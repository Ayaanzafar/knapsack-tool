// src/services/templateService.js
// Template service for fetching BOM variation templates

import { API_URL } from './config';

/**
 * Fetch variation template from database
 * @param {string} variationName - e.g. "U Cleat Long Rail - Regular"
 * @returns {Promise<Object|null>} Template with items and defaultNotes, or null if not found
 */
export async function getVariationTemplate(variationName) {
  if (!variationName) {
    console.warn('No variation name provided to getVariationTemplate');
    return null;
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/bom-templates/${encodeURIComponent(variationName)}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Template not found for variation: ${variationName}`);
        return null;
      }
      throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
    }

    const template = await response.json();
    console.log(`✅ Template loaded for variation: ${variationName}`, template);
    return template;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

/**
 * Fetch all available variation templates
 * @returns {Promise<Array>} Array of all templates
 */
export async function getAllVariationTemplates() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/bom-templates`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching all templates:', error);
    return [];
  }
}

/**
 * Format item description based on template item data
 * Applies M8/M10 length formatting for fasteners
 *
 * @param {Object} vItem - Variation Item from DB (with nested sunrackProfile or fastener)
 * @returns {string} Formatted item description
 */
export function formatItemDescription(vItem) {
  // Get the item data from either sunrackProfile or fastener
  const item = vItem.sunrackProfile || vItem.fastener;

  // Description comes from override OR item generic name
  const description = vItem.displayOverride || item?.genericName || '';

  // Length comes from item standard length
  const length = item?.standardLength;

  // Rule: M8/M10 fasteners → Add "x{length}" after M8/M10
  if (length && (description.startsWith('M8 ') || description.startsWith('M10 '))) {
    const prefix = description.startsWith('M8 ') ? 'M8' : 'M10';
    const restOfName = description.substring(prefix.length + 1); // Remove "M8 " or "M10 "
    return `${prefix}x${length} ${restOfName}`;
  }

  // All other items → Use description as-is
  return description;
}
