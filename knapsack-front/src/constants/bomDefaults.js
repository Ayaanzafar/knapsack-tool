/**
 * BOM Default Values and Constants
 *
 * This file contains all default values used across the BOM system.
 * Modify these values to change defaults throughout the application.
 */

// Material Rates (₹/kg)
export const DEFAULT_ALUMINIUM_RATE_PER_KG = 460;
export const DEFAULT_HDG_RATE_PER_KG = 125;
export const DEFAULT_MAGNELIS_RATE_PER_KG = 125;

// Module Specifications
export const DEFAULT_MODULE_WP = 590;

// Spare Calculations
export const DEFAULT_SPARE_PERCENTAGE = 1.0; // Represents 1%
export const SPARE_CALCULATION_MULTIPLIER = 0.01; // Used in Math.ceil(qty * 0.01)

// Unit Conversions
export const MM_TO_METERS_DIVISOR = 1000;
export const WP_TO_KWP_DIVISOR = 1000;

// Tolerance for floating-point comparisons
export const FLOAT_COMPARISON_TOLERANCE = 1e-9;

// Export as a single object for convenience
export const BOM_DEFAULTS = {
  aluminiumRatePerKg: DEFAULT_ALUMINIUM_RATE_PER_KG,
  hdgRatePerKg: DEFAULT_HDG_RATE_PER_KG,
  magnelisRatePerKg: DEFAULT_MAGNELIS_RATE_PER_KG,
  moduleWp: DEFAULT_MODULE_WP,
  sparePercentage: DEFAULT_SPARE_PERCENTAGE,
  spareMultiplier: SPARE_CALCULATION_MULTIPLIER,
  mmToMeters: MM_TO_METERS_DIVISOR,
  wpToKwp: WP_TO_KWP_DIVISOR,
  floatTolerance: FLOAT_COMPARISON_TOLERANCE
};
