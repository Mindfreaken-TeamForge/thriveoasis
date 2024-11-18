import React, { useState, useEffect } from 'react';
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
import SettingsComponent from '../Settings';
import { tokenService } from '@/services/tokenService';
import { joinOasis } from '@/services/oasisService';
import CommunityOwnerOasis from '../oasis/CommunityOasis/CommunityOwnerOasis';
import GamerOwnerOasis from '../oasis/GamerOasis/GamerOwnerOasis';
import ContentCreatorOwnerOasis from '../oasis/ContentCreatorOasis/ContentCreatorOwnerOasis';
import { themes } from '@/themes';
import { useAuth } from '@/lib/auth';
import { User, Cog, Camera, Mail, MapPin, Gamepad2, Trophy, Youtube, Twitch, Twitter, Link2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilePictureUpload } from '@/components/ui/ProfilePictureUpload';

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

interface Profile {
  displayName: string;
  photoURL: string;
  bio: string;
  role: string;
  games: string[];
  socialLinks: {
    youtube?: string;
    twitch?: string;
    twitter?: string;
    other?: string;
  };
  achievements: string[];
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
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    bio: '',
    role: '',
    games: [],
    socialLinks: {},
    achievements: []
  });

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

  const shinyBlackButtonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0 1.5rem',
    cursor: 'pointer', // Improves feedback for hover
  };

  const shinyBlackIconButtonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '32px',
    height: '32px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    borderRadius: '50%',
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

  const handleSave = async () => {
    try {
      // Here you would typically save to your backend/firebase
      // For now, we'll just update the local state
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (selectedOasis) {
      return renderOasisContent();
    }

    switch (activeNav) {
      case 'settings':
        return <SettingsComponent onLogout={onLogout} />;
      
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
                      {oasis.map((oasisItem, index) => (
                        <motion.div
                          key={`created-${oasisItem.id || index}`}
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
                      {joinedOasis.map((oasisItem, index) => (
                        <motion.div
                          key={`joined-${oasisItem.id || index}`}
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

      case 'profile':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-lg shadow-xl p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  style={shinyBlackButtonStyle}
                  className="hover:opacity-90"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>

              {/* Profile Picture Section */}
              <div className="flex items-center gap-4">
                <ProfilePictureUpload 
                  currentPhotoURL={profile.photoURL}
                  size="lg"
                  onUploadComplete={(url) => setProfile({ ...profile, photoURL: url })}
                />
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white text-xl h-10 px-4"
                      placeholder="Display Name"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-white">{profile.displayName}</h2>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <User className="inline-block w-4 h-4 mr-2" />
                  Role
                </label>
                {isEditing ? (
                  <Select
                    value={profile.role}
                    onValueChange={(value) => setProfile({ ...profile, role: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-creator">Content Creator</SelectItem>
                      <SelectItem value="pro-player">Pro Player</SelectItem>
                      <SelectItem value="streamer">Streamer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="fan">Fan/Supporter</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-300 capitalize">{profile.role || 'No role set'}</p>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-300">{profile.bio || 'No bio added yet'}</p>
                )}
              </div>

              {/* Games */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Gamepad2 className="inline-block w-4 h-4 mr-2" />
                  Games
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      className="bg-gray-800 border-gray-700 text-white text-xl h-10 px-4"
                      placeholder="Add games (comma separated)"
                      value={profile.games.join(', ')}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        games: e.target.value.split(',').map(game => game.trim()) 
                      })}
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.games.map((game, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Link2 className="inline-block w-4 h-4 mr-2" />
                  Social Links
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <Input
                        className="bg-gray-800 border-gray-700 text-white text-xl h-6 px-4"
                        placeholder="YouTube Channel URL"
                        value={profile.socialLinks.youtube || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, youtube: e.target.value }
                        })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Twitch className="w-5 h-5 text-purple-500" />
                      <Input
                        className="bg-gray-800 border-gray-700 text-white text-xl h-6 px-4"
                        placeholder="Twitch Channel URL"
                        value={profile.socialLinks.twitch || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, twitch: e.target.value }
                        })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Twitter className="w-5 h-5 text-blue-500" />
                      <Input
                        className="bg-gray-800 border-gray-700 text-white text-xl h-6 px-4"
                        placeholder="Twitter Profile URL"
                        value={profile.socialLinks.twitter || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          socialLinks: { ...profile.socialLinks, twitter: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(profile.socialLinks).map(([platform, url]) => (
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-gray-300 hover:text-white"
                        >
                          {platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                          {platform === 'twitch' && <Twitch className="w-4 h-4 text-purple-500" />}
                          {platform === 'twitter' && <Twitter className="w-4 h-4 text-blue-500" />}
                          <span>{url}</span>
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Trophy className="inline-block w-4 h-4 mr-2" />
                  Achievements
                </label>
                {isEditing ? (
                  <Textarea
                    value={profile.achievements.join('\n')}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      achievements: e.target.value.split('\n').filter(achievement => achievement.trim()) 
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Add your achievements (one per line)"
                    rows={4}
                  />
                ) : (
                  <div className="space-y-2">
                    {profile.achievements.map((achievement, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-2 text-gray-300"
                      >
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="mt-8">
                  <Button
                    onClick={handleSave}
                    style={shinyBlackButtonStyle}
                    className="hover:opacity-90"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
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
      className="h-screen overflow-y-auto pr-60"
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