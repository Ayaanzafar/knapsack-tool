// src/services/bomDataCollection.js
// Service to collect data from all tabs for BOM generation

import { calculateSB1 } from '../lib/calculations';
import { requiredRailLength, generateScenarios } from '../lib/optimizer';
import { parseNumList } from '../lib/storage';
import { DEFAULT_MODULE_WP } from '../constants/bomDefaults';

/**
 * Calculate totals for a single tab
 * This mirrors the calculation logic from RailTable.jsx
 */
function calculateTabTotals(tab, longRailVariation) {
  const { rows, settings } = tab;
  const {
    railsPerSide = 2,
    enableSB2 = false,
    moduleLength = 2278,
    moduleWidth = 1134,
    frameThickness = 35,
    midClamp = 20,
    endClampWidth = 40,
    buffer = 15,
    purlinDistance = 1700,
    seamToSeamDistance = 400,
    maxSupportDistance = 1800,
    lengthsInput = '',
    enabledLengths = {},
    maxWastePct = '',
    allowUndershootPct = 0,
    alphaJoint = 220,
    betaSmall = 60,
    gammaShort = 5,
    costPerMm = '0.1',
    costPerJointSet = '50',
    joinerLength = '100',
    priority = 'cost'
  } = settings;

  // Parse available lengths
  const allLengths = parseNumList(lengthsInput);

  // Filter enabled lengths
  const parsedLengths = allLengths.filter(len => enabledLengths[len] !== false);

  const result = {
    modules: 0,
    endClamp: 0,
    midClamp: 0,
    joints: 0,
    sb1: 0,
    sb2: 0,
    countsByLength: {},
    required: 0,
    total: 0
  };

  // Initialize counts for all lengths
  allLengths.forEach(len => {
    result.countsByLength[len] = 0;
  });

  // Process each row
  rows.forEach(row => {
    const modules = Number(row.modules) || 0;
    const qty = Number(row.quantity) || 1;

    if (modules > 0) {
      result.modules += modules * qty;

      // Calculate required length
      const required = requiredRailLength({
        modules: modules,
        moduleWidth: Number(moduleWidth) || 0,
        midClamp: Number(midClamp) || 0,
        endClampWidth: Number(endClampWidth) || 0,
        buffer: Number(buffer) || 0
      });

      result.required += required * qty;

      // Calculate clamps
      result.endClamp += 2 * qty;
      result.midClamp += Math.max(0, modules - 1) * qty;

      // Run optimization to get actual cut lengths and joints
      if (required > 0 && parsedLengths.length > 0) {
        const combos = generateScenarios({
          required,
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

        if (combos) {
          // Select combo based on priority
          let optimResult;
          if (priority === 'cost') {
            optimResult = combos.C;
          } else if (priority === 'length') {
            optimResult = combos.L;
          } else if (priority === 'joints') {
            optimResult = combos.J;
          } else {
            optimResult = combos.C;  // Default to cost
          }

          // Collect cut lengths from optimization result
          if (optimResult && optimResult.ok && optimResult.countsByLength) {
            allLengths.forEach(len => {
              result.countsByLength[len] += (optimResult.countsByLength[len] || 0) * qty;
            });

            // Get actual joints from optimization
            result.joints += (optimResult.joints || 0) * qty;
          }
        }
      }

      // SB1 and SB2 calculations
      let sb1Divisor;
      if (longRailVariation?.endsWith('Seam Clamp')) {
        const seam = Number(seamToSeamDistance) || 400;
        const maxSupport = Number(maxSupportDistance) || 1800;
        sb1Divisor = seam * Math.floor(maxSupport / seam) || 1;
      } else {
        sb1Divisor = Number(purlinDistance) || 1;
      }
      const defaultSB1 = calculateSB1(required, sb1Divisor);
      const sb1Value = enableSB2 ? (row.supportBase1 ?? defaultSB1) : defaultSB1;
      const sb2Value = enableSB2 ? (row.supportBase2 ?? 0) : 0;

      result.sb1 += sb1Value * qty;
      result.sb2 += sb2Value * qty;
    }
  });

  // Multiply totals by railsPerSide
  const rps = Number(railsPerSide) || 1;
  result.endClamp *= rps;
  result.midClamp *= rps;
  result.joints *= rps;
  result.sb1 *= rps;
  result.sb2 *= rps;
  result.required *= rps;

  allLengths.forEach(len => {
    result.countsByLength[len] *= rps;
  });

  return result;
}

/**
 * Collect data from all tabs for BOM generation
 * @param {Object} tabsData - The complete tabs data structure
 * @param {string} projectName - The project name
 * @returns {Object} - Structured data for BOM generation
 */
export function collectBOMData(tabsData, projectName, longRailVariation) {
  const { tabs } = tabsData;

  const bomData = {
    projectInfo: {
      projectName: projectName || 'Untitled Project',
      longRailVariation: longRailVariation || 'BOM for U Cleat Long Rail',
      buildingCodes: [],
      totalTabs: tabs.length,
      generatedAt: new Date().toISOString()
    },
    moduleWp: DEFAULT_MODULE_WP,
    tabs: [],
    panelCounts: {},
    tabCalculations: {},
    tabProfiles: {}  // NEW: Store profile serial numbers per tab
  };

  // Process each tab
  tabs.forEach((tab, index) => {
    const tabName = tab.name || `T${index + 1}`;
    bomData.tabs.push(tabName);

    // NEW: Store profile serial number for this tab
    bomData.tabProfiles[tabName] = tab.longRailProfileSerialNumber || '26';

    // Calculate totals for this tab
    const tabTotals = calculateTabTotals(tab, longRailVariation);

    bomData.panelCounts[tabName] = tabTotals.modules;
    bomData.tabCalculations[tabName] = {
      totalModules: tabTotals.modules,
      endClamps: tabTotals.endClamp,
      midClamps: tabTotals.midClamp,
      joints: tabTotals.joints,
      sb1: tabTotals.sb1,
      sb2: tabTotals.sb2,
      cutLengths: tabTotals.countsByLength,
      requiredLength: tabTotals.required
    };

    bomData.projectInfo.buildingCodes.push(tabName);
  });

  return bomData;
}

/**
 * Get all unique cut lengths across all tabs (excluding zero quantities)
 * @param {Object} bomData - The collected BOM data
 * @returns {Array} - Array of cut lengths that have non-zero quantities
 */
export function getActiveCutLengths(bomData) {
  const lengthTotals = {};

  // Sum quantities for each length across all tabs
  Object.values(bomData.tabCalculations).forEach(tabCalc => {
    Object.entries(tabCalc.cutLengths).forEach(([length, qty]) => {
      lengthTotals[length] = (lengthTotals[length] || 0) + qty;
    });
  });

  // Return only lengths with non-zero totals
  return Object.keys(lengthTotals)
    .filter(length => lengthTotals[length] > 0)
    .map(length => parseInt(length, 10))
    .sort((a, b) => a - b);
}
