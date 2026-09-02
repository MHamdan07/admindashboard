import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  PRODUCTS_VIEW: 'PRODUCTS_VIEW',
  PRODUCTS_CREATE: 'PRODUCTS_CREATE',
  PRODUCTS_EDIT: 'PRODUCTS_EDIT',
  PRODUCTS_DELETE: 'PRODUCTS_DELETE',
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_EDIT: 'INVENTORY_EDIT',
  ORDERS_VIEW: 'ORDERS_VIEW',
  ORDERS_EDIT: 'ORDERS_EDIT',
  ORDERS_UPDATE_STATUS: 'ORDERS_UPDATE_STATUS',
  CUSTOMERS_VIEW: 'CUSTOMERS_VIEW',
  CUSTOMERS_EDIT: 'CUSTOMERS_EDIT',
  HOMEPAGE_CMS_VIEW: 'HOMEPAGE_CMS_VIEW',
  HOMEPAGE_CMS_EDIT: 'HOMEPAGE_CMS_EDIT',
  FOOTER_CMS_EDIT: 'FOOTER_CMS_EDIT',
  MEDIA_VIEW: 'MEDIA_VIEW',
  MEDIA_UPLOAD: 'MEDIA_UPLOAD',
  MEDIA_DELETE: 'MEDIA_DELETE',
  SETTINGS_VIEW: 'SETTINGS_VIEW',
  SETTINGS_EDIT: 'SETTINGS_EDIT',
  STAFF_VIEW: 'STAFF_VIEW',
  STAFF_CREATE: 'STAFF_CREATE',
  STAFF_EDIT: 'STAFF_EDIT',
  STAFF_DISABLE: 'STAFF_DISABLE',
  STAFF_DELETE: 'STAFF_DELETE',
  SECURITY_VIEW: 'SECURITY_VIEW',
  SECURITY_MANAGE: 'SECURITY_MANAGE',
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aydara_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('aydara_token') || '');
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('aydara_permissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Derive authorization flags
  const role = user?.role || 'CUSTOMER';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'STAFF';
  const isStaff = role === 'STAFF';
  const isCustomer = role === 'CUSTOMER' || !role;

  // Permission checking helper
  const hasPermission = useCallback((permissionName) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return Array.isArray(permissions) && permissions.includes(permissionName);
  }, [user, permissions]);

  // Fetch full user role & permissions from Supabase
  const loadUserAuthorization = useCallback(async (userEmail, userRole) => {
    if (!userEmail) return [];
    try {
      const perms = await api.getUserPermissions(userEmail, userRole);
      setPermissions(perms);
      localStorage.setItem('aydara_permissions', JSON.stringify(perms));
      return perms;
    } catch (e) {
      console.warn('Authorization load notice:', e.message);
      return [];
    }
  }, []);

  // Validate session against Supabase Auth & user_roles on mount
  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      if (!supabase) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const cleanEmail = session.user.email.trim().toLowerCase();

          // Query user_roles table
          const { data: roleRows } = await supabase
            .from('user_roles')
            .select('*')
            .or(`user_id.eq.${session.user.id},email.ilike.${cleanEmail}`)
            .limit(1);

          let userRole = roleRows && roleRows.length > 0 ? roleRows[0] : null;

          if (!userRole && cleanEmail === 'entermh07@gmail.com') {
            userRole = { role: 'SUPER_ADMIN', is_active: true };
          }

          if (userRole && userRole.is_active !== false && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole.role)) {
            const perms = await api.getUserPermissions(cleanEmail, userRole.role);
            if (isMounted) {
              const updatedUser = {
                id: session.user.id,
                email: cleanEmail,
                name: userRole.role === 'SUPER_ADMIN' ? 'M Hamdan' : (session.user.user_metadata?.name || cleanEmail.split('@')[0]),
                role: userRole.role
              };
              setUser(updatedUser);
              setPermissions(perms);
              setToken(session.access_token);
              localStorage.setItem('aydara_user', JSON.stringify(updatedUser));
              localStorage.setItem('aydara_permissions', JSON.stringify(perms));
              localStorage.setItem('aydara_token', session.access_token);
            }
          } else if (userRole && userRole.role === 'CUSTOMER') {
            if (isMounted) {
              const customerUser = {
                id: session.user.id,
                email: cleanEmail,
                name: session.user.user_metadata?.name || cleanEmail.split('@')[0],
                role: 'CUSTOMER'
              };
              setUser(customerUser);
              setPermissions([]);
              setToken(session.access_token);
              localStorage.setItem('aydara_user', JSON.stringify(customerUser));
            }
          }
        }
      } catch (e) {
        console.warn('Session verification notice:', e);
      }
    };

    validateSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setToken('');
          setPermissions([]);
          localStorage.removeItem('aydara_user');
          localStorage.removeItem('aydara_token');
          localStorage.removeItem('aydara_permissions');
        }
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session?.user?.email) {
          validateSession();
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Customer Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('aydara_user', JSON.stringify(res.user));
        localStorage.setItem('aydara_token', res.token);
        await loadUserAuthorization(res.user.email, res.user.role);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Invalid email or password.' };
    } catch {
      return { success: false, message: 'Server connection error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Administrative Portal Login
  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.adminLogin({ email, password });
      if (res.success && res.user) {
        // Enforce admin/staff authorization guard
        if (res.user.role === 'CUSTOMER' || !res.user.role) {
          return {
            success: false,
            message: 'Access denied. This account is not authorized to access the administration portal.'
          };
        }

        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('aydara_user', JSON.stringify(res.user));
        localStorage.setItem('aydara_token', res.token);
        
        const perms = await loadUserAuthorization(res.user.email, res.user.role);

        // Record Audit Log
        api.logSecurityEvent('ADMIN_LOGIN_SUCCESS', res.user.email, { role: res.user.role }, res.token).catch(() => {});

        return { success: true, user: res.user, permissions: perms };
      }

      // Log Failed Attempt
      api.logSecurityEvent('ADMIN_LOGIN_FAILED', email, { reason: res.message }, '').catch(() => {});

      return {
        success: false,
        message: res.message || 'Invalid administrative credentials or insufficient privileges.'
      };
    } catch {
      return { success: false, message: 'Administrative authentication server connection failed.' };
    } finally {
      setLoading(false);
    }
  };

  // Customer Registration
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('aydara_user', JSON.stringify(res.user));
        localStorage.setItem('aydara_token', res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed.' };
    } catch {
      return { success: false, message: 'Unable to complete registration. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Change Password for Logged-In User / Admin
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, message: 'User not authenticated' };
    setLoading(true);
    try {
      const res = await api.changeAdminPassword(user.email, currentPassword, newPassword, token);
      if (res.success) {
        api.logSecurityEvent('PASSWORD_CHANGED', user.email, {}, token).catch(() => {});
      }
      return res;
    } catch {
      return { success: false, message: 'Password update failed. Please verify current credentials.' };
    } finally {
      setLoading(false);
    }
  };

  // Logout (Invalidates session & clears state)
  const logout = () => {
    if (user?.email && isAdmin) {
      api.logSecurityEvent('ADMIN_LOGOUT', user.email, {}, token).catch(() => {});
    }
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setToken('');
    setPermissions([]);
    localStorage.removeItem('aydara_user');
    localStorage.removeItem('aydara_token');
    localStorage.removeItem('aydara_permissions');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        permissions,
        isSuperAdmin,
        isAdmin,
        isStaff,
        isCustomer,
        loading,
        hasPermission,
        login,
        adminLogin,
        register,
        changePassword,
        logout,
        loadUserAuthorization
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: '',
      role: 'CUSTOMER',
      permissions: [],
      isSuperAdmin: false,
      isAdmin: false,
      isStaff: false,
      isCustomer: true,
      loading: false,
      hasPermission: () => false,
      login: async () => ({ success: false }),
      adminLogin: async () => ({ success: false }),
      register: async () => ({ success: false }),
      changePassword: async () => ({ success: false }),
      logout: () => {},
      loadUserAuthorization: async () => []
    };
  }
  return context;
};
