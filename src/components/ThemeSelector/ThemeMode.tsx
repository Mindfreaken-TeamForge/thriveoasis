import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ThemeMode = 'gradient' | 'primary' | 'secondary';

interface ThemeModeProps {
  mode: ThemeMode;
  currentMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
  themeColors: {
    primary: string;
    secondary: string;
  };
}

const ThemeMode: React.FC<ThemeModeProps> = ({
  mode,
  currentMode,
  onSelect,
  themeColors,
}) => {
  const getPreviewStyle = () => {
    switch (mode) {
      case 'gradient':
        return {
          background: `linear-gradient(145deg, ${themeColors.primary}, ${themeColors.secondary})`,
        };
      case 'primary':
        return {
          background: themeColors.primary,
        };
      case 'secondary':
        return {
          background: themeColors.secondary,
        };
    }
  };

  return (
    <Button
      onClick={() => onSelect(mode)}
      className={`relative h-10 flex items-center justify-start px-3 border transition-all duration-200 ${
        currentMode === mode
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
      }`}
    >
      <div
        className="w-6 h-6 rounded-md mr-3 flex-shrink-0"
        style={{
          ...getPreviewStyle(),
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.1)',
        }}
      />
      <span className="text-sm font-medium text-white capitalize">
        {mode}
      </span>
      {currentMode === mode && (
        <div className="absolute top-1.5 right-1.5 bg-blue-500 rounded-full p-0.5">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </Button>
  );
};

export default ThemeMode;