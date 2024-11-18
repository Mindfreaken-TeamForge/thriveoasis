import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Gamepad2, Trophy, Youtube, Twitch, Twitter, Link2 } from 'lucide-react';
import { ProfilePictureUpload } from '@/components/ui/ProfilePictureUpload';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfileContext } from '@/contexts/ProfileContext';
import { updateProfile } from 'firebase/auth';

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

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function ProfileModal({ isOpen, onClose, onOpen }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateProfileUrl } = useProfileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [tempPhotoURL, setTempPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    bio: '',
    role: '',
    games: [],
    socialLinks: {},
    achievements: []
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
      }));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: profile.displayName,
        photoURL: tempPhotoURL || profile.photoURL
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profile.displayName,
        photoURL: tempPhotoURL || profile.photoURL,
        bio: profile.bio,
        role: profile.role,
        games: profile.games,
        socialLinks: profile.socialLinks,
        achievements: profile.achievements,
        lastUpdated: new Date()
      });

      if (tempPhotoURL) {
        await updateProfileUrl(tempPhotoURL);
        setTempPhotoURL(null);
      }

      if (user) {
        user.reload();
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
      onClose();

      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const shinyBlackButtonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
  };

  return (
    <Popover open={isOpen} onOpenChange={onClose} modal={true}>
      <PopoverTrigger asChild>
        <DropdownMenuItem 
          className="px-4 py-2 hover:bg-gray-800 cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            onOpen();
          }}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[800px] bg-gray-900 p-6" 
        align="end" 
        side="left"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
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
              currentPhotoURL={tempPhotoURL || profile.photoURL}
              size="lg"
              onUploadComplete={(url) => {
                setTempPhotoURL(url);
              }}
              skipProfileUpdate={true}
              isEditing={isEditing}
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Bio</label>
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

          {/* Save Button */}
          {isEditing && (
            <div className="mt-8">
              <Button
                onClick={handleSave}
                style={shinyBlackButtonStyle}
                className="hover:opacity-90"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 