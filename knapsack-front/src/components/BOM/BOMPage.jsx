// src/components/BOM/BOMPage.jsx
// src/components/BOM/BOMPage.jsx
// src/components/BOM/BOMPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';
import ComboBox from '../ComboBox';
import AddRowModal from './AddRowModal';
import DeleteRowModal from './DeleteRowModal';
import ReviewChangesModal from './ReviewChangesModal'; // NEW
import ReasonModal from './ReasonModal'; // NEW
import ChangeLogDisplay from './ChangeLogDisplay';
import { bomAPI } from '../../services/api';
import { arrayMove } from '@dnd-kit/sortable'; // NEW

const ensureStableIds = (items) => {
  return items.map(item => ({
    ...item,
    _id: item._id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }));
};

export default function BOMPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [sparePercentage, setSparePercentage] = useState(1);
  const [aluminumRate, setAluminumRate] = useState(527.85);
  const [changeLog, setChangeLog] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAfterRow, setAddAfterRow] = useState(1);
  
  // NEW: Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // NEW: Review Changes State
  const [baselineBomItems, setBaselineBomItems] = useState([]);
  const [changesToReview, setChangesToReview] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // NEW: Drag Reason State
  const [dragModalOpen, setDragModalOpen] = useState(false);
  const [pendingDrag, setPendingDrag] = useState(null); // { oldIndex, newIndex, item }

  useEffect(() => {
    const loadBOM = async () => {
      try {
        setLoading(true);
        let data;
        let bomId = location.state?.bomId;

        if (bomId) {
          // Fetch BOM from database
          data = await bomAPI.getBOMById(bomId);
          setChangeLog(data.changeLog || []);
        } else if (location.state?.bomData) {
          // Fallback: Direct BOM data
          data = { bomData: location.state.bomData };
        } else {
          // No data provided, redirect
          console.warn('No BOM data or ID provided, redirecting to home');
          navigate('/');
          return;
        }

        if (data && data.bomData) {
          // Ensure every item has a stable ID for drag-and-drop
          if (data.bomData.bomItems) {
            data.bomData.bomItems = ensureStableIds(data.bomData.bomItems);
          }
          setBomData(data.bomData);

          // Extract profiles from bomData
          if (data.bomData.profilesMap) {
            const profilesList = Object.values(data.bomData.profilesMap);
            setProfiles(profilesList);
          }

          // Set initial aluminum rate from bomData if available
          if (data.bomData.aluminumRate) {
            setAluminumRate(data.bomData.aluminumRate);
          }
          // Set initial spare percentage from bomData if available
          if (typeof data.bomData.sparePercentage === 'number') {
            setSparePercentage(data.bomData.sparePercentage);
          }

          // Set default addAfterRow to last row number
          if (data.bomData.bomItems && data.bomData.bomItems.length > 0) {
            setAddAfterRow(data.bomData.bomItems.length);
          }
        } else {
          console.error('BOM data is missing or invalid.', data);
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load BOM data:', error);
        alert('Failed to load BOM. It may have been deleted or an error occurred.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadBOM();
  }, [location.state, navigate]);

  // Recalculate costs when aluminum rate changes
  useEffect(() => {
    if (!bomData || loading) return;

    const updatedBomData = { ...bomData };
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      const profile = bomData.profilesMap[item.profileSerialNumber];
      if (profile) {
        const weightCost = calculateWeightAndCost(item, profile, aluminumRate);
        return { ...item, ...weightCost };
      }
      return item;
    });

    setBomData(updatedBomData);
  }, [aluminumRate, loading]);

  // Recalculate all items when spare percentage changes
  useEffect(() => {
    if (!bomData || loading) return;

    const updatedBomData = { ...bomData };
    updatedBomData.bomItems = bomData.bomItems.map(item => {
      // For each item, recalculate spare, final total, weight and cost
      const totalQty = item.totalQuantity;
      const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
      const finalTotal = totalQty + spareQty;

      const updatedItem = {
        ...item,
        spareQuantity: spareQty,
        finalTotal: finalTotal
      };

      const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
      if (profile) {
        const weightCost = calculateWeightAndCost(updatedItem, profile, aluminumRate);
        return { ...updatedItem, ...weightCost };
      }

      return updatedItem;
    });

    setBomData(updatedBomData);
  }, [sparePercentage]);

  const handleBack = () => {
    navigate('/');
  };

  // Helper function to calculate weight and cost for an item
  const calculateWeightAndCost = (item, profile, aluRate) => {
    const result = {
      wtPerRm: null,
      rm: null,
      wt: null,
      cost: null
    };

    // Check if profile has cost_per_piece (for fasteners)
    if (profile.costPerPiece && profile.costPerPiece > 0) {
      result.cost = parseFloat(profile.costPerPiece) * item.finalTotal;
      return result;
    }

    // Weight-based calculation for aluminum profiles
    // Use item.length (for cut lengths) or profile.standardLength (for accessories)
    const lengthToUse = item.length || profile.standardLength;

    if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
      result.wtPerRm = parseFloat(profile.designWeight);
      result.rm = (lengthToUse / 1000) * item.finalTotal;  // Convert mm to meters
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * aluRate;
    }

    return result;
  };

  const handleProfileChange = (profileSerialNumber, itemToUpdate) => {
    if (!itemToUpdate || !profileSerialNumber) return;

    const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
    if (!selectedProfile) return;

    // Update bomData based on row type
    const updatedBomData = { ...bomData };

    if (itemToUpdate.calculationType === 'CUT_LENGTH') {
      // Update ALL cut length rows with the same profile
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.calculationType === 'CUT_LENGTH') {
          const updatedItem = {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            material: selectedProfile.material,
            profileSerialNumber: profileSerialNumber
          };

          // Recalculate weight and cost
          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile);
          updatedItem.wtPerRm = weightCost.wtPerRm;
          updatedItem.rm = weightCost.rm;
          updatedItem.wt = weightCost.wt;
          updatedItem.cost = weightCost.cost;

          return updatedItem;
        }
        return item;
      });
    } else if (itemToUpdate.calculationType === 'ACCESSORY') {
      // Update only the selected row
      updatedBomData.bomItems = bomData.bomItems.map(item => {
        if (item.sn === itemToUpdate.sn) {
          const updatedItem = {
            ...item,
            sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
            profileImage: selectedProfile.profileImagePath,
            itemDescription: selectedProfile.genericName,
            material: selectedProfile.material,
            profileSerialNumber: profileSerialNumber
          };

          // Recalculate weight and cost
          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile);
          updatedItem.wtPerRm = weightCost.wtPerRm;
          updatedItem.rm = weightCost.rm;
          updatedItem.wt = weightCost.wt;
          updatedItem.cost = weightCost.cost;

          return updatedItem;
        }
        return item;
      });
    }

    setBomData(updatedBomData);
  };

  const handleItemUpdate = (itemSn, field, value) => {
    const newBomItems = bomData.bomItems.map(item => {
      if (item.sn === itemSn) {
        let updatedItem = { ...item };

        // Initialize userEdits if it doesn't exist
        if (!updatedItem.userEdits) {
          updatedItem.userEdits = {};
        }

        // Update the specific field that was changed
        if (field.startsWith('quantity_')) {
          const tabName = field.split('_')[1];
          updatedItem.quantities = { ...updatedItem.quantities, [tabName]: Number(value) || 0 };
        } else if (field === 'spareQuantity') {
          // Manual spare quantity override
          const manualSpare = Number(value) || 0;
          updatedItem.spareQuantity = manualSpare;
          updatedItem.userEdits = { ...updatedItem.userEdits, manualSpareQuantity: manualSpare };
        } else if (field === 'resetSpare') {
          // Reset manual spare override - remove from userEdits
          const { manualSpareQuantity: _manualSpareQuantity, ...restEdits } = updatedItem.userEdits;
          updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;
        }

        // Recalculate derived fields for the updated item
        const totalQty = Object.values(updatedItem.quantities).reduce((sum, q) => sum + q, 0);
        updatedItem.totalQuantity = totalQty;

        // If a building quantity was changed OR spare was reset, recalculate spare based on global percentage
        if (field.startsWith('quantity_') || field === 'resetSpare') {
          // Check if there's a manual override
          if (updatedItem.userEdits?.manualSpareQuantity !== undefined) {
            // Keep manual override
            updatedItem.spareQuantity = updatedItem.userEdits.manualSpareQuantity;
          } else {
            // Auto-calculate from percentage
            updatedItem.spareQuantity = Math.ceil(totalQty * (sparePercentage / 100));
          }
        }

        const finalTotal = totalQty + updatedItem.spareQuantity;
        updatedItem.finalTotal = finalTotal;

        // Recalculate weight and cost
        const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
        if (profile) {
          const weightCost = calculateWeightAndCost(updatedItem, profile, aluminumRate);
          updatedItem = { ...updatedItem, ...weightCost };
        }

        return updatedItem;
      }
      return item;
    });

    setBomData({ ...bomData, bomItems: newBomItems });
  };

  const handleAddRowClick = () => {
    setShowAddModal(true);
  };

  const handleAddRowConfirm = (newItemData) => {
    const profile = profiles.find(p => p.serialNumber === newItemData.profileSerialNumber);
    if (!profile) {
      alert('Profile not found');
      return;
    }

    // Validate addAfterRow
    const maxRow = bomData.bomItems.length;
    const insertAfter = Math.max(0, Math.min(addAfterRow, maxRow));

    // Calculate totals
    const totalQty = Object.values(newItemData.quantities).reduce((sum, qty) => sum + qty, 0);
    const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
    const finalTotal = totalQty + spareQty;

    // Determine calculation type
    let calculationType = 'ACCESSORY';
    if (newItemData.customLength) {
      calculationType = 'CUT_LENGTH';
    }

    // Create new item
    const newItem = {
      _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sn: insertAfter + 1, // Temporary SN
      profileSerialNumber: newItemData.profileSerialNumber,
      sunrackCode: profile.preferredRmCode || profile.sunrackCode,
      profileImage: profile.profileImagePath,
      itemDescription: profile.genericName,
      material: profile.material,
      length: newItemData.customLength || newItemData.standardLength,
      uom: profile.uom,
      calculationType: calculationType,
      quantities: newItemData.quantities,
      totalQuantity: totalQty,
      spareQuantity: spareQty,
      finalTotal: finalTotal,
      userEdits: {
        addedManually: true,
        reason: newItemData.reason,
        // Store user's calculation preferences
        userProvidedStandardLength: newItemData.standardLength || null,
        userProvidedCostPerPiece: newItemData.costPerPiece || null,
        calculationMethod: newItemData.calculationMethod
      }
    };

    // Create a modified profile object with user overrides
    const profileForCalculation = {
      ...profile,
      // Override profile values with user-provided values if they exist
      standardLength: newItemData.standardLength || profile.standardLength,
      costPerPiece: newItemData.costPerPiece || profile.costPerPiece
    };

    // IMPORTANT: Force the calculation method
    // If user selected cost_per_piece, temporarily modify profile to prioritize it
    if (newItemData.calculationMethod === 'cost_per_piece' && newItemData.costPerPiece) {
      profileForCalculation.costPerPiece = parseFloat(newItemData.costPerPiece);
    } else if (newItemData.calculationMethod === 'standard_length') {
      // If standard length selected, ensure costPerPiece doesn't interfere
      // Set costPerPiece to null/0 to force weight-based calculation
      profileForCalculation.costPerPiece = null;
    }

    // Calculate weight and cost
    const weightCost = calculateWeightAndCost(newItem, profileForCalculation, aluminumRate);
    newItem.wtPerRm = weightCost.wtPerRm;
    newItem.rm = weightCost.rm;
    newItem.wt = weightCost.wt;
    newItem.cost = weightCost.cost;
    newItem.costPerPiece = weightCost.costPerPiece; // Ensure this is captured if returned

    // Insert into array at the specified position
    const updatedItems = [...bomData.bomItems];
    updatedItems.splice(insertAfter, 0, newItem);

    // Renumber all S.N
    updatedItems.forEach((item, index) => {
      item.sn = index + 1;
    });

    // Add to change log with calculation method
    const newChangeLog = [...changeLog, {
      type: 'ADD_ROW',
      itemName: newItem.itemDescription,
      rowNumber: insertAfter + 1,
      reason: newItemData.reason,
      calculationMethod: newItemData.calculationMethod,
      timestamp: new Date().toISOString()
    }];

    // Update state
    setBomData({ ...bomData, bomItems: updatedItems });
    setChangeLog(newChangeLog);
    
    // Update baseline to match new structure so it doesn't flag as "changed" later
    if (baselineBomItems) {
      const updatedBaseline = [...baselineBomItems];
      // Insert deep copy of new item
      updatedBaseline.splice(insertAfter, 0, JSON.parse(JSON.stringify(newItem)));
      // Renumber
      updatedBaseline.forEach((item, index) => { item.sn = index + 1; });
      setBaselineBomItems(updatedBaseline);
    }

    setShowAddModal(false);

    // Reset addAfterRow to new last row
    setAddAfterRow(updatedItems.length);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Use _id (which is passed as id to dnd-kit)
      const oldIndex = bomData.bomItems.findIndex((item) => item._id === active.id);
      const newIndex = bomData.bomItems.findIndex((item) => item._id === over.id);
      
      // Optimistically move the item in the UI
      const newItems = arrayMove(bomData.bomItems, oldIndex, newIndex);
      
      // Renumber temporarily for display
      const renumberedItems = newItems.map((item, index) => ({
        ...item,
        sn: index + 1
      }));

      // Update UI
      setBomData({ ...bomData, bomItems: renumberedItems });

      // Store pending drag details and open modal with a slight delay to allow paint
      setPendingDrag({
        oldIndex,
        newIndex,
        item: bomData.bomItems[oldIndex],
        originalItems: bomData.bomItems // Store original order for revert
      });
      setTimeout(() => setDragModalOpen(true), 150);
    }
  };

  const handleDragConfirm = (reason) => {
    if (!pendingDrag) return;

    const { item, oldIndex, newIndex } = pendingDrag;

    // Log the change
    const newChangeLog = [...changeLog, {
      type: 'REORDER_ROW',
      itemName: item.itemDescription,
      rowNumber: newIndex + 1,
      oldValue: `Row ${oldIndex + 1}`,
      newValue: `Row ${newIndex + 1}`,
      reason: reason,
      timestamp: new Date().toISOString()
    }];

    setChangeLog(newChangeLog);

    // Update baseline to match new order so it doesn't flag as "changed" later
    if (baselineBomItems) {
      const newBaseline = arrayMove(baselineBomItems, oldIndex, newIndex);
      newBaseline.forEach((itm, idx) => { itm.sn = idx + 1; });
      setBaselineBomItems(newBaseline);
    }

    // Save to DB immediately to persist the new order and the log
    saveWithExplicitData(bomData, newChangeLog);

    setDragModalOpen(false);
    setPendingDrag(null);
  };

  const handleDragCancel = () => {
    if (pendingDrag) {
      // Revert to original order
      setBomData({ ...bomData, bomItems: pendingDrag.originalItems });
    }
    setDragModalOpen(false);
    setPendingDrag(null);
  };

  const handleDeleteRowClick = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = (reason) => {
    if (!itemToDelete) return;

    // Remove item
    const updatedItems = bomData.bomItems.filter(item => item.sn !== itemToDelete.sn);

    // Renumber S.N
    updatedItems.forEach((item, index) => {
      item.sn = index + 1;
    });

    // Add to change log
    const newChangeLog = [...changeLog, {
      type: 'DELETE_ROW',
      itemName: itemToDelete.itemDescription,
      rowNumber: itemToDelete.sn, // Store original SN for reference
      reason: reason,
      timestamp: new Date().toISOString()
    }];

    setBomData({ ...bomData, bomItems: updatedItems });
    setChangeLog(newChangeLog);

    // Update baseline to match new structure
    if (baselineBomItems) {
      // Find item in baseline using SN (before re-indexing)
      const updatedBaseline = baselineBomItems.filter(item => item.sn !== itemToDelete.sn);
      // Renumber
      updatedBaseline.forEach((item, index) => { item.sn = index + 1; });
      setBaselineBomItems(updatedBaseline);
    }
    
    setDeleteModalOpen(false);
    setItemToDelete(null);

    // Update addAfterRow if it's now out of bounds
    if (addAfterRow > updatedItems.length) {
      setAddAfterRow(updatedItems.length);
    }
  };

  const handleSaveChanges = async () => {
    const bomId = location.state?.bomId;
    if (!bomId) {
      alert('Cannot save changes: BOM ID is missing.');
      return;
    }

    setIsSaving(true);
    try {
      // Construct a clean data object to save, sending only what the backend needs.
      const dataToSave = {
        projectInfo: bomData.projectInfo,
        tabs: bomData.tabs,
        panelCounts: bomData.panelCounts,
        bomItems: bomData.bomItems,
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
      };

      // Save the changes to backend
      await bomAPI.updateBOM(bomId, dataToSave, changeLog);

      // Reload the BOM from backend to get recalculated weights and costs
      const freshData = await bomAPI.getBOMById(bomId);

      if (freshData && freshData.bomData) {
        setBomData(freshData.bomData);
        setChangeLog(freshData.changeLog || []);

        // Update profiles list
        if (freshData.bomData.profilesMap) {
          const profilesList = Object.values(freshData.bomData.profilesMap);
          setProfiles(profilesList);
        }

        // Update aluminum rate
        if (freshData.bomData.aluminumRate) {
          setAluminumRate(freshData.bomData.aluminumRate);
        }
      }

      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes? This will revert the BOM to its state before you started editing.')) {
      if (baselineBomItems && baselineBomItems.length > 0) {
        // Revert to baseline
        setBomData(prev => ({ ...prev, bomItems: JSON.parse(JSON.stringify(baselineBomItems)) }));
      }
      setEditMode(false);
      setBaselineBomItems([]);
    }
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      // Exiting edit mode -> Check for changes instead of direct save
      handleDoneEditing();
    } else {
      // Entering edit mode -> Snapshot the current state as baseline
      if (bomData?.bomItems) {
        setBaselineBomItems(JSON.parse(JSON.stringify(bomData.bomItems)));
      }
      setEditMode(true);
    }
  };

  const handleDoneEditing = () => {
    // 1. Compare current items with baseline
    const changes = [];
    
    // We assume the structure is synced (Add/Delete handled separately).
    // Loop through current items to find edits.
    bomData.bomItems.forEach((currentItem) => {
      // Find matching item in baseline by SN if possible, or fallback to index if structure is synced
      // Since we update baseline on Add/Delete, index matching should be safe-ish,
      // but let's try to match by SN to be robust, assuming SNs are unique.
      const baselineItem = baselineBomItems.find(b => b.sn === currentItem.sn);
      
      if (baselineItem) {
        // Check Quantities Per Tab
        Object.keys(currentItem.quantities).forEach(tabName => {
          const oldQty = baselineItem.quantities[tabName] || 0;
          const newQty = currentItem.quantities[tabName] || 0;
          
          if (oldQty !== newQty) {
            changes.push({
              id: `${currentItem.sn}-${tabName}`, // Unique ID for the change
              type: 'EDIT_QUANTITY',
              itemName: currentItem.itemDescription,
              rowNumber: currentItem.sn,
              tabName: tabName,
              oldValue: oldQty,
              newValue: newQty
            });
          }
        });

        // Check Spare Quantity (if manually overridden)
        // Note: spareQuantity might auto-calculate, so we only care if it's a manual edit difference?
        // Or do we care about the value change regardless? 
        // User asked for "quantity from original quantity".
        // Let's stick to tab quantities for now as per request.
      }
    });

    if (changes.length > 0) {
      // 2. If changes found, open review modal
      setChangesToReview(changes);
      setReviewModalOpen(true);
    } else {
      // 3. No changes, just save and exit
      handleSaveChanges();
      setEditMode(false);
    }
  };

  const handleReviewConfirm = (changesWithReasons) => {
    // 1. Add new changes to log
    const newLogEntries = changesWithReasons.map(change => ({
      type: change.type,
      itemName: change.itemName,
      rowNumber: change.rowNumber,
      tabName: change.tabName,
      oldValue: change.oldValue,
      newValue: change.newValue,
      reason: change.reason,
      timestamp: new Date().toISOString()
    }));

    const updatedChangeLog = [...changeLog, ...newLogEntries];
    setChangeLog(updatedChangeLog);

    // 2. Save everything
    // We need to use the updated change log in the save function. 
    // Since state update is async, we can pass it directly or modify handleSaveChanges to accept it.
    // For now, let's update state and call a modified save logic or just rely on the state update being fast enough?
    // No, React state updates are batched. Better to pass it explicitly.
    
    // Actually, handleSaveChanges uses 'changeLog' from state. 
    // Let's create a helper to save with explicit data.
    saveWithExplicitData(bomData, updatedChangeLog);

    setReviewModalOpen(false);
    setEditMode(false);
  };

  // Duplicate of handleSaveChanges but accepts data as args to avoid state race conditions
  const saveWithExplicitData = async (currentBomData, currentChangeLog) => {
    const bomId = location.state?.bomId;
    if (!bomId) return;

    setIsSaving(true);
    try {
      const dataToSave = {
        projectInfo: currentBomData.projectInfo,
        tabs: currentBomData.tabs,
        panelCounts: currentBomData.panelCounts,
        bomItems: currentBomData.bomItems,
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
      };

      await bomAPI.updateBOM(bomId, dataToSave, currentChangeLog);
      
      // Reload fresh data
      const freshData = await bomAPI.getBOMById(bomId);
      if (freshData && freshData.bomData) {
        // Ensure stable IDs are preserved/generated after reload
        if (freshData.bomData.bomItems) {
          freshData.bomData.bomItems = ensureStableIds(freshData.bomData.bomItems);
        }
        setBomData(freshData.bomData);
        setChangeLog(freshData.changeLog || []);
        if (freshData.bomData.profilesMap) {
          setProfiles(Object.values(freshData.bomData.profilesMap));
        }
        if (freshData.bomData.aluminumRate) {
          setAluminumRate(freshData.bomData.aluminumRate);
        }
      }
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BOM...</p>
        </div>
      </div>
    );
  }

  if (!bomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">Could not load BOM data. It might have been deleted or is invalid.</p>
          <button onClick={handleBack} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profileOptions = profiles.map(profile => ({
    value: profile.serialNumber,
    label: `${profile.genericName} (${profile.preferredRmCode || profile.sunrackCode || 'No Code'})`
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-700"
              title="Back to main page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bill of Materials (BOM)</h1>
              <p className="text-sm text-gray-600">{bomData.projectInfo.projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* NEW: Discard Changes Button */}
            {editMode && (
              <button
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                title="Discard all unsaved changes"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Discard
              </button>
            )}

            {/* NEW: Enable Edit Button */}
            <button
              onClick={handleToggleEditMode}
              disabled={isSaving}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                editMode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {editMode ? 'Done Editing' : 'Enable Edit'}
                </>
              )}
            </button>

            <button
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => window.print()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                  clipRule="evenodd"
                />
              </svg>
              Print
            </button>
          </div>
        </div>
      </header>

      {/* BOM Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Project Info Bar */}
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{bomData.projectInfo.projectName}</h2>
                <p className="text-sm text-purple-100">
                  {bomData.projectInfo.totalTabs} Building{bomData.projectInfo.totalTabs > 1 ? 's' : ''} | {bomData.bomItems.length} Items
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-100">Generated</p>
                <p className="text-sm font-medium">
                  {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Bar - Always visible */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {/* Aluminum Rate Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Aluminum Rate (₹/kg):
                </label>
                <input
                  type="number"
                  value={aluminumRate}
                  onChange={(e) => setAluminumRate(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  disabled={!editMode}
                  className={`w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Spare Percentage Input */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Spare %:
                </label>
                <input
                  type="number"
                  value={sparePercentage}
                  onChange={(e) => setSparePercentage(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                  disabled={!editMode}
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Add Row Section - Only visible in edit mode */}
              {editMode && (
                <>
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Add After Input */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Add After:
                    </label>
                    <input
                      type="number"
                      value={addAfterRow}
                      onChange={(e) => setAddAfterRow(parseInt(e.target.value) || 1)}
                      min="0"
                      max={bomData.bomItems.length}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Add Row Button */}
                  <button
                    onClick={handleAddRowClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Row
                  </button>
                </>
              )}
            </div>
          </div>

          {/* BOM Table with integrated Spare columns */}
          <BOMTable
            bomData={bomData}
            editMode={editMode}
            onProfileChange={handleProfileChange}
            profileOptions={profileOptions}
            onItemUpdate={handleItemUpdate}
            aluminumRate={aluminumRate}
            sparePercentage={sparePercentage}
            onDeleteRow={handleDeleteRowClick}
            onDragEnd={handleDragEnd}
          />
          
          {/* Change Log Display / Disclaimer */}
          <div className="px-6 pb-6">
            <ChangeLogDisplay changeLog={changeLog} />
          </div>
        </div>
      </main>

      {/* Add Row Modal */}
      <AddRowModal
        isOpen={showAddModal}
        afterRowNumber={addAfterRow}
        profiles={profiles}
        tabs={bomData.tabs}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddRowConfirm}
      />

      {/* Delete Row Modal */}
      <DeleteRowModal
        isOpen={deleteModalOpen}
        itemDescription={itemToDelete?.itemDescription}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Drag Reason Modal */}
      <ReasonModal
        isOpen={dragModalOpen}
        title="Confirm Move"
        message={`You moved "${pendingDrag?.item?.itemDescription}" from Row ${pendingDrag ? pendingDrag.oldIndex + 1 : ''} to Row ${pendingDrag ? pendingDrag.newIndex + 1 : ''}.`}
        onClose={handleDragCancel}
        onConfirm={handleDragConfirm}
      />

      {/* Review Changes Modal */}
      <ReviewChangesModal
        isOpen={reviewModalOpen}
        changes={changesToReview}
        onCancel={() => setReviewModalOpen(false)}
        onConfirm={handleReviewConfirm}
      />
    </div>
  );
}
