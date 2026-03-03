// src/lib/optimizer.js

/**
 * Rail cut optimizer (unbounded knapsack with overshoot, joint & small-piece penalties)
 * Params:
 *  required: number (mm)                       - target rail length (>= 0)
 *  lengths: number[]                           - stock cut sizes (mm)
 *  smallLengths?: number[]                     - subset treated as "small" (discouraged)
 *  maxPieces?: number                          - hard cap on number of pieces (optional)
 *  allowUndershootPct?: number                 - e.g. 0.01 allows up to 1% shortfall (optional)
 *  maxWastePct?: number                        - e.g. 0.02 allows max 2% waste (optional)
 *  alphaJoint?: number                         - penalty per joint (pieces - 1), in "mm units"
 *  betaSmall?: number                          - penalty per piece chosen from smallLengths
 *  gammaShort?: number                         - penalty per mm of undershoot
 *  costPerMm?: number                          - actual cost per mm of rail (for BOM)
 *  costPerJointSet?: number                    - actual cost per joint connector set (for BOM)
 *  joinerLength?: number                       - length of each joiner in mm
 */
export function optimizeCuts({
  required,
  lengths,
  smallLengths = [],
  maxPieces,
  allowUndershootPct = 0,
  maxWastePct,
  alphaJoint = 220,
  betaSmall = 60,
  gammaShort = 5,
  costPerMm = 0,
  costPerJointSet = 0,
  joinerLength = 0
}) {
  const L = Array.from(new Set(lengths)).filter(x => Number.isFinite(x) && x > 0).sort((a,b)=>a-b);
  if (L.length === 0) return { ok:false, reason:"No valid cut lengths." };

  const R = Math.max(0, Math.round(Number(required) || 0));
  const maxL = Math.max(...L);
  const TMAX = R + maxL - 1;

  const smallSet = new Set(smallLengths);
  /** @type {(null|{total:number,pieces:number,small:number,prev:number|null,lastIdx:number|null})[]} */
  const best = Array(TMAX + 1).fill(null);
  best[0] = { total: 0, pieces: 0, small: 0, prev: null, lastIdx: null };

  for (let t = 0; t <= TMAX; t++) {
    const cur = best[t];
    if (!cur) continue;

    for (let i = 0; i < L.length; i++) {
      const li = L[i];
      const nt = Math.min(TMAX, t + li);

      const cand = {
        total: Math.min(TMAX, cur.total + li),
        pieces: cur.pieces + 1,
        small: cur.small + (smallSet.has(li) ? 1 : 0),
        prev: t,
        lastIdx: i
      };

      if (maxPieces && cand.pieces > maxPieces) continue;

      const old = best[nt];
      if (!old || betterDP(cand, old)) {
        best[nt] = cand;
      }
    }
  }

  const minAllowed = allowUndershootPct > 0
    ? Math.ceil(R * (1 - allowUndershootPct))
    : R;

  const candidates = [];
  for (let t = minAllowed; t <= TMAX; t++) {
    const s = best[t];
    if (!s) continue;

    const extra = Math.max(0, s.total - R);
    const shortage = s.total >= R ? 0 : (R - s.total);

    // Check waste percentage constraint if specified
    if (maxWastePct !== undefined && R > 0) {
      const wastePct = extra / R;
      if (wastePct > maxWastePct) continue; // Skip solutions exceeding waste limit
    }

    const joints = Math.max(0, s.pieces - 1);
    const cost = extra + alphaJoint * joints + betaSmall * s.small + gammaShort * shortage;

    candidates.push({ t, s, cost, extra, shortage, joints });
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      reason: maxWastePct !== undefined
        ? `No solution found within ${(maxWastePct * 100).toFixed(1)}% waste limit. Try increasing max waste, max pieces, or allowing undershoot.`
        : "No feasible combination found. Try increasing max pieces or allowing undershoot."
    };
  }

  candidates.sort((a,b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    if (a.extra !== b.extra) return a.extra - b.extra;
    if (a.s.pieces !== b.s.pieces) return a.s.pieces - b.s.pieces;
    if (a.s.small !== b.s.small) return a.s.small - b.s.small;
    return a.t - b.t;
  });

  const bestCand = candidates[0];

  // Reconstruct chosen pieces
  const plan = [];
  let curT = bestCand.t;
  let node = best[curT];
  while (node && node.prev !== null && node.lastIdx !== null) {
    plan.push(L[node.lastIdx]);
    curT = node.prev;
    node = best[curT];
  }
  plan.reverse();

  const countsByLength = {};
  for (const len of plan) countsByLength[len] = (countsByLength[len] || 0) + 1;

  // Calculate rail length and overshoot (jointers do NOT add to span length)
  const totalRailLength = bestCand.s.total;  // Sum of rail pieces only
  const overshootMm = Math.max(0, totalRailLength - R);  // Overshoot without joiners
  const shortage = totalRailLength >= R ? 0 : (R - totalRailLength);

  // Calculate actual costs for BOM
  const materialCost = totalRailLength * costPerMm;  // Cost of rail material
  const jointSetCost = bestCand.joints * costPerJointSet;  // Cost of joint hardware (joiners)
  const totalActualCost = materialCost + jointSetCost;  // Total cost

  return {
    ok: true,
    plan,
    countsByLength,
    totalRailLength,       // Sum of rail pieces only (no jointer length)
    overshootMm,           // Overshoot without joiners
    shortage,              // Shortage if any
    pieces: plan.length,
    joints: bestCand.joints,
    smallCount: plan.filter(x => smallSet.has(x)).length,
    // Actual costs for BOM
    materialCost,
    jointSetCost,
    totalActualCost
  };

  // DP tie-breaker: prefer fewer pieces, then fewer small, then shorter total
  function betterDP(a, b) {
    if (a.pieces !== b.pieces) return a.pieces < b.pieces;
    if (a.small  !== b.small)  return a.small  < b.small;
    return a.total < b.total;
  }
}

