import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeColors } from '@/themes';
import InviteList from './InviteList';
import InviteAnalytics from './InviteAnalytics';
import InviteCreation from './InviteCreation';

interface InviteDashboardProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const InviteDashboard: React.FC<InviteDashboardProps> = ({ oasisId, themeColors }) => {
  const [activeTab, setActiveTab] = useState('invites');

  return (
    <Card
      className="relative transition-all duration-300"
      style={{
        background: 'rgb(17 24 39)',
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `1px solid rgb(75 85 99)`,
      }}
    >
      <CardHeader>
        <CardTitle className="text-xl text-white">Invite Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="invites">Active Invites</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="creation">Create Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="invites">
            <InviteList oasisId={oasisId} themeColors={themeColors} />
          </TabsContent>

          <TabsContent value="analytics">
            <InviteAnalytics oasisId={oasisId} themeColors={themeColors} />
          </TabsContent>

          <TabsContent value="creation">
            <InviteCreation oasisId={oasisId} themeColors={themeColors} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InviteDashboard;