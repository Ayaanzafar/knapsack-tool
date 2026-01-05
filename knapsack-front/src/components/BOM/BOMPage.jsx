// import { useLocation, useNavigate } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import BOMTable from './BOMTable';
// import ComboBox from '../ComboBox';
// import AddRowModal from './AddRowModal';
// import DeleteRowModal from './DeleteRowModal';
// import ReviewChangesModal from './ReviewChangesModal';
// import ReasonModal from './ReasonModal';
// import ChangeLogDisplay from './ChangeLogDisplay';
// import PrintSettingsModal from './PrintSettingsModal';
// import NotesSection from './NotesSection';
// import { API_URL } from '../../services/config';
// import { bomAPI } from '../../services/api';
// import axios from 'axios';
// import { arrayMove } from '@dnd-kit/sortable';
// import * as changeTracker from '../../lib/changeTracker';

// const ensureStableIds = (items) => {
//   return items.map(item => ({
//     ...item,
//     _id: item._id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
//   }));
// };

// export default function BOMPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [bomData, setBomData] = useState(null);
//   const [originalBomData, setOriginalBomData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [editMode, setEditMode] = useState(false);
//   const [profiles, setProfiles] = useState([]);
//   const [sparePercentage, setSparePercentage] = useState(1);
//   const [moduleWp, setModuleWp] = useState(710);
//   const [aluminumRate, setAluminumRate] = useState(527.85);
//   const [changeLog, setChangeLog] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addAfterRow, setAddAfterRow] = useState(1);

//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState(null);

//   const [reviewModalOpen, setReviewModalOpen] = useState(false);

//   const [printSettingsModalOpen, setPrintSettingsModalOpen] = useState(false);

//   const [userNotes, setUserNotes] = useState([]);
//   const [originalUserNotes, setOriginalUserNotes] = useState([]);

//   useEffect(() => {
//     const loadBOM = async () => {
//       try {
//         setLoading(true);
//         let data;
//         let bomId = location.state?.bomId;

//         if (bomId) {
//           data = await bomAPI.getBOMById(bomId);
//           setChangeLog(data.changeLog || []);
//         } else if (location.state?.bomData) {
//           data = { bomData: location.state.bomData };
//         } else {
//           console.warn('No BOM data or ID provided, redirecting to home');
//           navigate('/');
//           return;
//         }

//         if (data && data.bomData) {
//           if (data.bomData.bomItems) {
//             data.bomData.bomItems = ensureStableIds(data.bomData.bomItems);
//           }

//           if (data.bomData.profilesMap) {
//             const profilesList = Object.values(data.bomData.profilesMap);
//             setProfiles(profilesList);
//           }

//           const pendingChanges = changeTracker.getChanges();
//           const pendingAdditions = changeTracker.getAdditions();
//           const pendingDeletions = changeTracker.getDeletions();

//           if (pendingChanges.length > 0 || pendingAdditions.length > 0 || pendingDeletions.length > 0) {
//             console.log('Applying pending changes from last session...');
//             setEditMode(true); // Re-enter edit mode if changes were pending

//             let items = [...data.bomData.bomItems];

//             // 1. Apply deletions
//             const deletedIds = new Set(pendingDeletions.map(d => d.rowId));
//             items = items.filter(item => !deletedIds.has(item._id));

//             // 2. Apply additions
//             items = [...items, ...pendingAdditions];

//             // 3. Renumber SNs after structural changes
//             items = items.map((item, index) => ({ ...item, sn: index + 1 }));

//             // 4. Apply field-level edits
//             items = items.map(item => {
//               let updatedItem = { ...item };
//               for (const change of pendingChanges) {
//                 const [itemId, field] = change.id.split('-');
//                 if (item._id === itemId) {
//                   if (field === 'manual' && change.type === 'EDIT_SPARE_QUANTITY') {
//                     updatedItem.spareQuantity = change.newValue;
//                     if (!updatedItem.userEdits) updatedItem.userEdits = {};
//                     updatedItem.userEdits.manualSpareQuantity = change.newValue;
//                   } else if (change.type === 'EDIT_QUANTITY') {
//                     if (!updatedItem.quantities) updatedItem.quantities = {};
//                     updatedItem.quantities[change.tabName] = change.newValue;
//                   } else if (change.type === 'CHANGE_ALUMINUM_RATE') {
//                     setAluminumRate(change.newValue);
//                   } else if (change.type === 'CHANGE_SPARE_PERCENTAGE') {
//                     setSparePercentage(change.newValue);
//                   } else if (change.type === 'CHANGE_MODULE_WP') {
//                     setModuleWp(change.newValue);
//                   } else if (change.type === 'EDIT_PROFILE') {
//                     const selectedProfile = profiles.find(p => p.serialNumber === change.newValue);
//                     if (selectedProfile) {
//                       updatedItem.profileSerialNumber = change.newValue;
//                       updatedItem.sunrackCode = selectedProfile.preferredRmCode || selectedProfile.sunrackCode;
//                       updatedItem.profileImage = selectedProfile.profileImagePath;
//                       updatedItem.itemDescription = selectedProfile.genericName;
//                       updatedItem.material = selectedProfile.material;
//                       const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
//                       updatedItem.wtPerRm = weightCost.wtPerRm;
//                       updatedItem.rm = weightCost.rm;
//                       updatedItem.wt = weightCost.wt;
//                       updatedItem.cost = weightCost.cost;
//                     }
//                   }
//                 }
//               }
//               return updatedItem;
//             });

//             data.bomData.bomItems = items;
//           }

//           setBomData(data.bomData);

//           if (data.bomData.aluminumRate) {
//             setAluminumRate(data.bomData.aluminumRate);
//           }
//           if (typeof data.bomData.sparePercentage === 'number') {
//             setSparePercentage(data.bomData.sparePercentage);
//           }
//           if (typeof data.bomData.moduleWp === 'number') {
//             setModuleWp(data.bomData.moduleWp);
//           }
//           if (data.bomData.userNotes && Array.isArray(data.bomData.userNotes)) {
//             setUserNotes(data.bomData.userNotes);
//           }

//           if (data.bomData.bomItems && data.bomData.bomItems.length > 0) {
//             setAddAfterRow(data.bomData.bomItems.length);
//           }
//         } else {
//           console.error('BOM data is missing or invalid.', data);
//           navigate('/');
//         }
//       } catch (error) {
//         console.error('Failed to load BOM data:', error);
//         alert('Failed to load BOM. It may have been deleted or an error occurred.');
//         navigate('/');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadBOM();
//   }, [location.state, navigate]);

//   useEffect(() => {
//     if (!bomData || loading) return;

//     const updatedBomData = { ...bomData };
//     updatedBomData.bomItems = bomData.bomItems.map(item => {
//       const profile = bomData.profilesMap[item.profileSerialNumber];
//       if (profile) {
//         const weightCost = calculateWeightAndCost(item, profile, aluminumRate);
//         return { ...item, ...weightCost };
//       }
//       return item;
//     });

//     setBomData(updatedBomData);
//   }, [aluminumRate, loading]);

//   useEffect(() => {
//     if (!bomData || loading) return;

//     const updatedBomData = { ...bomData };
//     updatedBomData.bomItems = bomData.bomItems.map(item => {
//       const totalQty = item.totalQuantity;
//       const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
//       const finalTotal = totalQty + spareQty;

//       const updatedItem = {
//         ...item,
//         spareQuantity: spareQty,
//         finalTotal: finalTotal
//       };

//       const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
//       if (profile) {
//         const weightCost = calculateWeightAndCost(updatedItem, profile, aluminumRate);
//         return { ...updatedItem, ...weightCost };
//       }

//       return updatedItem;
//     });

//     setBomData(updatedBomData);
//   }, [sparePercentage]);

//   const handleBack = () => {
//     navigate('/');
//   };

//   const calculateWeightAndCost = (item, profile, aluRate) => {
//     const result = {
//       wtPerRm: null,
//       rm: null,
//       wt: null,
//       cost: null,
//       costPerPiece: null
//     };

//     const finalTotal = parseFloat(item.finalTotal) || 0;

//     if (item.userEdits?.userProvidedCostPerPiece !== undefined && item.userEdits?.userProvidedCostPerPiece !== null) {
//       result.costPerPiece = parseFloat(item.userEdits.userProvidedCostPerPiece) || 0;
//       result.cost = result.costPerPiece * finalTotal;
//       return result;
//     }

//     const profileCostPerPiece = parseFloat(profile?.costPerPiece) || 0;
//     if (profileCostPerPiece > 0) {
//       result.costPerPiece = profileCostPerPiece;
//       result.cost = result.costPerPiece * finalTotal;
//       return result;
//     }

//     const lengthToUse = parseFloat(item.length || item.userEdits?.userProvidedStandardLength || profile?.standardLength) || 0;
//     const designWeight = parseFloat(profile?.designWeight) || 0;
//     const rate = parseFloat(item.userEdits?.manualAluminumRate ?? aluRate) || 0;

//     if (designWeight > 0 && lengthToUse > 0) {
//       result.wtPerRm = designWeight;
//       result.rm = (lengthToUse / 1000) * finalTotal;
//       result.wt = result.rm * result.wtPerRm;
//       result.cost = result.wt * rate;
//     }

