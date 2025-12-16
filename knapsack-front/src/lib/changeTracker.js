// src/lib/changeTracker.js
const CHANGES_STORAGE_KEY = 'bomChanges';
const ADDED_ROWS_STORAGE_KEY = 'bomAddedRows';
const DELETED_ROWS_STORAGE_KEY = 'bomDeletedRows';

/**
 * Starts a new change tracking session.
 * Clears any previously tracked changes from localStorage.
 */
export const startTracking = () => {
  try {
    localStorage.setItem(CHANGES_STORAGE_KEY, JSON.stringify({}));
    localStorage.setItem(ADDED_ROWS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(DELETED_ROWS_STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error starting change tracking:', error);
  }
};

/**
 * Stops the change tracking session.
 * Clears all tracked changes from localStorage.
 */
export const stopTracking = () => {
  try {
    localStorage.removeItem(CHANGES_STORAGE_KEY);
    localStorage.removeItem(ADDED_ROWS_STORAGE_KEY);
    localStorage.removeItem(DELETED_ROWS_STORAGE_KEY);
  } catch (error) {
    console.error('Error stopping change tracking:', error);
  }
};

/**
 * Tracks a single change. If a change with the same ID already exists, it updates it.
 * The `oldValue` is only set the first time a change for a specific ID is tracked.
 *
 * @param {object} change - The change object.
 * @param {string} change.id - A unique identifier for the field being changed (e.g., `item-123-quantity-T1`).
 * @param {any} change.newValue - The new value of the field.
 * @param {object} details - Additional details about the change (e.g., type, itemName, rowNumber).
 */
export const trackChange = (change) => {
  try {
    const existingChanges = JSON.parse(localStorage.getItem(CHANGES_STORAGE_KEY) || '{}');
    const { id, newValue, ...details } = change;

    const existingChange = existingChanges[id];

    if (existingChange) {
      // If the user changes the value back to the original, remove the change
      if (newValue === existingChange.oldValue) {
        delete existingChanges[id];
      } else {
        // Update the new value, but keep the original old value
        existingChanges[id].newValue = newValue;
      }
    } else {
      // This is a new change, record it.
      // The `oldValue` is captured from the `details` object passed in.
      existingChanges[id] = {
        id,
        newValue,
        ...details,
      };
    }

    localStorage.setItem(CHANGES_STORAGE_KEY, JSON.stringify(existingChanges));
  } catch (error) {
    console.error('Error tracking change:', error);
  }
};


/**
 * Tracks the addition of a new row.
 *
 * @param {object} row - The new row object to be added.
 */
export const trackRowAddition = (row) => {
  try {
    const addedRows = JSON.parse(localStorage.getItem(ADDED_ROWS_STORAGE_KEY) || '[]');
    addedRows.push(row);
    localStorage.setItem(ADDED_ROWS_STORAGE_KEY, JSON.stringify(addedRows));
  } catch (error) {
    console.error('Error tracking row addition:', error);
  }
};

/**
 * Tracks the deletion of a row.
 *
 * @param {string} rowId - The ID of the row to be deleted.
 */
export const trackRowDeletion = (deletion) => {
  try {
    const deletedRows = JSON.parse(localStorage.getItem(DELETED_ROWS_STORAGE_KEY) || '[]');
    deletedRows.push(deletion);
    localStorage.setItem(DELETED_ROWS_STORAGE_KEY, JSON.stringify(deletedRows));
  } catch (error) {
    console.error('Error tracking row deletion:', error);
  }
};


/**
 * Retrieves all tracked changes.
 *
 * @returns {Array<object>} An array of change objects.
 */
export const getChanges = () => {
  try {
    const changes = JSON.parse(localStorage.getItem(CHANGES_STORAGE_KEY) || '{}');
    return Object.values(changes);
  } catch (error) {
    console.error('Error getting changes:', error);
    return [];
  }
};

/**
 * Retrieves all tracked row additions.
 *
 * @returns {Array<object>} An array of added row objects.
 */
export const getAdditions = () => {
  try {
    return JSON.parse(localStorage.getItem(ADDED_ROWS_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error getting added rows:', error);
    return [];
  }
};

/**
 * Retrieves all tracked row deletions.
 *
 * @returns {Array<string>} An array of deleted row IDs.
 */
export const getDeletions = () => {
  try {
    return JSON.parse(localStorage.getItem(DELETED_ROWS_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error getting deleted rows:', error);
    return [];
  }
};
