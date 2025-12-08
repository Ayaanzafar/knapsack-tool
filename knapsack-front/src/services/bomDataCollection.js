// src/services/bomDataCollection.js
// Service to collect data from all tabs for BOM generation

import { calculateSB1 } from '../lib/calculations';

/**
 * Calculate totals for a single tab
 * This mirrors the calculation logic from RailTable.jsx
 */
function calculateTabTotals(tab) {
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
    lengthsInput = '',
    enabledLengths = {}
  } = settings;

  // Parse available lengths
  const allLengths = lengthsInput
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0);

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
      const required = (modules * moduleWidth) +
        (2 * endClampWidth) +
        ((modules - 1) * midClamp) +
        (2 * buffer);

      result.required += required * qty;

      // Calculate clamps
      result.endClamp += 2 * qty;
      result.midClamp += Math.max(0, modules - 1) * qty;

      // Estimate joints based on required length
      // This is simplified - actual joint calculation depends on optimization
      const avgJointsPerRow = Math.max(0, Math.floor(required / 5000)); // Rough estimate
      result.joints += avgJointsPerRow * qty;

      // SB1 and SB2 calculations
      const purlinDist = Number(settings.purlinDistance) || 1700;
      const defaultSB1 = calculateSB1(required, purlinDist);
      const sb1Value = enableSB2 ? (row.supportBase1 ?? defaultSB1) : defaultSB1;
      const sb2Value = enableSB2 ? (row.supportBase2 ?? 0) : 0;

      result.sb1 += sb1Value * qty;
      result.sb2 += sb2Value * qty;

      // Count pieces by length (from row results if available)
      // Note: This would need actual optimization results
      // For now, we'll use a simplified approach
      if (row.result && row.result.countsByLength) {
        allLengths.forEach(len => {
          result.countsByLength[len] += (row.result.countsByLength[len] || 0) * qty;
        });
      }
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
export function collectBOMData(tabsData, projectName) {
  const { tabs } = tabsData;

  const bomData = {
    projectInfo: {
      projectName: projectName || 'Untitled Project',
      buildingCodes: [],
      totalTabs: tabs.length,
      generatedAt: new Date().toISOString()
    },
    tabs: [],
    panelCounts: {},
    tabCalculations: {}
  };

  // Process each tab
  tabs.forEach((tab, index) => {
    const tabName = tab.name || `T${index + 1}`;
    bomData.tabs.push(tabName);

    // Calculate totals for this tab
    const tabTotals = calculateTabTotals(tab);

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