//     // Safeguard against NaN
//     if (isNaN(result.cost)) {
//       result.cost = 0;
//     }
//     if (isNaN(result.costPerPiece)) {
//       result.costPerPiece = 0;
//     }

//     return result;
//   };

//   // Format numbers in Indian style (lakhs, crores)
//   const formatIndianNumber = (value, decimals = 2) => {
//     if (value === null || value === undefined) return '0';
//     if (typeof value !== 'number') return '0';

//     const fixedValue = value.toFixed(decimals);
//     const [integerPart, decimalPart] = fixedValue.split('.');

//     // Indian numbering: first comma after 3 digits, then every 2 digits
//     let lastThree = integerPart.slice(-3);
//     let otherNumbers = integerPart.slice(0, -3);

//     if (otherNumbers !== '') {
//       lastThree = ',' + lastThree;
//     }

//     let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

//     return decimalPart ? `${formatted}.${decimalPart}` : formatted;
//   };

//   const handleProfileChange = (profileSerialNumber, itemToUpdate) => {
//     if (!itemToUpdate || !profileSerialNumber) return;

//     const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
//     if (!selectedProfile) return;

//     const originalProfile = profiles.find(p => p.serialNumber === itemToUpdate.profileSerialNumber);

//     changeTracker.trackChange({
//       id: `${itemToUpdate._id}-profile`,
//       type: 'EDIT_PROFILE',
//       oldValue: itemToUpdate.profileSerialNumber,
//       newValue: profileSerialNumber,
//       itemName: itemToUpdate.itemDescription,
//       rowNumber: itemToUpdate.sn,
//       oldProfileName: originalProfile?.genericName,
//       newProfileName: selectedProfile.genericName,
//     });

//     const updatedBomData = { ...bomData };

//     if (itemToUpdate.calculationType === 'CUT_LENGTH') {
//       updatedBomData.bomItems = bomData.bomItems.map(item => {
//         if (item.calculationType === 'CUT_LENGTH') {
//           const updatedItem = {
//             ...item,
//             sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
//             profileImage: selectedProfile.profileImagePath,
//             itemDescription: selectedProfile.genericName,
//             material: selectedProfile.material,
//             profileSerialNumber: profileSerialNumber
//           };

//           const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
//           updatedItem.wtPerRm = weightCost.wtPerRm;
//           updatedItem.rm = weightCost.rm;
//           updatedItem.wt = weightCost.wt;
//           updatedItem.cost = weightCost.cost;

//           return updatedItem;
//         }
//         return item;
//       });
//     } else if (itemToUpdate.calculationType === 'ACCESSORY') {
//       updatedBomData.bomItems = bomData.bomItems.map(item => {
//         if (item.sn === itemToUpdate.sn) {
//           const updatedItem = {
//             ...item,
//             sunrackCode: selectedProfile.preferredRmCode || selectedProfile.sunrackCode,
//             profileImage: selectedProfile.profileImagePath,
//             itemDescription: selectedProfile.genericName,
//             material: selectedProfile.material,
//             profileSerialNumber: profileSerialNumber
//           };

//           const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
//           updatedItem.wtPerRm = weightCost.wtPerRm;
//           updatedItem.rm = weightCost.rm;
//           updatedItem.wt = weightCost.wt;
//           updatedItem.cost = weightCost.cost;

//           return updatedItem;
//         }
//         return item;
//       });
//     }

//     setBomData(updatedBomData);
//   };

//   const handleItemUpdate = (itemSn, field, value) => {
//     const originalItem = bomData.bomItems.find(item => item.sn === itemSn);
//     if (!originalItem) return;

//     let oldValue; // Variable to store the original value for tracking

//     const newBomItems = bomData.bomItems.map(item => {
//       if (item.sn === itemSn) {
//         let updatedItem = { ...item };

//         if (!updatedItem.userEdits) {
//           updatedItem.userEdits = {};
//         }

//         if (field.startsWith('quantity_')) {
//           const tabName = field.split('_')[1];
//           oldValue = originalItem.quantities[tabName] || 0;
//           updatedItem.quantities = { ...updatedItem.quantities, [tabName]: Number(value) || 0 };

//           changeTracker.trackChange({
//             id: `${item._id}-${tabName}`,
//             type: 'EDIT_QUANTITY',
//             oldValue: oldValue,
//             newValue: updatedItem.quantities[tabName],
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: tabName,
//           });

//         } else if (field === 'spareQuantity') {
//           oldValue = originalItem.userEdits?.manualSpareQuantity ?? 'Auto';
//           const manualSpare = Number(value) || 0;
//           updatedItem.spareQuantity = manualSpare;
//           updatedItem.userEdits = { ...updatedItem.userEdits, manualSpareQuantity: manualSpare };

//           changeTracker.trackChange({
//             id: `${item._id}-manual-spare`,
//             type: 'EDIT_SPARE_QUANTITY',
//             oldValue: oldValue,
//             newValue: manualSpare,
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: null,
//           });

//         } else if (field === 'costPerPiece') {
//           oldValue = originalItem.userEdits?.userProvidedCostPerPiece ?? originalItem.costPerPiece ?? 0;
//           const newRate = parseFloat(value) || 0;
//           updatedItem.costPerPiece = newRate;
//           updatedItem.userEdits = {
//             ...updatedItem.userEdits,
//             userProvidedCostPerPiece: newRate,
//             calculationMethod: 'cost_per_piece'
//           };

//           changeTracker.trackChange({
//             id: `${item._id}-cost-per-piece`,
//             type: 'EDIT_COST_PER_PIECE',
//             oldValue: oldValue,
//             newValue: newRate,
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: null,
//             profileSerialNumber: item.profileSerialNumber
//           });

//         } else if (field === 'manualAluminumRate') {
//           oldValue = originalItem.userEdits?.manualAluminumRate ?? aluminumRate;

//           const parsed = value === '' || value === null || value === undefined ? null : parseFloat(value);
//           const isValid = parsed !== null && !isNaN(parsed);
//           const isSameAsGlobal = isValid && Math.abs(parsed - aluminumRate) < 1e-9;
//           const useGlobal = !isValid || isSameAsGlobal;

//           if (useGlobal) {
//             const { manualAluminumRate: _manualAluminumRate, ...restEdits } = updatedItem.userEdits;
//             updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;
//           } else {
//             updatedItem.userEdits = { ...updatedItem.userEdits, manualAluminumRate: parsed };
//           }

//           changeTracker.trackChange({
//             id: `${item._id}-aluminum-rate`,
//             type: 'EDIT_ALUMINUM_RATE_OVERRIDE',
//             oldValue: oldValue,
//             newValue: useGlobal ? aluminumRate : parsed,
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: null,
//           });

//         } else if (field === 'resetSpare') {
//           oldValue = originalItem.userEdits?.manualSpareQuantity ?? 'Auto';
//           const { manualSpareQuantity: _manualSpareQuantity, ...restEdits } = updatedItem.userEdits;
//           updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;

//           changeTracker.trackChange({
//             id: `${item._id}-manual-spare`,
//             type: 'EDIT_SPARE_QUANTITY',
//             oldValue: oldValue,
//             newValue: 'Auto',
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: null,
//           });
//         } else if (field === 'resetAluminumRate') {
//           oldValue = originalItem.userEdits?.manualAluminumRate ?? aluminumRate;
//           const { manualAluminumRate: _manualAluminumRate, ...restEdits } = updatedItem.userEdits;
//           updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;

//           changeTracker.trackChange({
//             id: `${item._id}-aluminum-rate`,
//             type: 'EDIT_ALUMINUM_RATE_OVERRIDE',
//             oldValue: oldValue,
//             newValue: aluminumRate,
//             itemName: item.itemDescription,
//             rowNumber: item.sn,
//             tabName: null,
//           });
//         }

//         const totalQty = Object.values(updatedItem.quantities).reduce((sum, q) => sum + q, 0);
//         updatedItem.totalQuantity = totalQty;

//         if (field.startsWith('quantity_') || field === 'resetSpare') {
//           if (updatedItem.userEdits?.manualSpareQuantity !== undefined) {
//             updatedItem.spareQuantity = updatedItem.userEdits.manualSpareQuantity;
//           } else {
//             updatedItem.spareQuantity = Math.ceil(totalQty * (sparePercentage / 100));
//           }
//         }

//         const finalTotal = totalQty + updatedItem.spareQuantity;
//         updatedItem.finalTotal = finalTotal;

//         const profile = bomData.profilesMap[updatedItem.profileSerialNumber];
//         if (profile) {
//           const profileForCalculation = { ...profile };
//           if (updatedItem.userEdits?.userProvidedCostPerPiece !== undefined) {
//             profileForCalculation.costPerPiece = updatedItem.userEdits.userProvidedCostPerPiece;
//           }

//           const weightCost = calculateWeightAndCost(updatedItem, profileForCalculation, aluminumRate);
//           updatedItem = { ...updatedItem, ...weightCost };
//         }

//         return updatedItem;
//       }
//       return item;
//     });

