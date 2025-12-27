// src/services/bomCalculations.js
// Formula-based calculations for BOM hardware items

import { API_URL } from './config';
import {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  SPARE_CALCULATION_MULTIPLIER,
  MM_TO_METERS_DIVISOR
} from '../constants/bomDefaults';

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
 * Calculate weight and cost for a BOM item
 * @param {Object} item - BOM item
 * @param {Object} profilesMap - Map of profile serial numbers to profile data
 * @param {Number} aluminumRate - Rate per kg for aluminum
 * @returns {Object} - Weight and cost calculations
 */
function calculateWeightAndCost(item, profilesMap, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
  const result = {
    wtPerRm: null,  // Weight per running meter (kg/m)
    rm: null,       // Running meters
    wt: null,       // Total weight (kg)
    cost: null      // Total cost
  };

  // Check if item has cost_per_piece directly (for fasteners)
  if (item.costPerPiece && item.costPerPiece > 0) {
    result.cost = parseFloat(item.costPerPiece) * item.finalTotal;
    return result;
  }

  // Try to find the profile in profilesMap by sunrackCode
  const profile = Object.values(profilesMap).find(p =>
    p.sunrackCode === item.sunrackCode ||
    p.preferredRmCode === item.sunrackCode
  );

  if (profile) {
    // Determine the length to use: item.length (for cut lengths) or profile.standardLength (for accessories)
    const lengthToUse = item.length || profile.standardLength;

    // Check if it has design weight (weight-based calculation)
    if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
      result.wtPerRm = parseFloat(profile.designWeight);
      result.rm = (lengthToUse / MM_TO_METERS_DIVISOR) * item.finalTotal;  // Convert mm to meters
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * aluminumRate;
    }
    // Check if it has cost per piece (piece-based calculation) from profile
    else if (profile.costPerPiece && profile.costPerPiece > 0) {
      result.cost = parseFloat(profile.costPerPiece) * item.finalTotal;
    }
  }

  return result;
}

/**
 * Generate complete BOM items with quantities for all tabs
 * @param {Object} bomData - Collected BOM data from bomDataCollection
 * @param {Array} activeCutLengths - Active cut lengths (non-zero)
 * @param {Object} profilesMap - Map of profile serial numbers to profile data
 * @param {Number} aluminumRate - Rate per kg for aluminum (default: DEFAULT_ALUMINIUM_RATE_PER_KG)
 * @returns {Array} - Array of BOM items with quantities per tab
 */
