import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Settings, Users, Shield, Bell, MessageSquare } from 'lucide-react';
import { ThemeColors } from '@/themes';
import ThemeSelector from '../ThemeSelector/ThemeSelector';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../ThemeSelector/ThemeMode';

interface OasisData {
  id?: string;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
  themeMode?: ThemeMode;
}

interface QuickActionsProps {
  themeColors: ThemeColors;
  currentTheme: string;
  themes: Record<string, ThemeColors>;
  handleThemeChange: (theme: string, mode: ThemeMode) => void;
  setIsRoleManagementOpen: (isOpen: boolean) => void;
  cardStyle: React.CSSProperties;
  oasisData?: OasisData;
  currentMode: ThemeMode;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  themeColors,
  currentTheme,
  themes,
  handleThemeChange,
  setIsRoleManagementOpen,
  cardStyle,
  oasisData = { tier: 'Free' },
  currentMode,
}) => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    announcement: false,
    roles: false,
    notifications: false,
    theme: false
  });
  const isPremium = oasisData?.tier === 'Premium';

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

  const handleButtonClick = async (action: keyof typeof loadingStates) => {
    setLoadingStates(prev => ({ ...prev, [action]: true }));

    try {
      switch (action) {
        case 'roles':
          setIsRoleManagementOpen(true);
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'theme':
          if (isPremium) {
            setIsThemeDialogOpen(true);
          } else {
            setIsPremiumDialogOpen(true);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'announcement':
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'notifications':
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [action]: false }));
    }
  };

  const renderButton = (
    action: keyof typeof loadingStates,
    icon: React.ReactNode,
    text: string,
    onClick?: () => void
  ) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Button
        className="flex items-center justify-center relative overflow-hidden w-full"
        style={{
          ...shinyBlackButtonStyle,
          opacity: loadingStates[action] ? 0.8 : 1,
        }}
        onClick={() => {
          handleButtonClick(action);
          onClick?.();
        }}
        disabled={loadingStates[action]}
      >
        {loadingStates[action] && (
          <div className="absolute inset-0 bg-white/5" />
        )}
        {icon}
        <span className="ml-2">{text}</span>
      </Button>
    </motion.div>
  );

  return (
    <Card
      className="w-[250px] h-[350px] overflow-hidden relative transition-all duration-300 hover:scale-105 hover:shadow-lg"
      style={{
        background: 'rgb(17 24 39)',
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `1px solid rgb(75 85 99)`,
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className="text-xl text-white flex items-center"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Quick Actions
        </CardTitle>
        <CardDescription
          style={{
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          Manage your community oasis efficiently
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {renderButton('announcement', <MessageSquare className="mr-2 h-4 w-4" />, 'Send Announcement')}
        {renderButton('roles', <Shield className="mr-2 h-4 w-4" />, 'Manage Roles')}
        {renderButton('notifications', <Bell className="mr-2 h-4 w-4" />, 'Notifications')}
        {renderButton('theme', <Settings className="mr-2 h-4 w-4" />, 'Change Theme')}
      </CardContent>

      {/* Theme Selection Dialog */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-xl">
          <DialogHeader>
            <DialogTitle>Customize Oasis Theme</DialogTitle>
          </DialogHeader>
          <ThemeSelector
            currentTheme={currentTheme}
            currentMode={currentMode}
            onThemeChange={handleThemeChange}
          />
        </DialogContent>
      </Dialog>

      {/* Premium Feature Dialog */}
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Premium Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Theme customization is available exclusively for Premium Oasis members.</p>
            <Button
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
              onClick={() => setIsPremiumDialogOpen(false)}
            >
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuickActions;