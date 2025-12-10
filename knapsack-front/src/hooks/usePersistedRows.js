// src/hooks/usePersistedRows.js
// Custom hook to handle row persistence to database

import { useCallback } from 'react';
import { rowAPI } from '../services/api';

export function usePersistedRows(tabId, rows, setRows, onRowCreated) {
  // Add a new row
  const addRow = useCallback(async (newRowData) => {
    // Generate temporary ID for optimistic update
    const tempId = Date.now();
    const lastModules = rows.length > 0 ? rows[rows.length - 1].modules : 0;

    const optimisticRow = {
      id: tempId,
      modules: lastModules + 1,
      quantity: 1,
      supportBase1: 0,
      supportBase2: 0,
      ...newRowData
    };

    // Optimistic update
    setRows([...rows, optimisticRow]);

    try {
      // Save to database
      const savedRow = await rowAPI.create(tabId, {
        rowNumber: rows.length + 1,
        modules: optimisticRow.modules,
        quantity: optimisticRow.quantity,
        supportBase1: optimisticRow.supportBase1,
        supportBase2: optimisticRow.supportBase2
      });

      // Replace temp ID with real ID from database
      setRows(currentRows =>
        currentRows.map(r => r.id === tempId ? { ...savedRow,
          supportBase1: Number(savedRow.supportBase1) || 0,
          supportBase2: Number(savedRow.supportBase2) || 0
        } : r)
      );

      // Call callback with the created row (if provided)
      if (onRowCreated) {
        onRowCreated(savedRow);
      }
    } catch (error) {
      console.error('Failed to save row:', error);
      // Rollback on error
      setRows(currentRows => currentRows.filter(r => r.id !== tempId));
      alert('Failed to save row. Please try again.');
    }
  }, [tabId, rows, setRows, onRowCreated]);

  // Update a row field
  const updateRow = useCallback(async (rowId, updates) => {
    console.log(`📤 updateRow called: rowId=${rowId}, updates=`, updates);

    // Optimistic update
    setRows(currentRows =>
      currentRows.map(r => r.id === rowId ? { ...r, ...updates } : r)
    );

    try {
      // Save to database
      console.log(`📡 Calling API to update row ${rowId}...`);
      const result = await rowAPI.update(rowId, updates);
      console.log(`✅ API call successful for row ${rowId}:`, result);
    } catch (error) {
      console.error('❌ Failed to update row:', error);
      // Don't rollback as it might be confusing for user
      // The next refresh will show the correct data
    }
  }, [setRows]);

  // Delete a row
  const deleteRow = useCallback(async (rowId) => {
    // Optimistic update
    const newRows = rows.filter(r => r.id !== rowId);
    setRows(newRows);

    try {
      // Delete from database
      await rowAPI.delete(rowId);
    } catch (error) {
      console.error('Failed to delete row:', error);
      // Rollback on error
      setRows(rows);
      alert('Failed to delete row. Please try again.');
    }
  }, [rows, setRows]);

  // Update row modules
  const updateRowModules = useCallback((id, modules) => {
    const numModules = Number(modules) || 0;
    updateRow(id, { modules: numModules });
  }, [updateRow]);

  // Update row quantity
  const updateRowQuantity = useCallback((id, quantity) => {
    const numQuantity = Math.max(1, Number(quantity) || 1);
    updateRow(id, { quantity: numQuantity });
  }, [updateRow]);

  // Update support base
  const updateRowSupportBase = useCallback((id, field, value) => {
    const numValue = Number(value) || 0;
    console.log(`🔧 updateRowSupportBase called: id=${id}, field=${field}, value=${value}, numValue=${numValue}`);
    updateRow(id, { [field]: numValue });
  }, [updateRow]);

  return {
    addRow,
    updateRow,
    deleteRow,
    updateRowModules,
    updateRowQuantity,
    updateRowSupportBase
  };
}
