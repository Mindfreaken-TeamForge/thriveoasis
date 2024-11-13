import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorSelectorProps {
  color: string;
  onChange: (color: string) => void;
}

const presetColors = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Zinc', value: '#71717a' },
  { name: 'Neutral', value: '#737373' },
  { name: 'Stone', value: '#78716c' },
];

export default function ColorSelector({ color, onChange }: ColorSelectorProps) {
  const isCustomColor = !presetColors.some(preset => preset.value === color);

  return (
    <div className="w-48">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 justify-between bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full transition-transform duration-200"
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
              <span className="text-white text-sm flex-grow text-left truncate">
                {isCustomColor ? 'Custom' : presetColors.find(p => p.value === color)?.name || 'Select'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-48 p-3 bg-gray-800 border-gray-700"
          align="start"
        >
          <div className="grid grid-cols-5 gap-2 mb-3">
            {presetColors.map((preset) => (
              <button
                key={preset.value}
                className="w-6 h-6 rounded-lg relative hover:scale-110 transition-all duration-200"
                style={{ 
                  backgroundColor: preset.value,
                  boxShadow: `0 0 8px ${preset.value}`,
                }}
                onClick={() => onChange(preset.value)}
                title={preset.name}
              >
                {color === preset.value && (
                  <Check className="absolute inset-0 m-auto text-white w-3 h-3 drop-shadow-lg" />
                )}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-700">
            <Label className="text-sm font-medium text-white mb-2 block">
              Custom Color
            </Label>
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-8 h-8 p-1 bg-transparent border-0 cursor-pointer absolute opacity-0"
                />
                <div
                  className="w-8 h-8 rounded-md transition-transform duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
              </div>
              <Input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 h-8 bg-gray-900 border-gray-700 text-white text-sm"
                placeholder="#000000"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}