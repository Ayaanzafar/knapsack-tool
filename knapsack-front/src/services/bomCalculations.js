// src/services/bomCalculations.js
// Formula-based calculations for BOM hardware items

import { API_URL } from './config';
import {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  SPARE_CALCULATION_MULTIPLIER,
  MM_TO_METERS_DIVISOR
} from '../constants/bomDefaults';
import { getVariationTemplate, formatItemDescription } from './templateService';

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

  // Try to find the profile in profilesMap by preferredRmCode
  const profile = Object.values(profilesMap).find(p =>
    p.preferredRmCode === item.sunrackCode  // item.sunrackCode now contains RM code
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
 * @param {Object|null} template - Variation template with items array (optional, for filtering)
 * @returns {Array} - Array of BOM items with quantities per tab
 */
export async function generateBOMItems(bomData, activeCutLengths, profilesMap, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG, template = null) {
  const bomItems = [];
  let serialNumber = 1;

  // Calculate quantities for each tab
  const tabQuantities = {};
  bomData.tabs.forEach(tabName => {
    tabQuantities[tabName] = calculateTabQuantities(bomData.tabCalculations[tabName]);
  });

  // ✅ NEW: Helper function to normalize sunrack codes (remove spaces AND hyphens)
  function normalizeCode(code) {
    if (!code) return '';
    // Remove all spaces and hyphens, convert to uppercase
    return code.replace(/[\s\-]+/g, '').toUpperCase();
  }

  // ✅ NEW: Create a Set of allowed items from template
  let allowedItems = null;
  let templateItemsMap = new Map(); // Map to store template items by normalized code

  if (template && template.items) {
    allowedItems = new Set();

    template.items.forEach(templateItem => {
      // Store by sunrack code (normalized - remove spaces AND hyphens)
      if (templateItem.sunrackCode) {
        const normalizedCode = normalizeCode(templateItem.sunrackCode);
        allowedItems.add(normalizedCode);
        templateItemsMap.set(normalizedCode, templateItem);
      }

      // Also store by description (for fasteners without codes)
      if (templateItem.itemDescription) {
        const normalizedDesc = templateItem.itemDescription.trim();
        allowedItems.add(normalizedDesc);
        templateItemsMap.set(normalizedDesc, templateItem);
      }
    });

    console.log('✅ Template filtering enabled. Allowed items:', Array.from(allowedItems));
  } else {
    console.log('⚠️ No template provided. Showing all items (backward compatibility).');
  }

  // ✅ NEW: Helper function to check if item is allowed and get template item
  function getTemplateItem(preferredRmCode, itemDescription) {
    // If no template, allow all items (backward compatibility)
    if (!allowedItems) return { allowed: true, templateItem: null };

    // Check by RM code (MA-XX, SR-XX, etc.) - normalize: remove spaces AND hyphens
    if (preferredRmCode) {
      const normalizedCode = normalizeCode(preferredRmCode);
      if (allowedItems.has(normalizedCode)) {
        return { allowed: true, templateItem: templateItemsMap.get(normalizedCode) };
      }
    }

    // Check by description (for fasteners without RM codes)
    if (itemDescription) {
      const normalizedDesc = itemDescription.trim();
      if (allowedItems.has(normalizedDesc)) {
        return { allowed: true, templateItem: templateItemsMap.get(normalizedDesc) };
      }
    }

    return { allowed: false, templateItem: null };
  }

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
      const preferredRmCode = selectedProfile?.preferredRmCode;
      const dbDescription = selectedProfile?.genericName || '40mm Long Rail';

      // ✅ NEW: Check if Long Rail is allowed in this variation (using RM code)
      const { allowed, templateItem } = getTemplateItem(preferredRmCode, dbDescription);

      if (allowed) {
        // ✅ NEW: Use template description if available, otherwise use DB description
        const itemDescription = templateItem
          ? formatItemDescription(templateItem)
          : dbDescription;

        const item = {
          sn: serialNumber++,
          sunrackCode: preferredRmCode || 'MA-43',  // ✅ Use RM code (MA-43, not SRC-XXX)
          profileImage: selectedProfile?.profileImagePath || '/assets/bom-profiles/MA-43.png',
          itemDescription: itemDescription,  // ✅ UPDATED: Use formatted description
          material: selectedProfile?.material || 'AA 6000 T5/T6',
          length: cutLength,
          uom: 'Nos',
          calculationType: 'CUT_LENGTH',
          profileSerialNumber: primaryProfileSerialNumber,
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
      } else {
        console.log(`⚠️ Long Rail (${preferredRmCode}) not in template. Skipping.`);
      }
    }
  });

  // 2. Build hardware items from database (items with formulas) + hardcoded hardware
  const hardwareItems = [];

  // Add all items from database that have formulas (including fasteners)
  Object.values(profilesMap).forEach(profile => {
    if (profile.formulas && profile.formulas.length > 0) {
      const preferredRmCode = profile.preferredRmCode;
      const dbDescription = profile.genericName;

      // ✅ NEW: Check if item is allowed in this variation (using RM code)
      const { allowed, templateItem } = getTemplateItem(preferredRmCode, dbDescription);

      if (allowed) {
        profile.formulas.forEach(formula => {
          hardwareItems.push({
            preferredRmCode: profile.preferredRmCode,
            profileImagePath: profile.profileImagePath,
            itemDescription: profile.genericName,
            material: profile.material,
            length: profile.standardLength,
            uom: profile.uom,
            formulaKey: formula.formulaKey,
            costPerPiece: profile.costPerPiece,
            templateItem: templateItem  // ✅ NEW: Pass template item for formatting
          });
        });
      } else {
        console.log(`⚠️ Item ${preferredRmCode || dbDescription} not in template. Skipping.`);
      }
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
      // ✅ Use RM code (MA-XX, SR-XX, etc.)
      const displayCode = item.preferredRmCode;

      // ✅ NEW: Use template description with M8/M10 formatting if available
      const itemDescription = item.templateItem
        ? formatItemDescription(item.templateItem)
        : item.itemDescription;

      const bomItem = {
        sn: serialNumber++,
        sunrackCode: displayCode,  // ✅ Use RM code (not SRC-XXX)
        profileImage: item.profileImagePath || null,
        itemDescription: itemDescription,  // ✅ UPDATED: Use formatted description
        material: item.material,
        length: item.length,
        uom: item.uom,
        calculationType: 'ACCESSORY',
        formulaKey: item.formulaKey,
        costPerPiece: item.costPerPiece,
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

  // ✅ NEW: Fetch variation template
  const variationName = bomData.projectInfo.longRailVariation;
  let template = null;

  if (variationName) {
    try {
      console.log(`📋 Fetching template for variation: ${variationName}`);
      template = await getVariationTemplate(variationName);

      if (template) {
        console.log(`✅ Template loaded successfully. Items count: ${template.items?.length || 0}`);
      } else {
        console.warn(`⚠️ No template found for variation: ${variationName}. Showing all items.`);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      // Continue without template (fallback to all items)
    }
  } else {
    console.warn('⚠️ No variation specified. Showing all items (backward compatibility).');
  }

  // Create profilesMap: { serialNumber: profileData }
  const profilesMap = {};
  if (Array.isArray(allProfiles)) {
    allProfiles.forEach(profile => {
      profilesMap[profile.serialNumber] = profile;
    });
  }

  // ✅ UPDATED: Pass template to generateBOMItems
  const bomItems = await generateBOMItems(bomData, activeCutLengths, profilesMap, aluminumRate, template);

  return {
    projectInfo: bomData.projectInfo,
    tabs: bomData.tabs,
    panelCounts: bomData.panelCounts,
    profilesMap: profilesMap,
    bomItems: bomItems,
    aluminumRate: aluminumRate,
    moduleWp: bomData.moduleWp,
    defaultNotes: template?.defaultNotes || []  // ✅ NEW: Include default notes from template
  };
}
