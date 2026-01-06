// src/services/bomCalculations.js - UPDATED FOR NEW SCHEMA
// Formula-based calculations for BOM hardware items
// Now uses sunrack_profiles + fasteners instead of bom_master_items

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
  M8x60_BOLT_SHORT: (tabCalc, calculated) => calculated.U_CLEAT, // For Double U Cleat (60mm version)
  M8x20_BOLT: (tabCalc, calculated) => calculated.END_CLAMP,
  M8x25_BOLT: (tabCalc, calculated) => calculated.MID_CLAMP,
  M8_BOLT_PLAIN_SPRING: (tabCalc, calculated) => calculated.U_CLEAT,
  M8_GRUB_SCREW: (tabCalc, calculated) => calculated.U_CLEAT * 2,

  // Level 4: Washers and nuts (deprecated but kept for backward compatibility)
  M8_HEX_NUTS: (tabCalc, calculated) => calculated.M8x60_BOLT,
  M8_PLAIN_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT * 2,
  M8_SPRING_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT + calculated.M8x20_BOLT + (calculated.M8x25_BOLT || 0),

  // Level 5: Other hardware
  SDS_4_2X19MM: (tabCalc, calculated) => calculated.RAIL_JOINTER * 4,
  SDS_4_8X19MM: (tabCalc) => tabCalc.sb2,
  SDS_5_5X63MM: (tabCalc) => tabCalc.sb1,
  SDS_6_3X63MM: (tabCalc) => tabCalc.sb1 + tabCalc.sb2, // For Double U Cleat
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
  calculated.M8x60_BOLT_SHORT = BOM_FORMULAS.M8x60_BOLT_SHORT(tabCalculation, calculated);
  calculated.M8x20_BOLT = BOM_FORMULAS.M8x20_BOLT(tabCalculation, calculated);
  calculated.M8x25_BOLT = BOM_FORMULAS.M8x25_BOLT(tabCalculation, calculated);
  calculated.M8_BOLT_PLAIN_SPRING = BOM_FORMULAS.M8_BOLT_PLAIN_SPRING(tabCalculation, calculated);
  calculated.M8_GRUB_SCREW = BOM_FORMULAS.M8_GRUB_SCREW(tabCalculation, calculated);

  // Level 4: Washers and nuts (deprecated)
  calculated.M8_HEX_NUTS = BOM_FORMULAS.M8_HEX_NUTS(tabCalculation, calculated);
  calculated.M8_PLAIN_WASHER = BOM_FORMULAS.M8_PLAIN_WASHER(tabCalculation, calculated);
  calculated.M8_SPRING_WASHER = BOM_FORMULAS.M8_SPRING_WASHER(tabCalculation, calculated);

  // Level 5: Other hardware
  calculated.SDS_4_2X19MM = BOM_FORMULAS.SDS_4_2X19MM(tabCalculation, calculated);
  calculated.SDS_4_8X19MM = BOM_FORMULAS.SDS_4_8X19MM(tabCalculation, calculated);
  calculated.SDS_5_5X63MM = BOM_FORMULAS.SDS_5_5X63MM(tabCalculation, calculated);
  calculated.SDS_6_3X63MM = BOM_FORMULAS.SDS_6_3X63MM(tabCalculation, calculated);
  calculated.RUBBER_PAD = BOM_FORMULAS.RUBBER_PAD(tabCalculation, calculated);
  calculated.BLIND_RIVETS = BOM_FORMULAS.BLIND_RIVETS(tabCalculation, calculated);

  return calculated;
}

/**
 * Calculate weight and cost for a BOM item
 * @param {Object} item - BOM item with item data
 * @param {Number} aluminumRate - Rate per kg for aluminum
 * @returns {Object} - Weight and cost calculations
 */
function calculateWeightAndCost(item, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
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

  // For profiles: weight-based calculation
  if (item.designWeight && item.designWeight > 0 && item.length) {
    result.wtPerRm = parseFloat(item.designWeight);
    result.rm = (item.length / MM_TO_METERS_DIVISOR) * item.finalTotal;
    result.wt = result.rm * result.wtPerRm;
    result.cost = result.wt * aluminumRate;
  }

  return result;
}

