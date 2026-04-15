import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bomAPI, customBomAPI, projectAPI } from '../services/api';
import { getCurrentProjectId } from '../lib/tabStorageAPI';
import TabContextMenu from '../components/TabContextMenu';
import RenameTabDialog from '../components/RenameTabDialog';
import { API_URL } from '../services/config';
import NumberInputWithSpinner from '../components/NumberInputWithSpinner';

const MATERIALS = ['SS 304', 'Al 6063', 'GI'];

const MATERIAL_RATE_KEYS = {
  'Al 6063': 'al6063Rate',
  'GI': 'giRate',
};

function calcItem(item, rates, sparePercent = 0) {
  const length = parseFloat(item.length) || 0;
  const qty = parseFloat(item.quantity) || 0;
  const designWeight = parseFloat(item.designWeight) || 0;
  const costPerPiece = parseFloat(item.costPerPiece) ?? null;
  const rateKey = MATERIAL_RATE_KEYS[item.material];
  const rate = parseFloat(rates[rateKey]) || 0;
  const sp = parseFloat(sparePercent) || 0;

  const spareQty = Math.ceil(qty * sp / 100);
  const finalQty = qty + spareQty;

  let rm = 0, wt = 0, cost = 0;

  if (item.itemType === 'FASTENER' || (costPerPiece !== null && item.costPerPiece !== null)) {
    // Fastener — cost per piece
    cost = parseFloat((finalQty * (costPerPiece || 0)).toFixed(2));
  } else {
    // Profile — weight-based
    rm = parseFloat(((finalQty * length) / 1000).toFixed(4));
    wt = parseFloat((rm * designWeight).toFixed(4));
    cost = parseFloat((wt * rate).toFixed(2));
  }

  return { ...item, spareQty, finalQty, rate, rm, wt, cost };
}

// ── Add Item Modal ────────────────────────────────────────────────────────────

