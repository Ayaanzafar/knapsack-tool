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
  M8x20_BOLT: (tabCalc, calculated) => calculated.END_CLAMP, // Changed to only END_CLAMP for template alignment
  M8x25_BOLT: (tabCalc, calculated) => calculated.MID_CLAMP, // NEW
  M8_BOLT_PLAIN_SPRING: (tabCalc, calculated) => calculated.U_CLEAT, // NEW
  M8_GRUB_SCREW: (tabCalc, calculated) => calculated.U_CLEAT * 2, // NEW

  // Level 4: Washers and nuts
  M8_HEX_NUTS: (tabCalc, calculated) => calculated.M8x60_BOLT,
  M8_PLAIN_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT * 2,
  M8_SPRING_WASHER: (tabCalc, calculated) => calculated.M8x60_BOLT + calculated.M8x20_BOLT + (calculated.M8x25_BOLT || 0),

  // Level 5: Other hardware
  SDS_4_2X13MM: (tabCalc, calculated) => calculated.RAIL_JOINTER * 4,
  SDS_4_8X19MM: (tabCalc) => tabCalc.sb2, // NEW
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
  calculated.M8x25_BOLT = BOM_FORMULAS.M8x25_BOLT(tabCalculation, calculated);
  calculated.M8_BOLT_PLAIN_SPRING = BOM_FORMULAS.M8_BOLT_PLAIN_SPRING(tabCalculation, calculated);
  calculated.M8_GRUB_SCREW = BOM_FORMULAS.M8_GRUB_SCREW(tabCalculation, calculated);

  // Level 4: Washers and nuts
  calculated.M8_HEX_NUTS = BOM_FORMULAS.M8_HEX_NUTS(tabCalculation, calculated);
  calculated.M8_PLAIN_WASHER = BOM_FORMULAS.M8_PLAIN_WASHER(tabCalculation, calculated);
  calculated.M8_SPRING_WASHER = BOM_FORMULAS.M8_SPRING_WASHER(tabCalculation, calculated);

  // Level 5: Other hardware
  calculated.SDS_4_2X13MM = BOM_FORMULAS.SDS_4_2X13MM(tabCalculation, calculated);
  calculated.SDS_4_8X19MM = BOM_FORMULAS.SDS_4_8X19MM(tabCalculation, calculated);
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

  // ✅ NEW: Helper function to normalize sunrack codes (remove all non-alphanumeric characters)
  function normalizeCode(code) {
    if (!code) return '';
    // Remove all non-alphanumeric characters, convert to uppercase
    return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  // ✅ NEW: Create Map of allowed items from relational variationItems
  let allowedItemsMap = new Map(); // masterItemId -> variationItem (with masterItem details)

  if (template && template.variationItems) {
    template.variationItems.forEach(vItem => {
      allowedItemsMap.set(vItem.masterItemId, vItem);
    });

    console.log(`✅ Template filtering enabled. Allowed items count: ${allowedItemsMap.size}`);
  } else {
    console.log('⚠️ No template provided or no items in template. Showing all items.');
  }

  // ✅ NEW: Helper function to check if item is allowed and get template data
  function getTemplateData(profile) {
    // If no template, allow all items (backward compatibility)
    if (!template || !template.variationItems) return { allowed: true, vItem: null };

    const vItem = allowedItemsMap.get(profile.id);
    if (vItem) {
      return { allowed: true, vItem };
    }

    return { allowed: false, vItem: null };
  }

  // 1. Add Long Rails for each active cut length
  const profileSerialNumbers = Object.values(bomData.tabProfiles);
  const primaryProfileSerialNumber = profileSerialNumbers[0] || '26';
  const selectedProfile = profilesMap[primaryProfileSerialNumber];

  activeCutLengths.forEach(cutLength => {
    const quantities = {};
    let totalQty = 0;

    bomData.tabs.forEach(tabName => {
      const qty = bomData.tabCalculations[tabName].cutLengths[cutLength] || 0;
      quantities[tabName] = qty;
      totalQty += qty;
    });

    if (totalQty > 0 && selectedProfile) {
      const { allowed, vItem } = getTemplateData(selectedProfile);

      if (allowed) {
        // Find Regal code from sunrackProfile if linked, otherwise from rmCodes
        let displayCode = selectedProfile.preferredRmCode;
        
        // Initial image path from master item
        let profileImage = selectedProfile.profileImagePath;
        if (profileImage && profileImage.startsWith('/assets')) {
          profileImage = `${API_URL}${profileImage}`;
        } else if (!profileImage) {
          profileImage = `${API_URL}/assets/bom-profiles/MA-43.png`;
        }
        
        if (selectedProfile.sunrackProfile) {
          if (selectedProfile.sunrackProfile.regalCode) {
            displayCode = selectedProfile.sunrackProfile.regalCode;
          }
          if (selectedProfile.sunrackProfile.profileImage) {
            // Prepend API_URL if the path starts with /assets (backend path)
            profileImage = selectedProfile.sunrackProfile.profileImage.startsWith('/') 
              ? `${API_URL}${selectedProfile.sunrackProfile.profileImage}`
              : selectedProfile.sunrackProfile.profileImage;
          }
        }

        const itemDescription = vItem?.displayOverride || selectedProfile.genericName;

        const item = {
          sn: serialNumber++,
          sunrackCode: displayCode || 'MA-43',
          profileImage: profileImage,
          itemDescription: itemDescription,
          material: selectedProfile.material || 'AA 6000 T5/T6',
          length: cutLength,
          uom: 'Nos',
          calculationType: 'CUT_LENGTH',
          profileSerialNumber: primaryProfileSerialNumber,
          quantities: quantities,
          totalQuantity: totalQty,
          spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
          finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
        };

        const weightCost = calculateWeightAndCost(item, profilesMap, aluminumRate);
        item.wtPerRm = weightCost.wtPerRm;
        item.rm = weightCost.rm;
        item.wt = weightCost.wt;
        item.cost = weightCost.cost;

        bomItems.push(item);
      }
    }
  });

  // 2. Add Accessory items
  Object.values(profilesMap).forEach(profile => {
    if (profile.formulas && profile.formulas.length > 0) {
      const { allowed, vItem } = getTemplateData(profile);

      if (allowed) {
        profile.formulas.forEach(formula => {
          const quantities = {};
          let totalQty = 0;

          // Check if this specific variationItem restricts the formula
          // (If vItem has a formulaKey, we only use that one)
          if (vItem.formulaKey && vItem.formulaKey !== formula.formulaKey) {
             return;
          }

          bomData.tabs.forEach(tabName => {
            const qty = tabQuantities[tabName][formula.formulaKey] || 0;
            quantities[tabName] = qty;
            totalQty += qty;
          });

          if (totalQty > 0) {
            // DEBUG
            if (profile.serialNumber === '56') {
               console.log('[bomCalculations] Processing End Clamp:', {
                 id: profile.id,
                 vItem: vItem,
                 displayCode: profile.preferredRmCode,
                 sunrackProfile: profile.sunrackProfile
               });
            }

            // Find Regal code
            let displayCode = profile.preferredRmCode;
            
            // Initial image path from master item
            let profileImage = profile.profileImagePath;
            if (profileImage && profileImage.startsWith('/assets')) {
              profileImage = `${API_URL}${profileImage}`;
            }

            if (profile.sunrackProfile) {
              if (profile.sunrackProfile.regalCode) {
                displayCode = profile.sunrackProfile.regalCode;
              }
              if (profile.sunrackProfile.profileImage) {
                // Prepend API_URL if the path starts with /assets (backend path)
                profileImage = profile.sunrackProfile.profileImage.startsWith('/') 
                  ? `${API_URL}${profile.sunrackProfile.profileImage}`
                  : profile.sunrackProfile.profileImage;
              }
            }

            let itemDescription = vItem.displayOverride || profile.genericName;
            
            // Apply M8/M10 formatting if applicable
            if (profile.standardLength && (itemDescription.startsWith('M8 ') || itemDescription.startsWith('M10 '))) {
              const prefix = itemDescription.startsWith('M8 ') ? 'M8' : 'M10';
              const restOfName = itemDescription.substring(prefix.length + 1);
              itemDescription = `${prefix}x${profile.standardLength} ${restOfName}`;
            }

            const bomItem = {
              sn: serialNumber++,
              sunrackCode: displayCode,
              profileImage: profileImage,
              itemDescription: itemDescription,
              material: profile.material,
              length: profile.standardLength,
              uom: profile.uom,
              calculationType: 'ACCESSORY',
              formulaKey: formula.formulaKey,
              costPerPiece: profile.costPerPiece,
              quantities: quantities,
              totalQuantity: totalQty,
              spareQuantity: Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER),
              finalTotal: totalQty + Math.ceil(totalQty * SPARE_CALCULATION_MULTIPLIER)
            };

            const weightCost = calculateWeightAndCost(bomItem, profilesMap, aluminumRate);
            bomItem.wtPerRm = weightCost.wtPerRm;
            bomItem.rm = weightCost.rm;
            bomItem.wt = weightCost.wt;
            bomItem.cost = weightCost.cost;

            bomItems.push(bomItem);
          }
        });
      }
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
    
    // DEBUG: Check if End Clamp (SN 56) has sunrackProfile
    const endClamp = allProfiles.find(p => p.serialNumber === '56');
    console.log('[bomCalculations] End Clamp Data:', endClamp);

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
