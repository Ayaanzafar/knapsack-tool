import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, walkwayAPI } from '../services/api';

const SECTION_LENGTH = 2.01;
const WALKWAY_PROJECT_KEY = 'currentWalkwayProjectId';

function calcRow(lengthStr, qtyStr, type) {
  const length = parseFloat(lengthStr);
  const qty = parseInt(qtyStr, 10);
  if (!length || length <= 0 || !qty || qty <= 0) return null;

  const sections = Math.ceil(length / SECTION_LENGTH);
  const lCleats = sections * 6;
  const jointers = sections * 2;
  const baseRail = type === 'V' ? (sections * 2) + 1 : 0;

  return {
    sections,
    lCleats,
    jointers,
    baseRail,
    totalSections: sections * qty,
    totalLCleats: lCleats * qty,
    totalJointers: jointers * qty,
    totalBaseRail: baseRail * qty,
  };
}

function makeRow() {
  return { id: Date.now() + Math.random(), type: 'H', length: '', qty: '1' };
}

export default function WalkwayApp() {
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [rows, setRows] = useState([makeRow()]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'

  const saveTimerRef = useRef(null);
  const projectIdRef = useRef(null);

  // Load project + rows on mount
  useEffect(() => {
    const projectId = localStorage.getItem(WALKWAY_PROJECT_KEY);
    if (!projectId) {
      navigate('/walkway/create');
      return;
    }
    projectIdRef.current = parseInt(projectId);

    const loadData = async () => {
      try {
        const [proj, savedRows] = await Promise.all([
          projectAPI.getById(projectId),
          walkwayAPI.getRows(projectId)
        ]);
        setProject(proj);
        if (savedRows && savedRows.length > 0) {
          setRows(savedRows.map(r => ({
            id: r.id,
            type: r.type,
            length: r.length.toString(),
            qty: r.qty.toString()
          })));
        }
      } catch (err) {
        console.error('Failed to load walkway data:', err);
      } finally {
        setLoadingRows(false);
      }
    };

    loadData();
  }, [navigate]);

  // Autosave rows to API (debounced 1.5s)
  const scheduleSave = useCallback((rowsToSave) => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!projectIdRef.current) return;
      setSaveStatus('saving');
      try {
        await walkwayAPI.syncRows(projectIdRef.current, rowsToSave.map(r => ({
          type: r.type,
          length: parseFloat(r.length) || 0,
          qty: parseInt(r.qty) || 1
        })));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('unsaved');
      }
    }, 1500);
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows(prev => {
      const next = prev.map(r => r.id === id ? { ...r, [field]: value } : r);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const addRow = () => {
    setRows(prev => {
      const next = [...prev, makeRow()];
      scheduleSave(next);
      return next;
    });
  };

  const deleteRow = (id) => {
    setRows(prev => {
      if (prev.length === 1) return prev;
      const next = prev.filter(r => r.id !== id);
      scheduleSave(next);
      return next;
    });
  };

  const handleClose = () => {
    localStorage.removeItem(WALKWAY_PROJECT_KEY);
    navigate('/');
  };

  const rowCalcs = rows.map(r => calcRow(r.length, r.qty, r.type));

  const totals = rowCalcs.reduce(
    (acc, c) => c ? {
      sections: acc.sections + c.totalSections,
      lCleats: acc.lCleats + c.totalLCleats,
      jointers: acc.jointers + c.totalJointers,
      baseRail: acc.baseRail + c.totalBaseRail,
    } : acc,
    { sections: 0, lCleats: 0, jointers: 0, baseRail: 0 }
  );

  const hasVertical = rows.some(r => r.type === 'V');
  const hasAnyCalc = rowCalcs.some(Boolean);

  if (loadingRows) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-yellow-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b-2 border-yellow-300 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            <img src="/white_back_photo.svg" alt="Logo" className="h-8 shrink-0" />
            <div className="border-l border-gray-200 pl-4 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preliminary Calculation</p>
              <h1 className="text-base font-bold text-gray-900 truncate">Walk Way</h1>
            </div>
          </div>

          {/* Center: project info */}
          {project && (
            <div className="hidden md:flex items-center gap-3 text-sm text-gray-600 min-w-0">
              <span className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg font-medium truncate max-w-xs">
                {project.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 shrink-0">Client: <strong className="text-gray-700">{project.clientName}</strong></span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500 shrink-0">ID: <strong className="text-gray-700">{project.projectId}</strong></span>
            </div>
          )}

          {/* Right: save status + close */}
          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator status={saveStatus} />
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Project
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Info bar */}
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-800">
          <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Each section = <strong>2.01 m</strong> &nbsp;|&nbsp;
            Sections = ⌈ Length ÷ 2.01 ⌉ &nbsp;|&nbsp;
            L-Cleats = Sections × 6 &nbsp;|&nbsp;
            Jointers = Sections × 2 &nbsp;|&nbsp;
            Base Rail = (Sections × 2) + 1 <span className="italic">(Vertical only)</span>
          </span>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Walkway Sections
            </h2>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-8">#</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-28">Type</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-36">
                    Length (m)
                    <div className="text-xs text-gray-400 font-normal">required</div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 w-28">
                    Qty
                    <div className="text-xs text-gray-400 font-normal">lines</div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 bg-blue-50/60">
                    Sections
                    <div className="text-xs text-gray-400 font-normal">per line</div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 bg-blue-50/60">
                    L-Cleats
                    <div className="text-xs text-gray-400 font-normal">per line</div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 bg-blue-50/60">
                    Jointers
                    <div className="text-xs text-gray-400 font-normal">per line</div>
                  </th>
                  {hasVertical && (
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 bg-orange-50/60">
                      Base Rail
                      <div className="text-xs text-gray-400 font-normal">per line (V only)</div>
                    </th>
                  )}
                  <th className="px-4 py-3 text-center font-semibold text-yellow-700 bg-yellow-50">Total Sections</th>
                  <th className="px-4 py-3 text-center font-semibold text-yellow-700 bg-yellow-50">Total L-Cleats</th>
                  <th className="px-4 py-3 text-center font-semibold text-yellow-700 bg-yellow-50">Total Jointers</th>
                  {hasVertical && (
                    <th className="px-4 py-3 text-center font-semibold text-orange-700 bg-orange-50">Total Base Rail</th>
                  )}
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, idx) => {
                  const c = rowCalcs[idx];
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>

                      {/* Type toggle */}
                      <td className="px-4 py-3">
                        <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 w-fit mx-auto">
                          <button
                            onClick={() => updateRow(row.id, 'type', 'H')}
                            className={`px-3 py-1.5 text-xs font-bold transition-all duration-150 ${row.type === 'H' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                          >H</button>
                          <button
                            onClick={() => updateRow(row.id, 'type', 'V')}
                            className={`px-3 py-1.5 text-xs font-bold transition-all duration-150 ${row.type === 'V' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                          >V</button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number" min="0.01" step="0.01" value={row.length}
                          onChange={(e) => updateRow(row.id, 'length', e.target.value)}
                          placeholder="e.g. 60"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors hover:border-yellow-300 text-sm"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number" min="1" step="1" value={row.qty}
                          onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors hover:border-yellow-300 text-sm"
                        />
                      </td>

                      <td className="px-4 py-3 text-center bg-blue-50/30">
                        {c ? <CalcCell value={c.sections} /> : <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 text-center bg-blue-50/30">
                        {c ? <CalcCell value={c.lCleats} /> : <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 text-center bg-blue-50/30">
                        {c ? <CalcCell value={c.jointers} /> : <EmptyCell />}
                      </td>
                      {hasVertical && (
                        <td className="px-4 py-3 text-center bg-orange-50/30">
                          {c ? (row.type === 'V' ? <CalcCell value={c.baseRail} accent="orange" /> : <span className="text-gray-300 text-xs">—</span>) : <EmptyCell />}
                        </td>
                      )}

                      <td className="px-4 py-3 text-center bg-yellow-50/40">
                        {c ? <CalcCell value={c.totalSections} bold /> : <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 text-center bg-yellow-50/40">
                        {c ? <CalcCell value={c.totalLCleats} bold /> : <EmptyCell />}
                      </td>
                      <td className="px-4 py-3 text-center bg-yellow-50/40">
                        {c ? <CalcCell value={c.totalJointers} bold /> : <EmptyCell />}
                      </td>
                      {hasVertical && (
                        <td className="px-4 py-3 text-center bg-orange-50/30">
                          {c ? (row.type === 'V' ? <CalcCell value={c.totalBaseRail} bold accent="orange" /> : <span className="text-gray-300 text-xs">—</span>) : <EmptyCell />}
                        </td>
                      )}

                      <td className="px-2 py-3">
                        <button
                          onClick={() => deleteRow(row.id)}
                          disabled={rows.length === 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {hasAnyCalc && (
                <tfoot>
                  <tr className="bg-gray-900 text-white border-t-2 border-gray-700">
                    <td colSpan={4} className="px-4 py-4 font-bold text-sm text-gray-300 text-right">Grand Total</td>
                    <td className="px-4 py-4 text-center">—</td>
                    <td className="px-4 py-4 text-center">—</td>
                    <td className="px-4 py-4 text-center">—</td>
                    {hasVertical && <td className="px-4 py-4 text-center">—</td>}
                    <td className="px-4 py-4 text-center"><span className="text-yellow-400 font-black text-base">{totals.sections}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-yellow-400 font-black text-base">{totals.lCleats}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-yellow-400 font-black text-base">{totals.jointers}</span></td>
                    {hasVertical && <td className="px-4 py-4 text-center"><span className="text-orange-400 font-black text-base">{totals.baseRail}</span></td>}
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {hasAnyCalc && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Walkway Sections" value={totals.sections} sub="Nos" color="yellow"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            />
            <SummaryCard label="Total L-Cleats" value={totals.lCleats} sub="Nos" color="blue"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10M7 21V3m0 18l-3-3m3 3l3-3M17 3v18m0-18l-3 3m3-3l3 3" /></svg>}
            />
            <SummaryCard label="Total Jointers" value={totals.jointers} sub="Nos" color="green"
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            />
            {hasVertical && (
              <SummaryCard label="Total Base Rails" value={totals.baseRail} sub="Nos (Vertical)" color="orange"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>}
              />
            )}
          </div>
        )}

        {/* Create BOM */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/walkway-bom')}
            disabled={!hasAnyCalc}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create BOM
          </button>
        </div>
      </main>
    </div>
  );
}

// ── Helpers ──

function SaveIndicator({ status }) {
  if (status === 'saving') return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
      <svg className="animate-spin w-3.5 h-3.5 text-yellow-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Saving...
    </span>
  );
  if (status === 'unsaved') return (
    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
      Unsaved
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
      Saved
    </span>
  );
}

function CalcCell({ value, bold = false, accent = 'blue' }) {
  const color = accent === 'orange' ? 'text-orange-700' : 'text-blue-700';
  return <span className={`${bold ? 'font-bold' : 'font-medium'} ${color}`}>{value}</span>;
}

function EmptyCell() {
  return <span className="text-gray-300 text-xs">—</span>;
}

function SummaryCard({ label, value, sub, color, icon }) {
  const colors = { yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700', blue: 'bg-blue-50 border-blue-200 text-blue-700', green: 'bg-green-50 border-green-200 text-green-700', orange: 'bg-orange-50 border-orange-200 text-orange-700' };
  const iconColors = { yellow: 'text-yellow-500', blue: 'text-blue-500', green: 'text-green-500', orange: 'text-orange-500' };
  return (
    <div className={`rounded-2xl border-2 p-5 ${colors[color]}`}>
      <div className={`mb-2 ${iconColors[color]}`}>{icon}</div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-70">{sub}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
    </div>
  );
}
