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

interface ContentCreatorOwnerOasisProps {
  oasis: Oasis;
  onThemeChange: (oasisId: string, newTheme: string) => void;
}

const ContentCreatorOwnerOasis: React.FC<ContentCreatorOwnerOasisProps> = ({
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
          description: 'Content Creator oasis theme updated successfully!',
        });
      } catch (error) {
        console.error('Error updating content creator oasis theme:', error);
        toast({
          title: 'Error',
          description:
            'Failed to update content creator oasis theme. Please try again.',
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
        {oasis.name} - Creator Oasis
      </h1>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your content schedule here.</p>
              {/* Add content calendar component here */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View your content performance analytics here.</p>
              {/* Add analytics component here */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monetization">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Options</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your monetization strategies here.</p>
              {/* Add monetization options component here */}
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

export default ContentCreatorOwnerOasis;
