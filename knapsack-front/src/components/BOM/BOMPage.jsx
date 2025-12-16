import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';
import ComboBox from '../ComboBox';
import AddRowModal from './AddRowModal';
import DeleteRowModal from './DeleteRowModal';
import ReviewChangesModal from './ReviewChangesModal';
import ReasonModal from './ReasonModal';
import ChangeLogDisplay from './ChangeLogDisplay';
import { bomAPI } from '../../services/api';
import { arrayMove } from '@dnd-kit/sortable';
import * as changeTracker from '../../lib/changeTracker';

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
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const [dragModalOpen, setDragModalOpen] = useState(false);
  const [pendingDrag, setPendingDrag] = useState(null);

  useEffect(() => {
    const loadBOM = async () => {
      try {
        setLoading(true);
        let data;
        let bomId = location.state?.bomId;

        if (bomId) {
          data = await bomAPI.getBOMById(bomId);
          setChangeLog(data.changeLog || []);
        } else if (location.state?.bomData) {
          data = { bomData: location.state.bomData };
        } else {
          console.warn('No BOM data or ID provided, redirecting to home');
          navigate('/');
          return;
        }

        if (data && data.bomData) {
          if (data.bomData.bomItems) {
            data.bomData.bomItems = ensureStableIds(data.bomData.bomItems);
          }
          
          const pendingChanges = changeTracker.getChanges();
          const pendingAdditions = changeTracker.getAdditions();
          const pendingDeletions = changeTracker.getDeletions();

          if (pendingChanges.length > 0 || pendingAdditions.length > 0 || pendingDeletions.length > 0) {
            console.log('Applying pending changes from last session...');
            setEditMode(true); // Re-enter edit mode if changes were pending

            let items = [...data.bomData.bomItems];

            // 1. Apply deletions
            const deletedIds = new Set(pendingDeletions);
            items = items.filter(item => !deletedIds.has(item._id));

            // 2. Apply additions
            items = [...items, ...pendingAdditions];

            // 3. Renumber SNs after structural changes
            items = items.map((item, index) => ({ ...item, sn: index + 1 }));

            // 4. Apply field-level edits
            items = items.map(item => {
              let updatedItem = { ...item };
              for (const change of pendingChanges) {
                const [itemId, field] = change.id.split('-');
                if (item._id === itemId) {
                  if (field === 'manual' && change.type === 'EDIT_SPARE_QUANTITY') {
                     updatedItem.spareQuantity = change.newValue;
                     if (!updatedItem.userEdits) updatedItem.userEdits = {};
                     updatedItem.userEdits.manualSpareQuantity = change.newValue;
                  } else if (change.type === 'EDIT_QUANTITY') {
                    if (!updatedItem.quantities) updatedItem.quantities = {};
                    updatedItem.quantities[change.tabName] = change.newValue;
                  } else if (change.type === 'CHANGE_ALUMINUM_RATE') {
                    setAluminumRate(change.newValue);
                  } else if (change.type === 'CHANGE_SPARE_PERCENTAGE') {
                    setSparePercentage(change.newValue);
                  }
                }
              }
              return updatedItem;
            });
            
            data.bomData.bomItems = items;
          }

          setBomData(data.bomData);

          if (data.bomData.profilesMap) {
            const profilesList = Object.values(data.bomData.profilesMap);
            setProfiles(profilesList);
          }

          if (data.bomData.aluminumRate) {
            setAluminumRate(data.bomData.aluminumRate);
          }
          if (typeof data.bomData.sparePercentage === 'number') {
            setSparePercentage(data.bomData.sparePercentage);
          }

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

  useEffect(() => {
    if (!bomData || loading) return;

    const updatedBomData = { ...bomData };
    updatedBomData.bomItems = bomData.bomItems.map(item => {
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

  const calculateWeightAndCost = (item, profile, aluRate) => {
    const result = {
      wtPerRm: null,
      rm: null,
      wt: null,
      cost: null,
      costPerPiece: null
    };

    if (item.userEdits?.userProvidedCostPerPiece !== undefined) {
      result.costPerPiece = parseFloat(item.userEdits.userProvidedCostPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    } else if (item.userEdits?.costPerPiece !== undefined) {
      result.costPerPiece = parseFloat(item.userEdits.costPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    }

    if (profile.costPerPiece && profile.costPerPiece > 0) {
      result.costPerPiece = parseFloat(profile.costPerPiece);
      result.cost = result.costPerPiece * item.finalTotal;
      return result;
    }

    const lengthToUse = item.length || item.userEdits?.userProvidedStandardLength || profile.standardLength;

    if (profile.designWeight && profile.designWeight > 0 && lengthToUse) {
      result.wtPerRm = parseFloat(profile.designWeight);
      result.rm = (lengthToUse / 1000) * item.finalTotal;
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * aluRate;
    }

    return result;
  };

  const handleProfileChange = (profileSerialNumber, itemToUpdate) => {
    if (!itemToUpdate || !profileSerialNumber) return;

    const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
    if (!selectedProfile) return;

    const updatedBomData = { ...bomData };

    if (itemToUpdate.calculationType === 'CUT_LENGTH') {
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

          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
          updatedItem.wtPerRm = weightCost.wtPerRm;
          updatedItem.rm = weightCost.rm;
          updatedItem.wt = weightCost.wt;
          updatedItem.cost = weightCost.cost;

          return updatedItem;
        }
        return item;
      });
    } else if (itemToUpdate.calculationType === 'ACCESSORY') {
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

          const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
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
    const originalItem = bomData.bomItems.find(item => item.sn === itemSn);
    if (!originalItem) return;

    let oldValue; // Variable to store the original value for tracking

    const newBomItems = bomData.bomItems.map(item => {
      if (item.sn === itemSn) {
        let updatedItem = { ...item };

        if (!updatedItem.userEdits) {
          updatedItem.userEdits = {};
        }

        if (field.startsWith('quantity_')) {
          const tabName = field.split('_')[1];
          oldValue = originalItem.quantities[tabName] || 0;
          updatedItem.quantities = { ...updatedItem.quantities, [tabName]: Number(value) || 0 };
          
          changeTracker.trackChange({
            id: `${item._id}-${tabName}`,
            type: 'EDIT_QUANTITY',
            oldValue: oldValue,
            newValue: updatedItem.quantities[tabName],
            itemName: item.itemDescription,
            rowNumber: item.sn,
            tabName: tabName,
          });

        } else if (field === 'spareQuantity') {
          oldValue = originalItem.userEdits?.manualSpareQuantity ?? 'Auto';
          const manualSpare = Number(value) || 0;
          updatedItem.spareQuantity = manualSpare;
          updatedItem.userEdits = { ...updatedItem.userEdits, manualSpareQuantity: manualSpare };

          changeTracker.trackChange({
            id: `${item._id}-manual-spare`,
            type: 'EDIT_SPARE_QUANTITY',
            oldValue: oldValue,
            newValue: manualSpare,
            itemName: item.itemDescription,
            rowNumber: item.sn,
            tabName: null,
          });

        } else if (field === 'costPerPiece') {
          oldValue = originalItem.userEdits?.userProvidedCostPerPiece ?? originalItem.costPerPiece ?? 0;
          const newRate = parseFloat(value) || 0;
          updatedItem.costPerPiece = newRate;
          updatedItem.userEdits = { 
            ...updatedItem.userEdits, 
            userProvidedCostPerPiece: newRate,
            calculationMethod: 'cost_per_piece' 
          };

          changeTracker.trackChange({
            id: `${item._id}-cost-per-piece`,
            type: 'EDIT_COST_PER_PIECE',
            oldValue: oldValue,
            newValue: newRate,
            itemName: item.itemDescription,
            rowNumber: item.sn,
            tabName: null,
            profileSerialNumber: item.profileSerialNumber
          });

        } else if (field === 'resetSpare') {
          oldValue = originalItem.userEdits?.manualSpareQuantity ?? 'Auto';
          const { manualSpareQuantity: _manualSpareQuantity, ...restEdits } = updatedItem.userEdits;
          updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;
          
          changeTracker.trackChange({
            id: `${item._id}-manual-spare`,
            type: 'EDIT_SPARE_QUANTITY',
            oldValue: oldValue,
            newValue: 'Auto',
            itemName: item.itemDescription,
            rowNumber: item.sn,
            tabName: null,
          });
        }

        const totalQty = Object.values(updatedItem.quantities).reduce((sum, q) => sum + q, 0);
        updatedItem.totalQuantity = totalQty;

        if (field.startsWith('quantity_') || field === 'resetSpare') {
          if (updatedItem.userEdits?.manualSpareQuantity !== undefined) {
            updatedItem.spareQuantity = updatedItem.userEdits.manualSpareQuantity;
          } else {
            updatedItem.spareQuantity = Math.ceil(totalQty * (sparePercentage / 100));
          }
        }

        const finalTotal = totalQty + updatedItem.spareQuantity;
        updatedItem.finalTotal = finalTotal;

        const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
        if (profile) {
          const profileForCalculation = { ...profile };
          if (updatedItem.userEdits?.userProvidedCostPerPiece !== undefined) {
            profileForCalculation.costPerPiece = updatedItem.userEdits.userProvidedCostPerPiece;
          }
          
          const weightCost = calculateWeightAndCost(updatedItem, profileForCalculation, aluminumRate);
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

    const maxRow = bomData.bomItems.length;
    const insertAfter = Math.max(0, Math.min(addAfterRow, maxRow));

    const totalQty = Object.values(newItemData.quantities).reduce((sum, qty) => sum + qty, 0);
    const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
    const finalTotal = totalQty + spareQty;

    let calculationType = 'ACCESSORY';
    if (newItemData.customLength) {
      calculationType = 'CUT_LENGTH';
    }

    const newItem = {
      _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sn: insertAfter + 1,
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
        userProvidedStandardLength: newItemData.standardLength || null,
        userProvidedCostPerPiece: newItemData.costPerPiece || null,
        calculationMethod: newItemData.calculationMethod
      }
    };

    const profileForCalculation = {
      ...profile,
      standardLength: newItemData.standardLength || profile.standardLength,
      costPerPiece: newItemData.costPerPiece || profile.costPerPiece
    };

    if (newItemData.calculationMethod === 'cost_per_piece' && newItemData.costPerPiece) {
      profileForCalculation.costPerPiece = parseFloat(newItemData.costPerPiece);
    } else if (newItemData.calculationMethod === 'standard_length') {
      profileForCalculation.costPerPiece = null;
    }

    const weightCost = calculateWeightAndCost(newItem, profileForCalculation, aluminumRate);
    newItem.wtPerRm = weightCost.wtPerRm;
    newItem.rm = weightCost.rm;
    newItem.wt = weightCost.wt;
    newItem.cost = weightCost.cost;
    newItem.costPerPiece = weightCost.costPerPiece;

    const updatedItems = [...bomData.bomItems];
    updatedItems.splice(insertAfter, 0, newItem);

    updatedItems.forEach((item, index) => {
      item.sn = index + 1;
    });

    changeTracker.trackRowAddition(newItem);

    setBomData({ ...bomData, bomItems: updatedItems });
    
    setShowAddModal(false);

    setAddAfterRow(updatedItems.length);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bomData.bomItems.findIndex((item) => item._id === active.id);
      const newIndex = bomData.bomItems.findIndex((item) => item._id === over.id);
      
      const newItems = arrayMove(bomData.bomItems, oldIndex, newIndex);
      
      const renumberedItems = newItems.map((item, index) => ({
        ...item,
        sn: index + 1
      }));

      setBomData({ ...bomData, bomItems: renumberedItems });

      setPendingDrag({
        oldIndex,
        newIndex,
        item: bomData.bomItems[oldIndex],
        originalItems: bomData.bomItems
      });
      setTimeout(() => setDragModalOpen(true), 150);
    }
  };

  const handleDragConfirm = (reason) => {
    if (!pendingDrag) return;

    const { item, oldIndex, newIndex } = pendingDrag;

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
    
    saveWithExplicitData(bomData, newChangeLog);

    setDragModalOpen(false);
    setPendingDrag(null);
  };

  const handleDragCancel = () => {
    if (pendingDrag) {
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

    changeTracker.trackRowDeletion({ rowId: itemToDelete._id, reason: reason });

    const updatedItems = bomData.bomItems.filter(item => item.sn !== itemToDelete.sn);

    updatedItems.forEach((item, index) => {
      item.sn = index + 1;
    });

    setBomData({ ...bomData, bomItems: updatedItems });
    
    setDeleteModalOpen(false);
    setItemToDelete(null);

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
      const dataToSave = {
        projectInfo: bomData.projectInfo,
        tabs: bomData.tabs,
        panelCounts: bomData.panelCounts,
        bomItems: bomData.bomItems,
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
      };

      await bomAPI.updateBOM(bomId, dataToSave, changeLog);

      const freshData = await bomAPI.getBOMById(bomId);

      if (freshData && freshData.bomData) {
        setBomData(freshData.bomData);
        setChangeLog(freshData.changeLog || []);

        if (freshData.bomData.profilesMap) {
          const profilesList = Object.values(freshData.bomData.profilesMap);
          setProfiles(profilesList);
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
      changeTracker.stopTracking(); // Stop tracking on successful save
    }
  };

  const handleDiscardChanges = async () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes? This will reload the BOM data.')) {
      changeTracker.stopTracking(); // Clear any tracked changes
      setEditMode(false);
      // Reload the entire component to fetch fresh data
      window.location.reload();
    }
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      handleDoneEditing();
    } else {
      changeTracker.startTracking(); // Start tracking changes
      setEditMode(true);
    }
  };

  const handleDoneEditing = () => {
    const changes = changeTracker.getChanges();
    const additions = changeTracker.getAdditions();
    const deletions = changeTracker.getDeletions();

    if (changes.length > 0 || additions.length > 0 || deletions.length > 0) {
      setReviewModalOpen(true);
    } else {
      // No changes detected, just exit edit mode without saving
      // alert('No changes were made.');
      setEditMode(false);
      changeTracker.stopTracking(); // Ensure tracking is stopped
    }
  };

  const handleReviewConfirm = async (changesWithReasons) => {
    const masterUpdates = changesWithReasons.filter(c => c.updateMaster && c.profileSerialNumber);
    
    if (masterUpdates.length > 0) {
      try {
        await Promise.all(masterUpdates.map(update => {
          return bomAPI.updateMasterItem(update.profileSerialNumber, { costPerPiece: update.newValue });
        }));
        console.log('Updated master items:', masterUpdates.length);
      } catch (error) {
        console.error('Failed to update master items:', error);
        alert('Warning: Failed to update Master Database. Project-specific changes will still be saved.');
      }
    }

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

    saveWithExplicitData(bomData, updatedChangeLog);

    setReviewModalOpen(false);
    setEditMode(false);
    changeTracker.stopTracking();
  };

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
      
      const freshData = await bomAPI.getBOMById(bomId);
      if (freshData && freshData.bomData) {
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
      changeTracker.stopTracking(); // Stop tracking on successful save
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

      <main className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Aluminum Rate (₹/kg):
                </label>
                <input
                  type="number"
                  value={aluminumRate}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    changeTracker.trackChange({
                      id: 'global-aluminum-rate',
                      type: 'CHANGE_ALUMINUM_RATE',
                      oldValue: aluminumRate,
                      newValue: newValue,
                      itemName: 'Global Settings',
                    });
                    setAluminumRate(newValue);
                  }}
                  step="0.01"
                  min="0"
                  disabled={!editMode}
                  className={`w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Spare %:
                </label>
                <input
                  type="number"
                  value={sparePercentage}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    changeTracker.trackChange({
                        id: `global-spare-pct`,
                        type: 'CHANGE_SPARE_PERCENTAGE',
                        oldValue: sparePercentage,
                        newValue: newValue,
                        itemName: 'Global Settings',
                    });
                    setSparePercentage(newValue);
                  }}
                  step="0.1"
                  min="0"
                  disabled={!editMode}
                  className={`w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    !editMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {editMode && (
                <>
                  <div className="h-8 w-px bg-gray-300"></div>

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
          
          <div className="px-6 pb-6">
            <ChangeLogDisplay changeLog={changeLog} />
          </div>
        </div>
      </main>

      <AddRowModal
        isOpen={showAddModal}
        afterRowNumber={addAfterRow}
        profiles={profiles}
        tabs={bomData.tabs}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddRowConfirm}
      />

      <DeleteRowModal
        isOpen={deleteModalOpen}
        itemDescription={itemToDelete?.itemDescription}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <ReasonModal
        isOpen={dragModalOpen}
        title="Confirm Move"
        message={`You moved "${pendingDrag?.item?.itemDescription}" from Row ${pendingDrag ? pendingDrag.oldIndex + 1 : ''} to Row ${pendingDrag ? pendingDrag.newIndex + 1 : ''}.`}
        onClose={handleDragCancel}
        onConfirm={handleDragConfirm}
      />

      <ReviewChangesModal
        isOpen={reviewModalOpen}
        changes={{
          updates: changeTracker.getChanges(),
          additions: changeTracker.getAdditions(),
          deletions: changeTracker.getDeletions(),
        }}
        bomData={bomData}
        onCancel={() => {
          setReviewModalOpen(false);
          changeTracker.stopTracking();
          window.location.reload();
        }}
        onConfirm={handleReviewConfirm}
      />
    </div>
  );
}
