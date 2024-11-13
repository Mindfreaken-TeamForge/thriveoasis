import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Bell, ChevronRight } from 'lucide-react';
import { themes } from '../themes';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
  ownerId: string;
  memberCount?: number;
  alerts?: number;
}

interface OwnerOasisCardProps {
  oasis: Oasis;
  onViewOasis: (oasisId: string) => void;
}

const OwnerOasisCard: React.FC<OwnerOasisCardProps> = ({ oasis, onViewOasis }) => {
  const [memberCount, setMemberCount] = useState(oasis?.memberCount || 0);
  const themeColors = themes[oasis.theme as keyof typeof themes] || themes['Regal Sunrise'];

  const shinyBlackButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  const memberCounterStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
  };

  useEffect(() => {
    if (!oasis?.id) return;

    const membersRef = collection(db, 'oasis', oasis.id, 'members');
    const membersQuery = query(membersRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const count = snapshot.docs.length;
      setMemberCount(count);
    }, (error) => {
      console.error('Error getting members:', error);
    });

    return () => unsubscribe();
  }, [oasis?.id]);

  const oasisName = oasis?.name || 'Unnamed Oasis';
  const oasisAlerts = oasis?.alerts || 0;
  const oasisType = Array.isArray(oasis?.type) ? oasis.type[0] : oasis?.type || 'Unknown';

  return (
    <motion.div
      className="w-[225px] h-[300px] overflow-hidden relative transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-lg"
      style={{
        background: themeColors.background,
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `3px solid ${themeColors.primary}`,
      }}
    >
      <div className="p-4 flex flex-col h-full justify-between">
        <div style={memberCounterStyle} className="absolute top-2 left-2 z-10">
          <Users size={14} className="text-white" />
          <span className="ml-1 text-xs font-semibold text-white">
            {memberCount}
          </span>
        </div>

        <div className="mb-2">
          <h3
            className="text-xl font-bold text-center m-0"
            style={{
              color: 'white',
              textShadow: `0 2px 2px ${themeColors.accent}`,
            }}
          >
            {oasisName}
          </h3>
          <p className="text-xs text-center mt-1 text-white opacity-80">
            {oasisType} Oasis
          </p>
        </div>

        <div
          className="h-[150px] flex justify-center items-center overflow-hidden rounded-lg mb-2"
          style={{
            background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.accent})`,
          }}
        >
          {oasis.imageUrl ? (
            <img
              src={oasis.imageUrl}
              alt={oasisName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-6xl font-bold"
              style={{
                color: 'white',
                textShadow: `0 2px 4px ${themeColors.primary}`,
              }}
            >
              {oasisName[0]}
            </span>
          )}
        </div>

        <div className="flex-grow flex flex-col justify-between">
          <div className="flex justify-end items-center mt-2">
            {oasisAlerts > 0 && (
              <Badge variant="destructive" className="flex items-center">
                <Bell size={18} className="mr-1" />
                {oasisAlerts}
              </Badge>
            )}
          </div>

          <Button
            onClick={() => onViewOasis(oasis.id)}
            className="w-full mt-4 font-medium flex items-center justify-center text-white transition-transform hover:scale-105"
            style={shinyBlackButtonStyle}
          >
            <span className="mr-2">Manage Oasis</span>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default OwnerOasisCard;