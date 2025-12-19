// src/components/GlobalInputs.jsx
import { useState, useEffect, useRef } from 'react';
import { TextField } from './ui';
import { parseNumList } from '../lib/storage';

export default function GlobalInputs({ settings, setSettings, applyToAll }) {
  // Local state for lengthsInput to prevent cursor jumping
  const [localLengthsInput, setLocalLengthsInput] = useState(settings.lengthsInput || '');
  const debounceTimerRef = useRef(null);

  // Sync local state when settings change from outside (e.g., tab switch)
  useEffect(() => {
    setLocalLengthsInput(settings.lengthsInput || '');
  }, [settings.lengthsInput]);

  // Debounced update to parent
  const handleLengthsInputChange = (value) => {
    // Update local state immediately (no cursor jump)
    setLocalLengthsInput(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update parent (and DB) after 500ms of no typing
    debounceTimerRef.current = setTimeout(() => {
      setSettings(prev => ({ ...prev, lengthsInput: value }));
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  const {
    moduleLength = 2278,
    moduleWidth = 1134,
    frameThickness = 35,
    midClamp,
    endClampWidth,
    buffer,
    purlinDistance,
    railsPerSide,
    enabledLengths,
    userMode,
    priority
  } = settings;

  // Use local state for parsing to prevent issues during typing
  const allLengths = parseNumList(localLengthsInput);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleLength = (len) => {
    setSettings(prev => ({
      ...prev,
      enabledLengths: {
        ...prev.enabledLengths,
        [len]: !prev.enabledLengths[len]
      }
    }));
  };

  const enableAll = () => {
    const newEnabled = {};
    allLengths.forEach(len => newEnabled[len] = true);
    updateSetting('enabledLengths', newEnabled);
  };

  const disableAll = () => {
    const newEnabled = {};
    allLengths.forEach(len => newEnabled[len] = false);
    updateSetting('enabledLengths', newEnabled);
  };

  const enabledCount = allLengths.filter(len => enabledLengths[len] !== false).length;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Global Parameters</h2>

      {/* 3 Columns in One Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Module Parameters */}
        <div className="border-2 border-blue-200 rounded-lg p-2.5 bg-blue-50/30">
          <h3 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Module Parameters</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[14px] text-gray-600 mb-0.5">Module Length (mm)</label>
              <input
                type="number"
                value={moduleLength}
                onChange={e => updateSetting('moduleLength', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              <label className="block text-[14px] text-gray-600 mb-0.5">Module Width (mm)</label>
              <input
                type="number"
                value={moduleWidth}
                onChange={e => updateSetting('moduleWidth', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              <label className="block text-[14px] text-gray-600 mb-0.5">Frame Thickness (mm)</label>
              <input
                type="number"
                value={frameThickness}
                onChange={e => updateSetting('frameThickness', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              {/* Empty box */}
            </div>
          </div>
        </div>

        {/* MMS Parameters */}
        <div className="border-2 border-purple-200 rounded-lg p-2.5 bg-purple-50/30">
          <h3 className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wide">MMS Parameters</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              {/* <label className="block text-[14px] text-gray-600 mb-0.5">End Clamp after Module(mm)</label> */}
              <label className="block text-[14px] text-gray-600 mb-0.5 leading-tight min-h-[34px] flex items-end">
                End Clamp after Module(mm)
              </label>

              <input
                type="number"
                value={endClampWidth}
                onChange={e => updateSetting('endClampWidth', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              {/* <label className="block text-[14px] text-gray-600 mb-0.5">Mid Clamp Gap(mm)</label> */}
              <label className="block text-[14px] text-gray-600 mb-0.5 leading-tight min-h-[34px] flex items-end">
                Mid Clamp Gap(mm)
              </label>

              <input
                type="number"
                value={midClamp}
                onChange={e => updateSetting('midClamp', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              <label className="block text-[14px] text-gray-600 mb-0.5">Buffer after End Clamp(mm)</label>
              <input
                type="number"
                value={buffer}
                onChange={e => updateSetting('buffer', e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
            </div>
            <div>
              {/* <label className="block text-[14px] text-gray-600 mb-0.5">Rails/side</label> */}
              <label className="block text-[13px] text-gray-600 mb-0.5">No. of Rails per each side of module</label>
              <input
                type="number"
                value={railsPerSide}
                onChange={e => updateSetting('railsPerSide', e.target.value)}
                min="1"
                className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
              />
              {Number(railsPerSide) === 1 && (
                <p className="text-[10px] text-amber-600 mt-0.5">⚠ Typically its 2</p>
              )}
            </div>
          </div>
        </div>

        {/* Site Parameters */}
        <div className="border-2 border-green-200 rounded-lg p-2.5 bg-green-50/30">
          <h3 className="text-xs font-bold text-green-700 mb-2 uppercase tracking-wide">Site Parameters</h3>
          <div>
            <label className="block text-[14px] text-gray-600 mb-0.5">Purlin to Purlin Distance (mm)</label>
            <input
              type="number"
              value={purlinDistance}
              onChange={e => updateSetting('purlinDistance', e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm text-center font-medium"
            />
            {applyToAll && (
              <button
                onClick={() => applyToAll('purlinDistance', purlinDistance)}
                className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-1.5"
                title="Apply this value to all tabs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
                Apply to All Tabs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Priority - Separate Row */}
      <div className="border-2 border-orange-200 rounded-lg p-2.5 bg-orange-50/30 mb-3">
        <h3 className="text-xs font-bold text-orange-700 mb-2 uppercase tracking-wide">Priority</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={priority === 'cost'}
              onChange={() => updateSetting('priority', 'cost')}
              className="w-3.5 h-3.5 text-orange-600"
            />
            <span className="text-xs font-medium">Cost</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={priority === 'length'}
              onChange={() => updateSetting('priority', 'length')}
              className="w-3.5 h-3.5 text-orange-600"
            />
            <span className="text-xs font-medium">Length</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={priority === 'joints'}
              onChange={() => updateSetting('priority', 'joints')}
              className="w-3.5 h-3.5 text-orange-600"
            />
            <span className="text-xs font-medium">Joints</span>
          </label>
        </div>
      </div>

      {/* Length Selection */}
      <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30 mt-4">
        <div className="flex items-center mb-3 gap-4">
          <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wide">
            Available Cut Lengths ({enabledCount}/{allLengths.length} selected)
          </h3>
          <div className="flex gap-2">
            <button onClick={enableAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">All</button>
            <span className="text-gray-300">|</span>
            <button onClick={disableAll} className="text-xs text-purple-600 hover:text-purple-800 font-medium">None</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allLengths.map(len => (
            <label
              key={len}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${enabledLengths[len] !== false
                ? 'bg-purple-100 border-purple-400 text-purple-800'
                : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
            >
              <input
                type="checkbox"
                checked={enabledLengths[len] !== false}
                onChange={() => toggleLength(len)}
                className="w-3.5 h-3.5 text-purple-600 rounded"
              />
              <span className="text-sm font-medium">{len}</span>
            </label>
          ))}
        </div>
        {enabledCount === 0 && (
          <p className="text-xs text-red-500 mt-2">Please select at least one length</p>
        )}
      </div>

      {/* Advanced: Edit lengths */}
      {userMode === 'advanced' && (
        <div className="mt-4 pt-4 border-t">
          <TextField
            label="Edit Cut Lengths (comma-separated)"
            value={localLengthsInput}
            setValue={handleLengthsInputChange}
          />
        </div>
      )}
    </div>
  );
}