/** Excel-like helper: compute required rail length from module & clamp inputs */
export function requiredRailLength({ modules, moduleWidth, midClamp, endClampWidth, buffer }) {
  const m = Number(modules) || 0;
  const MW = Number(moduleWidth) || 0;
  const MC = Number(midClamp) || 0;
  const EC = Number(endClampWidth) || 0;
  const BF = Number(buffer) || 0;
  return m*MW + (m>0 ? (m-1)*MC : 0) + 2*EC + 2*BF;
}

/**
 * Generate multiple scenarios and compute the three best combinations:
 * C (cost): lowest totalCost, then overshoot, then joints
 * L (length): lowest overshoot, then cost, then joints
 * J (joints): lowest joints, then cost, then overshoot
 *
 * Returns: { C, L, J, allScenarios }
 */
export function generateScenarios(baseConfig) {
  const scenarios = [];
  const maxL = Math.max(...baseConfig.lengths);
  const minPossiblePieces = Math.ceil(baseConfig.required / maxL);

  // Generate scenarios with different maxPieces values
  for (let pieces = minPossiblePieces; pieces <= minPossiblePieces + 4; pieces++) {
    const result = optimizeCuts({
      ...baseConfig,
      maxPieces: pieces
    });

    if (result.ok) {
      scenarios.push(result);
    }
  }

  // Also try with different alpha values to get varied solutions
  const alphaVariations = [0, 100, 500, 1000];
  for (const alpha of alphaVariations) {
    for (let pieces = minPossiblePieces; pieces <= minPossiblePieces + 2; pieces++) {
      const result = optimizeCuts({
        ...baseConfig,
        maxPieces: pieces,
        alphaJoint: alpha
      });

      if (result.ok) {
        scenarios.push(result);
      }
    }
  }

  // Remove duplicates (same plan)
  const uniqueScenarios = [];
  const seenPlans = new Set();

  for (const scenario of scenarios) {
    const planKey = scenario.plan.sort((a, b) => a - b).join(',');
    if (!seenPlans.has(planKey)) {
      seenPlans.add(planKey);
      uniqueScenarios.push(scenario);
    }
  }

  if (uniqueScenarios.length === 0) {
    return null;
  }

  // Compute the three best combinations

  // C (Cost combo): lowest totalCost, then overshoot, then joints
  const C = [...uniqueScenarios].sort((a, b) => {
    if (a.totalActualCost !== b.totalActualCost) return a.totalActualCost - b.totalActualCost;
    if (a.overshootMm !== b.overshootMm) return a.overshootMm - b.overshootMm;
    return a.joints - b.joints;
  })[0];

  // L (Length combo): lowest overshoot, then cost, then joints
  const L = [...uniqueScenarios].sort((a, b) => {
    if (a.overshootMm !== b.overshootMm) return a.overshootMm - b.overshootMm;
    if (a.totalActualCost !== b.totalActualCost) return a.totalActualCost - b.totalActualCost;
    return a.joints - b.joints;
  })[0];

  // J (Joints combo): lowest joints, then cost, then overshoot
  const J = [...uniqueScenarios].sort((a, b) => {
    if (a.joints !== b.joints) return a.joints - b.joints;
    if (a.totalActualCost !== b.totalActualCost) return a.totalActualCost - b.totalActualCost;
    return a.overshootMm - b.overshootMm;
  })[0];

  return {
    C,  // Best cost combo
    L,  // Best length combo
    J,  // Best joints combo
    allScenarios: uniqueScenarios
  };
}