//     setBomData({ ...bomData, bomItems: newBomItems });
//   };


//   const handleAddRowClick = () => {
//     setShowAddModal(true);
//   };

//   const handleAddRowConfirm = (newItemData) => {
//     const profile = profiles.find(p => p.serialNumber === newItemData.profileSerialNumber);
//     if (!profile) {
//       alert('Profile not found');
//       return;
//     }

//     const maxRow = bomData.bomItems.length;
//     const insertAfter = Math.max(0, Math.min(addAfterRow, maxRow));

//     const totalQty = Object.values(newItemData.quantities).reduce((sum, qty) => sum + qty, 0);
//     const spareQty = Math.ceil(totalQty * (sparePercentage / 100));
//     const finalTotal = totalQty + spareQty;

//     let calculationType = 'ACCESSORY';
//     if (newItemData.customLength) {
//       calculationType = 'CUT_LENGTH';
//     }

//     const newItem = {
//       _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       sn: insertAfter + 1,
//       profileSerialNumber: newItemData.profileSerialNumber,
//       sunrackCode: profile.preferredRmCode || profile.sunrackCode,
//       profileImage: profile.profileImagePath,
//       itemDescription: profile.genericName,
//       material: profile.material,
//       length: newItemData.customLength || newItemData.standardLength,
//       uom: profile.uom,
//       calculationType: calculationType,
//       quantities: newItemData.quantities,
//       totalQuantity: totalQty,
//       spareQuantity: spareQty,
//       finalTotal: finalTotal,
//       userEdits: {
//         addedManually: true,
//         reason: newItemData.reason,
//         userProvidedStandardLength: newItemData.standardLength || null,
//         userProvidedCostPerPiece: newItemData.costPerPiece || null,
//         calculationMethod: newItemData.calculationMethod
//       }
//     };

//     const profileForCalculation = {
//       ...profile,
//       standardLength: newItemData.standardLength || profile.standardLength,
//       costPerPiece: newItemData.costPerPiece || profile.costPerPiece
//     };

//     if (newItemData.calculationMethod === 'cost_per_piece' && newItemData.costPerPiece) {
//       profileForCalculation.costPerPiece = parseFloat(newItemData.costPerPiece);
//     } else if (newItemData.calculationMethod === 'standard_length') {
//       profileForCalculation.costPerPiece = null;
//     }

//     const weightCost = calculateWeightAndCost(newItem, profileForCalculation, aluminumRate);
//     newItem.wtPerRm = weightCost.wtPerRm;
//     newItem.rm = weightCost.rm;
//     newItem.wt = weightCost.wt;
//     newItem.cost = weightCost.cost;
//     newItem.costPerPiece = weightCost.costPerPiece;

//     const updatedItems = [...bomData.bomItems];
//     updatedItems.splice(insertAfter, 0, newItem);

//     updatedItems.forEach((item, index) => {
//       item.sn = index + 1;
//     });

//     changeTracker.trackRowAddition(newItem);

//     setBomData({ ...bomData, bomItems: updatedItems });

//     setShowAddModal(false);

//     setAddAfterRow(updatedItems.length);
//   };

//   const handleDragEnd = (event) => {
//     const { active, over } = event;

//     if (over && active.id !== over.id) {
//       const oldIndex = bomData.bomItems.findIndex((item) => item._id === active.id);
//       const newIndex = bomData.bomItems.findIndex((item) => item._id === over.id);

//       const newItems = arrayMove(bomData.bomItems, oldIndex, newIndex);

//       const renumberedItems = newItems.map((item, index) => ({
//         ...item,
//         sn: index + 1
//       }));

//       const updatedBomData = { ...bomData, bomItems: renumberedItems };
//       setBomData(updatedBomData);

//       // Save directly without asking for reason or adding to changelog
//       saveWithExplicitData(updatedBomData, changeLog);
//     }
//   };


//   const handleDeleteRowClick = (item) => {
//     setItemToDelete(item);
//     setDeleteModalOpen(true);
//   };

//   const handleDeleteConfirm = (reason) => {
//     if (!itemToDelete) return;

//     changeTracker.trackRowDeletion({ rowId: itemToDelete._id, reason: reason });

//     const updatedItems = bomData.bomItems.filter(item => item.sn !== itemToDelete.sn);

//     updatedItems.forEach((item, index) => {
//       item.sn = index + 1;
//     });

//     setBomData({ ...bomData, bomItems: updatedItems });

//     setDeleteModalOpen(false);
//     setItemToDelete(null);

//     if (addAfterRow > updatedItems.length) {
//       setAddAfterRow(updatedItems.length);
//     }
//   };

//   const handleSaveChanges = async () => {
//     const bomId = location.state?.bomId;
//     if (!bomId) {
//       alert('Cannot save changes: BOM ID is missing.');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const dataToSave = {
//         projectInfo: bomData.projectInfo,
//         tabs: bomData.tabs,
//         panelCounts: bomData.panelCounts,
//         bomItems: bomData.bomItems,
//         aluminumRate: aluminumRate,
//         sparePercentage: sparePercentage,
//         userNotes: userNotes,
//       };

//       await bomAPI.updateBOM(bomId, dataToSave, changeLog);

//       const freshData = await bomAPI.getBOMById(bomId);

//       if (freshData && freshData.bomData) {
//         setBomData(freshData.bomData);
//         setChangeLog(freshData.changeLog || []);

//         if (freshData.bomData.profilesMap) {
//           const profilesList = Object.values(freshData.bomData.profilesMap);
//           setProfiles(profilesList);
//         }

//         if (freshData.bomData.aluminumRate) {
//           setAluminumRate(freshData.bomData.aluminumRate);
//         }

//         if (freshData.bomData.userNotes && Array.isArray(freshData.bomData.userNotes)) {
//           setUserNotes(freshData.bomData.userNotes);
//         }
//       }

//       alert('Changes saved successfully!');
//     } catch (error) {
//       console.error('Failed to save changes:', error);
//       alert(`Failed to save changes: ${error.message}`);
//     } finally {
//       setIsSaving(false);
//       changeTracker.stopTracking(); // Stop tracking on successful save
//     }
//   };

//   const handleDiscardChanges = async () => {
//     if (window.confirm('Are you sure you want to discard all unsaved changes? This will reload the BOM data.')) {
//       changeTracker.stopTracking(); // Clear any tracked changes
//       setUserNotes([...originalUserNotes]); // Restore original notes
//       setEditMode(false);
//       // Reload the entire component to fetch fresh data
//       window.location.reload();
//     }
//   };

//   const handleToggleEditMode = () => {
//     if (editMode) {
//       handleDoneEditing();
//     } else {
//       setOriginalBomData(bomData); // Save a snapshot of the original data
//       setOriginalUserNotes([...userNotes]); // Save original notes
//       changeTracker.startTracking(); // Start tracking changes
//       setEditMode(true);
//     }
//   };

//   const handleDoneEditing = async () => {
//     const changes = changeTracker.getChanges();
//     const additions = changeTracker.getAdditions();
//     const deletions = changeTracker.getDeletions();

//     // Check if notes have changed
//     const notesChanged = JSON.stringify(userNotes) !== JSON.stringify(originalUserNotes);

//     const hasBomChanges = changes.length > 0 || additions.length > 0 || deletions.length > 0;

//     if (hasBomChanges) {
//       // BOM changes exist - show review modal
//       setReviewModalOpen(true);
//     } else if (notesChanged) {
//       // Only notes changed - save directly without review modal
//       await saveWithExplicitData(bomData, changeLog);
//       setEditMode(false);
//       setOriginalUserNotes([...userNotes]);
//       changeTracker.stopTracking();
//     } else {
//       // No changes detected, just exit edit mode without saving
//       setEditMode(false);
//       changeTracker.stopTracking();
//     }
//   };

//   const handleReviewConfirm = async (changesWithReasons) => {
//     const masterUpdates = changesWithReasons.filter(c => c.updateMaster && c.profileSerialNumber);

//     if (masterUpdates.length > 0) {
//       try {
//         await Promise.all(masterUpdates.map(update => {
//           return bomAPI.updateMasterItem(update.profileSerialNumber, { costPerPiece: update.newValue });
//         }));
//         console.log('Updated master items:', masterUpdates.length);
//       } catch (error) {
//         console.error('Failed to update master items:', error);
//         alert('Warning: Failed to update Master Database. Project-specific changes will still be saved.');
//       }
//     }

//     const newLogEntries = changesWithReasons.map(change => {
//       const logEntry = {
//         type: change.type,
//         itemName: change.itemName,
//         rowNumber: change.rowNumber,
//         tabName: change.tabName,
//         oldValue: change.oldValue,
//         newValue: change.newValue,
//         reason: change.reason,
//         timestamp: new Date().toISOString()
//       };

//       if (change.type === 'EDIT_PROFILE') {
//         logEntry.oldProfileName = change.oldProfileName;
//         logEntry.newProfileName = change.newProfileName;
//       }

//       return logEntry;
//     });

//     const updatedChangeLog = [...changeLog, ...newLogEntries];
//     setChangeLog(updatedChangeLog);

//     await saveWithExplicitData(bomData, updatedChangeLog);

