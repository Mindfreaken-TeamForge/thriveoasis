import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/firebase';
import OasisCreationModal from '../OasisCreationModal';
import OwnerOasisCard from '../OwnerOasisCard';
import JoinedOasisCard from '../JoinedOasisCard';
import Settings from '../Settings';
import { tokenService } from '@/services/tokenService';
import { joinOasis } from '@/services/oasisService';
import CommunityOwnerOasis from '../oasis/CommunityOasis/CommunityOwnerOasis';
import GamerOwnerOasis from '../oasis/GamerOasis/GamerOwnerOasis';
import ContentCreatorOwnerOasis from '../oasis/ContentCreatorOasis/ContentCreatorOwnerOasis';
import { themes } from '@/themes';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
  ownerId: string;
  memberCount?: number;
}

interface DashboardContentProps {
  activeNav: string;
  selectedOasis: Oasis | null;
  oasis: Oasis[];
  setOasis: React.Dispatch<React.SetStateAction<Oasis[]>>;
  joinedOasis: Oasis[];
  setJoinedOasis: React.Dispatch<React.SetStateAction<Oasis[]>>;
  setSelectedOasis: React.Dispatch<React.SetStateAction<Oasis | null>>;
  setIsOasisOnboardingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

export default function DashboardContent({
  activeNav,
  selectedOasis,
  oasis,
  setOasis,
  joinedOasis,
  setJoinedOasis,
  setSelectedOasis,
  setIsOasisOnboardingOpen,
  onLogout,
}: DashboardContentProps) {
  const [isOasisCreationModalOpen, setIsOasisCreationModalOpen] = useState(false);
  const [joinOasisCode, setJoinOasisCode] = useState('');
  const [newOasisName, setNewOasisName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const currentTheme = selectedOasis?.theme || 'Thrive Oasis(Default)';
  const themeColors = themes[currentTheme as keyof typeof themes] || themes['Thrive Oasis(Default)'];

  const buttonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0 1.5rem',
  };

  const inputStyle = {
    height: '42px',
    fontSize: '0.875rem',
    padding: '0 1rem',
  };

  const handleJoinOasis = async () => {
    if (!joinOasisCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invite code',
        variant: 'destructive',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join an oasis',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);

    try {
      // First validate the token
      const validationResult = await tokenService.validateToken(joinOasisCode);
      
      if (!validationResult.success || !validationResult.token) {
        throw new Error(validationResult.error || 'Invalid invite code');
      }

      const token = validationResult.token;

      // Join the oasis
      const result = await joinOasis({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        oasisId: token.oasisId,
        permissions: token.permissions,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to join oasis');
      }

      // Record token usage and invite relation
      await tokenService.useToken(token.id, user.uid, token.oasisId);
      await tokenService.recordInviteRelation(
        token.createdBy,
        user.uid,
        token.id,
        token.oasisId
      );

      // Add to joined oasis list
      const newOasis: Oasis = {
        id: token.oasisId,
        name: token.oasisName,
        type: result.oasisType || 'Community',
        theme: 'Thrive Oasis(Default)',
        ownerId: token.createdBy,
        color: '#000000',
      };
      
      setJoinedOasis(prev => [...prev, newOasis]);
      setJoinOasisCode('');
      
      toast({
        title: 'Success',
        description: 'Successfully joined the oasis!',
      });
    } catch (error: any) {
      console.error('Error joining oasis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join oasis',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateOasis = async (oasisData: Oasis) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an oasis',
        variant: 'destructive',
      });
      return;
    }

    try {
      setOasis((prev) => [...prev, { ...oasisData, ownerId: user.uid }]);
      setIsOasisCreationModalOpen(false);
      setNewOasisName('');
      
      toast({
        title: 'Success',
        description: `Oasis "${oasisData.name}" created successfully!`,
      });
    } catch (error: any) {
      console.error('Error creating oasis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create oasis',
        variant: 'destructive',
      });
    }
  };

  const handleThemeChange = (oasisId: string, newTheme: string) => {
    setOasis(prev => prev.map(o => 
      o.id === oasisId ? { ...o, theme: newTheme } : o
    ));
    setJoinedOasis(prev => prev.map(o => 
      o.id === oasisId ? { ...o, theme: newTheme } : o
    ));
    
    if (selectedOasis?.id === oasisId) {
      setSelectedOasis(prev => prev ? { ...prev, theme: newTheme } : null);
    }
  };

  const renderOasisContent = () => {
    if (!selectedOasis) return null;

    switch (selectedOasis.type.toLowerCase()) {
      case 'community':
        return (
          <CommunityOwnerOasis
            oasis={selectedOasis}
            onThemeChange={handleThemeChange}
          />
        );
      case 'gamer':
        return (
          <GamerOwnerOasis
            oasis={selectedOasis}
            onThemeChange={handleThemeChange}
          />
        );
      case 'content creator':
        return (
          <ContentCreatorOwnerOasis
            oasis={selectedOasis}
            onThemeChange={handleThemeChange}
          />
        );
      default:
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Unknown Oasis Type
            </h2>
            <p className="text-gray-300">
              This type of Oasis ({selectedOasis.type}) is not yet supported.
            </p>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (selectedOasis) {
      return renderOasisContent();
    }

    switch (activeNav) {
      case 'settings':
        return <Settings onLogout={onLogout} />;
      
      case 'oasis':
        return (
          <motion.div
            key="oasis-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
            style={{
              background: themeColors.background,
              color: themeColors.text,
            }}
          >
            <Card 
              className="mb-6"
              style={{
                background: themeColors.background,
                color: themeColors.text,
                boxShadow: `0 0 20px ${themeColors.accent}`,
                border: `1px solid ${themeColors.primary}`,
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: themeColors.text }}>Oasis Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card style={{
                    background: 'rgba(17, 24, 39, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${themeColors.accent}`,
                  }}>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white">
                        Create a New Oasis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Oasis Name"
                          value={newOasisName}
                          onChange={(e) => setNewOasisName(e.target.value)}
                          className="flex-1 bg-gray-800 border-gray-700 text-white"
                          style={inputStyle}
                        />
                        <Button
                          onClick={() => setIsOasisCreationModalOpen(true)}
                          style={buttonStyle}
                          disabled={!newOasisName.trim()}
                        >
                          Create
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card style={{
                    background: 'rgba(17, 24, 39, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${themeColors.accent}`,
                  }}>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white">
                        Join an Oasis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Invite Code"
                          value={joinOasisCode}
                          onChange={(e) => setJoinOasisCode(e.target.value)}
                          className="flex-1 bg-gray-800 border-gray-700 text-white"
                          style={inputStyle}
                        />
                        <Button
                          onClick={handleJoinOasis}
                          disabled={isJoining}
                          style={buttonStyle}
                        >
                          {isJoining ? 'Joining...' : 'Join'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card 
              style={{
                background: themeColors.background,
                color: themeColors.text,
                boxShadow: `0 0 20px ${themeColors.accent}`,
                border: `1px solid ${themeColors.primary}`,
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: themeColors.text }}>Your Oasis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="created" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="created">Created</TabsTrigger>
                    <TabsTrigger value="joined">Joined</TabsTrigger>
                  </TabsList>

                  <TabsContent value="created">
                    <div 
                      className="grid gap-4 px-4"
                      style={{ 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        maxWidth: '100%'
                      }}
                    >
                      {oasis.map((oasisItem) => (
                        <motion.div
                          key={`created-${oasisItem.id}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <OwnerOasisCard
                            oasis={oasisItem}
                            onViewOasis={() => setSelectedOasis(oasisItem)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="joined">
                    <div 
                      className="grid gap-4 px-4"
                      style={{ 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        maxWidth: '100%'
                      }}
                    >
                      {joinedOasis.map((oasisItem) => (
                        <motion.div
                          key={`joined-${oasisItem.id}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <JoinedOasisCard
                            oasis={oasisItem}
                            onViewOasis={() => setSelectedOasis(oasisItem)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return (
          <motion.div
            key="welcome-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
              background: themeColors.background,
              color: themeColors.text,
            }}
          >
            <Card 
              style={{
                background: themeColors.background,
                color: themeColors.text,
                boxShadow: `0 0 20px ${themeColors.accent}`,
                border: `1px solid ${themeColors.primary}`,
              }}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-semibold" style={{ color: themeColors.text }}>
                  Welcome to Thrive Oasis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: themeColors.text }}>
                  Select a oasis from the navigation rail or create a new one to
                  get started.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <main 
      className="h-screen overflow-y-auto"
      style={{
        background: themeColors.background,
        color: themeColors.text,
      }}
    >
      <div className="min-h-full p-0">
        {renderContent()}
        {isOasisCreationModalOpen && (
          <OasisCreationModal
            onClose={() => setIsOasisCreationModalOpen(false)}
            onCreateOasis={handleCreateOasis}
            initialOasisName={newOasisName}
          />
        )}
      </div>
    </main>
  );
}