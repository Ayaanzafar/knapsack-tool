// walkwayBomCalculations.js
// Pure formula engine for Walkway BOM generation.
// Takes rows[] and settings → returns { horizontal, vertical, totals }

const SECTION_LENGTH = 2.01;

// ── Weight constants (hardcoded until added to DB) ──
const WEIGHTS = {
  walkwaySection: 7.638,  // kg/pc — 310x35x10x0.9mm, 2010mm
  walkwayCleat:   0.048,  // kg/pc — LA 35x45x1.2, 40mm
  jointer:        0.24,   // kg/pc — LA 35x45x2, 200mm
  baseRail:       0.5,    // kg/pc — Strut 41x41x1.2mm, 400mm
  railNut:        0.0154, // kg/pc — MA 01, 23mm
};

// ── Fixed rate/pc for fasteners (no weight-based cost) ──
const FASTENER_RATES = {
  blindRivets:     1.2,   // INR/pc
  epdmPad:         3.0,   // INR/pc
  m8Bolt:          10.0,  // INR/pc
  m8Washer:        5.0,   // INR/pc
  // SDS rate is user-supplied (unknown at design time)
};

/**
 * Calculate aggregated section/cleat/jointer/baseRail totals
 * for a filtered set of rows.
 */
function aggregateRows(rows) {
  let totalSections = 0;
  let totalLCleats  = 0;
  let totalJointers = 0;
  let totalBaseRail = 0;

  for (const row of rows) {
    const length = parseFloat(row.length);
    const qty    = parseInt(row.qty, 10);
    if (!length || length <= 0 || !qty || qty <= 0) continue;

    const sections  = Math.ceil(length / SECTION_LENGTH);
    const baseRailPerRun = sections * 2 + 1;
    const lCleats   = row.type === 'V' ? baseRailPerRun * 2 : sections * 6;
    const jointers  = sections * 2;
    // Base rail: (sections × 2) + 1 per line
    const baseRail  = row.type === 'V' ? baseRailPerRun * qty : 0;

    totalSections  += sections  * qty;
    totalLCleats   += lCleats   * qty;
    totalJointers  += jointers  * qty;
    totalBaseRail  += baseRail;
  }

  return { totalSections, totalLCleats, totalJointers, totalBaseRail };
}

/**
 * Apply spare % and return { baseQty, spareQty, totalQty }
 */
function withSpare(baseQty, sparePct) {
  const spareQty = Math.ceil(baseQty * (sparePct / 100));
  return { baseQty, spareQty, totalQty: baseQty + spareQty };
}

/**
 * Build a BOM item row.
 * @param {string}  description
 * @param {number}  baseQty
 * @param {number}  sparePct
 * @param {number|null} wtPc        — kg/pc (null for fasteners)
 * @param {number}  materialRate    — INR/kg for this specific material
 * @param {number|null} fixedRatePc — INR/pc override (for fasteners, SS items)
 * @param {string}  material
 */
function makeItem(description, baseQty, sparePct, wtPc, materialRate, fixedRatePc, material) {
  const { baseQty: bq, spareQty, totalQty } = withSpare(baseQty, sparePct);

  let wtPcFinal   = wtPc ?? 0;
  let ratePc;
  let totalWeight;
  let cost;

  if (fixedRatePc != null) {
    // Fastener / SS item: cost by fixed rate/pc, no weight-based cost
    ratePc      = fixedRatePc;
    totalWeight = 0;
    cost        = totalQty * ratePc;
  } else {
    // Profile: cost = Total Weight × material rate
    ratePc      = wtPcFinal * materialRate;
    totalWeight = totalQty * wtPcFinal;
    cost        = totalWeight * materialRate;
  }

  return {
    description,
    material,
    baseQty: bq,
    spareQty,
    totalQty,
    wtPc: wtPcFinal || null,
    totalWeight: totalWeight || null,
    ratePc: parseFloat(ratePc.toFixed(4)),
    cost: parseFloat(cost.toFixed(2)),
    uom: 'Nos',
  };
}

/**
 * Build the HORIZONTAL BOM item list.
 */
function buildHorizontalBOM(agg, settings) {
  const { totalSections, totalLCleats, totalJointers } = agg;
  const { magnelisRate, alRate, sparePct, includeBlindRivets, includeSDS } = settings;

  const fastenerQty = totalLCleats + totalJointers * 4;

  const items = [];

  // Magnelis profiles → use magnelisRate
  items.push(makeItem('Walkway Section (310mm width, 2010mm)', totalSections, sparePct, WEIGHTS.walkwaySection, magnelisRate, null, 'Magnelis'));
  items.push(makeItem('Walkway Cleat (L-Angle, 40mm)',         totalLCleats,  sparePct, WEIGHTS.walkwayCleat,   magnelisRate, null, 'Magnelis'));
  items.push(makeItem('Jointer (200mm)',                       totalJointers, sparePct, WEIGHTS.jointer,        magnelisRate, null, 'Magnelis'));

  // Fasteners → fixed rate/pc
  if (includeBlindRivets) {
    items.push(makeItem('Blind Rivets (4.8×15mm)', fastenerQty, sparePct, null, null, FASTENER_RATES.blindRivets, 'Al 5000'));
  }
  if (includeSDS) {
    const sdsRate = settings.sdsRate != null ? settings.sdsRate : null;
    items.push(makeItem('SDS Screws', fastenerQty, sparePct, null, null, sdsRate, '—'));
  }
  items.push(makeItem('EPDM Pad (30×30×2mm)', totalLCleats, sparePct, null, null, FASTENER_RATES.epdmPad, 'Al 5001'));

  return items;
}