/**
 * Generate complete BOM items with quantities for all tabs
 * @param {Object} bomData - Collected BOM data from bomDataCollection
 * @param {Array} activeCutLengths - Active cut lengths (non-zero)
 * @param {Number} aluminumRate - Rate per kg for aluminum
 * @param {Object} template - Variation template with variationItems array
 * @returns {Array} - Array of BOM items with quantities per tab
 */
export async function generateBOMItems(bomData, activeCutLengths, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG, template) {
  const bomItems = [];
  let serialNumber = 1;

  console.log('[BOM DEBUG] bomData.tabs:', bomData.tabs);
  console.log('[BOM DEBUG] activeCutLengths:', activeCutLengths);
  console.log('[BOM DEBUG] template:', template ? `${template.variationItems?.length} items` : 'NULL');

  // Calculate quantities for each tab
  const tabQuantities = {};
  bomData.tabs.forEach(tabName => {
    tabQuantities[tabName] = calculateTabQuantities(bomData.tabCalculations[tabName]);
  });

  if (!template || !template.variationItems) {
    console.error('❌ Template or variation items not provided!');
    console.error('Template:', template);
    return [];
  }

  console.log(`✅ Processing ${template.variationItems.length} items from template`);

  // Map to store unique profiles/fasteners for BOMPage lookup
  const profilesMap = {};

  // Iterate through template variation items
  template.variationItems.forEach((vItem, idx) => {
    // Get item data from either sunrackProfile or fastener
    const item = vItem.sunrackProfile || vItem.fastener;

    console.log(`[BOM DEBUG ${idx + 1}] Item:`, item?.genericName, 'Formula:', vItem.formulaKey);

    if (!item) {
      console.warn('⚠️ Variation item has no profile or fastener data:', vItem);
      return;
    }

    const isProfile = !!vItem.sunrackProfile;
    const isFastener = !!vItem.fastener;
    const formulaKey = vItem.formulaKey;

    // Add to profilesMap
    // Use sNo for profiles, F-{id} for fasteners
    const profileKey = isProfile ? item.sNo : `F-${item.id}`;
    
    // Ensure item has necessary fields for BOMPage calculations
    const mapItem = { ...item };

    // Add sunrackCode to mapItem (BOMPage expects this field)
    mapItem.sunrackCode = item.regalCode || item.snalcoCode || item.excellenceCode || item.varnCode || null;

    if (isProfile) {
      mapItem.serialNumber = item.sNo; // Map sNo to serialNumber for BOMPage compatibility
    }
    if (isFastener) {
      // Ensure fasteners have costPerPiece in the map item
      mapItem.costPerPiece = parseFloat(item.costPerPiece) || 0;
      // Map other fields BOMPage might expect from a profile
      mapItem.genericName = item.name || item.genericName;
      mapItem.profileImagePath = item.imagePath || item.profileImagePath;
      mapItem.standardLength = item.standardLength; // Use standardLength directly (can be null)
    }
    
    profilesMap[profileKey] = mapItem;

    // DEBUG: Log profilesMap entry for sNo 94
    if (isProfile && item.sNo === 94) {
      console.log('=== DEBUG profilesMap[94] ===');
      console.log('mapItem:', mapItem);
      console.log('mapItem.sunrackCode:', mapItem.sunrackCode);
      console.log('mapItem.snalcoCode:', mapItem.snalcoCode);
      console.log('mapItem.regalCode:', mapItem.regalCode);
      console.log('===================================');
    }

    console.log(`[BOM DEBUG ${idx + 1}] isProfile:`, isProfile, 'isFastener:', isFastener, 'formulaKey:', formulaKey);

    // For Long Rail profiles, create multiple entries for each cut length
    if (isProfile && formulaKey === 'LONG_RAIL') {
      activeCutLengths.forEach(cutLength => {
        const quantities = {};
        let totalQty = 0;

        bomData.tabs.forEach(tabName => {
          const qty = bomData.tabCalculations[tabName].cutLengths[cutLength] || 0;
          quantities[tabName] = qty;
          totalQty += qty;
        });

        console.log(`[BOM DEBUG ${idx + 1}] Long Rail ${cutLength}mm - totalQty:`, totalQty);

        if (totalQty > 0) {
          const itemDescription = vItem.displayOverride || item.genericName;

          // Get vendor code (Regal priority, then Snalco)
          const displayCode = item.regalCode || item.snalcoCode || item.excellenceCode || item.varnCode || null;

          // DEBUG: Log for sNo 94 (UX Long Rail)
          if (item.sNo === 94) {
            console.log('=== DEBUG sNo 94 (UX Long Rail) - LONG_RAIL PATH ===');
            console.log('Item data:', item);
            console.log('regalCode:', item.regalCode);
            console.log('snalcoCode:', item.snalcoCode);
            console.log('excellenceCode:', item.excellenceCode);
            console.log('varnCode:', item.varnCode);
            console.log('Final displayCode:', displayCode);
            console.log('===================================');
          }

          // Get profile image
          let profileImage = item.profileImage;
          if (profileImage && !profileImage.startsWith('http')) {
            profileImage = `${API_URL}${profileImage}`;
          }

          const bomItem = {
            sn: serialNumber++,
            sunrackCode: displayCode,
            profileImage: profileImage,
            itemDescription: itemDescription,
            material: item.material || 'AA 6000 T5/T6',
            length: cutLength,
            uom: item.uom || 'Nos',
            calculationType: 'CUT_LENGTH',
            formulaKey: formulaKey,
            designWeight: item.designWeight,
            quantities: quantities,
            totalQuantity: totalQty,
            spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
            finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
            profileSerialNumber: profileKey // Link to profilesMap
          };

          const weightCost = calculateWeightAndCost(bomItem, aluminumRate);
          bomItem.wtPerRm = weightCost.wtPerRm;
          bomItem.rm = weightCost.rm;
          bomItem.wt = weightCost.wt;
          bomItem.cost = weightCost.cost;

          bomItems.push(bomItem);
        }
      });
    } else {
      // For all other items (accessories and fasteners)
      if (!formulaKey) {
        console.warn('⚠️ Item has no formula key:', item.genericName);
        return;
      }

      const quantities = {};
      let totalQty = 0;

      bomData.tabs.forEach(tabName => {
        const qty = tabQuantities[tabName][formulaKey] || 0;
        quantities[tabName] = qty;
        totalQty += qty;
      });

      console.log(`[BOM DEBUG ${idx + 1}] ${item.genericName} - totalQty:`, totalQty, 'quantities:', quantities);

      if (totalQty > 0) {
        let itemDescription = vItem.displayOverride || item.genericName;

        // Apply M8/M10 formatting for fasteners if applicable
        if (isFastener && item.standardLength && (itemDescription.startsWith('M8 ') || itemDescription.startsWith('M10 '))) {
          const prefix = itemDescription.startsWith('M8 ') ? 'M8' : 'M10';
          const restOfName = itemDescription.substring(prefix.length + 1);
          itemDescription = `${prefix}x${item.standardLength} ${restOfName}`;
        }

        // Get vendor code or null for fasteners (Regal priority, then Snalco)
        const displayCode = isProfile
          ? (item.regalCode || item.snalcoCode || item.excellenceCode || item.varnCode || null)
          : null;

        // DEBUG: Log for sNo 94 (UX Long Rail)
        if (isProfile && item.sNo === 94) {
          console.log('=== DEBUG sNo 94 (UX Long Rail) ===');
          console.log('Item data:', item);
          console.log('regalCode:', item.regalCode);
          console.log('snalcoCode:', item.snalcoCode);
          console.log('excellenceCode:', item.excellenceCode);
          console.log('varnCode:', item.varnCode);
          console.log('Final displayCode:', displayCode);
          console.log('===================================');
        }

        // Get image
        let profileImage = null;
        if (isProfile && item.profileImage) {
          profileImage = item.profileImage.startsWith('http')
            ? item.profileImage
            : `${API_URL}${item.profileImage}`;
        } else if (isFastener && item.profileImagePath) {
          profileImage = item.profileImagePath.startsWith('http')
            ? item.profileImagePath
            : `${API_URL}${item.profileImagePath}`;
        }

        const bomItem = {
          sn: serialNumber++,
          sunrackCode: displayCode,
          profileImage: profileImage,
          itemDescription: itemDescription,
          material: item.material,
          length: item.standardLength,
          uom: item.uom || 'Nos',
          calculationType: 'ACCESSORY',
          formulaKey: formulaKey,
          costPerPiece: item.costPerPiece,
          designWeight: item.designWeight,
          quantities: quantities,
          totalQuantity: totalQty,
          spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
          finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
          profileSerialNumber: profileKey // Link to profilesMap
        };

        // DEBUG: Log final bomItem for sNo 94
        if (isProfile && item.sNo === 94) {
          console.log('=== DEBUG bomItem for sNo 94 ===');
          console.log('bomItem.sunrackCode:', bomItem.sunrackCode);
          console.log('Full bomItem:', bomItem);
          console.log('===================================');
        }

        const weightCost = calculateWeightAndCost(bomItem, aluminumRate);
        bomItem.wtPerRm = weightCost.wtPerRm;
        bomItem.rm = weightCost.rm;
        bomItem.wt = weightCost.wt;
        bomItem.cost = weightCost.cost;

        bomItems.push(bomItem);

        // DEBUG: Log if this is sNo 94
        if (isProfile && item.sNo === 94) {
          console.log('=== PUSHED sNo 94 to bomItems array ===');
          console.log('Array length now:', bomItems.length);
        }
      }
    }
  });

  console.log(`[BOM DEBUG] FINAL: Generated ${bomItems.length} BOM items`);

  // DEBUG: Check if sNo 94 is in the final array
  const sno94Item = bomItems.find(item => item.profileSerialNumber === 94);
  if (sno94Item) {
    console.log('=== sNo 94 FOUND in final bomItems ===');
    console.log('Item:', sno94Item);
  } else {
    console.log('=== WARNING: sNo 94 NOT FOUND in final bomItems ===');
  }

  return { bomItems, profilesMap };
}

