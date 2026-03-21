import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, walkwayAPI } from '../services/api';
import { calculateWalkwayBOM } from '../lib/walkwayBomCalculations';

const WALKWAY_PROJECT_KEY = 'currentWalkwayProjectId';

// ── First-time setup modal ────────────────────────────────────────────────────

function FirstSetupModal({ onConfirm, onCancel }) {
  const [magnelisRate, setMagnelisRate] = useState('');
  const [alRate, setAlRate]             = useState('');
  const [error, setError]               = useState('');

  const handleSubmit = () => {
    if (!magnelisRate || parseFloat(magnelisRate) <= 0) {
      setError('Please enter a valid Magnelis Rate.');
      return;
    }
    if (!alRate || parseFloat(alRate) <= 0) {
      setError('Please enter a valid Aluminium Rate.');
      return;
    }
    setError('');
    onConfirm({ magnelisRate: parseFloat(magnelisRate), alRate: parseFloat(alRate) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Set Material Rates</h2>
          <p className="text-yellow-100 text-sm mt-0.5">Required to calculate material costs</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Magnelis Rate <span className="text-gray-400 font-normal">(INR / kg)</span>
              <span className="ml-2 text-xs text-gray-400">— Walkway Section, Cleat, Jointer, Base Rail</span>
            </label>
            <input
              type="number" min="0" step="0.01" autoFocus
              value={magnelisRate}
              onChange={e => setMagnelisRate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. 180"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Aluminium Rate <span className="text-gray-400 font-normal">(INR / kg)</span>
              <span className="ml-2 text-xs text-gray-400">— Rail Nut (Al 6063-T6)</span>
            </label>
            <input
              type="number" min="0" step="0.01"
              value={alRate}
              onChange={e => setAlRate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. 220"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm font-medium"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors shadow-sm"
          >
            Generate BOM
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline settings panel (live-editable) ────────────────────────────────────

function SettingsPanel({ settings, onChange }) {
  const { magnelisRate, alRate, sparePct, includeBlindRivets, includeSDS } = settings;

  const set = (key, value) => onChange({ ...settings, [key]: value });

  const fastenerError = !includeBlindRivets && !includeSDS;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">BOM Settings — edit to update live</p>
      <div className="flex flex-wrap gap-6 items-end">

        {/* Magnelis Rate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            Magnelis Rate <span className="text-gray-400 font-normal">(₹/kg)</span>
          </label>
          {/* <div className="text-xs text-gray-400 -mt-1">Section · Cleat · Jointer · Base Rail</div> */}
          <input
            type="number" min="0" step="0.01"
            value={magnelisRate}
            onChange={e => set('magnelisRate', parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border-2 border-yellow-300 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-36 bg-yellow-50"
          />
        </div>

        {/* Aluminium Rate */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            Aluminium Rate <span className="text-gray-400 font-normal">(₹/kg)</span>
          </label>
          {/* <div className="text-xs text-gray-400 -mt-1">Rail Nut (Al 6063-T6)</div> */}
          <input
            type="number" min="0" step="0.01"
            value={alRate}
            onChange={e => set('alRate', parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border-2 border-blue-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-36 bg-blue-50"
          />
        </div>

        {/* Spare % */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Spare %</label>
          {/* <div className="text-xs text-gray-400 -mt-1">All items</div> */}
          <input
            type="number" min="0" step="0.1"
            value={sparePct}
            onChange={e => set('sparePct', parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-24"
          />
        </div>

        {/* Fasteners */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Fasteners</span>
          {/* <div className="text-xs text-gray-400 -mt-1">Fixed rate/pc — not weight-based</div> */}
          <div className="flex gap-3">
            <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${includeBlindRivets ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500'}`}>
              <input
                type="checkbox"
                checked={includeBlindRivets}
                onChange={e => set('includeBlindRivets', e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500"
              />
              Blind Rivets
            </label>
            <label className={`flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${includeSDS ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500'}`}>
              <input
                type="checkbox"
                checked={includeSDS}
                onChange={e => set('includeSDS', e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500"
              />
              SDS Screws
            </label>
          </div>
          {fastenerError && (
            <p className="text-red-500 text-xs font-medium mt-0.5">Select at least one fastener.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BOM Section Table ─────────────────────────────────────────────────────────

function BOMSectionTable({ title, items, accentColor = 'blue' }) {
  const headerBg = accentColor === 'orange' ? 'bg-orange-600' : 'bg-blue-700';
  const totalCost = items.reduce((s, i) => s + (i.cost || 0), 0);
  const totalWt   = items.reduce((s, i) => s + (i.totalWeight || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`px-6 py-3 ${headerBg}`}>
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <th className="px-4 py-3 text-left w-10">S.No</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Material</th>
              <th className="px-4 py-3 text-center">Base Qty</th>
              <th className="px-4 py-3 text-center">Spare</th>
              <th className="px-4 py-3 text-center font-bold text-gray-800">Total Qty</th>
              <th className="px-4 py-3 text-center">UoM</th>
              <th className="px-4 py-3 text-center">Wt/pc (kg)</th>
              <th className="px-4 py-3 text-center">Total Wt (kg)</th>
              <th className="px-4 py-3 text-center">Rate/kg (₹)</th>
              <th className="px-4 py-3 text-center">Rate/pc (₹)</th>
              <th className="px-4 py-3 text-center">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-medium text-center">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-center text-gray-500 text-xs">{item.material}</td>
                <td className="px-4 py-3 text-center text-gray-700">{item.baseQty.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-gray-500">{item.spareQty}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{item.totalQty.toLocaleString()}</td>
                <td className="px-4 py-3 text-center text-gray-500">Nos</td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {item.wtPc != null ? item.wtPc.toFixed(4) : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {item.totalWeight != null && item.totalWeight > 0 ? item.totalWeight.toFixed(2) : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {item.rateKg != null ? `₹${item.rateKg.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {item.ratePc != null ? `₹${item.ratePc.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-800">
                  {item.cost != null ? `₹${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 text-white border-t-2 border-gray-600">
              <td colSpan={9} className="px-4 py-3 text-right font-bold text-sm text-gray-300">Section Total</td>
              <td className="px-4 py-3 text-center font-bold text-yellow-300">
                {totalWt > 0 ? totalWt.toFixed(2) : '—'}
              </td>
              <td></td>
              <td className="px-4 py-3 text-center font-black text-yellow-400 text-base">
                ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  magnelisRate: 0,
  alRate: 0,
  sparePct: 0.1,
  includeBlindRivets: true,
  includeSDS: true,
};

export default function WalkwayBOMPage() {
  const navigate = useNavigate();

  const [project, setProject]         = useState(null);
  const [rows, setRows]               = useState([]);
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS);
  const [bomActive, setBomActive]     = useState(false);   // true once Al Rate has been set
  const [showModal, setShowModal]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saveStatus, setSaveStatus]   = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [error, setError]             = useState('');

  const saveTimerRef = useRef(null);

  // Load project + rows + existing saved BOM on mount
  useEffect(() => {
    const projectId = localStorage.getItem(WALKWAY_PROJECT_KEY);
    if (!projectId) { navigate('/walkway/create'); return; }

    const load = async () => {
      try {
        const [proj, savedRows] = await Promise.all([
          projectAPI.getById(projectId),
          walkwayAPI.getRows(projectId),
        ]);
        setProject(proj);
        setRows(savedRows ?? []);

        // Restore previously saved BOM settings
        try {
          const saved = await walkwayAPI.getBOM(projectId);
          if (saved?.bomData?.moduleType === 'WALKWAY' && saved.bomData.settings) {
            setSettings(saved.bomData.settings);
            setBomActive(true);
          }
        } catch {
          // No saved BOM yet
        }
      } catch (err) {
        setError('Failed to load project data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Derived BOM — recalculates whenever rows or settings change
  const bom = useMemo(() => {
    if (!bomActive || settings.magnelisRate <= 0 || settings.alRate <= 0) return null;
    const fastenerOk = settings.includeBlindRivets || settings.includeSDS;
    if (!fastenerOk) return null;
    return calculateWalkwayBOM(rows, settings);
  }, [rows, settings, bomActive]);

  // Debounced save to DB whenever bom changes
  const scheduleSave = useCallback((currentSettings, currentBom) => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const projectId = localStorage.getItem(WALKWAY_PROJECT_KEY);
      if (!projectId) return;
      setSaveStatus('saving');
      try {
        await walkwayAPI.saveBOM(projectId, {
          moduleType: 'WALKWAY',
          settings: currentSettings,
          bom: currentBom,
          generatedAt: new Date().toISOString(),
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save BOM:', err);
        setSaveStatus('unsaved');
      }
    }, 1500);
  }, []);

  useEffect(() => {
    if (bom) scheduleSave(settings, bom);
  }, [bom, settings, scheduleSave]);

  const handleFirstSetup = ({ magnelisRate, alRate }) => {
    setShowModal(false);
    setSettings(s => ({ ...s, magnelisRate, alRate }));
    setBomActive(true);
  };

  const handleSettingsChange = (next) => {
    setSettings(next);
  };

  const handlePrintPreview = () => {
    sessionStorage.setItem('walkwayBomPrint', JSON.stringify({ bom, settings, project }));
    navigate('/walkway-bom/print-preview');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-yellow-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading BOM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {showModal && (
        <FirstSetupModal
          onConfirm={handleFirstSetup}
          onCancel={() => navigate('/walkway-app')}
        />
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b-2 border-yellow-300 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img src="/white_back_photo.svg" alt="Logo" className="h-8 shrink-0" />
            <div className="border-l border-gray-200 pl-4 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Walkway BOM</p>
              <h1 className="text-base font-bold text-gray-900 truncate">Bill of Materials</h1>
            </div>
          </div>

          {project && (
            <div className="hidden md:flex items-center gap-3 text-sm text-gray-600 min-w-0">
              <span className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg font-medium truncate max-w-xs">
                {project.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className="shrink-0">Client: <strong className="text-gray-700">{project.clientName}</strong></span>
              <span className="text-gray-400">|</span>
              <span className="shrink-0">ID: <strong className="text-gray-700">{project.projectId}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator status={saveStatus} />
            {bom && (
              <button
                onClick={handlePrintPreview}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / PDF
              </button>
            )}
            <button
              onClick={() => navigate('/walkway-app')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Empty state — Al Rate not set yet */}
        {!bomActive && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-700">Enter material rates to generate BOM</p>
              <p className="text-sm text-gray-400 mt-1">Set Magnelis and Aluminium rates. All settings can be adjusted live after.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              Set Rate & Generate
            </button>
          </div>
        )}

        {/* Live settings panel */}
        {bomActive && (
          <SettingsPanel settings={settings} onChange={handleSettingsChange} />
        )}

        {/* BOM tables */}
        {bom && (
          <>
            {bom.horizontal && (
              <BOMSectionTable
                title="Section A — Horizontal Walkway"
                items={bom.horizontal}
                accentColor="blue"
              />
            )}

            {bom.vertical && (
              <BOMSectionTable
                title="Section B — Vertical Walkway"
                items={bom.vertical}
                accentColor="orange"
              />
            )}

            {/* Grand totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                label="Total Project Cost"
                value={`₹${bom.summary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                color="yellow"
              />
              <SummaryCard
                label="Total Walkway Length"
                value={`${bom.summary.totalLength.toFixed(1)} m`}
                color="blue"
              />
              <SummaryCard
                label="Cost per Running Metre"
                value={`₹${bom.summary.costPerRM.toFixed(2)} / RM`}
                color="green"
              />
            </div>

            {/* Recommendation note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Recommended support spacing: <strong>1000 mm</strong> (centre to centre). Seam Clamps and Grub Screws are customer-supplied and not included in this BOM.</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function SummaryCard({ label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue:   'bg-blue-50  border-blue-200  text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
  };
  return (
    <div className={`rounded-2xl border-2 px-6 py-5 ${colors[color]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-sm font-semibold mt-1 opacity-70">{label}</p>
    </div>
  );
}
