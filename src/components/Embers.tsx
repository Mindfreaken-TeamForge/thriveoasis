import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Ember {
  id: number;
  x: number;
  y: number;
}

const Embers: React.FC = () => {
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const createEmber = () => {
      const newEmber: Ember = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
      };
      setEmbers((prevEmbers) => [...prevEmbers, newEmber]);
    };

    const interval = setInterval(createEmber, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const removeOldEmbers = () => {
      setEmbers((prevEmbers) => prevEmbers.filter((ember) => ember.y > -10));
    };

    const interval = setInterval(removeOldEmbers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="absolute w-2 h-2 bg-red-500 rounded-full opacity-75"
          initial={{ x: ember.x, y: ember.y }}
          animate={{
            y: -10,
            opacity: 0,
          }}
          transition={{
            duration: 3,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default Embers;