//     setReviewModalOpen(false);
//     setEditMode(false);
//     setOriginalUserNotes([...userNotes]); // Update original notes after save
//     changeTracker.stopTracking();
//   };

//   const exportToPDF = async (settings) => {
//     try {
//       setIsSaving(true);

//       const payload = {
//         bomData,
//         printSettings: settings,
//         aluminumRate,
//         sparePercentage,
//         moduleWp,
//         changeLog,
//         userNotes
//       };

//       // Create a form and submit it to bypass IDM/CORS issues
//       const form = document.createElement('form');
//       form.method = 'POST';
//       form.action = `${API_URL}/api/bom/export-pdf`;
//       form.target = '_blank'; // Open in new tab

//       // Create hidden input with JSON payload
//       const input = document.createElement('input');
//       input.type = 'hidden';
//       input.name = 'jsonPayload';
//       input.value = JSON.stringify(payload);

//       form.appendChild(input);
//       document.body.appendChild(form);
//       form.submit();
//       document.body.removeChild(form);

//       // Show success message after a short delay
//       setTimeout(() => {
//         alert('PDF export initiated! Check your browser downloads or new tab.');
//       }, 500);

//     } catch (error) {
//       console.error('Export PDF Failed:', error);
//       alert('Failed to generate PDF. Please try again.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handlePrintSettings = (settings, action) => {
//     if (action === 'preview') {
//       // Navigate to print preview page with data
//       navigate('/bom/print-preview', {
//         state: {
//           bomData,
//           printSettings: settings,
//           aluminumRate,
//           sparePercentage,
//           moduleWp,
//           changeLog,
//           userNotes
//         }
//       });
//     } else if (action === 'direct') {
//       // Navigate to print preview and auto-print
//       navigate('/bom/print-preview', {
//         state: {
//           bomData,
//           printSettings: settings,
//           aluminumRate,
//           sparePercentage,
//           moduleWp,
//           changeLog,
//           userNotes,
//           autoPrint: true
//         }
//       });
//     } else if (action === 'pdf') {
//       // Call export API
//       exportToPDF(settings);
//     }
//     setPrintSettingsModalOpen(false);
//   };

//   const handleNotesChange = (updatedNotes) => {
//     setUserNotes(updatedNotes);
//   };

//   const handleResetGlobalParameters = () => {
//     if (window.confirm('⚠️ Are you sure you want to reset Aluminum Rate, Spare %, and Module Wp to default values? This action cannot be undone.')) {
//       const defaultAluminumRate = 527.85;
//       const defaultSparePercentage = 1;
//       const defaultModuleWp = 710;

//       // Track changes for all three parameters
//       changeTracker.trackChange({
//         id: 'global-aluminum-rate',
//         type: 'CHANGE_ALUMINUM_RATE',
//         oldValue: aluminumRate,
//         newValue: defaultAluminumRate,
//         itemName: 'Global Settings',
//       });

//       changeTracker.trackChange({
//         id: 'global-spare-pct',
//         type: 'CHANGE_SPARE_PERCENTAGE',
//         oldValue: sparePercentage,
//         newValue: defaultSparePercentage,
//         itemName: 'Global Settings',
//       });

//       changeTracker.trackChange({
//         id: 'global-module-wp',
//         type: 'CHANGE_MODULE_WP',
//         oldValue: moduleWp,
//         newValue: defaultModuleWp,
//         itemName: 'Global Settings',
//       });

//       setAluminumRate(defaultAluminumRate);
//       setSparePercentage(defaultSparePercentage);
//       setModuleWp(defaultModuleWp);
//     }
//   };

//   const saveWithExplicitData = async (currentBomData, currentChangeLog) => {
//     const bomId = location.state?.bomId;
//     if (!bomId) return;

//     setIsSaving(true);
//     try {
//       const dataToSave = {
//         projectInfo: currentBomData.projectInfo,
//         tabs: currentBomData.tabs,
//         panelCounts: currentBomData.panelCounts,
//         bomItems: currentBomData.bomItems,
//         aluminumRate: aluminumRate,
//         sparePercentage: sparePercentage,
//         moduleWp: moduleWp,
//         userNotes: userNotes,
//       };

//       await bomAPI.updateBOM(bomId, dataToSave, currentChangeLog);

//       const freshData = await bomAPI.getBOMById(bomId);
//       if (freshData && freshData.bomData) {
//         if (freshData.bomData.bomItems) {
//           freshData.bomData.bomItems = ensureStableIds(freshData.bomData.bomItems);
//         }
//         setBomData(freshData.bomData);
//         setChangeLog(freshData.changeLog || []);
//         if (freshData.bomData.profilesMap) {
//           setProfiles(Object.values(freshData.bomData.profilesMap));
//         }
//         if (freshData.bomData.aluminumRate) {
//           setAluminumRate(freshData.bomData.aluminumRate);
//         }
//         if (freshData.bomData.userNotes && Array.isArray(freshData.bomData.userNotes)) {
//           setUserNotes(freshData.bomData.userNotes);
//         }
//       }
//       alert('Changes saved successfully!');
//     } catch (error) {
//       console.error('Failed to save changes:', error);
//       alert(`Failed to save changes: ${error.message}`);
//     } finally {
//       setIsSaving(false);
//       changeTracker.stopTracking(); // Stop tracking on successful save
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading BOM...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!bomData) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-xl font-bold text-red-600">Error</h2>
//           <p className="text-gray-600">Could not load BOM data. It might have been deleted or is invalid.</p>
//           <button onClick={handleBack} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const profileOptions = profiles.map(profile => ({
//     value: profile.serialNumber,
//     label: `${profile.genericName} (${profile.preferredRmCode || profile.sunrackCode || 'No Code'})`
//   }));

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <header className="bg-white border-b shadow-sm sticky top-0 z-10">
//         <div className="px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={handleBack}
//               disabled={editMode}
//               className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${editMode
//                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                   : 'hover:bg-gray-100 text-gray-700'
//                 }`}
//               title={editMode ? "Exit edit mode to go back" : "Back to main page"}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               <span className="font-medium">Back</span>
//             </button>
//             <div className="h-8 w-px bg-gray-300"></div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900">Bill of Materials (BOM)</h1>
//               <p className="text-sm text-gray-600">{bomData.projectInfo.projectName}</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-3">
//             {editMode && (
//               <button
//                 onClick={handleDiscardChanges}
//                 disabled={isSaving}
//                 className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
//                 title="Discard all unsaved changes"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
//                 </svg>
//                 Discard
//               </button>
//             )}

//             <button
//               onClick={handleToggleEditMode}
//               disabled={isSaving}
//               className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${editMode
//                 ? 'bg-purple-600 text-white border-purple-600'
//                 : 'text-gray-700 border-gray-300 hover:bg-gray-50'
//                 } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {isSaving ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
//                   </svg>
//                   {editMode ? 'Done Editing' : 'Enable Edit'}
//                 </>
//               )}
//             </button>

//             <button
//               className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
//               onClick={() => setPrintSettingsModalOpen(true)}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               Print
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-6 py-6">
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-lg font-semibold">{bomData.projectInfo.projectName}</h2>
//                 <p className="text-sm text-purple-100">
//                   {bomData.projectInfo.totalTabs} Building{bomData.projectInfo.totalTabs > 1 ? 's' : ''} | {bomData.bomItems.length} Items
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="text-sm text-purple-100">Generated</p>
//                 <p className="text-sm font-medium">
//                   {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-6">
//                 <div className="flex items-center gap-3">
//                   <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
//                     Aluminum Rate (₹/kg):
//                   </label>
//                 <input
//                   type="number"
//                   value={aluminumRate}
//                   onChange={(e) => {
//                     const newValue = parseFloat(e.target.value) || 0;
//                     changeTracker.trackChange({
//                       id: 'global-aluminum-rate',
//                       type: 'CHANGE_ALUMINUM_RATE',
//                       oldValue: aluminumRate,
//                       newValue: newValue,
//                       itemName: 'Global Settings',
//                     });
//                     setAluminumRate(newValue);
//                   }}
//                   step="0.01"
//                   min="0"
//                   disabled={!editMode}
//                   className={`w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${!editMode ? 'bg-gray-100 cursor-not-allowed' : ''
//                     }`}
//                 />
//               </div>

//               <div className="flex items-center gap-3">
//                 <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
//                   Spare %:
//                 </label>
//                 <input
//                   type="number"
//                   value={sparePercentage}
//                   onChange={(e) => {
//                     const newValue = parseFloat(e.target.value) || 0;
//                     changeTracker.trackChange({
//                       id: `global-spare-pct`,
//                       type: 'CHANGE_SPARE_PERCENTAGE',
//                       oldValue: sparePercentage,
//                       newValue: newValue,
//                       itemName: 'Global Settings',
//                     });
//                     setSparePercentage(newValue);
//                   }}
//                   step="0.1"
//                   min="0"
//                   disabled={!editMode}
//                   className={`w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${!editMode ? 'bg-gray-100 cursor-not-allowed' : ''
//                     }`}
//                 />
//               </div>

