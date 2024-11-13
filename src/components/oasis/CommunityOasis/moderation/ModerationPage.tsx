import React from 'react';
import { ThemeColors } from '@/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModerationPageProps {
  oasis: {
    id: string;
    name: string;
  };
  themeColors: ThemeColors;
}

const ModerationPage: React.FC<ModerationPageProps> = ({ oasis, themeColors }) => {
  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="filters">Content Filters</TabsTrigger>
        <TabsTrigger value="logs">Audit Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="reports">
        <Card style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}>
          <CardHeader>
            <CardTitle>User Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View and manage user reports here.</p>
            {/* Add reports management component */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="filters">
        <Card style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}>
          <CardHeader>
            <CardTitle>Content Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Configure content filtering rules here.</p>
            {/* Add content filters component */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logs">
        <Card style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View moderation action history here.</p>
            {/* Add audit logs component */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ModerationPage;