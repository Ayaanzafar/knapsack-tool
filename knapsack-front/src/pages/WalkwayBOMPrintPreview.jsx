import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WalkwayBOMPrintPreview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('walkwayBomPrint');
    if (!raw) { navigate('/walkway-bom'); return; }
    try {
      setData(JSON.parse(raw));
    } catch {
      navigate('/walkway-bom');
    }
  }, [navigate]);

  if (!data) return null;

  const { bom, settings, project } = data;
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      {/* Print toolbar — hidden when printing */}
      <div className="no-print bg-gray-800 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <span className="font-semibold text-sm">Print Preview — Walkway BOM</span>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/walkway-bom')}
            className="px-4 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-400 rounded-lg font-bold transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="print-page bg-white min-h-screen px-10 py-8 text-gray-900 font-sans text-sm max-w-[1050px] mx-auto">
        {/* ── Document header ── */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">WALKWAY BILL OF MATERIALS</h1>
              <p className="text-xs text-gray-500 mt-0.5">Solar Rooftop Walkway System</p>
            </div>
            <div className="text-right text-xs text-gray-600 space-y-0.5">
              <p>Date: <strong>{date}</strong></p>
              {project && (
                <>
                  <p>Project: <strong>{project.name}</strong></p>
                  <p>Client: <strong>{project.clientName}</strong></p>
                  <p>ID: <strong>{project.projectId}</strong></p>
                </>
              )}
            </div>
          </div>

          {/* Settings summary */}
          {settings && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-700 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
              <span>Magnelis Rate: <strong>₹{settings.magnelisRate}/kg</strong></span>
              <span>|</span>
              <span>Aluminium Rate: <strong>₹{settings.alRate}/kg</strong></span>
              <span>|</span>
              <span>Spare: <strong>{settings.sparePct}%</strong></span>
              <span>|</span>
              <span>Fasteners: <strong>
                {[settings.includeBlindRivets && 'Blind Rivets (4.8×15mm)', settings.includeSDS && 'SDS Screws'].filter(Boolean).join(' + ')}
              </strong></span>
            </div>
          )}
        </div>

        {/* ── Sections ── */}
        {bom.horizontal && (
          <PrintSection title="SECTION A — HORIZONTAL WALKWAY" items={bom.horizontal} />
        )}

        {bom.vertical && (
          <PrintSection title="SECTION B — VERTICAL WALKWAY" items={bom.vertical} className={bom.horizontal ? 'mt-8' : ''} />
        )}

        {/* ── Grand totals ── */}
        <div className="mt-8 border-t-2 border-gray-800 pt-4">
          <table className="w-full text-sm">
            <tbody>
              <tr className="font-bold">
                <td className="py-1.5 pr-4 text-gray-600">Total Project Cost</td>
                <td className="py-1.5 font-black text-base">
                  ₹{bom.summary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-gray-600">Total Walkway Length</td>
                <td className="py-1 font-semibold">{bom.summary.totalLength.toFixed(1)} m</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-gray-600">Cost per Running Metre</td>
                <td className="py-1 font-semibold">₹{bom.summary.costPerRM.toFixed(2)} / RM</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Notes ── */}
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Notes</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Recommended support spacing: <strong>1000 mm</strong> centre-to-centre.</li>
            <li>Seam Clamps and Grub Screws are customer-supplied and are <strong>not included</strong> in this BOM.</li>
            <li>Each walkway section = 2010 mm length × 310 mm width (Magnelis).</li>
            <li>Spare quantity calculated at <strong>{settings?.sparePct ?? 0.1}%</strong> on all items (rounded up).</li>
          </ul>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { max-width: 100% !important; margin: 0 !important; padding: 12mm 14mm !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}

function PrintSection({ title, items, className = '' }) {
  const sectionTotal = items.reduce((s, i) => s + (i.cost || 0), 0);
  const sectionWt    = items.reduce((s, i) => s + (i.totalWeight || 0), 0);

  return (
    <div className={className}>
      <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-2 rounded mb-2 border border-gray-300">
        {title}
      </h2>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-3 py-2 text-left w-8">S.No</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-center">Material</th>
            <th className="px-3 py-2 text-center">Base Qty</th>
            <th className="px-3 py-2 text-center">Spare</th>
            <th className="px-3 py-2 text-center font-bold">Total Qty</th>
            <th className="px-3 py-2 text-center">UoM</th>
            <th className="px-3 py-2 text-center">Wt/pc (kg)</th>
            <th className="px-3 py-2 text-center">Total Wt</th>
            <th className="px-3 py-2 text-center">Rate/pc (₹)</th>
            <th className="px-3 py-2 text-center">Cost (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-1.5 text-center text-gray-500 border border-gray-200">{i + 1}</td>
              <td className="px-3 py-1.5 font-medium text-gray-900 border border-gray-200">{item.description}</td>
              <td className="px-3 py-1.5 text-center text-gray-600 border border-gray-200">{item.material}</td>
              <td className="px-3 py-1.5 text-center border border-gray-200">{item.baseQty.toLocaleString()}</td>
              <td className="px-3 py-1.5 text-center text-gray-500 border border-gray-200">{item.spareQty}</td>
              <td className="px-3 py-1.5 text-center font-bold border border-gray-200">{item.totalQty.toLocaleString()}</td>
              <td className="px-3 py-1.5 text-center text-gray-500 border border-gray-200">Nos</td>
              <td className="px-3 py-1.5 text-center border border-gray-200">
                {item.wtPc != null ? item.wtPc.toFixed(4) : '—'}
              </td>
              <td className="px-3 py-1.5 text-center border border-gray-200">
                {item.totalWeight != null && item.totalWeight > 0 ? item.totalWeight.toFixed(2) : '—'}
              </td>
              <td className="px-3 py-1.5 text-center border border-gray-200">
                {item.ratePc != null ? item.ratePc.toFixed(2) : '—'}
              </td>
              <td className="px-3 py-1.5 text-center font-semibold border border-gray-200">
                {item.cost != null ? item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-800 text-white font-bold">
            <td colSpan={8} className="px-3 py-2 text-right">Section Total</td>
            <td className="px-3 py-2 text-center">{sectionWt > 0 ? sectionWt.toFixed(2) : '—'}</td>
            <td></td>
            <td className="px-3 py-2 text-center">
              {sectionTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
