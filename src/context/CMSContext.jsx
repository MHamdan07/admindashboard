import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const CMSContext = createContext();

export const CMSProvider = ({ children }) => {
  const [homepage, setHomepage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(Date.now());

  const refreshCMS = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.getHomepage(),
        api.getCategories(),
        api.getSettings()
      ]);

      const [hp, cat, set] = results;

      if (hp.status === 'fulfilled' && hp.value?.success) {
        setHomepage(prev => JSON.stringify(prev) === JSON.stringify(hp.value.homepage) ? prev : hp.value.homepage);
      }
      if (cat.status === 'fulfilled' && cat.value?.success) {
        setCategories(prev => JSON.stringify(prev) === JSON.stringify(cat.value.categories) ? prev : cat.value.categories);
      }
      if (set.status === 'fulfilled' && set.value?.success) {
        setSettings(prev => JSON.stringify(prev) === JSON.stringify(set.value.settings) ? prev : set.value.settings);
      }
      setLastSync(prev => prev);
    } catch (err) {
      console.warn('[AYDARA CMS Sync Notice]:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Broadcast sync trigger to all open tabs & devices
  const triggerGlobalBroadcast = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aydara_cms_sync_event', Date.now().toString());
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('aydara_live_sync');
          channel.postMessage({ type: 'CMS_REFRESH', timestamp: Date.now() });
          channel.close();
        }
      }
    } catch (e) {
      // Ignore broadcast errors
    }
    refreshCMS();
  }, [refreshCMS]);

  useEffect(() => {
    refreshCMS();

    // 1. Live background polling every 10 seconds for real-time storefront sync across devices
    const interval = setInterval(refreshCMS, 10000);

    // 2. Immediate sync when user refocuses or navigates back to tab
    const handleFocus = () => refreshCMS();
    window.addEventListener('focus', handleFocus);

    // 3. Cross-tab instant synchronization via Storage Event & BroadcastChannel
    const handleStorage = (e) => {
      if (e.key === 'aydara_cms_sync_event') {
        refreshCMS();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('aydara_live_sync');
      channel.onmessage = () => {
        refreshCMS();
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [refreshCMS]);

  return (
    <CMSContext.Provider
      value={{
        homepage,
        categories,
        settings,
        loading,
        lastSync,
        refreshCMS,
        triggerGlobalBroadcast
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    return {
      homepage: null,
      categories: [],
      settings: null,
      loading: false,
      lastSync: Date.now(),
      refreshCMS: async () => {},
      triggerGlobalBroadcast: () => {}
    };
  }
  return context;
};
