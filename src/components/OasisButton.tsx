'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Tooltip } from '@nextui-org/react';

interface OasisButtonProps {
  oasisName: string;
  onClick: () => void;
  imageUrl?: string;
}

export default function OasisButton({
  oasisName,
  onClick,
  imageUrl,
}: OasisButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buttonRef.current && isHovered) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);

  const calculateTransform = () => {
    if (!isHovered) return 'translateZ(0) rotateX(0deg) rotateY(0deg)';
    const { x, y } = mousePosition;
    const tiltX = (y - 0.5) * 20;
    const tiltY = (x - 0.5) * -20;
    const scale = isPressed ? 0.95 : 1.05;
    return `translateZ(20px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
  };

  const getDisplayText = () => {
    if (!oasisName) return '??';
    return oasisName.replace(/\s+/g, '').slice(0, 2).toUpperCase();
  };

  const getRandomColor = () => {
    const colors = [
      '$blue500',
      '$green500',
      '$purple500',
      '$red500',
      '$yellow500',
      '$pink500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const buttonColor = useRef(getRandomColor()).current;

  return (
    <Tooltip content={oasisName} placement="right">
      <div
        className="w-14 h-14 mb-4 relative"
        style={{ perspective: '1000px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
      >
        <Button
          ref={buttonRef}
          auto
          light
          onPress={onClick}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          css={{
            width: '100%',
            height: '100%',
            borderRadius: '$xl',
            background: `${buttonColor}cc`,
            boxShadow: `0 0 8px ${buttonColor}80, inset 0 0 8px ${buttonColor}80`,
            border: `1px solid ${buttonColor}`,
            transform: calculateTransform(),
            transition: 'all 0.3s ease-out',
            transformStyle: 'preserve-3d',
            '&:hover': {
              opacity: 1,
              transform: `${calculateTransform()} translateY(-3px)`,
            },
            '&:active': {
              transform: `${calculateTransform()} translateY(-1px)`,
            },
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={oasisName || 'Oasis image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'inherit',
              }}
            />
          ) : (
            <span className="text-xl font-bold text-white drop-shadow-md">
              {getDisplayText()}
            </span>
          )}
        </Button>
      </div>
    </Tooltip>
  );
}
