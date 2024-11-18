import React, { useState, useEffect } from 'react';
import { ThemeColors, themes } from '@/themes';
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Community from './Community';
import AdminPage from './AdminPage';
import ModerationPage from './moderation/ModerationPage';
import OwnerPage from './owner/OwnerPage';
import TokenManager from '@/components/TokenManagement/TokenManager';
import MemberManagementSidebar from './MemberManagementSidebar';
import type { ThemeMode } from '@/components/ThemeSelector/ThemeMode';

interface Oasis {
  id: string;
  name: string;
  ownerId: string;
  theme: string;
  themeMode?: ThemeMode;
  type: string;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
}

interface CommunityOwnerOasisProps {
  oasis: Oasis;
  onThemeChange: (oasisId: string, newTheme: string) => void;
}

const CommunityOwnerOasis: React.FC<CommunityOwnerOasisProps> = ({
  oasis,
  onThemeChange,
}) => {
  const [currentTheme, setCurrentTheme] = useState(
    oasis.theme || 'Thrive Oasis(Default)'
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    oasis.themeMode || 'gradient'
  );
  const [themeColors, setThemeColors] = useState<ThemeColors>(
    themes[currentTheme as keyof typeof themes]
  );
  const [activeTab, setActiveTab] = useState('owner');
  const { toast } = useToast();

  // Listen for theme changes in Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !oasis.id) return;

    // Listen to the main oasis document
    const oasisRef = doc(db, 'oasis', oasis.id);
    const unsubscribe = onSnapshot(oasisRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.theme !== currentTheme) {
          setCurrentTheme(data.theme);
          setThemeColors(themes[data.theme as keyof typeof themes]);
        }
        if (data.themeMode !== themeMode) {
          setThemeMode(data.themeMode || 'gradient');
        }
      }
    }, (error) => {
      console.error('Error listening to theme changes:', error);
    });

    return () => unsubscribe();
  }, [oasis.id, currentTheme, themeMode]);

  const handleThemeChange = async (theme: string, mode: ThemeMode) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update the theme.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update in main oasis collection
      const oasisRef = doc(db, 'oasis', oasis.id);
      await updateDoc(oasisRef, { 
        theme,
        themeMode: mode 
      });

      // Update in user's created oasis collection
      const userOasisRef = doc(collection(db, 'users', user.uid, 'createdOasis'), oasis.id);
      await updateDoc(userOasisRef, { 
        theme,
        themeMode: mode 
      });

      // Update parent state
      onThemeChange(oasis.id, theme);

      toast({
        title: 'Success',
        description: 'Theme updated successfully!',
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to update theme. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getThemeBackground = () => {
    switch (themeMode) {
      case 'gradient':
        return `linear-gradient(145deg, ${themeColors.primary}, ${themeColors.secondary})`;
      case 'primary':
        return themeColors.primary;
      case 'secondary':
        return themeColors.secondary;
      default:
        return themeColors.background;
    }
  };

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{
        color: themeColors.text,
        background: getThemeBackground(),
      }}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div 
          className="flex justify-between items-center px-6 py-4 border-b border-gray-700"
          style={{
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h1 className="text-2xl font-bold" style={{ color: 'white' }}>
            {oasis.name} - Community Oasis
          </h1>
          
          <div className="flex items-center space-x-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-800/50 border border-gray-700">
                <TabsTrigger value="owner">Owner</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="w-[135px]">
              <TokenManager 
                oasisId={oasis.id}
                userRole="owner"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsContent value="owner" className="h-full overflow-auto p-6">
            <OwnerPage 
              oasis={{
                ...oasis,
                themeMode,
              }}
              themeColors={themeColors}
              onThemeChange={handleThemeChange}
              currentMode={themeMode}
            />
          </TabsContent>

          <TabsContent value="admin" className="h-full overflow-auto p-6">
            <AdminPage 
              oasis={oasis} 
              themeColors={themeColors}
            />
          </TabsContent>

          <TabsContent value="moderation" className="h-full overflow-auto p-6">
            <ModerationPage 
              oasis={oasis} 
              themeColors={themeColors}
            />
          </TabsContent>

          <TabsContent value="community" className="h-full overflow-hidden">
            <Community 
              oasisId={oasis.id}
              oasisName={oasis.name}
              themeColors={themeColors}
              themeMode={themeMode}
              showInput={true}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Sidebar */}
      <MemberManagementSidebar 
        oasisId={oasis.id}
        themeColors={themeColors}
      />
    </div>
  );
};

export default CommunityOwnerOasis;