//               <div className="flex items-center gap-3">
//                 <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
//                   Module Wp:
//                 </label>
//                 <input
//                   type="number"
//                   value={moduleWp}
//                   onChange={(e) => {
//                     const newValue = parseFloat(e.target.value) || 0;
//                     changeTracker.trackChange({
//                       id: `global-module-wp`,
//                       type: 'CHANGE_MODULE_WP',
//                       oldValue: moduleWp,
//                       newValue: newValue,
//                       itemName: 'Global Settings',
//                     });
//                     setModuleWp(newValue);
//                   }}
//                   step="1"
//                   min="0"
//                   disabled={!editMode}
//                   className={`w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${!editMode ? 'bg-gray-100 cursor-not-allowed' : ''
//                     }`}
//                 />
//               </div>

//               {editMode && (
//                 <>
//                   <div className="h-8 w-px bg-gray-300"></div>
//                   <button
//                     onClick={handleResetGlobalParameters}
//                     className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                     title="Reset to default values (Al Rate: 527.85, Spare %: 1, Module Wp: 710)"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
//                     </svg>
//                   </button>

//                   <div className="h-8 w-px bg-gray-300"></div>

//                   <div className="flex items-center gap-3">
//                     <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
//                       Add After:
//                     </label>
//                     <input
//                       type="number"
//                       value={addAfterRow}
//                       onChange={(e) => setAddAfterRow(parseInt(e.target.value) || 1)}
//                       min="0"
//                       max={bomData.bomItems.length}
//                       className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                     />
//                   </div>

//                   <button
//                     onClick={handleAddRowClick}
//                     className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-semibold"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
//                     </svg>
//                     Add Row
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//           </div>

//           <BOMTable
//             bomData={bomData}
//             editMode={editMode}
//             onProfileChange={handleProfileChange}
//             profileOptions={profileOptions}
//             onItemUpdate={handleItemUpdate}
//             aluminumRate={aluminumRate}
//             sparePercentage={sparePercentage}
//             onDeleteRow={handleDeleteRowClick}
//             onDragEnd={handleDragEnd}
//           />

//           <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
//             <div className="grid grid-cols-3 gap-4">

//               <div className="p-4 bg-white rounded-lg shadow">
//                 <p className="text-sm font-semibold text-gray-600">Total Capacity</p>
//                 <p className="text-2xl font-bold text-gray-800">
//                   {((Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp) / 1000).toFixed(2)} kWp
//                 </p>
//               </div>
//               <div className="p-4 bg-white rounded-lg shadow">
//                 <p className="text-sm font-semibold text-gray-600">Cost/Wp</p>
//                 <p className="text-2xl font-bold text-gray-800">
//                   ₹{formatIndianNumber(
//                     bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0) /
//                     (Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp),
//                     2
//                   )}
//                 </p>
//               </div>
//               <div className="p-4 bg-white rounded-lg shadow">
//                 <p className="text-sm font-semibold text-gray-600">Total Cost</p>
//                 <p className="text-2xl font-bold text-gray-800">
//                   ₹{formatIndianNumber(bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0), 2)}
//                 </p>
//               </div>
//             </div>

//             {/* Notes Section */}
//             <NotesSection
//               userNotes={userNotes}
//               onNotesChange={handleNotesChange}
//               editMode={editMode}
//             />
//           </div>

//           <div className="px-6 pb-6">
//             <ChangeLogDisplay changeLog={changeLog} />
//           </div>
//         </div>
//       </main>

//       <AddRowModal
//         isOpen={showAddModal}
//         afterRowNumber={addAfterRow}
//         profiles={profiles}
//         tabs={bomData.tabs}
//         onClose={() => setShowAddModal(false)}
//         onAdd={handleAddRowConfirm}
//       />

//       <DeleteRowModal
//         isOpen={deleteModalOpen}
//         itemDescription={itemToDelete?.itemDescription}
//         onClose={() => setDeleteModalOpen(false)}
//         onConfirm={handleDeleteConfirm}
//       />

//       <ReviewChangesModal
//         isOpen={reviewModalOpen}
//         changes={{
//           updates: changeTracker.getChanges(),
//           additions: changeTracker.getAdditions(),
//           deletions: changeTracker.getDeletions(),
//         }}
//         bomData={bomData}
//         originalBomData={originalBomData}
//         onCancel={() => setReviewModalOpen(false)}
//         onConfirm={handleReviewConfirm}
//       />

//       <PrintSettingsModal
//         isOpen={printSettingsModalOpen}
//         onClose={() => setPrintSettingsModalOpen(false)}
//         onPrint={handlePrintSettings}
//         bomData={bomData}
//         aluminumRate={aluminumRate}
//         sparePercentage={sparePercentage}
//         moduleWp={moduleWp}
//         changeLog={changeLog}
//       />
//     </div>
//   );
// }











import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BOMTable from './BOMTable';
import ComboBox from '../ComboBox';
import AddRowModal from './AddRowModal';
import DeleteRowModal from './DeleteRowModal';
import ReviewChangesModal from './ReviewChangesModal';
import ReasonModal from './ReasonModal';
import ChangeLogDisplay from './ChangeLogDisplay';
import PrintSettingsModal from './PrintSettingsModal';
import NotesSection from './NotesSection';
import { API_URL } from '../../services/config';
import { bomAPI, savedBomAPI, defaultNotesAPI } from '../../services/api';
import { setCurrentProjectId } from '../../lib/tabStorageAPI';
import axios from 'axios';
import { arrayMove } from '@dnd-kit/sortable';
import * as changeTracker from '../../lib/changeTracker';
import { useAuth } from '../../context/AuthContext';
import {
  DEFAULT_ALUMINIUM_RATE_PER_KG,
  DEFAULT_MODULE_WP,
  DEFAULT_SPARE_PERCENTAGE
} from '../../constants/bomDefaults';

const ensureStableIds = (items) => {
  return items.map(item => ({
    ...item,
    _id: item._id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }));
};

