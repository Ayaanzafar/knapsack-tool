import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, configAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [appDefaults, setAppDefaults] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = async () => {
    try {
      const [permsData, defaultsData] = await Promise.all([
        configAPI.getPermissions(),
        configAPI.getDefaults(),
      ]);
      setPermissions(permsData);
      setAppDefaults(defaultsData);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          await loadConfig();
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    await loadConfig();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions(null);
    setAppDefaults(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Feature-level permission check: can('canAccessAdmin')
  const can = (permissionKey) => {
    if (!user || !permissions) return false;
    return permissions[user.role]?.[permissionKey] === true;
  };

  // Field-level permission check: canEditField('buffer') or canEditField('aluminumRate', 'bom')
  const canEditField = (fieldKey, fieldGroup = 'tab') => {
    if (!user || !permissions) return false;
    const key = fieldGroup === 'bom' ? 'editableBomFields' : 'editableTabFields';
    const fields = permissions[user.role]?.[key] ?? [];
    return fields.includes('all') || fields.includes(fieldKey);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      permissions,
      appDefaults,
      can,
      canEditField,
      login,
      logout,
      refreshUser,
      loadConfig,
      loading,
      isAuthenticated: !!user,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
