// src/components/ResultCard.jsx
import { useMemo } from 'react';
import { Card, KV } from './ui';
import { requiredRailLength, generateScenarios } from '../lib/optimizer';
import { parseNumList, fmt } from '../lib/storage';

import { useAuth } from '../context/AuthContext';

export default function ResultCard({ row, settings }) {
  const { canEditField } = useAuth();

  const {
    moduleWidth,
    midClamp,
    endClampWidth,
    buffer,
    lengthsInput,
    enabledLengths,
    maxWastePct,
    allowUndershootPct,
    alphaJoint,
    betaSmall,
    gammaShort,
    costPerMm,
    costPerJointSet,
    joinerLength,
    priority
  } = settings;

  const parsedLengths = useMemo(
    () => parseNumList(lengthsInput).filter(len => enabledLengths[len] !== false),
    [lengthsInput, enabledLengths]
  );

  const { required, combos, result, extraPct } = useMemo(() => {
    const req = requiredRailLength({
      modules: row?.modules || 0,
      moduleWidth: Number(moduleWidth) || 0,
      midClamp: Number(midClamp) || 0,
      endClampWidth: Number(endClampWidth) || 0,
      buffer: Number(buffer) || 0
    });

    if (req <= 0 || parsedLengths.length === 0) {
      return { required: req, combos: null, result: null, extraPct: 0 };
    }

    // Generate scenarios and get C, L, J combos
    const combosData = generateScenarios({
      required: req,
      lengths: parsedLengths,
      allowUndershootPct: Number(allowUndershootPct) || 0,
      maxWastePct: Number(maxWastePct) || undefined,
      alphaJoint: Number(alphaJoint) || 0,
      betaSmall: Number(betaSmall) || 0,
      gammaShort: Number(gammaShort) || 0,
      costPerMm: Number(costPerMm) || 0,
      costPerJointSet: Number(costPerJointSet) || 0,
      joinerLength: Number(joinerLength) || 0
    });

    if (!combosData) {
      return { required: req, combos: null, result: null, extraPct: 0 };
    }

    // Select combo based on priority
    let res;
    if (priority === 'cost') {
      res = combosData.C;
    } else if (priority === 'length') {
      res = combosData.L;
    } else if (priority === 'joints') {
      res = combosData.J;
    } else {
      res = combosData.C;  // Default to cost
    }

    const pct = res?.ok && req > 0
      ? (res.overshootMm / req) * 100
      : 0;

    return { required: req, combos: combosData, result: res, extraPct: pct };
  }, [row, moduleWidth, midClamp, endClampWidth, buffer, parsedLengths,
      maxWastePct, allowUndershootPct, alphaJoint, betaSmall,
      gammaShort, costPerMm, costPerJointSet, joinerLength, priority]);

  if (!row) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-xs">Select a row to view details</p>
      </div>
    );
  }

  if (!result || !result.ok) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-xs">
          {result?.reason || "No solution found. Try adjusting settings or selecting more lengths."}
        </div>
      </div>
    );
  }

  // Calculate extra cost vs cheapest option
  const C = combos?.C;  // Always the cheapest cost combo
  const extraCost = C ? result.totalActualCost - C.totalActualCost : 0;

  // Priority display text
  let priorityText = 'Minimum Cost';
  if (priority === 'length') {
    priorityText = 'Minimum Length';
  } else if (priority === 'joints') {
    priorityText = 'Minimum Joints';
  }

  return (
    <div className="space-y-3">
      {/* Priority indicator */}
      <div className="text-xs text-purple-600 font-medium">
        Optimized for: {priorityText}
      </div>

      {/* Extra cost summary (only if not cheapest) */}
      {extraCost > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="text-xs text-red-700 font-medium mb-1">
            Extra Cost vs Cheapest: ₹{extraCost.toFixed(2)}
          </div>
          {priority === 'length' && (
            <div className="text-xs text-red-600">
              You pay ₹{extraCost.toFixed(2)} extra to reduce overshoot from {fmt(C.overshootMm)} mm to {fmt(result.overshootMm)} mm.
            </div>
          )}
          {priority === 'joints' && (
            <div className="text-xs text-red-600">
              You pay ₹{extraCost.toFixed(2)} extra to reduce joints from {C.joints} to {result.joints}.
            </div>
          )}
        </div>
      )}
      {extraCost <= 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="text-xs text-green-700 font-medium">
            This is the cheapest option.
          </div>
        </div>
      )}

      {/* Rail Summary */}
      <div className="space-y-1.5">
        <KV label="Required (mm)" value={fmt(required)} />
        <KV label="Total Rail Length (mm)" value={fmt(result.totalRailLength)} />
        <div className="flex justify-between text-xs">
          <span className="text-red-600">Overshoot (mm)</span>
          <span className="font-medium text-red-600">{fmt(result.overshootMm)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-red-600">% Extra Length</span>
          <span className="font-medium text-red-600">{extraPct.toFixed(2)}%</span>
        </div>
        <KV label="Pieces" value={result.pieces} />
        <KV label="Joints" value={result.joints} />
        {canEditField('maxWastePct') && (
          <KV label="Small Pieces" value={result.smallCount} />
        )}
      </div>

      {/* Cost Breakdown */}
      <div className="pt-2 mt-2 border-t">
        <h4 className="text-xs font-semibold mb-1.5">Cost Breakdown</h4>
        <div className="space-y-1.5">
          <KV label="Rail Material Cost" value={`₹${result.materialCost.toFixed(2)}`} />
          {result.joints > 0 && (
            <KV label="Joint Cost" value={`₹${result.jointSetCost.toFixed(2)}`} />
          )}
          <div className="flex justify-between text-xs font-semibold pt-1 border-t">
            <span className="text-gray-800">Total Cost</span>
            <span className="text-green-600">₹{result.totalActualCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cheapest option mini summary */}
      {C && (
        <div className="pt-2 mt-2 border-t bg-gray-50 rounded-lg p-2">
          <h4 className="text-xs font-semibold text-gray-600 mb-1">Cheapest Option</h4>
          <div className="text-xs space-y-0.5 text-gray-700">
            <div className="flex justify-between">
              <span>Cost:</span>
              <span className="font-medium">₹{C.totalActualCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Overshoot:</span>
              <span className="font-medium">{fmt(C.overshootMm)} mm</span>
            </div>
            <div className="flex justify-between">
              <span>Joints:</span>
              <span className="font-medium">{C.joints}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chosen Pieces */}
      <div className="pt-2">
        <h4 className="text-xs font-semibold mb-1.5">Chosen Pieces</h4>
        {result.plan.length === 0 ? (
          <div className="text-gray-500 text-xs">—</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {result.plan.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-white"
              >
                {p} mm
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Counts by Length */}
      <div>
        <h4 className="text-xs font-semibold mb-1.5">Counts by Length</h4>
        <table className="w-full text-xs">
          <tbody>
            {Object.entries(result.countsByLength)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([len, ct]) => (
                <tr key={len} className="border-t">
                  <td className="py-0.5 text-gray-600">{len} mm</td>
                  <td className="py-0.5 text-right font-medium">{ct}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
