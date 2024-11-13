import React from 'react';
import { ThemeColors } from '@/themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PollManager from './PollManager';
import CallManager from './CallManager';
import AdminChat from './AdminChat';

interface AdminPageProps {
  oasis: {
    id: string;
    name: string;
    theme: string;
    tier?: string;
  };
  themeColors: ThemeColors;
}

const AdminPage: React.FC<AdminPageProps> = ({ oasis, themeColors }) => {
  return (
    <div className="h-full">
      <Tabs defaultValue="chat" className="w-full h-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Admin Chat</TabsTrigger>
          <TabsTrigger value="calls">Admin Calls</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="h-[calc(100%-48px)]">
          <AdminChat 
            themeColors={themeColors} 
            oasisId={oasis.id}
          />
        </TabsContent>

        <TabsContent value="calls">
          <CallManager 
            themeColors={themeColors} 
            oasisId={oasis.id}
            isPremium={oasis.tier === 'Premium'} 
          />
        </TabsContent>

        <TabsContent value="polls">
          <PollManager 
            themeColors={themeColors} 
            oasisId={oasis.id} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;