export default function BOMPage() {
  const { user } = useAuth();
  const isBasicUser = user?.role === 'BASIC';
  const location = useLocation();
  const navigate = useNavigate();
  const [bomData, setBomData] = useState(null);
  const [originalBomData, setOriginalBomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [sparePercentage, setSparePercentage] = useState(DEFAULT_SPARE_PERCENTAGE);
  const [moduleWp, setModuleWp] = useState(DEFAULT_MODULE_WP);
  const [aluminumRate, setAluminumRate] = useState(DEFAULT_ALUMINIUM_RATE_PER_KG);
  const [changeLog, setChangeLog] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAfterRow, setAddAfterRow] = useState(1);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [printSettingsModalOpen, setPrintSettingsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [userNotes, setUserNotes] = useState([]);
  const [originalUserNotes, setOriginalUserNotes] = useState([]);
  const [defaultNotesChanges, setDefaultNotesChanges] = useState([]);

  // Saved BOM states
  const [hasSavedBom, setHasSavedBom] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const applyFreshBom = (freshData) => {
    if (!freshData?.bomData) return;

    const nextBomData = {
      ...freshData.bomData,
      bomItems: freshData.bomData.bomItems ? ensureStableIds(freshData.bomData.bomItems) : []
    };

    setBomData(nextBomData);
    setOriginalBomData(nextBomData);
    setChangeLog(freshData.changeLog || []);

    if (nextBomData.profilesMap) {
      setProfiles(Object.values(nextBomData.profilesMap));
    }

    if (typeof nextBomData.aluminumRate === 'number') setAluminumRate(nextBomData.aluminumRate);
    if (typeof nextBomData.sparePercentage === 'number') setSparePercentage(nextBomData.sparePercentage);
    if (typeof nextBomData.moduleWp === 'number') setModuleWp(nextBomData.moduleWp);

    // Always initialize userNotes - even if empty array
    const loadedNotes = Array.isArray(nextBomData.userNotes) ? nextBomData.userNotes : [];
    setUserNotes(loadedNotes);
    setOriginalUserNotes(loadedNotes);
    console.log('Loaded notes from backend:', loadedNotes); // Debug log

    if (nextBomData.bomItems?.length > 0) {
      setAddAfterRow(nextBomData.bomItems.length);
    }
  };

  const revertBomFromServer = async (bomId) => {
    try {
      const freshData = await bomAPI.getBOMById(bomId);
      applyFreshBom(freshData);
    } catch (e) {
      console.error('Failed to reload BOM from server:', e);
    }
  };

  useEffect(() => {
    const loadBOM = async () => {
      try {
        setLoading(true);
        let data;
        let bomId = location.state?.bomId;

        // If no bomId in state, check localStorage (for page refresh case)
        if (!bomId && !location.state?.bomData) {
          const lastBomId = localStorage.getItem('lastBomId');
          if (lastBomId) {
            bomId = parseInt(lastBomId);
          }
        }

        if (bomId) {
          data = await bomAPI.getBOMById(bomId);
          setChangeLog(data.changeLog || []);
          setProjectId(data.projectId); // Store projectId
          // Store in localStorage for refresh support
          localStorage.setItem('lastBomId', bomId);
        } else if (location.state?.bomData) {
          data = { bomData: location.state.bomData };
          // Store projectId from saved BOM
          if (location.state?.projectId) {
            setProjectId(location.state.projectId);
            setCurrentProjectId(location.state.projectId); // Also set global projectId
          }
          // Load saved changeLog and userNotes
          if (location.state?.changeLog) {
            setChangeLog(location.state.changeLog);
          }
          if (location.state?.userNotes) {
            setUserNotes(location.state.userNotes);
            setOriginalUserNotes(location.state.userNotes);
          }
        } else {
          console.warn('No BOM data or ID provided, redirecting to home');
          navigate('/');
          return;
        }

        if (data && data.bomData) {
          if (data.bomData.bomItems) {
            data.bomData.bomItems = ensureStableIds(data.bomData.bomItems);
          }

          if (data.bomData.profilesMap) {
            const profilesList = Object.values(data.bomData.profilesMap);
            setProfiles(profilesList);
          }

          const pendingChanges = changeTracker.getChanges();
          const pendingAdditions = changeTracker.getAdditions();
          const pendingDeletions = changeTracker.getDeletions();

          if (pendingChanges.length > 0 || pendingAdditions.length > 0 || pendingDeletions.length > 0) {
            console.log('Applying pending changes from last session...');
            setEditMode(true);

            let items = [...data.bomData.bomItems];

            const deletedIds = new Set(pendingDeletions.map(d => d.rowId));
            items = items.filter(item => !deletedIds.has(item._id));

            items = [...items, ...pendingAdditions];

            items = items.map((item, index) => ({ ...item, sn: index + 1 }));

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
                  } else if (change.type === 'CHANGE_MODULE_WP') {
                    setModuleWp(change.newValue);
                  } else if (change.type === 'EDIT_PROFILE') {
                    const selectedProfile = profiles.find(p => p.serialNumber === change.newValue);
                    if (selectedProfile) {
                      updatedItem.profileSerialNumber = change.newValue;
                      updatedItem.sunrackCode = selectedProfile.preferredRmCode || selectedProfile.sunrackCode;
                      updatedItem.profileImage = selectedProfile.sunrackProfile?.profileImage || selectedProfile.profileImagePath;
                      updatedItem.itemDescription = selectedProfile.genericName;
                      updatedItem.material = selectedProfile.material;
                      const weightCost = calculateWeightAndCost(updatedItem, selectedProfile, aluminumRate);
                      updatedItem.wtPerRm = weightCost.wtPerRm;
                      updatedItem.rm = weightCost.rm;
                      updatedItem.wt = weightCost.wt;
                      updatedItem.cost = weightCost.cost;
                    }
                  }
                }
              }
              return updatedItem;
            });

            data.bomData.bomItems = items;
          }

          setBomData(data.bomData);

          if (data.bomData.aluminumRate) {
            setAluminumRate(data.bomData.aluminumRate);
          }
          if (typeof data.bomData.sparePercentage === 'number') {
            setSparePercentage(data.bomData.sparePercentage);
          }
          if (typeof data.bomData.moduleWp === 'number') {
            setModuleWp(data.bomData.moduleWp);
          }

          // Load userNotes from backend
          if (data.bomData.userNotes && Array.isArray(data.bomData.userNotes)) {
            setUserNotes(data.bomData.userNotes);
            setOriginalUserNotes(data.bomData.userNotes);
            console.log('Initial load - userNotes from backend:', data.bomData.userNotes);
          } else {
            setUserNotes([]);
            setOriginalUserNotes([]);
            console.log('Initial load - no userNotes found, initializing empty array');
          }

          if (data.bomData.bomItems && data.bomData.bomItems.length > 0) {
            setAddAfterRow(data.bomData.bomItems.length);
          }
        } else {
          console.error('BOM data is missing or invalid.', data);
          navigate('/app');
        }
      } catch (error) {
        console.error('Failed to load BOM data:', error);
        showToast('Failed to load BOM. It may have been deleted or an error occurred.', 'error');
        navigate('/app');
      } finally {
        setLoading(false);
      }
    };

    loadBOM();
  }, [location.state, navigate]);

  // Check if saved BOM exists for this project and get creator info
  useEffect(() => {
    const checkSavedBom = async () => {
      if (!projectId || !bomData) return;

      try {
        const result = await savedBomAPI.checkSavedBomExists(projectId);
        setHasSavedBom(result.exists);

        // If saved BOM exists, fetch it to get creator info (only if not already set)
        if (result.exists && !bomData.projectInfo?.createdBy) {
          const savedBom = await savedBomAPI.getSavedBom(projectId);
          // Add creator info to bomData
          if (savedBom && savedBom.user) {
            setBomData(prev => ({
              ...prev,
              projectInfo: {
                ...prev.projectInfo,
                createdBy: savedBom.user.username,
                createdAt: savedBom.createdAt
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error checking saved BOM:', error);
        setHasSavedBom(false);
      }
    };

    checkSavedBom();
  }, [projectId, location.state?.savedBomId, bomData?.projectInfo?.projectName]);  // Re-check when returning from print or when BOM is saved

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
    navigate('/app');
  };

  const calculateWeightAndCost = (item, profile, aluRate) => {
    const result = {
      wtPerRm: null,
      rm: null,
      wt: null,
      cost: null,
      costPerPiece: null
    };

    const finalTotal = parseFloat(item.finalTotal) || 0;

    if (item.userEdits?.userProvidedCostPerPiece !== undefined && item.userEdits?.userProvidedCostPerPiece !== null) {
      result.costPerPiece = parseFloat(item.userEdits.userProvidedCostPerPiece) || 0;
      result.cost = result.costPerPiece * finalTotal;
      return result;
    }

    const profileCostPerPiece = parseFloat(profile?.costPerPiece) || 0;
    if (profileCostPerPiece > 0) {
      result.costPerPiece = profileCostPerPiece;
      result.cost = result.costPerPiece * finalTotal;
      return result;
    }

    const lengthToUse = parseFloat(item.length || item.userEdits?.userProvidedStandardLength || profile?.standardLength) || 0;
    const designWeight = parseFloat(profile?.designWeight) || 0;
    const rate = parseFloat(item.userEdits?.manualAluminumRate ?? aluRate) || 0;

    if (designWeight > 0 && lengthToUse > 0) {
      result.wtPerRm = designWeight;
      result.rm = (lengthToUse / 1000) * finalTotal;
      result.wt = result.rm * result.wtPerRm;
      result.cost = result.wt * rate;
    }

    if (isNaN(result.cost)) {
      result.cost = 0;
    }
    if (isNaN(result.costPerPiece)) {
      result.costPerPiece = 0;
    }

    return result;
  };

  const formatIndianNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0';
    if (typeof value !== 'number') return '0';

    const fixedValue = value.toFixed(decimals);
    const [integerPart, decimalPart] = fixedValue.split('.');

    let lastThree = integerPart.slice(-3);
    let otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return decimalPart ? `${formatted}.${decimalPart}` : formatted;
  };

  const handleProfileChange = (profileSerialNumber, itemToUpdate) => {
    if (!itemToUpdate || !profileSerialNumber) return;

    const selectedProfile = profiles.find(p => p.serialNumber === profileSerialNumber);
    if (!selectedProfile) return;

    const originalProfile = profiles.find(p => p.serialNumber === itemToUpdate.profileSerialNumber);

    changeTracker.trackChange({
      id: `${itemToUpdate._id}-profile`,
      type: 'EDIT_PROFILE',
      oldValue: itemToUpdate.profileSerialNumber,
      newValue: profileSerialNumber,
      itemName: itemToUpdate.itemDescription,
      rowNumber: itemToUpdate.sn,
      oldProfileName: originalProfile?.genericName,
      newProfileName: selectedProfile.genericName,
    });

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

    let oldValue;

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

        } else if (field === 'manualAluminumRate') {
          oldValue = originalItem.userEdits?.manualAluminumRate ?? aluminumRate;

          const parsed = value === '' || value === null || value === undefined ? null : parseFloat(value);
          const isValid = parsed !== null && !isNaN(parsed);
          const isSameAsGlobal = isValid && Math.abs(parsed - aluminumRate) < 1e-9;
          const useGlobal = !isValid || isSameAsGlobal;

          if (useGlobal) {
            const { manualAluminumRate: _manualAluminumRate, ...restEdits } = updatedItem.userEdits;
            updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;
          } else {
            updatedItem.userEdits = { ...updatedItem.userEdits, manualAluminumRate: parsed };
          }

          changeTracker.trackChange({
            id: `${item._id}-aluminum-rate`,
            type: 'EDIT_ALUMINUM_RATE_OVERRIDE',
            oldValue: oldValue,
            newValue: useGlobal ? aluminumRate : parsed,
            itemName: item.itemDescription,
            rowNumber: item.sn,
            tabName: null,
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
        } else if (field === 'resetAluminumRate') {
          oldValue = originalItem.userEdits?.manualAluminumRate ?? aluminumRate;
          const { manualAluminumRate: _manualAluminumRate, ...restEdits } = updatedItem.userEdits;
          updatedItem.userEdits = Object.keys(restEdits).length > 0 ? restEdits : null;

          changeTracker.trackChange({
            id: `${item._id}-aluminum-rate`,
            type: 'EDIT_ALUMINUM_RATE_OVERRIDE',
            oldValue: oldValue,
            newValue: aluminumRate,
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
      showToast('Profile not found', 'error');
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

      const updatedBomData = { ...bomData, bomItems: renumberedItems };
      setBomData(updatedBomData);

      saveWithExplicitData(updatedBomData, changeLog);
    }
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
      showToast('Cannot save changes: BOM ID is missing.', 'error');
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
        moduleWp: moduleWp,
      };

      await bomAPI.updateBOM(bomId, dataToSave, changeLog);

      const freshData = await bomAPI.getBOMById(bomId);

      if (freshData && freshData.bomData) {
        applyFreshBom(freshData);
      }

      showToast('Changes saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save changes:', error);

      if (error?.code === 'FORBIDDEN_FIELD') {
        showToast(`${error.field || 'Field'}: ${error.data?.message || error.message}`);
        await revertBomFromServer(bomId);
        changeTracker.stopTracking();
        setEditMode(false);
      } else if (error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        showToast('Password change required before continuing.');
        await revertBomFromServer(bomId);
        changeTracker.stopTracking();
        setEditMode(false);
      } else {
        showToast(`Failed to save changes: ${error.message}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = async () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes? This will reload the BOM data.')) {
      changeTracker.stopTracking();
      setUserNotes([...originalUserNotes]); // Restore original notes
      setEditMode(false);
      window.location.reload();
    }
  };

  const handleNotesChange = (updatedNotes) => {
    setUserNotes(updatedNotes);
  };

  const handleToggleEditMode = () => {
    if (editMode) {
      handleDoneEditing();
    } else {
      setOriginalBomData(bomData);
      setOriginalUserNotes([...userNotes]); // Save original notes
      changeTracker.startTracking();
      setEditMode(true);
    }
  };

  // Save BOM Snapshot
  const handleSaveBomSnapshot = async () => {
    if (!projectId) {
      showToast('Error: Project ID not found');
      return;
    }

    setIsSavingSnapshot(true);
    try {
      const customDefaultNotes = bomData.customDefaultNotes || null;
      await savedBomAPI.saveBomSnapshot(projectId, bomData, userNotes, changeLog, customDefaultNotes);
      setHasSavedBom(true);
      showToast('✅ BOM snapshot saved successfully!');
    } catch (error) {
      console.error('Error saving BOM snapshot:', error);
      showToast('❌ Failed to save BOM snapshot');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleDoneEditing = async () => {
    const changes = changeTracker.getChanges();
    const additions = changeTracker.getAdditions();
    const deletions = changeTracker.getDeletions();

    // Check if notes have changed
    const notesChanged = JSON.stringify(userNotes) !== JSON.stringify(originalUserNotes);

    // Check if default notes have changed
    const hasDefaultNotesChanges = defaultNotesChanges && defaultNotesChanges.length > 0;

    const hasBomChanges = changes.length > 0 || additions.length > 0 || deletions.length > 0;

    console.log('Done Editing - Notes changed:', notesChanged); // Debug log
    console.log('Current notes:', userNotes); // Debug log
    console.log('Original notes:', originalUserNotes); // Debug log
    console.log('BOM changes:', hasBomChanges); // Debug log
    console.log('Default notes changes:', hasDefaultNotesChanges, defaultNotesChanges); // Debug log

    if (hasBomChanges || hasDefaultNotesChanges) {
      // BOM changes OR default notes changes exist - show review modal
      setReviewModalOpen(true);
    } else if (notesChanged) {
      // Only user notes changed - save directly without review modal
      console.log('Saving user notes only...'); // Debug log
      await saveWithExplicitData(bomData, changeLog);
      setEditMode(false);
      setOriginalUserNotes([...userNotes]); // Update original notes after save
      changeTracker.stopTracking();
    } else {
      // No changes detected, just exit edit mode without saving
      console.log('No changes detected'); // Debug log
      setEditMode(false);
      changeTracker.stopTracking();
    }
  };

  const handleReviewConfirm = async (changesWithReasons, defaultNotesData = {}) => {
    const masterUpdates = changesWithReasons.filter(c => c.updateMaster && c.profileSerialNumber);

    if (masterUpdates.length > 0) {
      try {
        await Promise.all(masterUpdates.map(update => {
          return bomAPI.updateMasterItem(update.profileSerialNumber, { costPerPiece: update.newValue });
        }));
        console.log('Updated master items:', masterUpdates.length);
      } catch (error) {
        console.error('Failed to update master items:', error);
        if (error?.code === 'FORBIDDEN_FIELD') {
          showToast(`${error.field || 'Field'}: ${error.data?.message || error.message}`);
        } else {
          showToast('Warning: Failed to update Master Database. Project-specific changes will still be saved.', 'warning');
        }
      }
    }

    // Handle default notes changes
    const { defaultNotesChanges, defaultNotesUpdateChoice } = defaultNotesData;
    if (defaultNotesChanges && defaultNotesChanges.length > 0 && defaultNotesUpdateChoice) {
      if (defaultNotesUpdateChoice === 'global') {
        // Update global default notes
        try {
          // Separate changes by type
          const additions = defaultNotesChanges.filter(c => c.type === 'ADD');
          const edits = defaultNotesChanges.filter(c => c.type === 'EDIT');
          const deletions = defaultNotesChanges.filter(c => c.type === 'DELETE');

          // Sort deletions in descending order (highest noteOrder first)
          // This prevents renumbering issues when deleting multiple notes
          deletions.sort((a, b) => b.noteOrder - a.noteOrder);

          // Process deletions first (to avoid conflicts)
          for (const deletion of deletions) {
            await defaultNotesAPI.deleteNote(deletion.noteOrder);
            console.log('Deleted default note:', deletion.noteOrder);
          }

          // Process edits
          if (edits.length > 0) {
            const notesToUpdate = edits.map(change => ({
              noteOrder: change.noteOrder,
              noteText: change.newText
            }));
            await defaultNotesAPI.updateNotes(notesToUpdate);
            console.log('Updated global default notes:', notesToUpdate.length);
          }

          // Process additions
          for (const addition of additions) {
            await defaultNotesAPI.addNote(addition.newText);
            console.log('Added default note:', addition.newText);
          }

          showToast(`Default notes updated globally: ${additions.length} added, ${edits.length} edited, ${deletions.length} deleted`);

          // Reload notes from database to get correct noteOrders after add/delete
          if (window.reloadDefaultNotesFromDB) {
            await window.reloadDefaultNotesFromDB();
          }
          setDefaultNotesChanges([]);
        } catch (error) {
          console.error('Failed to update global default notes:', error);
          showToast('Warning: Failed to update global default notes. BOM-specific changes will still be saved.', 'warning');
        }
      }
      // If 'bom-only', custom default notes will be saved with the BOM snapshot (handled in saveBomSnapshot)
    }

    const newLogEntries = changesWithReasons.map(change => {
      const logEntry = {
        type: change.type,
        itemName: change.itemName,
        rowNumber: change.rowNumber,
        tabName: change.tabName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: change.reason,
        timestamp: new Date().toISOString()
      };

      if (change.type === 'EDIT_PROFILE') {
        logEntry.oldProfileName = change.oldProfileName;
        logEntry.newProfileName = change.newProfileName;
      }

      return logEntry;
    });

    const updatedChangeLog = [...changeLog, ...newLogEntries];
    setChangeLog(updatedChangeLog);

    // Store custom default notes if choice is 'bom-only'
    if (defaultNotesChanges && defaultNotesChanges.length > 0 && defaultNotesUpdateChoice === 'bom-only') {
      // Store the COMPLETE FINAL STATE of default notes for this BOM
      if (window.currentDefaultNotes) {
        bomData.customDefaultNotes = window.currentDefaultNotes;
      }
    }

    const result = await saveWithExplicitData(bomData, updatedChangeLog);
    if (result?.ok) {
      setReviewModalOpen(false);
      setEditMode(false);
      setOriginalUserNotes([...userNotes]); // Update original notes after save

      // Reset default notes baseline after save (only if bom-only, global already reset above)
      if (defaultNotesUpdateChoice !== 'global') {
        if (window.resetDefaultNotesBaseline) {
          window.resetDefaultNotesBaseline();
        }
        setDefaultNotesChanges([]);
      }

      changeTracker.stopTracking();
    }
  };

  const exportToPDF = async (settings) => {
    try {
      setIsSaving(true);

      const payload = {
        bomData,
        printSettings: settings,
        aluminumRate,
        sparePercentage,
        moduleWp,
        changeLog,
        userNotes
      };

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${API_URL}/api/bom/export-pdf`;
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'jsonPayload';
      input.value = JSON.stringify(payload);

      // Add auth token to form for backend middleware
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = localStorage.getItem('token');

      form.appendChild(input);
      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      setTimeout(() => {
        showToast('PDF export initiated! Check your browser downloads or new tab.', 'success');
      }, 500);

    } catch (error) {
      console.error('Export PDF Failed:', error);
      showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSettings = (settings, action) => {
    if (action === 'preview') {
      navigate('/bom/print-preview', {
        state: {
          bomData,
          printSettings: settings,
          projectId,  // Pass database projectId
          aluminumRate,
          sparePercentage,
          moduleWp,
          changeLog,
          userNotes,
          savedBomId: location.state?.savedBomId,
          printedBy: user?.username || 'Unknown'  // Current logged-in user
        }
      });
    } else if (action === 'direct') {
      navigate('/bom/print-preview', {
        state: {
          bomData,
          printSettings: settings,
          projectId,  // Pass database projectId
          aluminumRate,
          sparePercentage,
          moduleWp,
          changeLog,
          userNotes,
          savedBomId: location.state?.savedBomId,
          printedBy: user?.username || 'Unknown',  // Current logged-in user
          autoPrint: true
        }
      });
    } else if (action === 'pdf') {
      exportToPDF(settings);
    }
    setPrintSettingsModalOpen(false);
  };

  const saveWithExplicitData = async (currentBomData, currentChangeLog) => {
    let bomId = location.state?.bomId;

    // If no bomId (loaded from saved BOM), create a new BOM entry
    let isNewBomCreated = false;
    if (!bomId && projectId) {
      try {
        const newBom = await bomAPI.saveBOM(projectId, currentBomData);
        bomId = newBom.bomId;
        isNewBomCreated = true;
      } catch (error) {
        console.error('Failed to create BOM entry:', error);
        showToast('Failed to create BOM entry for saving changes.', 'error');
        return { ok: false };
      }
    }

    if (!bomId) return { ok: false };

    setIsSaving(true);
    try {
      const dataToSave = {
        projectInfo: currentBomData.projectInfo,
        tabs: currentBomData.tabs,
        panelCounts: currentBomData.panelCounts,
        bomItems: currentBomData.bomItems,
        aluminumRate: aluminumRate,
        sparePercentage: sparePercentage,
        moduleWp: moduleWp,
        userNotes: userNotes,
      };

      console.log('Saving userNotes to backend:', userNotes); // Debug log
      await bomAPI.updateBOM(bomId, dataToSave, currentChangeLog);

      // If we created a new BOM entry, update state with bomId without triggering re-render
      if (isNewBomCreated) {
        // Store bomId in localStorage as backup for page refresh
        localStorage.setItem('lastBomId', bomId);
        // Update history state silently without causing component re-render
        window.history.replaceState(
          { ...location.state, bomId: bomId },
          '',
          window.location.pathname
        );
      }

      showToast('Changes saved successfully!', 'success');
      return { ok: true, bomId: bomId };
    } catch (error) {
      console.error('Failed to save changes:', error);

      if (error?.code === 'FORBIDDEN_FIELD') {
        showToast(`${error.field || 'Field'}: ${error.data?.message || error.message}`);
        await revertBomFromServer(bomId);
        changeTracker.stopTracking();
        setReviewModalOpen(false);
        setEditMode(false);
      } else if (error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        showToast('Password change required before continuing.');
        await revertBomFromServer(bomId);
        changeTracker.stopTracking();
        setReviewModalOpen(false);
        setEditMode(false);
      } else {
        showToast(`Failed to save changes: ${error.message}`, 'error');
      }

      return { ok: false, code: error?.code, field: error?.field };
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-lg font-medium text-gray-700 mt-4">Loading BOM...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (!bomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading BOM</h2>
          <p className="text-gray-600 mb-6">Could not load BOM data. It might have been deleted or is invalid.</p>
          <button
            onClick={handleBack}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Go Back to Home
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                disabled={editMode}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${editMode
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 shadow-sm hover:shadow-md transform hover:-translate-x-1'
                  }`}
                title={editMode ? "Exit edit mode to go back" : "Back to main page"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition-transform group-hover:-translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">Back</span>
              </button>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Bill of Materials (BOM)
                </h1>
                <p className="text-sm text-gray-600 mt-0.5 font-medium">{bomData.projectInfo.projectName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editMode && (
                <button
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                  className="group px-5 py-2.5 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="Discard all unsaved changes"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Discard</span>
                </button>
              )}

              <button
                onClick={handleToggleEditMode}
                disabled={isSaving}
                className={`group px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${editMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400 hover:text-purple-600'
                  }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 group-hover:rotate-12 transition-transform"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>{editMode ? 'Done Editing' : 'Enable Edit'}</span>
                  </>
                )}
              </button>

              {!editMode && (
                <button
                  onClick={handleSaveBomSnapshot}
                  disabled={isSavingSnapshot}
                  className="group px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="Save current BOM as snapshot"
                >
                  {isSavingSnapshot ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      <span>Save BOM</span>
                    </>
                  )}
                </button>
              )}

              {!editMode && <button
                disabled={!hasSavedBom}
                className={`group px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm hover:shadow-md transform hover:scale-105 ${!hasSavedBom ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setPrintSettingsModalOpen(true)}
                title={!hasSavedBom ? 'Please save BOM before printing' : 'Print BOM'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 group-hover:scale-110 transition-transform"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Print</span>
              </button>}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-4 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{bomData.projectInfo.projectName}</h2>
                <div className="flex items-center gap-4 text-sm text-purple-100">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span>{bomData.projectInfo.totalTabs} Building{bomData.projectInfo.totalTabs > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-px h-4 bg-purple-400"></div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <span>{bomData.bomItems.length} Items</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center items-center">
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  {bomData.projectInfo.longRailVariation || 'BOM for U Cleat Long Rail'}
                </h2>
              </div>

              <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <p className="text-xs text-purple-200 uppercase tracking-wide font-semibold mb-1">
                  Generated by: {user?.username || 'Unknown'}
                </p>
                <p className="text-sm font-bold">
                  {new Date(bomData.projectInfo.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                  </svg>
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
                  className={`w-32 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${!editMode ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-white hover:border-purple-400'
                    }`}
                />
              </div>

              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
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
                  className={`w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${!editMode ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-white hover:border-green-400'
                    }`}
                />
              </div>

              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Module Wp:
                </label>
                <input
                  type="number"
                  value={moduleWp}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    changeTracker.trackChange({
                      id: `global-module-wp`,
                      type: 'CHANGE_MODULE_WP',
                      oldValue: moduleWp,
                      newValue: newValue,
                      itemName: 'Global Settings',
                    });
                    setModuleWp(newValue);
                  }}
                  step="1"
                  min="0"
                  disabled={!editMode}
                  className={`w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!editMode ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-white hover:border-blue-400'
                    }`}
                />
              </div>

              {editMode && (
                <>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                  <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 py-3 shadow-sm border-2 border-green-200">
                    <label className="text-sm font-bold text-green-700 whitespace-nowrap flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Add After Row:
                    </label>
                    <input
                      type="number"
                      value={addAfterRow}
                      onChange={(e) => setAddAfterRow(parseInt(e.target.value) || 1)}
                      min="0"
                      max={bomData.bomItems.length}
                      className="w-20 px-3 py-2 border-2 border-green-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-green-400 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleAddRowClick}
                    className="group px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform" viewBox="0 0 20 20" fill="currentColor">
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

          <div className="px-6 py-6 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">Total Capacity</p>
                  </div>
                  <p className="text-3xl font-black text-blue-900">
                    {((Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp) / 1000).toFixed(2)} kWp
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-amber-100 hover:border-amber-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-wide">Cost/Wp</p>
                  </div>
                  <p className="text-3xl font-black text-amber-900">
                    ₹{formatIndianNumber(
                      bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0) /
                      (Object.values(bomData.panelCounts).reduce((a, b) => a + b, 0) * moduleWp),
                      2
                    )}
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-emerald-100 hover:border-emerald-300 transform hover:scale-105">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200 rounded-full -mr-12 -mt-12 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Total Cost</p>
                  </div>
                  <p className="text-3xl font-black text-emerald-900">
                    ₹{formatIndianNumber(bomData.bomItems.reduce((acc, item) => acc + (item.cost || 0), 0), 2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 bg-gray-50">
            <ChangeLogDisplay changeLog={changeLog} />

            {/* Notes Section */}
            <NotesSection
              userNotes={userNotes}
              onNotesChange={handleNotesChange}
              editMode={editMode}
              onDefaultNotesChange={setDefaultNotesChanges}
            />
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

      <ReviewChangesModal
        isOpen={reviewModalOpen}
        changes={{
          updates: changeTracker.getChanges(),
          additions: changeTracker.getAdditions(),
          deletions: changeTracker.getDeletions(),
        }}
        defaultNotesChanges={defaultNotesChanges}
        bomData={bomData}
        originalBomData={originalBomData}
        onCancel={() => setReviewModalOpen(false)}
        onConfirm={handleReviewConfirm}
        showToast={showToast}
      />

      <PrintSettingsModal
        isOpen={printSettingsModalOpen}
        onClose={() => setPrintSettingsModalOpen(false)}
        onPrint={handlePrintSettings}
        bomData={bomData}
        aluminumRate={aluminumRate}
        sparePercentage={sparePercentage}
        moduleWp={moduleWp}
        changeLog={changeLog}
        userNotes={userNotes}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`text-white text-sm px-4 py-2 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            toast.type === 'warning' ? 'bg-yellow-600' :
            'bg-gray-900'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
