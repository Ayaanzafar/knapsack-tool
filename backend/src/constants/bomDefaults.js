/**
 * BOM Default Values and Constants
 *
 * This file contains all default values used across the BOM system.
 * Modify these values to change defaults throughout the application.
 */

// Material Rates
const DEFAULT_ALUMINIUM_RATE_PER_KG = 460;

// Module Specifications
const DEFAULT_MODULE_WP = 590;

// Spare Calculations
const DEFAULT_SPARE_PERCENTAGE = 1.0; // Represents 1%
const SPARE_CALCULATION_MULTIPLIER = 0.01; // Used in Math.ceil(qty * 0.01)

// Unit Conversions
const MM_TO_METERS_DIVISOR = 1000;
const WP_TO_KWP_DIVISOR = 1000;

// Tolerance for floating-point comparisons
const FLOAT_COMPARISON_TOLERANCE = 1e-9;

// Export as a single object for convenience
const BOM_DEFAULTS = {
  aluminiumRatePerKg: DEFAULT_ALUMINIUM_RATE_PER_KG,
  moduleWp: DEFAULT_MODULE_WP,
  sparePercentage: DEFAULT_SPARE_PERCENTAGE,
  spareMultiplier: SPARE_CALCULATION_MULTIPLIER,
  mmToMeters: MM_TO_METERS_DIVISOR,
  wpToKwp: WP_TO_KWP_DIVISOR,
  floatTolerance: FLOAT_COMPARISON_TOLERANCE
};

module.exports = {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_MODULE_WP,
  DEFAULT_SPARE_PERCENTAGE,
  SPARE_CALCULATION_MULTIPLIER,
  MM_TO_METERS_DIVISOR,
  WP_TO_KWP_DIVISOR,
  FLOAT_COMPARISON_TOLERANCE,
  BOM_DEFAULTS
};
