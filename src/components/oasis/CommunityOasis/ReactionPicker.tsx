import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  anchorEl: HTMLButtonElement | null;
}

const commonEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯'];

const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSelectReaction,
  anchorEl,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorEl) return null;

  const anchorRect = anchorEl.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const pickerWidth = 320;
  const pickerHeight = 48;
  const padding = 8;

  let left = anchorRect.left + (anchorRect.width / 2) - (pickerWidth / 2);
  left = Math.max(padding, Math.min(left, viewportWidth - pickerWidth - padding));

  const spaceBelow = viewportHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;
  const showAbove = spaceBelow < (pickerHeight + padding) && spaceAbove > spaceBelow;

  const top = showAbove 
    ? anchorRect.top - pickerHeight - padding
    : anchorRect.bottom + padding;

  const arrowOffset = Math.max(10, Math.min(
    anchorRect.left - left + (anchorRect.width / 2),
    pickerWidth - 10
  ));

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: showAbove ? 10 : -10 }}
        className="fixed z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-2 overflow-hidden"
        style={{
          left,
          top,
          width: pickerWidth,
          maxHeight: '200px',
        }}
      >
        <div className="grid grid-cols-10 gap-1 auto-rows-max overflow-y-auto">
          {commonEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-800 flex items-center justify-center"
              onClick={() => {
                onSelectReaction(emoji);
                onClose();
              }}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
        <div 
          className="absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45"
          style={{
            [showAbove ? 'bottom' : 'top']: '-5px',
            left: `${arrowOffset}px`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: showAbove 
              ? 'transparent rgb(55 65 81) rgb(55 65 81) transparent'
              : 'rgb(55 65 81) transparent transparent rgb(55 65 81)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default ReactionPicker;