/**
 * Complete BOM generation pipeline
 * @param {Object} bomData - Collected BOM data
 * @param {Array} activeCutLengths - Active cut lengths
 * @param {Number} aluminumRate - Rate per kg for aluminum
 * @returns {Object} - Complete BOM structure
 */
export async function generateCompleteBOM(bomData, activeCutLengths, aluminumRate = DEFAULT_ALUMINIUM_RATE_PER_KG) {
  // Fetch variation template (contains all items we need)
  const variationName = bomData.projectInfo.longRailVariation;

  if (!variationName) {
    console.error('❌ No variation name provided in bomData');
    return { bomItems: [], totals: {} };
  }

  console.log(`📋 Fetching template for variation: ${variationName}`);
  const template = await getVariationTemplate(variationName);

  if (!template) {
    console.error(`❌ Template not found for variation: ${variationName}`);
    return { bomItems: [], totals: {} };
  }

  console.log(`✅ Template loaded successfully. Items count: ${template.variationItems?.length || 0}`);

  // Generate BOM items using template data
  const { bomItems, profilesMap } = await generateBOMItems(bomData, activeCutLengths, aluminumRate, template);

  // Calculate totals
  const totals = {
    totalWeight: bomItems.reduce((sum, item) => sum + (item.wt || 0), 0),
    totalCost: bomItems.reduce((sum, item) => sum + (item.cost || 0), 0),
    totalItems: bomItems.length
  };

  const result = {
    bomItems: bomItems,
    profilesMap: profilesMap, // Return profilesMap for BOMPage lookups
    totals: totals,
    template: template,
    variationName: variationName
  };

  console.log('[BOM DEBUG] generateCompleteBOM returning:', {
    itemsCount: result.bomItems.length,
    totals: result.totals,
    firstItem: result.bomItems[0]
  });

  return result;
}
