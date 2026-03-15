import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, walkwayAPI } from '../services/api';
import { calculateWalkwayBOM } from '../lib/walkwayBomCalculations';

const WALKWAY_PROJECT_KEY = 'currentWalkwayProjectId';
const WALKWAY_BOM_SETTINGS_KEY = 'walkwayBomSettings';

// ── BOM Settings Modal ──────────────────────────────────────────────────────

function BOMSettingsModal({ onConfirm, onCancel }) {
  const [alRate, setAlRate] = useState('');
  const [sparePct, setSparePct] = useState('0.1');
  const [includeBlindRivets, setIncludeBlindRivets] = useState(true);
  const [includeSDS, setIncludeSDS] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!alRate || parseFloat(alRate) <= 0) {
      setError('Please enter a valid Aluminum Rate.');
      return;
    }
    if (!includeBlindRivets && !includeSDS) {
      setError('Select at least one fastener type.');
      return;
    }
    setError('');
    onConfirm({
      alRate: parseFloat(alRate),
      sparePct: parseFloat(sparePct) || 0.1,
      includeBlindRivets,
      includeSDS,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4">
          <h2 className="text-lg font-bold text-white">BOM Settings</h2>
          <p className="text-yellow-100 text-sm mt-0.5">Configure before generating the walkway BOM</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Aluminum Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Aluminum Rate <span className="text-gray-400 font-normal">(INR / kg)</span>
            </label>
            <input
              type="number" min="0" step="0.01"
              value={alRate}
              onChange={e => setAlRate(e.target.value)}
              placeholder="e.g. 220"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm font-medium"
            />
          </div>

          {/* Spare % */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Spare % <span className="text-gray-400 font-normal">(applied to all items)</span>
            </label>
            <input
              type="number" min="0" step="0.1"
              value={sparePct}
              onChange={e => setSparePct(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm font-medium"
            />
          </div>

          {/* Fastener checkboxes */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Fastener Options</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeBlindRivets}
                  onChange={e => setIncludeBlindRivets(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500"
                />
                <span className="text-sm text-gray-700">Blind Rivets <span className="text-gray-400">(4.8×15mm)</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSDS}
                  onChange={e => setIncludeSDS(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500"
                />
                <span className="text-sm text-gray-700">SDS Screws</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
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

// ── BOM Section Table ───────────────────────────────────────────────────────

function BOMSectionTable({ title, items, accentColor = 'blue' }) {
  const headerBg   = accentColor === 'orange' ? 'bg-orange-600' : 'bg-blue-700';
  const subtitleBg = accentColor === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800';

  const totalCost  = items.reduce((s, i) => s + (i.cost || 0), 0);
  const totalWt    = items.reduce((s, i) => s + (i.totalWeight || 0), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Section header */}
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
              <td colSpan={8} className="px-4 py-3 text-right font-bold text-sm text-gray-300">Section Total</td>
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

// ── Main Page ───────────────────────────────────────────────────────────────

export default function WalkwayBOMPage() {
  const navigate = useNavigate();
  const [project, setProject]     = useState(null);
  const [rows, setRows]           = useState([]);
  const [bom, setBom]             = useState(null);       // { horizontal, vertical, summary }
  const [settings, setSettings]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Load project + rows on mount
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

        // Try to load existing saved BOM
        try {
          const saved = await walkwayAPI.getBOM(projectId);
          if (saved?.bomData?.moduleType === 'WALKWAY') {
            const { settings: s, bom: b } = saved.bomData;
            setSettings(s);
            setBom(b);
          }
        } catch {
          // No saved BOM yet — that's fine
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

  const handleCreateBOM = () => setShowModal(true);

  const handleSettingsConfirm = async (s) => {
    setShowModal(false);
    setSettings(s);

    const result = calculateWalkwayBOM(rows, s);
    setBom(result);

    // Persist to DB
    const projectId = localStorage.getItem(WALKWAY_PROJECT_KEY);
    if (projectId) {
      setSaving(true);
      try {
        await walkwayAPI.saveBOM(projectId, {
          moduleType: 'WALKWAY',
          settings: s,
          bom: result,
          generatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to save BOM snapshot:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => navigate('/walkway-app');

  const handlePrintPreview = () => {
    // Store bom + settings + project in sessionStorage for print page
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

  const hasH = rows.some(r => r.type === 'H');
  const hasV = rows.some(r => r.type === 'V');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Modal */}
      {showModal && (
        <BOMSettingsModal
          onConfirm={handleSettingsConfirm}
          onCancel={() => setShowModal(false)}
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
            {saving && (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5 text-yellow-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            )}
            {bom && (
              <button
                onClick={handlePrintPreview}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / PDF
              </button>
            )}
            <button
              onClick={handleCreateBOM}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {bom ? 'Regenerate BOM' : 'Generate BOM'}
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
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

        {/* Empty state — no BOM generated yet */}
        {!bom && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-700">No BOM generated yet</p>
              <p className="text-sm text-gray-400 mt-1">Click <strong>Generate BOM</strong> to configure settings and create the Bill of Materials.</p>
            </div>
            <button
              onClick={handleCreateBOM}
              className="mt-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              Generate BOM
            </button>
          </div>
        )}

        {/* BOM content */}
        {bom && (
          <>
            {/* Settings summary bar */}
            {settings && (
              <div className="flex flex-wrap gap-3 bg-gray-100 rounded-xl px-5 py-3 text-sm text-gray-700">
                <span>Al Rate: <strong>₹{settings.alRate}/kg</strong></span>
                <span className="text-gray-400">|</span>
                <span>Spare: <strong>{settings.sparePct}%</strong></span>
                <span className="text-gray-400">|</span>
                <span>Fasteners: <strong>
                  {[settings.includeBlindRivets && 'Blind Rivets', settings.includeSDS && 'SDS'].filter(Boolean).join(' + ')}
                </strong></span>
              </div>
            )}

            {/* Section A — Horizontal */}
            {bom.horizontal && (
              <BOMSectionTable
                title="Section A — Horizontal Walkway"
                items={bom.horizontal}
                accentColor="blue"
              />
            )}

            {/* Section B — Vertical */}
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
                value={`₹${bom.summary.costPerRM.toFixed(2)}/RM`}
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
