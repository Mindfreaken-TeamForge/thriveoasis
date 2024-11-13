import React, { useState } from 'react';
import { ThemeColors, themes } from '@/themes';
import OasisStatistics from '@/components/OwnerOasis/OasisStatistics';
import QuickActions from '@/components/OwnerOasis/QuickActions';
import UnbanRequests from '@/components/OwnerOasis/UnbanRequests';
import MemberManagement from '@/components/OwnerOasis/MemberManagement';
import BannedUsers from '@/components/OwnerOasis/BannedUsers';
import RoleManagement from '@/components/OwnerOasis/RoleManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import AdminPage from './AdminPage';

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
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('owner');
  const { toast } = useToast();

  const handleThemeChange = async (theme: string) => {
    setCurrentTheme(theme);
    setThemeColors(themes[theme as keyof typeof themes]);
    const user = auth.currentUser;
    if (user) {
      try {
        const oasisRef = doc(db, 'users', user.uid, 'oasis', oasis.id);
        await updateDoc(oasisRef, { theme: theme });
        onThemeChange(oasis.id, theme);
        toast({
          title: 'Success',
          description: 'Community oasis theme updated successfully!',
        });
      } catch (error) {
        console.error('Error updating community oasis theme:', error);
        toast({
          title: 'Error',
          description:
            'Failed to update community oasis theme. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${themeColors.accent}`,
  };

  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'admin':
        return <AdminPage oasis={oasis} />;
      case 'owner':
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <OasisStatistics
                themeColors={themeColors}
                oasisId={oasis.id}
                cardStyle={cardStyle}
              />
              <QuickActions
                themeColors={themeColors}
                currentTheme={currentTheme}
                themes={themes}
                handleThemeChange={handleThemeChange}
                setIsRoleManagementOpen={setIsRoleManagementOpen}
                getContrastColor={getContrastColor}
                cardStyle={cardStyle}
                oasisData={{
                  id: oasis.id,
                  tier: oasis.tier,
                  features: oasis.features,
                  extraEmotes: oasis.extraEmotes,
                  extraStickers: oasis.extraStickers,
                  monthlyPrice: oasis.monthlyPrice,
                }}
              />
              <UnbanRequests
                themeColors={themeColors}
                oasisId={oasis.id}
                getContrastColor={getContrastColor}
                cardStyle={cardStyle}
              />
            </div>

            <Tabs defaultValue="members" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="banned">Banned Users</TabsTrigger>
              </TabsList>
              <TabsContent value="members">
                <MemberManagement
                  themeColors={themeColors}
                  oasisId={oasis.id}
                  getContrastColor={getContrastColor}
                  cardStyle={cardStyle}
                />
              </TabsContent>
              <TabsContent value="banned">
                <BannedUsers
                  themeColors={themeColors}
                  oasisId={oasis.id}
                  cardStyle={cardStyle}
                />
              </TabsContent>
            </Tabs>
          </>
        );
    }
  };

  return (
    <div
  className="container mx-auto p-4 min-h-[100vh]" // Full viewport height as minimum
  style={{
    color: themeColors.text,
    background: themeColors.background,
  }}
>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
          {oasis.name} - Community Oasis
        </h1>

        <Tabs
          value={activeMainTab}
          onValueChange={setActiveMainTab}
          className="w-auto"
        >
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="owner" className="data-[state=active]:bg-black">
              Owner
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-black">
              Admin
            </TabsTrigger>
            <TabsTrigger
              value="moderation"
              className="data-[state=active]:bg-black"
            >
              Moderation
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="data-[state=active]:bg-black"
            >
              Community
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {renderTabContent()}

      {isRoleManagementOpen && (
        <RoleManagement
          oasisId={oasis.id}
          onClose={() => setIsRoleManagementOpen(false)}
        />
      )}
    </div>
  );
};

export default CommunityOwnerOasis;
