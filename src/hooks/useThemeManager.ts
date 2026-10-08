import { useState, useEffect, useCallback } from 'react';
import {
  ThemeConfig,
  ThemeId,
  FontId,
  FontSizeScale,
  AVAILABLE_FONTS,
} from '../types/theme';

const STORAGE_KEY = 'somuch_theme_config_v2';

const DEFAULT_CONFIG: ThemeConfig = {
  theme: 'somuch-red',
  font: 'cairo',
  fontSize: 'normal',
  tabularNums: true,
};

export function useThemeManager() {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  // Apply theme and font attributes to root element whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore localstorage quota
    }

    const root = document.documentElement;
    const body = document.body;

    // 1. Data attributes
    root.setAttribute('data-theme', config.theme);
    root.setAttribute('data-font', config.font);
    root.setAttribute('data-font-size', config.fontSize);

    // 2. Font family CSS variable
    const selectedFont = AVAILABLE_FONTS.find((f) => f.id === config.font) || AVAILABLE_FONTS[0];
    root.style.setProperty('--app-font-family', selectedFont.familyCss);
    if (body) {
      body.style.fontFamily = selectedFont.familyCss;
    }

    // 3. Font scaling
    const scaleMap: Record<FontSizeScale, string> = {
      compact: '0.92',
      normal: '1.0',
      large: '1.08',
      xlarge: '1.18',
    };
    root.style.setProperty('--font-scale', scaleMap[config.fontSize] || '1.0');

    // 4. Tabular nums
    if (config.tabularNums) {
      root.style.fontVariantNumeric = 'tabular-nums';
    } else {
      root.style.fontVariantNumeric = 'normal';
    }

    // 5. Light vs Dark theme classes
    if (config.theme === 'clean-light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [config]);

  const setTheme = useCallback((theme: ThemeId) => {
    setConfig((prev) => ({ ...prev, theme }));
  }, []);

  const setFont = useCallback((font: FontId) => {
    setConfig((prev) => ({ ...prev, font }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSizeScale) => {
    setConfig((prev) => ({ ...prev, fontSize }));
  }, []);

  const setTabularNums = useCallback((tabularNums: boolean) => {
    setConfig((prev) => ({ ...prev, tabularNums }));
  }, []);

  const resetDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return {
    config,
    setTheme,
    setFont,
    setFontSize,
    setTabularNums,
    resetDefaults,
  };
}
