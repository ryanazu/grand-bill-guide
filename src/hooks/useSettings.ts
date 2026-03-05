import { useState, useCallback } from 'react';
import { FlagRule, DEFAULT_FLAG_RULES } from '@/types/flagRule';

interface AppSettings {
  maxRatePerNight: number;
  flagRules: FlagRule[];
}

const DEFAULT_SETTINGS: AppSettings = {
  maxRatePerNight: 200,
  flagRules: DEFAULT_FLAG_RULES,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('app-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          flagRules: parsed.flagRules?.length ? parsed.flagRules : DEFAULT_FLAG_RULES,
        };
      }
      return DEFAULT_SETTINGS;
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
