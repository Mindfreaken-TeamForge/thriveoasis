import React, { useState } from 'react';
import { ThemeColors, themes } from '@/themes';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Community from './Community';
import AdminPage from './admin/AdminPage';
import ModerationPage from './moderation/ModerationPage';
import OwnerPage from './owner/OwnerPage';
import TokenManager from '@/components/TokenManagement/TokenManager';
import MemberManagementSidebar from './MemberManagementSidebar';

interface Oasis {
  id: string;
  name: string;
  ownerId: string;
  theme: string;
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
  const [themeColors, setThemeColors] = useState<ThemeColors>(
    themes[currentTheme as keyof typeof themes]
  );
  const [activeTab, setActiveTab] = useState('owner');
  const { toast } = useToast();

  const handleThemeChange = async (theme: string) => {
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
      await updateDoc(oasisRef, { theme });

      // Update in user's created oasis collection
      const userOasisRef = doc(collection(db, 'users', user.uid, 'createdOasis'), oasis.id);
      await updateDoc(userOasisRef, { theme });

      // Update local state
      setCurrentTheme(theme);
      setThemeColors(themes[theme as keyof typeof themes]);
      
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

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{
        color: themeColors.text,
        background: themeColors.background,
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
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
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
              oasis={oasis} 
              themeColors={themeColors} 
              onThemeChange={handleThemeChange}
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