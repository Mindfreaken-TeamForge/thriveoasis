import React, { useState } from 'react';
import { ThemeColors, themes } from '@/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';

interface Oasis {
  id: string;
  name: string;
  ownerId: string;
  theme: string;
  type: string;
}

interface GamerOwnerOasisProps {
  oasis: Oasis;
  onThemeChange: (oasisId: string, newTheme: string) => void;
}

const GamerOwnerOasis: React.FC<GamerOwnerOasisProps> = ({
  oasis,
  onThemeChange,
}) => {
  const [currentTheme, setCurrentTheme] = useState(
    oasis.theme || 'Regal Sunrise'
  );
  const [themeColors, setThemeColors] = useState<ThemeColors>(
    themes[currentTheme as keyof typeof themes]
  );
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
          description: 'Gamer oasis theme updated successfully!',
        });
      } catch (error) {
        console.error('Error updating gamer oasis theme:', error);
        toast({
          title: 'Error',
          description: 'Failed to update gamer oasis theme. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div
      className="container mx-auto p-4"
      style={{
        color: themeColors.text,
        background: themeColors.background,
      }}
    >
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'white' }}>
        {oasis.name} - Gamer Oasis
      </h1>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your team members and roles here.</p>
              {/* Add team management component here */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tournaments">
          <Card>
            <CardHeader>
              <CardTitle>Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Organize and participate in tournaments.</p>
              {/* Add tournament management component here */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Stats Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View and analyze your gaming statistics.</p>
              {/* Add stats tracking component here */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="community">
          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Engage with your gaming community.</p>
              {/* Add community component here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Change Theme</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(themes).map((themeName) => (
            <Button
              key={themeName}
              onClick={() => handleThemeChange(themeName)}
              variant={currentTheme === themeName ? 'default' : 'outline'}
            >
              {themeName}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamerOwnerOasis;
