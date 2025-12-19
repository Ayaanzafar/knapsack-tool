// src/components/RailTable.jsx
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { optimizeCuts, requiredRailLength, generateScenarios } from '../lib/optimizer';
import { parseNumList, fmt } from '../lib/storage';
import { TextField, NumberField } from './ui';
import { usePersistedRows } from '../hooks/usePersistedRows';
import { rowAPI } from '../services/api';
import ResultCard from './ResultCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component
function SortableRow({
  row,
  required,
  result,
  isSelected,
  enableSB2,
  allLengths,
  enabledLengths,
  calculateSB1,
  updateRowQuantity,
  updateRowModules,
  updateRowSupportBase,
  setSelectedRowId,
  setShowModal,
  deleteConfirmRowId,
  setDeleteConfirmRowId,
  deleteRow
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const extraPct = result?.ok && required > 0
    ? ((result.overshootMm / required) * 100).toFixed(2)
    : '-';

  const defaultSB1 = calculateSB1(required);
  // When enableSB2 is on, use row.supportBase1 if it's set (non-zero), otherwise use calculated default
  const sb1Value = enableSB2 ? (row.supportBase1 || defaultSB1) : defaultSB1;
  const sb2Value = row.supportBase2 || 0;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => {
        setSelectedRowId(row.id);
        setShowModal(true);
      }}
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-gray-50'
      }`}
    >
      {/* Drag Handle */}
      <td
        className="px-2 py-2 border-b text-center cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <span className="text-gray-400 hover:text-purple-600 text-xl select-none">⋮⋮</span>
      </td>
      <td className="px-3 py-2 border-b">
        <input
          type="number"
          value={row.quantity ?? 1}
          onChange={(e) => updateRowQuantity(row.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-16 px-2 py-1 border rounded text-center"
          min="1"
        />
      </td>
      <td className="px-3 py-2 border-b">
        <input
          type="number"
          value={row.modules}
          onChange={(e) => updateRowModules(row.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-16 px-2 py-1 border rounded text-center"
          min="1"
        />
      </td>
      <td className="px-3 py-2 text-center border-b">
        2
      </td>
      <td className="px-3 py-2 text-center border-b">
        {row.modules > 0 ? row.modules - 1 : 0}
      </td>
      <td className="px-3 py-2 text-center border-b font-medium">
        {fmt(required)}
      </td>
      {allLengths.map(len => (
        <td
          key={len}
          className={`px-2 py-2 text-center border-b ${enabledLengths[len] !== false ? '' : 'text-gray-300'
            }`}
        >
          {result?.ok ? (result.countsByLength[len] || 0) : '-'}
        </td>
      ))}
      <td className="px-3 py-2 text-center border-b font-medium">
        {result?.ok ? fmt(result.totalRailLength) : '-'}
      </td>
      <td className={`px-3 py-2 text-center border-b ${result?.ok && result.overshootMm > 0 ? 'text-red-600' : ''
        }`}>
        {result?.ok ? fmt(result.overshootMm) : '-'}
      </td>
      <td className={`px-3 py-2 text-center border-b ${result?.ok && result.overshootMm > 0 ? 'text-red-600' : ''
        }`}>
        {result?.ok ? `${extraPct}%` : '-'}
      </td>
      <td className="px-3 py-2 text-center border-b">
        {result?.ok ? result.joints : '-'}
      </td>
      <td className="px-3 py-2 text-center border-b">
        {enableSB2 ? (
          <input
            type="number"
            value={sb1Value}
            onChange={(e) => updateRowSupportBase(row.id, 'supportBase1', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-16 px-2 py-1 border rounded text-center"
            min="0"
          />
        ) : (
          defaultSB1
        )}
      </td>
      <td className="px-3 py-2 text-center border-b">
        {enableSB2 ? (
          <input
            type="number"
            value={sb2Value}
            onChange={(e) => updateRowSupportBase(row.id, 'supportBase2', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-16 px-2 py-1 border rounded text-center"
            min="0"
          />
        ) : (
          '-'
        )}
      </td>
      <td className="px-2 py-2 border-b relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmRowId(row.id);
          }}
          className="text-red-500 hover:text-red-700 text-2xl font-bold transition-colors"
          title="Delete row"
        >
          ×
        </button>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmRowId === row.id && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 mr-12 z-50 bg-white border-2 border-red-400 rounded-lg shadow-xl p-3 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-gray-700 mb-3">
              Delete this row?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmRowId(null);
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRow(row.id);
                  setDeleteConfirmRowId(null);
                }}
                className="px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function RailTable({
  tabId,
  rows,
  setRows,
  selectedRowId,
  setSelectedRowId,
  settings,
  setSettings,
  selectedRow
}) {
  // Get enableSB2 from settings first (needed by callback below)
  const enableSB2 = settings?.enableSB2 ?? false;
  const setEnableSB2 = (value) => {
    setSettings(prev => ({ ...prev, enableSB2: value }));
  };

  // Callback when a row is created (to calculate initial SB1 value)
  const handleRowCreated = useCallback((createdRow) => {
    // Always calculate SB1 as initial value for new rows
    const required = requiredRailLength({
      modules: createdRow.modules || 0,
      moduleWidth: Number(settings?.moduleWidth) || 0,
      midClamp: Number(settings?.midClamp) || 0,
      endClampWidth: Number(settings?.endClampWidth) || 0,
      buffer: Number(settings?.buffer) || 0
    });

    const purlin = Number(settings?.purlinDistance) || 1;
    const calculatedSB1 = Math.ceil(required / purlin) + 1;

    if (calculatedSB1 > 0) {
      console.log(`💾 Setting initial SB1=${calculatedSB1} for new row ${createdRow.id}`);

      // Update UI optimistically
      setRows(currentRows =>
        currentRows.map(r => r.id === createdRow.id ? { ...r, supportBase1: calculatedSB1 } : r)
      );

      // Save to database
      import('../services/api').then(({ rowAPI }) => {
        rowAPI.update(createdRow.id, { supportBase1: calculatedSB1 })
          .catch(err => {
            console.error('Failed to save SB1:', err);
            // Rollback UI on error
            setRows(currentRows =>
              currentRows.map(r => r.id === createdRow.id ? { ...r, supportBase1: 0 } : r)
            );
          });
      });
    }
  }, [settings, setRows]);

  // Use persisted rows hook for database operations (only if tabId exists)
  const persistedRows = tabId ? usePersistedRows(tabId, rows, setRows, handleRowCreated) : null;

  const {
    addRow: addRowToDB = () => {},
    updateRowModules: updateRowModulesToDB = () => {},
    updateRowQuantity: updateRowQuantityToDB = () => {},
    updateRowSupportBase: updateRowSupportBaseToDB = () => {},
    deleteRow: deleteRowFromDB = () => {}
  } = persistedRows || {};
  const [showSettings, setShowSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmRowId, setDeleteConfirmRowId] = useState(null);

  // Drag and drop sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset position when modal closes
  const closeModal = () => {
    setShowModal(false);
    setPosition({ x: 0, y: 0 });
  };

  const {
    userMode,
    moduleWidth,
    midClamp,
    endClampWidth,
    buffer,
    purlinDistance,
    railsPerSide,
    lengthsInput,
    enabledLengths,
    maxPieces,
    maxWastePct,
    allowUndershootPct,
    alphaJoint,
    betaSmall,
    gammaShort,
    costPerMm,
    costPerJointSet,
    joinerLength,
    priority
  } = settings;

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const parsedLengths = useMemo(
    () => parseNumList(lengthsInput).filter(len => enabledLengths[len] !== false),
    [lengthsInput, enabledLengths]
  );

  const allLengths = useMemo(() => parseNumList(lengthsInput), [lengthsInput]);

  // Calculate results for each row
  const rowResults = useMemo(() => {
    return rows.map(row => {
      const required = requiredRailLength({
        modules: row.modules,
        moduleWidth: Number(moduleWidth) || 0,
        midClamp: Number(midClamp) || 0,
        endClampWidth: Number(endClampWidth) || 0,
        buffer: Number(buffer) || 0
      });

      if (required <= 0 || parsedLengths.length === 0) {
        return { row, required, combos: null, result: null };
      }

      // Generate scenarios and get C, L, J combos
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

      if (!combos) {
        return { row, required, combos: null, result: null };
      }

      // Select combo based on priority
      let result;
      if (priority === 'cost') {
        result = combos.C;
      } else if (priority === 'length') {
        result = combos.L;
      } else if (priority === 'joints') {
        result = combos.J;
      } else {
        result = combos.C;  // Default to cost
      }

      return { row, required, combos, result };
    });
  }, [rows, moduleWidth, midClamp, endClampWidth, buffer, parsedLengths,
    maxWastePct, allowUndershootPct, alphaJoint, betaSmall,
    gammaShort, costPerMm, costPerJointSet, joinerLength, priority]);

  // Calculate default SB1 value for a row
  const calculateSB1 = (required) => {
    const purlin = Number(purlinDistance) || 1;
    return Math.ceil(required / purlin) + 1;
  };

  // Calculate totals for all columns
  const totals = useMemo(() => {
    const result = {
      modules: 0,
      endClamp: 0,
      midClamp: 0,
      required: 0,
      total: 0,
      joints: 0,
      cost: 0,
      countsByLength: {},
      wastage: 0,
      sb1: 0,
      sb2: 0
    };

    // Initialize counts for all lengths
    allLengths.forEach(len => {
      result.countsByLength[len] = 0;
    });

    // Sum with quantity multiplication: Σ(Qi × ValueI)
    rowResults.forEach(({ row, required, result: rowResult }) => {
      const qty = row.quantity || 1;

      result.modules += row.modules * qty;
      result.endClamp += 2 * qty;  // EC is always 2
      result.midClamp += (row.modules > 0 ? row.modules - 1 : 0) * qty;  // MC = modules - 1
      result.required += required * qty;

      if (rowResult?.ok) {
        result.total += rowResult.totalRailLength * qty;
        result.joints += rowResult.joints * qty;
        result.cost += rowResult.totalActualCost * qty;
        result.wastage += rowResult.overshootMm * qty;

        // Sum up piece counts for each length
        allLengths.forEach(len => {
          result.countsByLength[len] += (rowResult.countsByLength[len] || 0) * qty;
        });
      }

      // SB1 and SB2 calculations
      const defaultSB1 = calculateSB1(required);
      const sb1Value = enableSB2 ? (row.supportBase1 || defaultSB1) : defaultSB1;
      const sb2Value = enableSB2 ? (row.supportBase2 ?? 0) : 0;

      result.sb1 += sb1Value * qty;
      result.sb2 += sb2Value * qty;
    });

    // Multiply all totals by railsPerSide
    const rps = Number(railsPerSide) || 1;
    // result.modules *= rps;
    result.endClamp *= rps;
    result.midClamp *= rps;
    result.required *= rps;
    result.total *= rps;
    result.joints *= rps;
    result.cost *= rps;
    result.wastage *= rps;
    result.sb1 *= rps;
    result.sb2 *= rps;

    allLengths.forEach(len => {
      result.countsByLength[len] *= rps;
    });

    // Calculate overall wastage percentage
    result.wastagePct = result.required > 0
      ? ((result.wastage / result.required) * 100).toFixed(2)
      : 0;

    // Debug logging for Ratio of Supports to module
    // console.log('=== Supports Calculation Debug ===');
    // console.log('totals.sb1:', result.sb1);
    // console.log('totals.sb2:', result.sb2);
    // console.log('totals.modules:', result.modules);
    // console.log('Sum (sb1 + sb2):', result.sb1 + result.sb2);
    // console.log('Ratio (sb1+sb2)/modules:', result.modules > 0 ? ((result.sb1 + result.sb2) / result.modules) : 0);
    // console.log('==================================');

    return result;
  }, [rowResults, allLengths, railsPerSide, enableSB2]);

  const addRow = async () => {
    const lastModules = rows.length > 0 ? rows[rows.length - 1].modules : 0;
    await addRowToDB({ modules: lastModules + 1, quantity: 1 });
    // SB1 calculation is now handled by handleRowCreated callback
  };

  const updateRowModules = (id, modules) => {
    updateRowModulesToDB(id, modules);

    // When enableSB2 is FALSE, auto-recalculate and update SB1 based on new modules
    // When enableSB2 is TRUE, don't auto-update (preserve user's custom value)
    if (!enableSB2) {
      const row = rows.find(r => r.id === id);
      if (row) {
        const required = requiredRailLength({
          modules: Number(modules) || 0,
          moduleWidth: Number(moduleWidth) || 0,
          midClamp: Number(midClamp) || 0,
          endClampWidth: Number(endClampWidth) || 0,
          buffer: Number(buffer) || 0
        });
        const newSB1 = calculateSB1(required);

        // Update SB1 in database
        if (newSB1 > 0) {
          updateRowSupportBaseToDB(id, 'supportBase1', newSB1);
        }
      }
    }
  };

  const updateRowQuantity = (id, quantity) => {
    updateRowQuantityToDB(id, quantity);
  };

  const deleteRow = async (id) => {
    await deleteRowFromDB(id);
    if (selectedRowId === id) {
      const newRows = rows.filter(r => r.id !== id);
      setSelectedRowId(newRows.length > 0 ? newRows[0].id : null);
    }
  };

  const updateRowSupportBase = (id, field, value) => {
    updateRowSupportBaseToDB(id, field, value);
  };

  // Drag and drop handler for @dnd-kit
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === active.id);
      const newIndex = rows.findIndex((row) => row.id === over.id);
      const newRows = arrayMove(rows, oldIndex, newIndex);

      // Update UI optimistically
      setRows(newRows);

      // Persist new order to database
      if (tabId) {
        try {
          // Create array of { id, rowNumber } to send to backend
          const rowOrders = newRows.map((row, index) => ({
            id: row.id,
            rowNumber: index + 1  // rowNumber starts from 1
          }));

          await rowAPI.reorder(tabId, rowOrders);

          console.log('✅ Row order saved to database');
        } catch (error) {
          console.error('❌ Failed to save row order:', error);
          // Optionally: rollback to old order on error
          // setRows(rows);
        }
      }
    }
  };

  // Initialize SB1 values when enableSB2 is turned on
  useEffect(() => {
    console.log('🔍 SB1 Init useEffect triggered:', { enableSB2, tabId, rowsLength: rows.length });

    if (enableSB2 && tabId && rows.length > 0) {
      console.log('✅ Conditions met, initializing SB1 for rows...');

      rows.forEach(row => {
        console.log(`  Row ${row.id}: supportBase1=${row.supportBase1}, modules=${row.modules}`);

        // Only initialize if supportBase1 is not already set (null or 0)
        if (row.supportBase1 == null || row.supportBase1 === 0) {
          const required = requiredRailLength({
            modules: row.modules || 0,
            moduleWidth: Number(settings?.moduleWidth) || 0,
            midClamp: Number(settings?.midClamp) || 0,
            endClampWidth: Number(settings?.endClampWidth) || 0,
            buffer: Number(settings?.buffer) || 0
          });
          const defaultSB1 = calculateSB1(required);

          console.log(`    Calculated SB1=${defaultSB1} for row ${row.id}`);

          // Save calculated value to database
          if (defaultSB1 > 0) {
            console.log(`    💾 Saving SB1=${defaultSB1} to database for row ${row.id}`);
            updateRowSupportBaseToDB(row.id, 'supportBase1', defaultSB1);
          } else {
            console.log(`    ⚠️ Skipping save: SB1=${defaultSB1} is not > 0`);
          }
        } else {
          console.log(`    ℹ️ Skipping row ${row.id}: supportBase1 already set to ${row.supportBase1}`);
        }
      });
    } else {
      console.log('❌ Conditions not met:', { enableSB2, tabId, rowsLength: rows.length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableSB2, tabId]); // Only run when enableSB2 or tabId changes

  // Auto-update all SB1 values when global settings change OR when rows change (only when enableSB2 is FALSE)
  useEffect(() => {
    // Only auto-update when enableSB2 is disabled (SB1 is auto-calculated)
    if (!enableSB2 && tabId && rows.length > 0) {
      console.log('🔄 Recalculating SB1 for all rows (enableSB2=false)...');

      rows.forEach(row => {
        // Skip rows with temporary IDs (timestamp-based IDs > 1000000000000)
        // These rows haven't been saved to DB yet
        if (row.id > 1000000000000) {
          console.log(`  ⏭️ Skipping temp row ${row.id} (not yet saved to DB)`);
          return;
        }

        const required = requiredRailLength({
          modules: row.modules || 0,
          moduleWidth: Number(moduleWidth) || 0,
          midClamp: Number(midClamp) || 0,
          endClampWidth: Number(endClampWidth) || 0,
          buffer: Number(buffer) || 0
        });
        const newSB1 = calculateSB1(required);

        // Only update if different from current value (to avoid unnecessary API calls)
        const currentSB1 = Number(row.supportBase1) || 0;
        if (newSB1 > 0 && newSB1 !== currentSB1) {
          console.log(`  💾 Updating SB1=${newSB1} for row ${row.id} (was ${currentSB1})`);
          updateRowSupportBaseToDB(row.id, 'supportBase1', newSB1);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleWidth, midClamp, endClampWidth, buffer, purlinDistance, enableSB2, rows.length]);

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <h2 className="font-semibold">Basic MMS Calculation</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            + Add Row
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="bg-linear-to-r from-purple-600 to-purple-700 px-4 py-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Calculation Settings
                  </h3>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Cost & Optimization Settings */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-3">Cost & Limits</h4>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                      <TextField
                        label="Cost per mm"
                        value={costPerMm}
                        setValue={(v) => updateSetting('costPerMm', v)}
                      />
                      <TextField
                        label="Cost per Joint Set"
                        value={costPerJointSet}
                        setValue={(v) => updateSetting('costPerJointSet', v)}
                      />
                      <TextField
                        label="Joiner Length (mm)"
                        value={joinerLength}
                        setValue={(v) => updateSetting('joinerLength', v)}
                      />
                      <NumberField
                        label="Max Pieces"
                        value={maxPieces}
                        setValue={(v) => updateSetting('maxPieces', v)}
                      />
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  {userMode === 'advanced' && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">Advanced Tuning</h4>
                      <div className="space-y-3 bg-orange-50 rounded-lg p-3">
                        <NumberField
                          label="Max Waste %"
                          value={maxWastePct}
                          setValue={(v) => updateSetting('maxWastePct', v)}
                          step={0.01}
                        />
                        <NumberField
                          label="α Joint Penalty"
                          value={alphaJoint}
                          setValue={(v) => updateSetting('alphaJoint', v)}
                        />
                        <NumberField
                          label="β Small Penalty"
                          value={betaSmall}
                          setValue={(v) => updateSetting('betaSmall', v)}
                        />
                        <NumberField
                          label="Allow Undershoot %"
                          value={allowUndershootPct}
                          setValue={(v) => updateSetting('allowUndershootPct', v)}
                        />
                        <NumberField
                          label="γ Shortage Penalty"
                          value={gammaShort}
                          setValue={(v) => updateSetting('gammaShort', v)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-4 py-3">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rows.map(r => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full text-sm">

              <thead className="bg-gray-50">
            {/* Row 1: main headers + grouped title over cut lengths */}
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-2 text-center font-medium text-gray-600 border-b"
                title="Drag to reorder"
              >
                
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b"
              >
                Quantity
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b"
              >
                Modules
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="End Clamp"
              >
                End Clamp
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Mid Clamp"
              >
                Mid Clamp
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Required Rail Length (mm)"
              >
                Required Rail Length
              </th>

              {/* Group header over all cut-length columns */}
              <th
                colSpan={allLengths.length}
                className="px-3 py-2 text-center font-semibold text-purple-700 border-b border-x bg-purple-50"
              >
                Long Rail Cut length Combinations
              </th>

              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Total Rail Length (mm)"
              >
                Supply Rail Length
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Wastage (Total - Required)"
              >
                Extra Supply in mm
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Percentage Extra Material"
              >
                Extra Supply in %
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Number of Joints Required"
              >
                Joints
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help"
                title="Support Base 1"
              >
                SB1
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2 text-center font-medium text-gray-600 border-b"
              >
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={enableSB2}
                    onChange={(e) => setEnableSB2(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                    title="Enable Support Base 2 column"
                  />
                  <span className="cursor-help" title="Support Base 2">
                    SB2
                  </span>
                </div>
              </th>
              <th
                rowSpan={2}
                className="px-2 py-2 border-b"
              />
            </tr>

            {/* Row 2: individual cut-length headers */}
            <tr>
              {allLengths.map((len) => (
                <th
                  key={len}
                  className={`px-2 py-2 text-center font-medium border-b ${enabledLengths[len] !== false ? 'text-gray-600' : 'text-gray-300'
                    }`}
                >
                  {len}
                </th>
              ))}
            </tr>
          </thead>

          {/* <thead className="bg-gray-50">
            <tr className="bg-gray-100">
              <th colSpan={5} className="px-3 py-1 border-b bg-gray-50"></th>
              <th colSpan={allLengths.length} className="px-3 py-2 text-center font-semibold text-purple-700 border-b border-l border-r bg-purple-50">
                Long Rail Cut length Combinations
              </th>
              <th colSpan={7} className="px-3 py-1 border-b bg-gray-50"></th>
            </tr>
            <tr>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b">Quantity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Modules</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="End Clamp">End Clamp</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Mid Clamp">Mid Clamp</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Required Rail Length (mm)">Required Rail Length</th>
              {allLengths.map(len => (
                <th
                  key={len}
                  className={`px-2 py-2 text-center font-medium border-b ${
                    enabledLengths[len] !== false ? 'text-gray-600' : 'text-gray-300'
                  }`}
                >
                  {len}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Total Rail Length (mm)">Supply Rail Length</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Wastage (Total - Required)">Extra Supply in mm</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Percentage Extra Material">Extra Supply in %</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Number of Joints Required">Joints</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b cursor-help" title="Support Base 1">SB1</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600 border-b">
                <div className="flex items-center justify-center gap-1">
                  <input
                    type="checkbox"
                    checked={enableSB2}
                    onChange={(e) => setEnableSB2(e.target.checked)}
                    className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                    title="Enable Support Base 2 column"
                  />
                  <span className="cursor-help" title="Support Base 2">SB2</span>
                </div>
              </th>
              <th className="px-2 py-2 border-b"></th>
            </tr>
          </thead> */}
              <tbody>
                {rowResults.length === 0 ? (
                  <tr>
                    <td colSpan={allLengths.length + 12} className="px-4 py-8 text-center text-gray-500">
                      No rows yet. Click "Add Row" to get started.
                    </td>
                  </tr>
                ) : (
                  rowResults.map(({ row, required, result }) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      required={required}
                      result={result}
                      isSelected={row.id === selectedRowId}
                      enableSB2={enableSB2}
                      allLengths={allLengths}
                      enabledLengths={enabledLengths}
                      calculateSB1={calculateSB1}
                      updateRowQuantity={updateRowQuantity}
                      updateRowModules={updateRowModules}
                      updateRowSupportBase={updateRowSupportBase}
                      setSelectedRowId={setSelectedRowId}
                      setShowModal={setShowModal}
                      deleteConfirmRowId={deleteConfirmRowId}
                      setDeleteConfirmRowId={setDeleteConfirmRowId}
                      deleteRow={deleteRow}
                    />
                  ))
                )}
            {/* Totals Row */}
            {rowResults.length > 0 && (
              <tr className="bg-linear-to-r from-purple-100 to-purple-50 font-bold border-t-4 border-purple-400 shadow-sm">
                <td className="px-2 py-3 border-b-2 border-purple-300 text-center text-purple-700"></td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-700">-</td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">{totals.modules}</td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">{totals.endClamp}</td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">{totals.midClamp}</td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">
                  {fmt(totals.required)}
                </td>
                {allLengths.map(len => (
                  <td
                    key={len}
                    className={`px-2 py-3 text-center border-b-2 border-purple-300 ${enabledLengths[len] !== false ? 'text-purple-800 font-bold' : 'text-gray-400'
                      }`}
                  >
                    {totals.countsByLength[len] || 0}
                  </td>
                ))}
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">
                  {fmt(totals.total)}
                </td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-red-700 font-bold">
                  {fmt(totals.wastage)}
                </td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">
                  {totals.wastagePct}%
                </td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">
                  {totals.joints}
                </td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">{totals.sb1}</td>
                <td className="px-3 py-3 border-b-2 border-purple-300 text-center text-purple-800">
                  {enableSB2 ? totals.sb2 : '-'}
                </td>
                <td className="px-2 py-3 border-b-2 border-purple-300"></td>
              </tr>
            )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Overall Summary Card */}
      {rowResults.length > 0 && (
        <div className="border-t bg-linear-to-r from-purple-50 to-green-50 px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Ratio 1: Module clamps to module */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Ratio of module clamps to module
              </span>
              <p className="text-xl font-bold text-purple-700">
                {totals.modules > 0
                  ? ((totals.endClamp + totals.midClamp) / totals.modules).toFixed(2)
                  : '0.00'}
              </p>
              {/* <p className="text-xs text-gray-400 mt-1">
                ({totals.endClamp + totals.midClamp}) / {totals.modules}
              </p> */}
            </div>

            {/* Ratio 2: Rail length per module */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
               Ratio of Rail Length to modules (OR)  Rail length per module
              </span>
              <p className="text-xl font-bold text-purple-700">
                {totals.modules > 0
                  ? (totals.total / totals.modules).toFixed(2)
                  : '0.00'} mm
              </p>
              {/* <p className="text-xs text-gray-400 mt-1">
                {fmt(totals.total)} / {totals.modules}
              </p> */}
            </div>

            {/* Ratio 3: Rail to Supports */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Ratio of Rail to Supports
              </span>
              <p className="text-xl font-bold text-purple-700">
                {totals.total > 0
                  ? (totals.total / (totals.sb1 + totals.sb2)).toFixed(6)
                  : '0.00'}
              </p>
              {/* <p className="text-xs text-gray-400 mt-1">
                ({totals.sb1 + totals.sb2}) / {fmt(totals.total)}
              </p> */}
            </div>

            {/* Ratio 4: Supports to module */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Ratio of Supports to module
              </span>
              <p className="text-xl font-bold text-purple-700">
                {totals.modules > 0
                  ? ((totals.sb1 + totals.sb2) / totals.modules).toFixed(2)
                  : '0.00'}
              </p>
              {/* <p className="text-xs text-gray-400 mt-1">
                ({totals.sb1 + totals.sb2}) / {totals.modules}
              </p> */}
            </div>
          </div>
        </div>
      )}

      {/* Result Popover */}
      {showModal && selectedRow && (
        <div
          className="fixed top-40 right-8 z-50 w-80 animate-fadeIn"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
            {/* Popover Header */}
            <div
              className="bg-linear-to-r from-purple-600 to-purple-700 px-3 py-2 flex justify-between items-center rounded-t-xl cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
            >
              <h3 className="font-semibold text-white text-xs">Row Details - {selectedRow.modules} Modules</h3>
              <button
                onClick={closeModal}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-white hover:text-gray-200 text-xl leading-none font-light transition-colors cursor-pointer"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Popover Content */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
              <ResultCard row={selectedRow} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
