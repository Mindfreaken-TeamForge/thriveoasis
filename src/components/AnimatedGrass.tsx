import React from 'react';
import { motion } from 'framer-motion';

const AnimatedGrass = () => {
  const getRandomHeight = () => Math.random() * 30 + 20; // Shorter grass
  const getRandomDelay = () => Math.random() * 1.5;
  const getRandomDuration = () => Math.random() * 1.5 + 2;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
      <div className="relative w-full h-full">
        {/* Base ground layer */}
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-green-800 via-green-700 to-transparent" />
        
        {/* Dense grass layer */}
        <div className="absolute bottom-0 left-0 right-0 h-24">
          {[...Array(200)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 origin-bottom-left"
              style={{
                width: '3px',
                height: `${getRandomHeight()}px`,
                left: `${(i / 200) * 100}%`,
                background: `linear-gradient(to top, 
                  ${i % 3 === 0 ? '#166534' : i % 3 === 1 ? '#15803d' : '#14532d'},
                  ${i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#16a34a' : '#15803d'})`,
                borderRadius: '100% 0 0 0',
                transformOrigin: 'bottom center',
                zIndex: Math.floor(i / 4),
              }}
              animate={{
                rotateZ: ['0deg', '3deg', '-2deg', '0deg'],
                scaleY: [1, 1.02, 0.98, 1],
              }}
              transition={{
                duration: getRandomDuration(),
                repeat: Infinity,
                ease: "easeInOut",
                delay: getRandomDelay(),
              }}
            />
          ))}
        </div>

        {/* Foreground detailed grass */}
        <div className="absolute bottom-0 left-0 right-0 h-20">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={`detail-${i}`}
              className="absolute bottom-0 origin-bottom-left"
              style={{
                width: '2px',
                height: `${getRandomHeight() * 0.8}px`,
                left: `${(i / 100) * 100}%`,
                background: `linear-gradient(to top,
                  ${i % 2 === 0 ? '#15803d' : '#166534'},
                  ${i % 2 === 0 ? '#22c55e' : '#16a34a'})`,
                borderRadius: '100% 0 0 0',
                transformOrigin: 'bottom center',
                zIndex: 20 + Math.floor(i / 4),
              }}
              animate={{
                rotateZ: ['2deg', '-2deg', '2deg'],
                scaleY: [1, 1.03, 1],
              }}
              transition={{
                duration: getRandomDuration() * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: getRandomDelay(),
              }}
            />
          ))}
        </div>

        {/* Light effect overlay */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-full opacity-30"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedGrass;