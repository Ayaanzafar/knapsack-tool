// src/lib/storage.js
const STORAGE_KEY = 'railOptimizerSettings';

export const DEFAULT_LENGTHS = [1595, 1798, 2400, 2750, 3600, 4800];

export const DEFAULT_SETTINGS = {
  userMode: 'normal',
  moduleLength: 2278,
  moduleWidth: 1134,
  frameThickness: 35,
  midClamp: 20,
  endClampWidth: 40,
  buffer: 15,
  purlinDistance: 1700,
  railsPerSide: 2,
  lengthsInput: DEFAULT_LENGTHS.join(', '),
  enabledLengths: DEFAULT_LENGTHS.reduce((acc, len) => ({ ...acc, [len]: true }), {}),
  maxPieces: 3,
  maxWastePct: '',
  alphaJoint: 220,
  betaSmall: 60,
  allowUndershootPct: 0,
  gammaShort: 5,
  costPerMm: '0.1',
  costPerJointSet: '50',
  joinerLength: '100',
  priority: 'cost'
};

// Load settings from localStorage
export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Export settings to JSON file
export function exportToFile(settings) {
  const json = JSON.stringify(settings, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rail-optimizer-settings.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse comma-separated number list
export function parseNumList(s) {
  return String(s)
    .split(/[, ]+/)
    .map(x => Number(x.trim()))
    .filter(x => Number.isFinite(x) && x > 0);
}

// Format number with commas
export function fmt(n) {
  return new Intl.NumberFormat().format(n);
}

// Return merged defaults: admin-configured appDefaults take priority over hardcoded DEFAULT_SETTINGS
// Falls back to DEFAULT_SETTINGS if appDefaults haven't loaded yet
export function getEffectiveDefaults(appDefaults) {
  return appDefaults?.tabDefaults
    ? { ...DEFAULT_SETTINGS, ...appDefaults.tabDefaults }
    : DEFAULT_SETTINGS;
}
