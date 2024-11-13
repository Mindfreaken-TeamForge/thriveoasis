import React, { useState } from 'react';
import { Calendar, Video, Users, MessageSquare, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Community from '@/components/shared/Community';

interface ContentCreatorOasisProps {
  oasisName: string;
}

const ContentCreatorOasis: React.FC<ContentCreatorOasisProps> = ({
  oasisName,
}) => {
  const [activeTab, setActiveTab] = useState('content');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Content Calendar</h3>
            <p>Plan and schedule your content releases here.</p>
            {/* Add a calendar component here */}
          </div>
        );
      case 'stream':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Live Streaming</h3>
            <p>Set up and manage your live streams.</p>
            <Button className="bg-red-500 hover:bg-red-600">Go Live</Button>
          </div>
        );
      case 'collab':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Collaboration Space</h3>
            <p>Connect and collaborate with other creators.</p>
            {/* Add a list of potential collaborators or collaboration requests */}
          </div>
        );
      case 'community':
        return <Community oasisName={oasisName} oasisType="Content Creator" />;
      case 'analytics':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Analytics</h3>
            <p>Track your content performance and audience engagement.</p>
            {/* Add charts or graphs for content analytics */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-red-900 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-orange-500">
          {oasisName} - Content Creator Oasis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Button
            onClick={() => setActiveTab('content')}
            variant={activeTab === 'content' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Calendar className="mr-2" size={16} /> Content
          </Button>
          <Button
            onClick={() => setActiveTab('stream')}
            variant={activeTab === 'stream' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Video className="mr-2" size={16} /> Stream
          </Button>
          <Button
            onClick={() => setActiveTab('collab')}
            variant={activeTab === 'collab' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Users className="mr-2" size={16} /> Collaborate
          </Button>
          <Button
            onClick={() => setActiveTab('community')}
            variant={activeTab === 'community' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <MessageSquare className="mr-2" size={16} /> Community
          </Button>
          <Button
            onClick={() => setActiveTab('analytics')}
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <BarChart className="mr-2" size={16} /> Analytics
          </Button>
        </div>
        {renderTabContent()}
      </CardContent>
    </Card>
  );
};

export default ContentCreatorOasis;
