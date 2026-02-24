import { useState, useCallback } from 'react';

interface AppSettings {
  maxRatePerNight: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  maxRatePerNight: 200,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('app-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('app-settings', JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