/**
 * Build the VERTICAL BOM item list.
 */
function buildVerticalBOM(agg, settings) {
  const { totalSections, totalLCleats, totalJointers, totalBaseRail } = agg;
  const { magnelisRate, alRate, sparePct, includeBlindRivets, includeSDS } = settings;

  const fastenerQty = (totalBaseRail * 2) + totalLCleats + (totalJointers * 4);

  const items = [];

  // Magnelis profiles → use magnelisRate
  items.push(makeItem('Walkway Section (310mm width, 2010mm)', totalSections, sparePct, WEIGHTS.walkwaySection, magnelisRate, null, 'Magnelis'));
  items.push(makeItem('Base Rail (400mm)',                     totalBaseRail, sparePct, WEIGHTS.baseRail,       magnelisRate, null, 'Magnelis'));
  items.push(makeItem('Walkway Cleat (L-Angle, 40mm)',         totalLCleats,  sparePct, WEIGHTS.walkwayCleat,   magnelisRate, null, 'Magnelis'));
  items.push(makeItem('Jointer (200mm)',                       totalJointers, sparePct, WEIGHTS.jointer,        magnelisRate, null, 'Magnelis'));

  // Al 6063-T6 profile → use alRate
  items.push(makeItem('Rail Nut', totalLCleats, sparePct, WEIGHTS.railNut, alRate, null, 'Al 6063-T6'));

  // SS 304 fasteners → fixed rate/pc
  items.push(makeItem('M8×20 Allen Hex Bolt',     totalLCleats, sparePct, null, null, FASTENER_RATES.m8Bolt,   'SS 304'));
  items.push(makeItem('M8 Plain & Spring Washer', totalLCleats, sparePct, null, null, FASTENER_RATES.m8Washer, 'SS 304'));

  // Blind Rivets / SDS → fixed rate/pc
  if (includeBlindRivets) {
    items.push(makeItem('Blind Rivets (4.8×15mm)', fastenerQty, sparePct, null, null, FASTENER_RATES.blindRivets, 'Al 5000'));
  }
  if (includeSDS) {
    const sdsRate = settings.sdsRate != null ? settings.sdsRate : null;
    items.push(makeItem('SDS Screws', fastenerQty, sparePct, null, null, sdsRate, '—'));
  }

  items.push(makeItem('EPDM Pad (30×30×2mm)', totalBaseRail * 2, sparePct, null, null, FASTENER_RATES.epdmPad, 'Al 5001'));

  return items;
}

/**
 * Main entry point.
 *
 * @param {Array}  rows     — WalkwayRow objects: { type, length, qty }
 * @param {Object} settings — { alRate, sparePct, includeBlindRivets, includeSDS, sdsRate? }
 * @returns {{ horizontal, vertical, summary }}
 */
export function calculateWalkwayBOM(rows, settings) {
  const hRows = rows.filter(r => r.type === 'H');
  const vRows = rows.filter(r => r.type === 'V');

  const hAgg = aggregateRows(hRows);
  const vAgg = aggregateRows(vRows);

  const horizontal = hRows.length > 0 ? buildHorizontalBOM(hAgg, settings) : null;
  const vertical   = vRows.length > 0 ? buildVerticalBOM(vAgg, settings)   : null;

  // Total walkway length for Cost/RM
  const totalLength = rows.reduce((sum, r) => {
    const len = parseFloat(r.length);
    const qty = parseInt(r.qty, 10);
    return sum + (isNaN(len) || isNaN(qty) ? 0 : len * qty);
  }, 0);

  const allItems   = [...(horizontal ?? []), ...(vertical ?? [])];
  const totalCost  = allItems.reduce((s, i) => s + (i.cost || 0), 0);
  const costPerRM  = totalLength > 0 ? totalCost / totalLength : 0;

  const summary = {
    totalCost:   parseFloat(totalCost.toFixed(2)),
    totalLength: parseFloat(totalLength.toFixed(2)),
    costPerRM:   parseFloat(costPerRM.toFixed(2)),
    hAgg,
    vAgg,
  };

  return { horizontal, vertical, summary };
}
