import { useState, useEffect } from 'react';
import { userAPI, configAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import BOMManagementTab from './BOMManagementTab';
import { useAuth } from '../context/AuthContext';
import NumberInputWithSpinner from '../components/NumberInputWithSpinner';

// ─── Feature permission rows for Permissions tab ──────────────────────────────
const FEATURE_PERMS = [
  { key: 'canUpdateMasterItem', label: 'Update Master DB' },
  { key: 'canViewAllBoms',      label: 'View All BOMs' },
  { key: 'canViewSalesBoms',    label: 'View Sales BOMs' },
  { key: 'canViewDesignBoms',   label: 'View Design BOMs' },
  { key: 'canEditDefaultNotes', label: 'Edit Default Notes' },
  { key: 'canEditAppDefaults',  label: 'Edit App Defaults' },
  { key: 'canManageUsers',      label: 'Manage Users' },
  { key: 'canAccessAdmin',      label: 'Access Admin Panel' },
];

// Permissions that require canAccessAdmin to be useful
const REQUIRES_ADMIN = ['canManageUsers', 'canEditAppDefaults'];

const FIELD_GROUPS = [
  { key: 'moduleParams', label: 'Module Parameters', fields: [
    { key: 'moduleLength', label: 'Module Length', isBom: false },
    { key: 'moduleWidth',  label: 'Module Width',  isBom: false },
    { key: 'frameThickness', label: 'Frame Thickness', isBom: false },
    { key: 'midClamp',     label: 'Mid Clamp Gap', isBom: false },
    { key: 'endClampWidth',label: 'End Clamp Width', isBom: false },
  ]},
  { key: 'structural', label: 'MMS / Structural', fields: [
    { key: 'buffer',       label: 'Buffer',         isBom: false },
    { key: 'railsPerSide', label: 'Rails per Side', isBom: false },
  ]},
  { key: 'site', label: 'Site Parameters', fields: [
    { key: 'purlinDistance',       label: 'Purlin Distance',      isBom: false },
    { key: 'seamToSeamDistance',   label: 'Seam to Seam',         isBom: false },
    { key: 'maxSupportDistance',   label: 'Max Support Distance', isBom: false },
  ]},
  { key: 'cutLengths', label: 'Cut Lengths', fields: [
    { key: 'enabledLengths', label: 'Toggle on/off',  isBom: false },
    { key: 'lengthsInput',   label: 'Edit list',      isBom: false },
  ]},
  { key: 'optimizer', label: 'Optimizer / Cost Settings', fields: [
    { key: 'costPerMm',       label: 'Cost per mm',       isBom: false },
    { key: 'costPerJointSet', label: 'Cost per Joint Set', isBom: false },
    { key: 'joinerLength',    label: 'Joiner Length',     isBom: false },
    { key: 'priority',        label: 'Priority',          isBom: false },
  ]},
  { key: 'bomRates', label: 'BOM Rate Fields', fields: [
    { key: 'aluminumRate',      label: 'Aluminum Rate',          isBom: true },
    { key: 'sparePercentage',   label: 'Spare %',                isBom: true },
    { key: 'moduleWp',          label: 'Module Wp',              isBom: true },
    { key: 'perItemCost',       label: 'Per-item Cost Override', isBom: true },
    { key: 'perItemAluminumRate', label: 'Per-item Al Rate',     isBom: true },
  ]},
];

const ROLES = [
  { key: 'SALES', label: 'Sales' },
  { key: 'DESIGN', label: 'Design' },
  { key: 'MANAGER_SALES', label: 'Mgr (Sales)' },
  { key: 'MANAGER_DESIGN', label: 'Mgr (Design)', locked: true },
];

function PermissionsTab({ permissionsConfig, loading, saving, msg, autoLinkMsg, expandedGroups, setExpandedGroups, onToggleFeature, onToggleTabField, onToggleBomField, onSave }) {
  if (loading) return <div className="p-8 text-center text-gray-500">Loading permissions...</div>;
  if (!permissionsConfig) return <div className="p-8 text-center text-gray-500">No permissions data.</div>;

  const CheckCell = ({ locked, checked, onChange }) => (
    <td className="px-3 py-2 text-center">
      {locked
        ? <span className="text-gray-400 text-xs">🔒</span>
        : <input type="checkbox" checked={!!checked} onChange={onChange} className="w-4 h-4 cursor-pointer" />
      }
    </td>
  );

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-8">
      {autoLinkMsg && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
          <span className="mt-0.5">ℹ️</span>
          <span>{autoLinkMsg}</span>
        </div>
      )}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Feature Permissions</h3>
        <p className="text-sm text-gray-500 mb-4">Control which features each role can access.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-48">Permission</th>
                {ROLES.map(r => <th key={r.key} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{r.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FEATURE_PERMS.map(perm => (
                <tr key={perm.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{perm.label}</td>
                  {ROLES.map(role => (
                    <CheckCell
                      key={role.key}
                      locked={role.locked}
                      checked={permissionsConfig[role.key]?.[perm.key]}
                      onChange={() => onToggleFeature(role.key, perm.key)}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Field-Level Edit Control</h3>
        <p className="text-sm text-gray-500 mb-4">Control which input fields each role can edit.</p>
        <div className="space-y-2">
          {FIELD_GROUPS.map(group => (
            <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
              >
                <span>{group.label}</span>
                <span className="text-gray-400">{expandedGroups[group.key] ? '▼' : '▶'}</span>
              </button>
              {expandedGroups[group.key] && (
                <table className="min-w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500 w-48">Field</th>
                      {ROLES.map(r => <th key={r.key} className="px-3 py-2 text-center text-xs text-gray-500">{r.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.fields.map(field => (
                      <tr key={field.key} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-sm text-gray-700">{field.label}</td>
                        {ROLES.map(role => {
                          const arr = field.isBom
                            ? permissionsConfig[role.key]?.editableBomFields ?? []
                            : permissionsConfig[role.key]?.editableTabFields ?? [];
                          const checked = arr.includes('all') || arr.includes(field.key);
                          return (
                            <CheckCell
                              key={role.key}
                              locked={role.locked}
                              checked={checked}
                              onChange={() => field.isBom
                                ? onToggleBomField(role.key, field.key)
                                : onToggleTabField(role.key, field.key)
                              }
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
}

function DefaultsField({ label, value, onChange, type = 'number' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {type === 'text' ? (
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
        />
      ) : (
        <NumberInputWithSpinner
          value={value ?? 0}
          onChange={onChange}
          size="md"
        />
      )}
    </div>
  );
}

function DefaultsSection({ title, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function AppDefaultsTab({ defaultsConfig, setDefaultsConfig, loading, saving, msg, onSave, onReset }) {
  if (loading) return <div className="p-8 text-center text-gray-500">Loading defaults...</div>;
  if (!defaultsConfig) return <div className="p-8 text-center text-gray-500">No defaults data.</div>;

  const tab = defaultsConfig.tabDefaults ?? {};
  const bom = defaultsConfig.bomDefaults ?? {};

  const setTab = (key, val) => setDefaultsConfig(prev => ({ ...prev, tabDefaults: { ...prev.tabDefaults, [key]: val } }));
  const setBom = (key, val) => setDefaultsConfig(prev => ({ ...prev, bomDefaults: { ...prev.bomDefaults, [key]: val } }));

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-5">
      <div>
        <h3 className="text-lg font-medium text-gray-900">App Defaults</h3>
        <p className="text-sm text-gray-500 mt-1">Used when any user creates a new tab or BOM. Existing tabs and BOMs are NOT affected.</p>
      </div>

      <DefaultsSection title="BOM Rates & Specs">
        <DefaultsField label="Aluminum Rate (₹/kg)" value={bom.aluminumRate} onChange={v => setBom('aluminumRate', v)} />
        <DefaultsField label="HDG Rate (₹/kg)" value={bom.hdgRatePerKg} onChange={v => setBom('hdgRatePerKg', v)} />
        <DefaultsField label="Magnelis Rate (₹/kg)" value={bom.magnelisRatePerKg} onChange={v => setBom('magnelisRatePerKg', v)} />
        <DefaultsField label="Module Wp (W)" value={bom.moduleWp} onChange={v => setBom('moduleWp', v)} />
        <DefaultsField label="Spare Percentage (%)" value={bom.sparePercentage} onChange={v => setBom('sparePercentage', v)} />
      </DefaultsSection>

      <DefaultsSection title="Module Parameters">
        <DefaultsField label="Module Length (mm)" value={tab.moduleLength} onChange={v => setTab('moduleLength', v)} />
        <DefaultsField label="Module Width (mm)" value={tab.moduleWidth} onChange={v => setTab('moduleWidth', v)} />
        <DefaultsField label="Frame Thickness (mm)" value={tab.frameThickness} onChange={v => setTab('frameThickness', v)} />
        <DefaultsField label="Mid Clamp Gap (mm)" value={tab.midClamp} onChange={v => setTab('midClamp', v)} />
        <DefaultsField label="End Clamp Width (mm)" value={tab.endClampWidth} onChange={v => setTab('endClampWidth', v)} />
      </DefaultsSection>

      <DefaultsSection title="Structural Parameters">
        <DefaultsField label="Buffer (mm)" value={tab.buffer} onChange={v => setTab('buffer', v)} />
        <DefaultsField label="Rails per Side" value={tab.railsPerSide} onChange={v => setTab('railsPerSide', v)} />
        <DefaultsField label="Purlin Distance (mm)" value={tab.purlinDistance} onChange={v => setTab('purlinDistance', v)} />
        <DefaultsField label="Seam to Seam (mm)" value={tab.seamToSeamDistance} onChange={v => setTab('seamToSeamDistance', v)} />
        <DefaultsField label="Max Support Dist (mm)" value={tab.maxSupportDistance} onChange={v => setTab('maxSupportDistance', v)} />
      </DefaultsSection>

      <DefaultsSection title="Optimizer Settings">
        <div className="col-span-2 md:col-span-3">
          <DefaultsField label="Cut Lengths (comma-separated)" value={tab.lengthsInput} onChange={v => setTab('lengthsInput', v)} type="text" />
        </div>
        <DefaultsField label="Cost per mm" value={tab.costPerMm} onChange={v => setTab('costPerMm', v)} />
        <DefaultsField label="Cost per Joint Set" value={tab.costPerJointSet} onChange={v => setTab('costPerJointSet', v)} />
        <DefaultsField label="Joiner Length (mm)" value={tab.joinerLength} onChange={v => setTab('joinerLength', v)} />
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
          <select
            value={tab.priority ?? 'cost'}
            onChange={e => setTab('priority', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          >
            <option value="cost">Cost</option>
            <option value="length">Length</option>
            <option value="joints">Joints</option>
          </select>
        </div>
      </DefaultsSection>

      {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      <div className="flex justify-between items-center">
        <button
          onClick={onReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset to Factory Defaults
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save App Defaults'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user: currentUser, can, loadConfig } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => can('canManageUsers') ? 'users' : 'boms');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Permissions tab state
  const [permissionsConfig, setPermissionsConfig] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [permissionsMsg, setPermissionsMsg] = useState('');
  const [autoLinkMsg, setAutoLinkMsg] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({ moduleParams: true, structural: true, site: true, cutLengths: true, optimizer: false, advanced: false, bomRates: false });

  // App Defaults tab state
  const [defaultsConfig, setDefaultsConfig] = useState(null);
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [defaultsSaving, setDefaultsSaving] = useState(false);
  const [defaultsMsg, setDefaultsMsg] = useState('');

  // Check if returning from AdminBOMView with a specific tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SALES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Credentials Modal State
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ username: '', password: '' });
  const [credentialAction, setCredentialAction] = useState('create'); // 'create' or 'reset'
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedBoth, setCopiedBoth] = useState(false);

  // Load permissions/defaults when switching to those tabs
  useEffect(() => {
    if (activeTab === 'permissions' && !permissionsConfig) {
      setPermissionsLoading(true);
      configAPI.getPermissions()
        .then(data => setPermissionsConfig(data))
        .catch(err => setPermissionsMsg('Failed to load permissions: ' + err.message))
        .finally(() => setPermissionsLoading(false));
    }
    if (activeTab === 'defaults' && !defaultsConfig) {
      setDefaultsLoading(true);
      configAPI.getDefaults()
        .then(data => setDefaultsConfig(data))
        .catch(err => setDefaultsMsg('Failed to load defaults: ' + err.message))
        .finally(() => setDefaultsLoading(false));
    }
  }, [activeTab]);

  const handleSavePermissions = async () => {
    setPermissionsSaving(true);
    setPermissionsMsg('');
    try {
      const updated = await configAPI.updatePermissions(permissionsConfig);
      setPermissionsConfig(updated);
      setPermissionsMsg('Permissions saved successfully.');
    } catch (err) {
      setPermissionsMsg('Error: ' + err.message);
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleSaveDefaults = async () => {
    setDefaultsSaving(true);
    setDefaultsMsg('');
    try {
      const updated = await configAPI.updateDefaults(defaultsConfig);
      setDefaultsConfig(updated);
      await loadConfig();
      setDefaultsMsg('App defaults saved successfully.');
    } catch (err) {
      setDefaultsMsg('Error: ' + err.message);
    } finally {
      setDefaultsSaving(false);
    }
  };

  const handleResetDefaultsToFactory = () => {
    if (!window.confirm('Reset to factory defaults? This will overwrite all current App Defaults.')) return;
    const FACTORY = {
      tabDefaults: {
        moduleLength: 2278, moduleWidth: 1134, frameThickness: 35,
        midClamp: 20, endClampWidth: 40, buffer: 15,
        purlinDistance: 1700, seamToSeamDistance: 400, maxSupportDistance: 1800,
        railsPerSide: 2, lengthsInput: '1595, 1798, 2400, 2750, 3600, 4800',
        maxPieces: 3, maxWastePct: '', alphaJoint: 220, betaSmall: 60,
        allowUndershootPct: 0, gammaShort: 5, costPerMm: '0.1',
        costPerJointSet: '50', joinerLength: '100', priority: 'cost',
      },
      bomDefaults: {
        aluminumRate: 460, hdgRatePerKg: 125, magnelisRatePerKg: 125, moduleWp: 590, sparePercentage: 1.0,
      },
    };
    setDefaultsConfig(FACTORY);
    setDefaultsMsg('Factory defaults loaded. Click Save to apply.');
  };

  const toggleFeaturePerm = (roleKey, permKey) => {
    if (roleKey === 'MANAGER_DESIGN') return; // always locked
    setAutoLinkMsg('');
    setPermissionsConfig(prev => {
      const current = prev[roleKey];
      const newVal = !current[permKey];
      const updated = { ...current, [permKey]: newVal };
      let msg = '';

      // Turning ON a permission that requires Admin Panel → auto-enable canAccessAdmin
      if (newVal && REQUIRES_ADMIN.includes(permKey) && !updated.canAccessAdmin) {
        updated.canAccessAdmin = true;
        msg = 'Admin Panel access was also enabled — it is required for this permission.';
      }

      // Turning OFF canAccessAdmin → auto-disable all dependent permissions
      if (!newVal && permKey === 'canAccessAdmin') {
        const disabled = [];
        REQUIRES_ADMIN.forEach(dep => {
          if (updated[dep]) {
            updated[dep] = false;
            const label = FEATURE_PERMS.find(p => p.key === dep)?.label ?? dep;
            disabled.push(label);
          }
        });
        if (disabled.length) {
          msg = `"${disabled.join('" and "')}" ${disabled.length > 1 ? 'were' : 'was'} also disabled — ${disabled.length > 1 ? 'they require' : 'it requires'} Admin Panel access.`;
        }
      }

      if (msg) setTimeout(() => setAutoLinkMsg(msg), 0);
      return { ...prev, [roleKey]: updated };
    });
  };

  const toggleTabField = (roleKey, fieldKey) => {
    if (roleKey === 'MANAGER_DESIGN') return;
    setPermissionsConfig(prev => {
      const current = prev[roleKey].editableTabFields ?? [];
      const has = current.includes(fieldKey);
      return {
        ...prev,
        [roleKey]: {
          ...prev[roleKey],
          editableTabFields: has ? current.filter(f => f !== fieldKey) : [...current, fieldKey],
        },
      };
    });
  };

  const toggleBomField = (roleKey, fieldKey) => {
    if (roleKey === 'MANAGER_DESIGN') return;
    setPermissionsConfig(prev => {
      const current = prev[roleKey].editableBomFields ?? [];
      const has = current.includes(fieldKey);
      return {
        ...prev,
        [roleKey]: {
          ...prev[roleKey],
          editableBomFields: has ? current.filter(f => f !== fieldKey) : [...current, fieldKey],
        },
      };
    });
  };

  // Generate random secure password
  const generatePassword = () => {
    const length = 12;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setPassword(password);
    setCopied(false); // Reset copied state when generating new password
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  // Copy credentials functions for modal
  const copyCredentialUsername = async () => {
    try {
      await navigator.clipboard.writeText(createdCredentials.username);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    } catch (err) {
      console.error('Failed to copy username:', err);
    }
  };

  const copyCredentialPassword = async () => {
    try {
      await navigator.clipboard.writeText(createdCredentials.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const copyBothCredentials = async () => {
    try {
      const credentialsText = `Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
      await navigator.clipboard.writeText(credentialsText);
      setCopiedBoth(true);
      setTimeout(() => setCopiedBoth(false), 2000);
    } catch (err) {
      console.error('Failed to copy credentials:', err);
    }
  };

  const closeCredentialsModal = () => {
    setShowCredentialsModal(false);
    setCreatedCredentials({ username: '', password: '' });
    setCopiedUsername(false);
    setCopiedPassword(false);
    setCopiedBoth(false);
  };

  useEffect(() => {
    if (can('canManageUsers')) loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await userAPI.create({ username, password, role });

      // Store credentials and show modal
      setCredentialAction('create');
      setCreatedCredentials({ username, password });
      setShowCredentialsModal(true);

      // Reset form
      setUsername('');
      setPassword('');
      setRole('SALES');
      setCopied(false);

      loadUsers(); // Refresh list
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus, username) => {
    // Add confirmation for HOLD action
    if (newStatus === 'HOLD') {
      if (!window.confirm(`Are you sure you want to put user "${username}" on hold? They won't be able to login until reactivated.`)) {
        return;
      }
    }

    try {
      await userAPI.updateStatus(userId, newStatus);
      loadUsers(); // Refresh list
    } catch (err) {
      console.error('Failed to update user status:', err);
      setError('Failed to update user status.');
    }
  };

  const handleResetPassword = async (userId, username) => {
    if (window.confirm(`Are you sure you want to reset password for user "${username}"? This will generate a new temporary password and the user will be set to INACTIVE status.`)) {
      try {
        const result = await userAPI.resetPassword(userId);

        // Show credentials modal with new password
        setCredentialAction('reset');
        setCreatedCredentials({
          username: username,
          password: result.temporaryPassword
        });
        setShowCredentialsModal(true);

        loadUsers(); // Refresh list
      } catch (err) {
        console.error('Failed to reset password:', err);
        setError('Failed to reset password.');
      }
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action will soft-delete the user (data will be preserved).`)) {
      try {
        await userAPI.delete(userId);
        loadUsers(); // Refresh list
      } catch (err) {
        console.error('Failed to delete user:', err);
        setError('Failed to delete user.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {/* Tab Navigation */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="flex border-b border-gray-200">
            {[
              can('canManageUsers') && { key: 'users', label: 'User Management' },
              { key: 'boms', label: 'BOM Management' },
              currentUser?.role === 'MANAGER_DESIGN' && { key: 'permissions', label: 'Permissions' },
              can('canEditAppDefaults') && { key: 'defaults', label: 'App Defaults' },
            ].filter(Boolean).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && !can('canManageUsers') ? (
          <div className="bg-white shadow sm:rounded-lg p-8 text-center text-gray-500">
            You do not have permission to manage users.
          </div>
        ) : activeTab === 'users' ? (
          <>
            {/* Add User Section */}
            <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New User</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Create a new user account. They will be required to change their password on first login.</p>
            </div>
            
            <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    id="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Temporary Password</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Generate password"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={copyPassword}
                      disabled={!password}
                      className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        copied
                          ? 'border-green-300 text-green-700 bg-green-50'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      } ${!password ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Copy password"
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                  >
                    <option value="SALES">SALES</option>
                    <option value="DESIGN">DESIGN</option>
                    <option value="MANAGER_SALES">MANAGER (Sales)</option>
                    <option value="MANAGER_DESIGN">MANAGER (Design)</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>

        {/* Users List Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Existing Users</h3>
          </div>
          <div className="border-t border-gray-200">
            {loading ? (
              <div className="px-4 py-5 text-center text-gray-500">Loading users...</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'MANAGER_DESIGN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'MANAGER_SALES' ? 'bg-indigo-100 text-indigo-800' :
                          user.role === 'DESIGN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          user.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                          user.status === 'HOLD' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-3">
                          {currentUser?.id !== user.id ? (
                            <>
                              <button
                                onClick={() => handleResetPassword(user.id, user.username)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Reset password"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete user"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              {user.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(user.id, 'HOLD', user.username)}
                                  className="text-orange-600 hover:text-orange-800 transition-colors"
                                  title="Put on hold"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                              {user.status === 'HOLD' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE', user.username)}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  title="Activate user"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Current User</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
          </>
        ) : activeTab === 'boms' ? (
          /* BOM Management Tab */
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">BOM Management</h3>
              <div className="mt-2 text-sm text-gray-500 mb-6">
                <p>View and manage all BOMs across all projects. Click "View" to open any BOM.</p>
              </div>
              <BOMManagementTab />
            </div>
          </div>
        ) : activeTab === 'permissions' ? (
          /* Permissions Tab */
          <PermissionsTab
            permissionsConfig={permissionsConfig}
            loading={permissionsLoading}
            saving={permissionsSaving}
            msg={permissionsMsg}
            autoLinkMsg={autoLinkMsg}
            expandedGroups={expandedGroups}
            setExpandedGroups={setExpandedGroups}
            onToggleFeature={toggleFeaturePerm}
            onToggleTabField={toggleTabField}
            onToggleBomField={toggleBomField}
            onSave={handleSavePermissions}
          />
        ) : (
          /* App Defaults Tab */
          <AppDefaultsTab
            defaultsConfig={defaultsConfig}
            setDefaultsConfig={setDefaultsConfig}
            loading={defaultsLoading}
            saving={defaultsSaving}
            msg={defaultsMsg}
            onSave={handleSaveDefaults}
            onReset={handleResetDefaultsToFactory}
          />
        )}

      </main>

      {/* Credentials Success Modal */}
      {showCredentialsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {credentialAction === 'reset' ? 'Password Reset Successfully!' : 'User Created Successfully!'}
                  </h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-4">
                      {credentialAction === 'reset'
                        ? 'Share these new credentials with the user:'
                        : 'Share these credentials with the new user:'}
                    </p>

                    {/* Credentials Box */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* Username */}
                      <div className="flex items-center justify-between">
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 font-medium">Username</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">{createdCredentials.username}</p>
                        </div>
                        <button
                          onClick={copyCredentialUsername}
                          className={`ml-3 inline-flex items-center px-3 py-2 border shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            copiedUsername
                              ? 'border-green-300 text-green-700 bg-green-50'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {copiedUsername ? (
                            <>
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 font-medium">Password</p>
                          <p className="text-sm font-mono text-gray-900 mt-1">{createdCredentials.password}</p>
                        </div>
                        <button
                          onClick={copyCredentialPassword}
                          className={`ml-3 inline-flex items-center px-3 py-2 border shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            copiedPassword
                              ? 'border-green-300 text-green-700 bg-green-50'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {copiedPassword ? (
                            <>
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-xs text-yellow-700">
                            Save these credentials now. The password won't be shown again.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={copyBothCredentials}
                  className={`w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-1 sm:text-sm ${
                    copiedBoth
                      ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
                  }`}
                >
                  {copiedBoth ? (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied Both!
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                      </svg>
                      Copy Both Credentials
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeCredentialsModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-2 sm:text-sm"
                >
                  Done
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
