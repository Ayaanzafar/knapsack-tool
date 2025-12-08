// src/lib/calculations.js
// Shared calculation functions

/**
 * Calculate default SB1 value (support base 1)
 * @param {number} required - Required length
 * @param {number} purlinDistance - Purlin to purlin distance
 * @returns {number} - Calculated SB1 value
 */
export function calculateSB1(required, purlinDistance = 1700) {
  const purlin = Number(purlinDistance) || 1;
  return Math.ceil(required / purlin) + 1;
}
