import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { themes, ThemeColors } from '@/themes';
import ThemeMode, { ThemeMode as ThemeModeType } from './ThemeMode';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThemeSelectorProps {
  currentTheme: string;
  currentMode: ThemeModeType;
  onThemeChange: (theme: string, mode: ThemeModeType) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  currentMode,
  onThemeChange,
}) => {
  const handleModeChange = (mode: ThemeModeType) => {
    onThemeChange(currentTheme, mode);
  };

  const handleThemeSelect = (themeName: string) => {
    onThemeChange(themeName, currentMode);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Theme Mode</h3>
        <div className="flex flex-col space-y-2">
          {(['gradient', 'primary', 'secondary'] as ThemeModeType[]).map((mode) => (
            <ThemeMode
              key={mode}
              mode={mode}
              currentMode={currentMode}
              onSelect={handleModeChange}
              themeColors={themes[currentTheme as keyof typeof themes]}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3">Select Theme</h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(themes).map(([themeName, colors]) => (
              <motion.button
                key={themeName}
                onClick={() => handleThemeSelect(themeName)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  currentTheme === themeName
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                }`}
              >
                <div className="space-y-1">
                  <div
                    className="w-full h-12 rounded-md"
                    style={{
                      background:
                        currentMode === 'gradient'
                          ? `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`
                          : currentMode === 'primary'
                          ? colors.primary
                          : colors.secondary,
                      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                      border: '2px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <p className="text-xs font-medium text-white truncate px-1">{themeName}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ThemeSelector;