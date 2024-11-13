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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Bell, Palette, Megaphone, Crown, UserCog } from 'lucide-react';
import { ThemeColors } from '../../themes';
import { motion } from 'framer-motion';

interface OasisData {
  id?: string;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
}

interface QuickActionsProps {
  themeColors: ThemeColors;
  currentTheme: string;
  themes: Record<string, ThemeColors>;
  handleThemeChange: (theme: string) => void;
  setIsRoleManagementOpen: (isOpen: boolean) => void;
  cardStyle: React.CSSProperties;
  oasisData?: OasisData;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  themeColors,
  currentTheme,
  themes,
  handleThemeChange,
  setIsRoleManagementOpen,
  cardStyle,
  oasisData = { tier: 'Free' },
}) => {
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [isPremiumPopoverOpen, setIsPremiumPopoverOpen] = useState(false);
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
    // Set loading state
    setLoadingStates(prev => ({ ...prev, [action]: true }));

    try {
      // Handle specific actions
      switch (action) {
        case 'roles':
          setIsRoleManagementOpen(true);
          // Keep loading state for a moment to show feedback
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'theme':
          if (isPremium) {
            setIsThemePopoverOpen(true);
          } else {
            setIsPremiumPopoverOpen(true);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'announcement':
          // Simulate announcement action
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        case 'notifications':
          // Simulate notifications action
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
      }
    } finally {
      // Reset loading state after action completes
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
        {renderButton('announcement', <Megaphone className="mr-2 h-4 w-4" />, 'Send Announcement')}
        {renderButton('roles', <UserCog className="mr-2 h-4 w-4" />, 'Manage Roles')}
        {renderButton('notifications', <Bell className="mr-2 h-4 w-4" />, 'Notifications')}

        {isPremium ? (
          <Popover
            open={isThemePopoverOpen}
            onOpenChange={setIsThemePopoverOpen}
          >
            <PopoverTrigger asChild>
              {renderButton('theme', <Palette className="mr-2 h-4 w-4" />, 'Change Oasis Theme')}
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] p-4 bg-gray-800 border-gray-700"
              align="end"
            >
              <Command className="rounded-lg bg-transparent">
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {Object.keys(themes).map((theme) => (
                    <CommandItem
                      key={theme}
                      onSelect={() => {
                        handleThemeChange(theme);
                        setIsThemePopoverOpen(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/10 rounded-md transition-colors"
                      style={{
                        backgroundColor:
                          currentTheme === theme
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'transparent',
                        color: '#fff',
                        textShadow: '0 0 5px rgba(255,255,255,0.3)',
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            background:
                              themes[theme as keyof typeof themes].primary,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: `0 0 4px ${
                              themes[theme as keyof typeof themes].primary
                            }`,
                          }}
                        />
                        <span className="text-white text-sm font-medium">
                          {theme}
                        </span>
                      </div>
                      {currentTheme === theme && (
                        <span className="text-xs bg-blue-500 text-white rounded px-2 py-0.5">
                          Active
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover
            open={isPremiumPopoverOpen}
            onOpenChange={setIsPremiumPopoverOpen}
          >
            <PopoverTrigger asChild>
              {renderButton(
                'theme',
                <>
                  <Palette className="mr-2 h-4 w-4" />
                  <Crown className="ml-2 h-4 w-4 text-yellow-400" />
                </>,
                'Change Oasis Theme'
              )}
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] p-4 bg-gray-800 border-gray-700"
              align="end"
            >
              <div className="space-y-4">
                <div className="flex items-center">
                  <Crown className="h-6 w-6 text-yellow-400 mr-2" />
                  <h3 className="text-lg font-bold text-white">
                    Premium Feature
                  </h3>
                </div>
                <p className="text-sm text-white/90">
                  Theme customization is available exclusively for Premium Oasis
                  members. Upgrade now to unlock:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-white text-sm">
                    <Palette className="h-4 w-4 text-blue-400 mr-2" />
                    Custom theme selection
                  </li>
                  <li className="flex items-center text-white text-sm">
                    <Crown className="h-4 w-4 text-yellow-400 mr-2" />
                    Premium oasis themes
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                  onClick={() => setIsPremiumPopoverOpen(false)}
                >
                  Upgrade to Premium Oasis
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActions;