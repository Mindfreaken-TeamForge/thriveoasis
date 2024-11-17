import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Bell, ChevronRight } from 'lucide-react';
import { themes } from '../themes';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ThemeMode } from '@/components/ThemeSelector/ThemeMode';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
  themeMode?: ThemeMode;
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
  const [currentTheme, setCurrentTheme] = useState(oasis.theme);
  const [themeMode, setThemeMode] = useState<ThemeMode>(oasis.themeMode || 'gradient');
  const themeColors = themes[currentTheme as keyof typeof themes] || themes['Thrive Oasis(Default)'];

  const shinyBlackButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const memberCountStyle: React.CSSProperties = {
    ...shinyBlackButtonStyle,
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px', // Makes it oval
    minWidth: '4rem',
    height: '1.75rem',
  };

  useEffect(() => {
    if (!oasis?.id) return;

    // Listen for member count changes
    const membersRef = collection(db, 'oasis', oasis.id, 'members');
    const membersQuery = query(membersRef, where('status', '==', 'active'));

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      setMemberCount(snapshot.docs.length);
    }, (error) => {
      console.error('Error getting members:', error);
    });

    // Listen for theme changes
    const oasisRef = doc(db, 'oasis', oasis.id);
    const unsubscribeTheme = onSnapshot(oasisRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.theme !== currentTheme) {
          setCurrentTheme(data.theme);
        }
        if (data.themeMode !== themeMode) {
          setThemeMode(data.themeMode || 'gradient');
        }
      }
    }, (error) => {
      console.error('Error listening to theme changes:', error);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeTheme();
    };
  }, [oasis?.id, currentTheme, themeMode]);

  const getThemeBackground = () => {
    switch (themeMode) {
      case 'gradient':
        return `linear-gradient(145deg, ${themeColors.primary}, ${themeColors.secondary})`;
      case 'primary':
        return themeColors.primary;
      case 'secondary':
        return themeColors.secondary;
      default:
        return `linear-gradient(145deg, ${themeColors.primary}, ${themeColors.secondary})`;
    }
  };

  return (
    <motion.div
      className="w-full max-w-md"
      whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${themeColors.accent}` }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="overflow-hidden relative rounded-lg transition-all duration-300"
        style={{
          background: getThemeBackground(),
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `3px solid ${themeColors.primary}`,
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={oasis.imageUrl} alt={oasis.name} />
              <AvatarFallback
                className="text-2xl font-bold"
                style={{
                  backgroundColor: themeColors.secondary,
                  color: 'white',
                }}
              >
                {oasis.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-grow min-w-0">
              <h3
                className="text-2xl font-bold truncate"
                title={oasis.name}
                style={{ color: 'white' }}
              >
                {oasis.name}
              </h3>
              <div className="flex items-center mt-1 text-sm text-white">
                <span className="truncate mr-2">{oasis.type} Oasis</span>
                <div 
                  className="flex items-center space-x-1"
                  style={memberCountStyle}
                >
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-semibold">{memberCount}</span>
                </div>
              </div>
            </div>
          </div>

          {oasis.alerts && oasis.alerts > 0 && (
            <Badge variant="destructive" className="absolute top-4 right-4 flex items-center">
              <Bell className="w-4 h-4 mr-1" />
              {oasis.alerts}
            </Badge>
          )}
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            onClick={() => onViewOasis(oasis.id)}
            className="w-full font-medium flex items-center justify-center text-white transition-transform hover:scale-105"
            style={shinyBlackButtonStyle}
          >
            <span className="mr-2">Manage Oasis</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default OwnerOasisCard;