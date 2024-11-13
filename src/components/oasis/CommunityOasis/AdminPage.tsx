import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  Shield,
  Bell,
  MessageSquare,
  BarChart,
  Phone,
} from 'lucide-react';
import { themes } from '@/themes';
import AdminChat from './admin/AdminChat';
import PollManager from './admin/PollManager';
import CallManager from './admin/CallManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminPageProps {
  oasis: {
    id: string;
    name: string;
    theme: string;
    tier?: string;
  };
}

const AdminPage: React.FC<AdminPageProps> = ({ oasis }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const themeColors = themes[oasis.theme as keyof typeof themes] || themes['Thrive Oasis(Default)'];
  const isPremium = oasis.tier === 'Premium';

  const cards = [
    {
      title: 'General Settings',
      description: 'Configure oasis settings and preferences',
      icon: Settings,
      actions: ['Edit Oasis Info', 'Privacy Settings', 'Notifications'],
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: Users,
      actions: ['Manage Roles', 'User Permissions', 'Access Control'],
    },
    {
      title: 'Security',
      description: 'Configure security settings and monitoring',
      icon: Shield,
      actions: ['Security Logs', 'Audit Trail', 'Threat Detection'],
    },
    {
      title: 'Notifications',
      description: 'Configure notification settings and alerts',
      icon: Bell,
      actions: ['Alert Settings', 'Email Templates', 'Push Notifications'],
    },
    {
      title: 'Content Moderation',
      description: 'Manage content filters and moderation rules',
      icon: MessageSquare,
      actions: ['Filter Settings', 'Auto-moderation', 'Report Management'],
    },
  ];

  const cardStyle = {
    background: 'rgb(17 24 39)',
    boxShadow: `0 0 20px ${themeColors.accent}`,
    border: `1px solid rgb(75 85 99)`,
  };

  const buttonStyle = {
    background: 'rgb(31 41 55)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    border: 'none',
    transition: 'all 0.3s ease',
  };

  const iconStyle = {
    color: '#ffffff',
    filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-800/50 border border-gray-700 mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="polls" className="data-[state=active]:bg-black">
            <BarChart className="w-4 h-4 mr-2" />
            Polls
          </TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-black">
            <Phone className="w-4 h-4 mr-2" />
            Admin Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={index}
                      className="transition-all duration-200 hover:scale-105"
                      style={cardStyle}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            <Icon className="w-6 h-6" style={iconStyle} />
                          </div>
                          <CardTitle
                            className="text-lg"
                            style={{ color: themeColors.text }}
                          >
                            {card.title}
                          </CardTitle>
                        </div>
                        <p
                          className="text-sm mt-2"
                          style={{ color: themeColors.text }}
                        >
                          {card.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {card.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              className="w-full h-10 px-4 flex items-center justify-start hover:scale-105 transition-transform duration-200"
                              style={buttonStyle}
                            >
                              {action}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <AdminChat themeColors={themeColors} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="polls">
          <PollManager themeColors={themeColors} oasisId={oasis.id} />
        </TabsContent>

        <TabsContent value="calls">
          <CallManager 
            themeColors={themeColors} 
            oasisId={oasis.id} 
            isPremium={isPremium} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;