export async function generateBOMItems(bomData, activeCutLengths, profilesMap, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
  const bomItems = [];
  let serialNumber = 1;

  // Calculate quantities for each tab
  const tabQuantities = {};
  bomData.tabs.forEach(tabName => {
    tabQuantities[tabName] = calculateTabQuantities(bomData.tabCalculations[tabName]);
  });

  // 1. Add Long Rails for each active cut length
  // Determine which profile to use (use first tab's profile if all same, or default)
  const profileSerialNumbers = Object.values(bomData.tabProfiles);
  const primaryProfileSerialNumber = profileSerialNumbers[0] || '26';

  // Get profile details from profilesMap
  const selectedProfile = profilesMap[primaryProfileSerialNumber];

  activeCutLengths.forEach(cutLength => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = bomData.tabCalculations[tabName].cutLengths[cutLength] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      const item = {
        sn: serialNumber++,
        sunrackCode: selectedProfile?.preferredRmCode || selectedProfile?.sunrackCode || 'MA-43',  // Use RM code (Regal priority)
        profileImage: selectedProfile?.profileImagePath || '/assets/bom-profiles/MA-43.png',  // From DB
        itemDescription: selectedProfile?.genericName || '40mm Long Rail',  // Use genericName!
        material: selectedProfile?.material || 'AA 6000 T5/T6',  // Prefer DB material
        length: cutLength,
        uom: 'Nos',
        calculationType: 'CUT_LENGTH',  // NEW: Mark as cut length type
        profileSerialNumber: primaryProfileSerialNumber,  // NEW: Store for edit mode
        quantities: quantities,
        totalQuantity: totalQty,
        spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
        finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
      };

      // Calculate weight and cost
      const weightCost = calculateWeightAndCost(item, profilesMap, aluminumRate);
      item.wtPerRm = weightCost.wtPerRm;
      item.rm = weightCost.rm;
      item.wt = weightCost.wt;
      item.cost = weightCost.cost;

      bomItems.push(item);
    }
  });

  // 2. Build hardware items from database (items with formulas) + hardcoded hardware
  const hardwareItems = [];

  // Add all items from database that have formulas (including fasteners)
  Object.values(profilesMap).forEach(profile => {
    if (profile.formulas && profile.formulas.length > 0) {
      profile.formulas.forEach(formula => {
        hardwareItems.push({
          sunrackCode: profile.sunrackCode,
          preferredRmCode: profile.preferredRmCode,
          profileImagePath: profile.profileImagePath,  // Use image path from DB
          itemDescription: profile.genericName,  // Use genericName from DB
          material: profile.material,
          length: profile.standardLength,
          uom: profile.uom,
          formulaKey: formula.formulaKey,
          costPerPiece: profile.costPerPiece  // NEW: Include cost per piece for fasteners
        });
      });
    }
  });

  hardwareItems.forEach(item => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = tabQuantities[tabName][item.formulaKey] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0) {
      // Use RM code if available, otherwise use sunrack code
      const displayCode = item.preferredRmCode || item.sunrackCode;

      const bomItem = {
        sn: serialNumber++,
        sunrackCode: displayCode,  // Use RM code if available
        profileImage: item.profileImagePath || null,  // Use image path from DB
        itemDescription: item.itemDescription,
        material: item.material,
        length: item.length,
        uom: item.uom,
        calculationType: 'ACCESSORY',  // NEW: Mark as accessory type
        formulaKey: item.formulaKey,
        costPerPiece: item.costPerPiece,  // NEW: Pass cost per piece for fasteners
        quantities: quantities,
        totalQuantity: totalQty,
        spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
        finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
      };

      // Calculate weight and cost
      const weightCost = calculateWeightAndCost(bomItem, profilesMap, aluminumRate);
      bomItem.wtPerRm = weightCost.wtPerRm;
      bomItem.rm = weightCost.rm;
      bomItem.wt = weightCost.wt;
      bomItem.cost = weightCost.cost;

      bomItems.push(bomItem);
    }
  });

  return bomItems;
}

/**
 * Complete BOM generation pipeline
 * @param {Object} bomData - Collected BOM data
 * @param {Array} activeCutLengths - Active cut lengths
 * @param {Number} aluminumRate - Rate per kg for aluminum (default: DEFAULT_ALUMINIUM_RATE_PER_KG)
 * @returns {Object} - Complete BOM structure
 */
export async function generateCompleteBOM(bomData, activeCutLengths, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
  // Fetch all profiles from API
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let allProfiles = [];
  try {
    const response = await fetch(`${API_URL}/api/bom/master-items`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch master items: ${response.status} ${response.statusText}`);
    }
    allProfiles = await response.json();
  } catch (error) {
    console.error('Error fetching master items:', error);
    // Fallback: Continue with empty profiles or handle error appropriately
    // For now, we'll proceed but logging the error is crucial.
    // Ideally, we might want to throw here if profiles are essential.
  }

  // Create profilesMap: { serialNumber: profileData }
  const profilesMap = {};
  if (Array.isArray(allProfiles)) {
    allProfiles.forEach(profile => {
      profilesMap[profile.serialNumber] = profile;
    });
  }

  const bomItems = await generateBOMItems(bomData, activeCutLengths, profilesMap, aluminumRate);

  return {
    projectInfo: bomData.projectInfo,
    tabs: bomData.tabs,
    panelCounts: bomData.panelCounts,
    profilesMap: profilesMap,  // NEW: Pass profiles to BOM page
    bomItems: bomItems,
    aluminumRate: aluminumRate,  // NEW: Pass aluminum rate to BOM page
    moduleWp: bomData.moduleWp  // Pass module Wp to BOM page
  };
}
