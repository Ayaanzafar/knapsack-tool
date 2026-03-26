// src/components/SettingsPanel.jsx
import { Card, TextField, NumberField } from './ui';
import { exportToFile, DEFAULT_SETTINGS, DEFAULT_LENGTHS } from '../lib/storage';

import { useAuth } from '../context/AuthContext';

export default function SettingsPanel({
  settings,
  setSettings,
  onClose,
  applyToAll
}) {
  const { canEditField, appDefaults } = useAuth();

  const {
    moduleLength,
    moduleWidth,
    frameThickness,
    midClamp,
    endClampWidth,
    buffer,
    purlinDistance,
    railsPerSide,
    lengthsInput,
    enabledLengths,
    maxPieces,
    maxWastePct,
    alphaJoint,
    betaSmall,
    allowUndershootPct,
    gammaShort,
    costPerMm,
    costPerJointSet,
    joinerLength,
    priority
  } = settings;

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    exportToFile(settings);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      const tabDefs = appDefaults?.tabDefaults;
      const base = tabDefs ? { ...DEFAULT_SETTINGS, ...tabDefs } : DEFAULT_SETTINGS;
      const defaultLengths = tabDefs?.lengthsInput
        ? tabDefs.lengthsInput.split(/[,\s]+/).map(s => parseInt(s)).filter(n => !isNaN(n))
        : DEFAULT_LENGTHS;
      setSettings({
        ...base,
        enabledLengths: defaultLengths.reduce((acc, len) => ({ ...acc, [len]: true }), {}),
      });
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setSettings(prev => ({ ...prev, ...imported }));
        alert('Settings imported successfully!');
      } catch (err) {
        alert('Failed to import settings. Invalid file format.');
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Cost Settings */}
      {canEditField('costPerMm') && (
        <Card title="Cost Settings">
          <div className="space-y-3">
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
          </div>
        </Card>
      )}

      {/* Optimization */}
      <Card title="Optimization">
        <div className="space-y-3">
          <NumberField
            label="Max Pieces"
            value={maxPieces}
            setValue={(v) => updateSetting('maxPieces', v)}
          />

          <div>
            <div className="text-sm text-gray-600 mb-2">Priority</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={priority === 'length'}
                  onChange={() => updateSetting('priority', 'length')}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm">Lesser rail length</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={priority === 'joints'}
                  onChange={() => updateSetting('priority', 'joints')}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm">Lesser joints</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced Settings */}
      {canEditField('maxWastePct') && (
        <Card title="Advanced">
          <div className="space-y-3">
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
        </Card>
      )}

      {/* Export/Import */}
      <Card title="Data">
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Export Settings
          </button>
          <label className="block">
            <span className="w-full py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 cursor-pointer block text-center">
              Import Settings
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReset}
            className="w-full py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Reset Defaults
          </button>
        </div>
      </Card>
    </div>
  );
}