function AddItemModal({ isOpen, profiles, rates, sparePercent, onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [material, setMaterial] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [typeFilter, setTypeFilter] = useState('PROFILE');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(null);
      setMaterial('');
      setLength('');
      setQuantity('');
      setShowDropdown(false);
      setTypeFilter('PROFILE');
    }
  }, [isOpen]);

  const filtered = profiles.filter(p =>
    p.itemType === typeFilter &&
    (p.genericName?.toLowerCase().includes(search.toLowerCase()) ||
     p.itemDescription?.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 50);

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    setSelected(null);
    setSearch('');
    setLength('');
    setMaterial('');
  };

  const handleSelect = (profile) => {
    setSelected(profile);
    setSearch('');
    setMaterial(profile.material || MATERIALS[0]);
    setShowDropdown(false);
  };

  const preview = selected
    ? calcItem({ ...selected, material: material || selected.material || MATERIALS[0], length, quantity }, rates, sparePercent)
    : null;

  const isFastener = selected?.itemType === 'FASTENER' || (selected?.costPerPiece != null && parseFloat(selected.costPerPiece) > 0);

  const handleAdd = () => {
    if (!selected) { alert('Please select an item'); return; }
    if (!isFastener && (!length || parseFloat(length) <= 0)) { alert('Please enter a valid length'); return; }
    if (!quantity || parseFloat(quantity) <= 0) { alert('Please enter a valid quantity'); return; }

    const newItem = calcItem({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      profileId: selected.id || null,
      itemType: selected.itemType || 'PROFILE',
      genericName: selected.genericName,
      itemCode: selected.sunrackCode || selected.serialNumber || '',
      itemDescription: selected.itemDescription || '',
      material: material || MATERIALS[0],
      designWeight: parseFloat(selected.designWeight) || 0,
      costPerPiece: selected.costPerPiece != null ? parseFloat(selected.costPerPiece) : null,
      uom: selected.uom || '',
      profileImagePath: selected.profileImagePath || null,
      length: isFastener ? 0 : parseFloat(length),
      quantity: parseFloat(quantity),
    }, rates, sparePercent);

    onAdd(newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">Add Item</h2>
          <p className="text-yellow-100 text-sm mt-0.5">Select a profile or fastener from the catalog</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { label: 'Profile', value: 'PROFILE', color: 'green' },
              { label: 'Fastener', value: 'FASTENER', color: 'blue' },
            ].map(({ label, value, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeFilter(value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  typeFilter === value
                    ? value === 'PROFILE'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Item Dropdown */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {typeFilter === 'PROFILE' ? 'Profile' : 'Fastener'} <span className="text-red-500">*</span>
            </label>

            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setShowDropdown(prev => !prev)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border-2 rounded-xl text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                showDropdown ? 'border-yellow-400' : 'border-gray-200 hover:border-yellow-300'
              }`}
            >
              {selected ? (
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{selected.genericName}</div>
                  <div className="text-xs text-gray-400">{selected.sunrackCode || selected.serialNumber || ''}</div>
                </div>
              ) : (
                <span className="text-gray-400">Select an item...</span>
              )}
              <svg
                className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-yellow-300 rounded-xl shadow-2xl">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-yellow-100">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Type to search..."
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
                {/* List */}
                <div className="max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No items found</div>
                  ) : (
                    filtered.map(p => (
                      <button
                        key={p.serialNumber || p.id}
                        type="button"
                        onMouseDown={() => handleSelect(p)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-yellow-50 border-b border-gray-100 last:border-0 transition-colors ${
                          selected?.id === p.id ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-800">{p.genericName}</div>
                        <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                          {p.sunrackCode && <span>Code: {p.sunrackCode}</span>}
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.itemType === 'FASTENER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {p.itemType}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Item Code + fastener cost badge */}
          {selected && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Item Code</label>
                <input
                  type="text"
                  readOnly
                  value={selected.sunrackCode || selected.serialNumber || '—'}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              {isFastener && selected.costPerPiece != null && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Cost / Piece</label>
                  <div className="px-4 py-2.5 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm font-bold text-blue-700">
                    ₹{parseFloat(selected.costPerPiece).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Material */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Material <span className="text-red-500">*</span></label>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm bg-white"
              >
                <option value="">Select...</option>
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Length — hidden for fasteners */}
            {!isFastener ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Length (mm) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  placeholder="e.g. 6000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                />
              </div>
            ) : (
              <div className="flex items-end">
                <div className="w-full px-4 py-2.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 text-center">
                  No length for fasteners
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
            />
          </div>

          {/* Live preview */}
          {preview && quantity && (isFastener || length) && (
            <div className={`border-2 rounded-xl px-4 py-3 grid gap-2 text-center ${isFastener ? 'bg-blue-50 border-blue-200 grid-cols-3' : 'bg-yellow-50 border-yellow-200 grid-cols-5'}`}>
              <div>
                <div className="text-xs text-gray-500 font-medium">Spare Qty</div>
                <div className="font-bold text-gray-800">{preview.spareQty}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Final Qty</div>
                <div className="font-bold text-gray-800">{preview.finalQty}</div>
              </div>
              {!isFastener && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">RM (m)</div>
                    <div className="font-bold text-gray-800">{preview.rm.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Wt (kg)</div>
                    <div className="font-bold text-gray-800">{preview.wt.toFixed(3)}</div>
                  </div>
                </>
              )}
              <div>
                <div className="text-xs text-gray-500 font-medium">Cost (₹)</div>
                <div className={`font-bold ${isFastener ? 'text-blue-700' : 'text-yellow-700'}`}>
                  {preview.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl text-sm font-bold hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomBOMPage() {
  const navigate = useNavigate();
  const projectId = getCurrentProjectId();

  const [project, setProject] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [moduleWp, setModuleWp] = useState(590);
  const [sparePercent, setSparePercent] = useState(1);
  const [rates, setRates] = useState({ al6063Rate: 320, giRate: 70 });
  const [buildings, setBuildings] = useState([]);
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { buildingId, itemId }
  const [contextMenu, setContextMenu] = useState({ isOpen: false, buildingId: null, position: { x: 0, y: 0 } });
  const [renameDialog, setRenameDialog] = useState({ isOpen: false, buildingId: null, currentName: '' });

  // Load project info, profiles, and saved BOM data
  useEffect(() => {
    if (!projectId) { navigate('/custom-bom/create'); return; }

    const load = async () => {
      try {
        setLoading(true);
        const [proj, masterItems, bomData] = await Promise.all([
          projectAPI.getById(projectId),
          bomAPI.getAllMasterItems(),
          customBomAPI.get(projectId),
        ]);

        setProject(proj);
        setProfiles(masterItems);
        setModuleWp(bomData.moduleWp ?? 590);
        setSparePercent(bomData.sparePercent ?? 1);
        setRates({

          al6063Rate: bomData.al6063Rate || 320,

          giRate: bomData.giRate || 70,
        });

        const loadedBuildings = bomData.buildings?.length > 0
          ? bomData.buildings
          : [{ id: `b-${Date.now()}`, name: 'Building 1', items: [] }];

        setBuildings(loadedBuildings);
        setActiveBuilding(loadedBuildings[0].id);
      } catch (err) {
        console.error('Failed to load custom BOM:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // Add building
  const addBuilding = () => {
    const newBuilding = {
      id: `b-${Date.now()}`,
      name: `Building ${buildings.length + 1}`,
      items: [],
    };
    setBuildings(prev => [...prev, newBuilding]);
    setActiveBuilding(newBuilding.id);
  };

  // Remove building
  const removeBuilding = (id) => {
    if (buildings.length === 1) { alert('At least one building is required.'); return; }
    const remaining = buildings.filter(b => b.id !== id);
    setBuildings(remaining);
    if (activeBuilding === id) setActiveBuilding(remaining[0].id);
  };

  // Rename building
  const renameBuilding = (id, name) => {
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  };

  // Add item to active building
  const handleAddItem = useCallback((item) => {
    setBuildings(prev => prev.map(b =>
      b.id === activeBuilding ? { ...b, items: [...b.items, item] } : b
    ));
  }, [activeBuilding]);

  // Delete item
  const handleDeleteItem = (buildingId, itemId) => {
    setBuildings(prev => prev.map(b =>
      b.id === buildingId ? { ...b, items: b.items.filter(i => i.id !== itemId) } : b
    ));
    setDeleteConfirm(null);
  };

  // Inline edit item field
  const handleEditItem = (buildingId, itemId, field, value) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== buildingId) return b;
      const items = b.items.map(item => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        return calcItem(updated, rates, sparePercent);
      });
      return { ...b, items };
    }));
  };

  // Recalc all items when rates change
  const handleRateChange = (key, value) => {
    const newRates = { ...rates, [key]: value };
    setRates(newRates);
    setBuildings(prev => prev.map(b => ({
      ...b,
      items: b.items.map(item => calcItem(item, newRates, sparePercent)),
    })));
  };

  // Recalc all items when spare % changes
  const handleSparePercentChange = (value) => {
    setSparePercent(value);
    setBuildings(prev => prev.map(b => ({
      ...b,
      items: b.items.map(item => calcItem(item, rates, value)),
    })));
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await customBomAPI.save(projectId, {
        moduleWp: parseFloat(moduleWp) || 590,
        sparePercent: parseFloat(sparePercent) || 1,

        al6063Rate: parseFloat(rates.al6063Rate) || 0,

        giRate: parseFloat(rates.giRate) || 0,
        buildings,
      });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const activeB = buildings.find(b => b.id === activeBuilding);
  const totalItems = activeB?.items?.length || 0;
  const totalWt = activeB?.items?.reduce((s, i) => s + (i.wt || 0), 0) || 0;
  const totalCost = activeB?.items?.reduce((s, i) => s + (i.cost || 0), 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-yellow-500 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading Custom BOM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-yellow-100 to-white">
      {/* Header */}
      <header className="bg-yellow-50/80 backdrop-blur-sm border-b-2 border-yellow-300 shadow-sm sticky top-0 z-40">
        <div className="max-w-full mx-auto h-16 px-4 sm:px-6 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-yellow-100 transition-colors text-gray-600 hover:text-black shrink-0"
              title="Back to Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Custom BOM</div>
              <div className="font-bold text-gray-900 truncate text-sm">{project?.name || 'Loading...'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveMsg && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${saveMsg === 'Saved!' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-black text-yellow-400 font-bold text-sm rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60"
            >
              {saving ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
              )}
              {saving ? 'Saving...' : 'Save BOM'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Rates & Params Bar */}
        <div className="bg-white rounded-2xl border-2 border-yellow-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3">
            {/* Module Wp */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[180px]">
              <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Module Wp:</label>
              <div className="w-24">
                <NumberInputWithSpinner
                  value={parseFloat(moduleWp) || 0}
                  onChange={val => setModuleWp(val)}
                  minValue={0}
                  size="sm"
                />
              </div>
            </div>

            {/* Spare % */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[160px]">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Spare %:</label>
              <div className="w-20">
                <NumberInputWithSpinner
                  value={parseFloat(sparePercent) || 0}
                  onChange={val => handleSparePercentChange(val)}
                  minValue={0}
                  size="sm"
                />
              </div>
            </div>

            <div className="w-px bg-gray-200 self-stretch mx-1 hidden sm:block" />

            {/* Material Rates */}
            {[
              { label: 'Al 6063 (₹/kg)', key: 'al6063Rate' },
              { label: 'GI (₹/kg)', key: 'giRate' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[200px]">
                <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">{label}:</label>
                <div className="w-24">
                  <NumberInputWithSpinner
                    value={parseFloat(rates[key]) || 0}
                    onChange={val => handleRateChange(key, val)}
                    minValue={0}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Building Tabs */}
        <div className="bg-white rounded-2xl border-2 border-yellow-200 shadow-sm overflow-hidden">
          {/* Tab Bar */}
          <div className="flex items-center border-b-2 border-yellow-200 bg-yellow-50/50 overflow-x-auto">
            {buildings.map(b => (
              <div
                key={b.id}
                className={`group flex items-center gap-1 px-4 py-3 border-r-2 border-yellow-100 shrink-0 cursor-pointer select-none transition-all ${
                  activeBuilding === b.id
                    ? 'bg-black text-yellow-400 border-b-2 border-b-black'
                    : 'text-gray-600 hover:bg-yellow-100'
                }`}
                onClick={() => setActiveBuilding(b.id)}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({ isOpen: true, buildingId: b.id, position: { x: e.clientX, y: e.clientY } });
                }}
              >
                <span className={`text-sm font-bold ${activeBuilding === b.id ? 'text-yellow-400' : 'text-gray-700'}`}>
                  {b.name}
                </span>
                {buildings.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); removeBuilding(b.id); }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 hover:text-red-600 ${
                      activeBuilding === b.id ? 'text-yellow-300 hover:bg-red-900/30' : 'text-gray-400'
                    }`}
                    title="Remove building"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addBuilding}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-yellow-700 hover:bg-yellow-100 transition-colors shrink-0"
              title="Add building"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
              </svg>
              Add Building
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ minWidth: 1300 }}>
              <thead>
                {/* Row 1 — group headers */}
                <tr className="bg-yellow-400">
                  <th colSpan={8} className="border border-gray-400 px-3 py-1.5 text-sm font-bold text-center">
                    {project?.name || ''}
                  </th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th colSpan={2} className="border border-gray-400 px-3 py-1.5 text-sm font-bold text-center">
                    Spare
                  </th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th colSpan={7} className="border border-gray-400 px-3 py-1.5 text-sm font-bold text-center">
                    Weight Calculation and Cost Calculation
                  </th>
                  <th className="border-0 w-8"></th>
                </tr>
                {/* Row 2 — sub-headers / rates */}
                <tr className="bg-yellow-400">
                  <th colSpan={8} className="border border-gray-400 px-3 py-1 text-xs font-semibold text-center text-gray-700">
                    {buildings.find(b => b.id === activeBuilding)?.name || ''}
                  </th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th colSpan={2} className="border border-gray-400 px-3 py-1 text-xs font-semibold text-center text-gray-700">
                    {sparePercent}%
                  </th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th colSpan={7} className="border border-gray-400 px-3 py-1 text-xs font-semibold text-center">
                    <span className="text-blue-700">Al 6063: ₹{rates.al6063Rate || 0}</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span className="text-teal-700">GI: ₹{rates.giRate || 0}</span>
                  </th>
                  <th className="border-0 w-8"></th>
                </tr>
                {/* Row 3 — column labels */}
                <tr className="bg-yellow-400">
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-10">S.N</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-12">Profile</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-24">Sunrack Code</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-40">Item Description</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-24">Material</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-20">Length (mm)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-14">UoM</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-16">Qty</th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-16">Spare<br/>Qty</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-16">Final<br/>Qty</th>
                  <th className="bg-gray-300 w-3 border-0" />
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-18">Wt/RM<br/>(kg/m)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-18">Wt/pc<br/>(kg)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-18">RM (m)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-18">Wt (kg)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-20">Rate<br/>(₹/kg)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-20">Rate/Piece<br/>(₹)</th>
                  <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-24">Cost (₹)</th>
                  <th className="w-8 border-0"></th>
                </tr>
              </thead>

              <tbody>
                {!activeB?.items?.length ? (
                  <tr>
                    <td colSpan={20} className="px-4 py-16 text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="font-semibold text-gray-500">No items added yet</p>
                      <p className="text-sm mt-1">Click "Add Item" to start building your BOM</p>
                    </td>
                  </tr>
                ) : (
                  activeB.items.map((item, idx) => {
                    const imgSrc = item.profileImagePath
                      ? (item.profileImagePath.startsWith('/') ? `${API_URL}${item.profileImagePath}` : item.profileImagePath)
                      : null;
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-gray-50';
                    return (
                      <tr key={item.id} className={`${rowBg} hover:bg-yellow-50/40 group transition-colors`}>
                        {/* S.N */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center text-gray-500 font-medium">{idx + 1}</td>

                        {/* Profile image */}
                        <td className="border border-gray-200 px-2 py-2 text-center">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-9 h-9 object-contain mx-auto"
                              onError={e => { e.target.style.display='none'; }}/>
                          ) : (
                            <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center mx-auto">
                              <span className="text-gray-300 text-xs">—</span>
                            </div>
                          )}
                        </td>

                        {/* Sunrack Code */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center text-gray-600">{item.itemCode || '—'}</td>

                        {/* Item Description */}
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-800">
                          <div className="font-semibold">{item.genericName}</div>
                          {item.itemDescription && item.itemDescription !== item.genericName && (
                            <div className="text-gray-400 mt-0.5 truncate max-w-[200px]">{item.itemDescription}</div>
                          )}
                        </td>

                        {/* Material */}
                        <td className="border border-gray-200 px-2 py-2">
                          <select
                            value={item.material}
                            onChange={e => handleEditItem(activeBuilding, item.id, 'material', e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white w-full"
                          >
                            {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>

                        {/* Length */}
                        <td className="border border-gray-200 px-2 py-2">
                          <NumberInputWithSpinner
                            value={item.length}
                            onChange={val => handleEditItem(activeBuilding, item.id, 'length', val)}
                            minValue={0}
                            size="sm"
                          />
                        </td>

                        {/* UoM */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center text-gray-600">{item.uom || '—'}</td>

                        {/* Qty */}
                        <td className="border border-gray-200 px-2 py-2">
                          <NumberInputWithSpinner
                            value={item.quantity}
                            onChange={val => handleEditItem(activeBuilding, item.id, 'quantity', val)}
                            minValue={0}
                            size="sm"
                          />
                        </td>

                        {/* separator */}
                        <td className="bg-gray-200 w-3" />

                        {/* Spare Qty */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-green-50 text-green-800 font-medium">{item.spareQty ?? 0}</td>

                        {/* Final Qty */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-purple-50 font-bold text-purple-800">{item.finalQty ?? item.quantity}</td>

                        {/* separator */}
                        <td className="bg-gray-200 w-3" />

                        {/* Wt/RM */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-yellow-50 text-gray-700">{item.designWeight?.toFixed(4) ?? '—'}</td>

                        {/* Wt/pc */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-yellow-50 text-gray-700">
                          {item.itemType === 'FASTENER'
                            ? <span className="text-gray-300">—</span>
                            : ((parseFloat(item.length) || 0) / 1000 * (parseFloat(item.designWeight) || 0)).toFixed(4)
                          }
                        </td>

                        {/* RM */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-yellow-50 text-gray-700">{item.rm?.toFixed(3) ?? '—'}</td>

                        {/* Wt */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-orange-50 text-gray-700">{item.wt?.toFixed(3) ?? '—'}</td>

                        {/* Rate ₹/kg — only for profiles */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-orange-50 text-gray-700">
                          {item.costPerPiece != null && parseFloat(item.costPerPiece) > 0
                            ? <span className="text-gray-300">—</span>
                            : item.rate?.toFixed(2) ?? '—'
                          }
                        </td>

                        {/* Rate/Piece — editable for fasteners */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-center bg-blue-50">
                          {item.costPerPiece != null && parseFloat(item.costPerPiece) >= 0
                            ? <NumberInputWithSpinner
                                value={item.costPerPiece}
                                onChange={val => handleEditItem(activeBuilding, item.id, 'costPerPiece', val)}
                                minValue={0}
                                size="sm"
                                className="border-blue-200 text-blue-700 font-semibold focus:ring-blue-400"
                              />
                            : <span className="text-gray-300">—</span>
                          }
                        </td>

                        {/* Cost */}
                        <td className="border border-gray-200 px-2 py-2 text-xs text-right font-bold bg-green-50 text-gray-800">
                          ₹{item.cost?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—'}
                        </td>

                        {/* Delete */}
                        <td className="px-1 py-2 text-center">
                          <button
                            onClick={() => setDeleteConfirm({ buildingId: activeBuilding, itemId: item.id })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                            title="Delete row"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Totals row */}
              {totalItems > 0 && (
                <tfoot>
                  <tr className="bg-yellow-100 border-t-2 border-yellow-400 font-bold">
                    <td colSpan={11} className="border border-gray-300 px-3 py-2.5 text-xs text-gray-700">
                      Total — {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </td>
                    <td className="bg-gray-200 w-3" />
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-600">
                      {activeB.items.reduce((s, i) => s + (parseFloat(i.designWeight) || 0), 0).toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-400">—</td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-700">
                      {activeB.items.reduce((s, i) => s + (i.rm || 0), 0).toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-800">
                      {totalWt.toFixed(3)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-400">—</td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-center text-gray-400">—</td>
                    <td className="border border-gray-300 px-2 py-2.5 text-xs text-right text-yellow-800">
                      ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Add Item Button */}
          <div className="p-4 border-t border-yellow-100">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
              </svg>
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddModal}
        profiles={profiles}
        rates={rates}
        sparePercent={sparePercent}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />

      {/* Tab right-click context menu */}
      <TabContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu(m => ({ ...m, isOpen: false }))}
        onRename={() => {
          const b = buildings.find(b => b.id === contextMenu.buildingId);
          if (b) setRenameDialog({ isOpen: true, buildingId: b.id, currentName: b.name });
        }}
        onDuplicate={() => {
          const b = buildings.find(b => b.id === contextMenu.buildingId);
          if (b) {
            const copy = { ...b, id: `b-${Date.now()}`, name: `${b.name} (Copy)`, items: b.items.map(i => ({ ...i, id: `item-${Date.now()}-${Math.random().toString(36).substr(2,6)}` })) };
            setBuildings(prev => [...prev, copy]);
          }
        }}
      />

      {/* Rename dialog */}
      <RenameTabDialog
        isOpen={renameDialog.isOpen}
        currentName={renameDialog.currentName}
        existingTabNames={buildings.map(b => b.name)}
        onClose={() => setRenameDialog(d => ({ ...d, isOpen: false }))}
        onRename={newName => {
          renameBuilding(renameDialog.buildingId, newName);
          setRenameDialog(d => ({ ...d, isOpen: false }));
        }}
      />

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Item?</h3>
            <p className="text-gray-500 text-sm mb-5">This will remove the item from this building.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirm.buildingId, deleteConfirm.itemId)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
