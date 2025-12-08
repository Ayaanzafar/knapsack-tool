// src/services/bomCalculations.js
// Formula-based calculations for BOM hardware items

/**
 * Formula map for calculating hardware quantities
 * Each formula takes tabCalculation data and previously calculated values
 */
export const BOM_FORMULAS = {
  // Level 1: Direct from tab data
  LONG_RAIL: (tabCalc, cutLength) => tabCalc.cutLengths[cutLength] || 0,
  TOTAL_MODULES: (tabCalc) => tabCalc.totalModules,
  RAIL_JOINTER: (tabCalc) => tabCalc.joints,
  END_CLAMP: (tabCalc) => tabCalc.endClamps,
  MID_CLAMP: (tabCalc) => tabCalc.midClamps,

  // Level 2: Calculated from Level 1
  U_CLEAT: (tabCalc) => tabCalc.sb1 + tabCalc.sb2,
  RAIL_NUTS: (tabCalc, calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,

  // Level 3: Bolt calculations
  M8x60_BOLT: (tabCalc, calculated) => calculated.U_CLEAT,
  M8x20_BOLT: (tabCalc, calculated) => calculated.END_CLAMP + calculated.MID_CLAMP,

  // Level 4: Washers and nuts
  M8_HEX_NUTS: (tabCalc, calculated) => calculated.M8x60_BOLT,
  M8_PLAIN_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT * 2,
  M8_SPRING_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT + calculated.M8x20_BOLT,

  // Level 5: Other hardware
  SDS_4_2X13MM: (tabCalc, calculated) => calculated.RAIL_JOINTER * 4,
  SDS_5_5X63MM: (tabCalc) => tabCalc.sb1,
  RUBBER_PAD: (tabCalc, calculated) => calculated.U_CLEAT,
  BLIND_RIVETS: (tabCalc) => tabCalc.sb2
};

/**
 * Calculate quantities for a single tab
 * @param {Object} tabCalculation - Tab calculation data from bomDataCollection
 * @returns {Object} - Calculated quantities for all items
 */
export function calculateTabQuantities(tabCalculation) {
  const calculated = {};

  // Level 1: Direct calculations
  calculated.TOTAL_MODULES = BOM_FORMULAS.TOTAL_MODULES(tabCalculation);
  calculated.RAIL_JOINTER = BOM_FORMULAS.RAIL_JOINTER(tabCalculation);
  calculated.END_CLAMP = BOM_FORMULAS.END_CLAMP(tabCalculation);
  calculated.MID_CLAMP = BOM_FORMULAS.MID_CLAMP(tabCalculation);

  // Level 2: Dependent calculations
  calculated.U_CLEAT = BOM_FORMULAS.U_CLEAT(tabCalculation, calculated);
  calculated.RAIL_NUTS = BOM_FORMULAS.RAIL_NUTS(tabCalculation, calculated);

  // Level 3: Bolt calculations
  calculated.M8x60_BOLT = BOM_FORMULAS.M8x60_BOLT(tabCalculation, calculated);
  calculated.M8x20_BOLT = BOM_FORMULAS.M8x20_BOLT(tabCalculation, calculated);

  // Level 4: Washers and nuts
  calculated.M8_HEX_NUTS = BOM_FORMULAS.M8_HEX_NUTS(tabCalculation, calculated);
  calculated.M8_PLAIN_WASHER = BOM_FORMULAS.M8_PLAIN_WASHER(tabCalculation, calculated);
  calculated.M8_SPRING_WASHER = BOM_FORMULAS.M8_SPRING_WASHER(tabCalculation, calculated);

  // Level 5: Other hardware
  calculated.SDS_4_2X13MM = BOM_FORMULAS.SDS_4_2X13MM(tabCalculation, calculated);
  calculated.SDS_5_5X63MM = BOM_FORMULAS.SDS_5_5X63MM(tabCalculation, calculated);
  calculated.RUBBER_PAD = BOM_FORMULAS.RUBBER_PAD(tabCalculation, calculated);
  calculated.BLIND_RIVETS = BOM_FORMULAS.BLIND_RIVETS(tabCalculation, calculated);

  return calculated;
}

/**
 * Generate complete BOM items with quantities for all tabs
 * @param {Object} bomData - Collected BOM data from bomDataCollection
 * @param {Array} activeCutLengths - Active cut lengths (non-zero)
 * @returns {Array} - Array of BOM items with quantities per tab
 */
export function generateBOMItems(bomData, activeCutLengths) {
  const bomItems = [];
  let serialNumber = 1;

  // Calculate quantities for each tab
  const tabQuantities = {};
  bomData.tabs.forEach(tabName => {
    tabQuantities[tabName] = calculateTabQuantities(bomData.tabCalculations[tabName]);
  });

  // 1. Add Long Rails for each active cut length
  activeCutLengths.forEach(cutLength => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = bomData.tabCalculations[tabName].cutLengths[cutLength] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      bomItems.push({
        sn: serialNumber++,
        sunrackCode: 'MA-43',
        profileImage: '/assets/bom-profiles/MA-43.png',
        itemDescription: `Long Rail - ${cutLength}mm`,
        material: 'AA 6000 T5/T6',
        length: cutLength,
        uom: 'Nos',
        calculationType: 'DIRECT',
        quantities: quantities,
        totalQuantity: totalQty,
        spareQuantity: Math.ceil(totalQty * 0.01),
        finalTotal: totalQty + Math.ceil(totalQty * 0.01)
      });
    }
  });

  // 2. Add hardware items (with formulas)
  const hardwareItems = [
    {
      sunrackCode: 'MA-110',
      itemDescription: 'U Cleat (5mm Hole)',
      material: 'AA 6000 T5/T6',
      length: 40,
      uom: 'Nos',
      formulaKey: 'U_CLEAT'
    },
    {
      sunrackCode: 'MA-72',
      itemDescription: 'Rail Jointer',
      material: 'AA 6000 T5/T6',
      length: 150,
      uom: 'Nos',
      formulaKey: 'RAIL_JOINTER'
    },
    {
      sunrackCode: 'MA-109',
      itemDescription: 'End Clamps-30mm',
      material: 'AA 6000 T5/T6',
      length: 50,
      uom: 'Nos',
      formulaKey: 'END_CLAMP'
    },
    {
      sunrackCode: 'MA-35',
      itemDescription: 'Mid Clamps',
      material: 'AA 6000 T5/T6',
      length: 50,
      uom: 'Nos',
      formulaKey: 'MID_CLAMP'
    },
    {
      sunrackCode: 'MA-46',
      itemDescription: 'Rail Nuts',
      material: 'AA 6000 T5/T6',
      length: 20,
      uom: 'Nos',
      formulaKey: 'RAIL_NUTS'
    },
    {
      sunrackCode: null,
      itemDescription: 'M8x60 Hex Head Bolt for U-cleat',
      material: 'SS304',
      length: null,
      uom: 'Nos',
      formulaKey: 'M8x60_BOLT'
    },
    {
      sunrackCode: null,
      itemDescription: 'M8x20 Allen Head Bolt for End & Mid Clamps',
      material: 'SS304',
      length: null,
      uom: 'Nos',
      formulaKey: 'M8x20_BOLT'
    },
    {
      sunrackCode: null,
      itemDescription: 'M8 Hex Nuts for Outer U-Cleat Bolt',
      material: 'SS304',
      length: null,
      uom: 'Nos',
      formulaKey: 'M8_HEX_NUTS'
    },
    {
      sunrackCode: null,
      itemDescription: 'M8 Plain Washer - 2 for U-Cleat Bolt',
      material: 'SS304',
      length: null,
      uom: 'Nos',
      formulaKey: 'M8_PLAIN_WASHER'
    },
    {
      sunrackCode: null,
      itemDescription: 'M8 Spring washers - 1 for All Bolts',
      material: 'SS304',
      length: null,
      uom: 'Nos',
      formulaKey: 'M8_SPRING_WASHER'
    },
    {
      sunrackCode: null,
      itemDescription: 'SDS 4.2X13mm for Rail jointer',
      material: 'GI',
      length: null,
      uom: 'Nos',
      formulaKey: 'SDS_4_2X13MM'
    },
    {
      sunrackCode: null,
      itemDescription: 'SDS 5.5X63mm for U Cleat',
      material: 'GI',
      length: null,
      uom: 'Nos',
      formulaKey: 'SDS_5_5X63MM'
    },
    {
      sunrackCode: null,
      itemDescription: 'Rubber Pad 40x40mm for U- cleat',
      material: 'EPDM',
      length: null,
      uom: 'Nos',
      formulaKey: 'RUBBER_PAD'
    },
    {
      sunrackCode: null,
      itemDescription: 'Blind Rivets - 4.5x15mm',
      material: 'Al 5000',
      length: null,
      uom: 'Nos',
      formulaKey: 'BLIND_RIVETS'
    }
  ];

  hardwareItems.forEach(item => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = tabQuantities[tabName][item.formulaKey] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      bomItems.push({
        sn: serialNumber++,
        sunrackCode: item.sunrackCode,
        profileImage: item.sunrackCode ? `/assets/bom-profiles/${item.sunrackCode}.png` : null,
        itemDescription: item.itemDescription,
        material: item.material,
        length: item.length,
        uom: item.uom,
        calculationType: 'FORMULA',
        formulaKey: item.formulaKey,
        quantities: quantities,
        totalQuantity: totalQty,
        spareQuantity: Math.ceil(totalQty * 0.01),
        finalTotal: totalQty + Math.ceil(totalQty * 0.01)
      });
    }
  });

  return bomItems;
}

/**
 * Complete BOM generation pipeline
 * @param {Object} bomData - Collected BOM data
 * @param {Array} activeCutLengths - Active cut lengths
 * @returns {Object} - Complete BOM structure
 */
export function generateCompleteBOM(bomData, activeCutLengths) {
  const bomItems = generateBOMItems(bomData, activeCutLengths);

  return {
    projectInfo: bomData.projectInfo,
    tabs: bomData.tabs,
    panelCounts: bomData.panelCounts,
    bomItems: bomItems
  };
}
