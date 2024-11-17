import React, { useState, useEffect } from 'react';
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
  Upload,
  X,
  Smile,
} from 'lucide-react';
import { themes, ThemeColors } from '@/themes';
import AdminChat from './admin/AdminChat';
import PollManager from './admin/PollManager';
import CallManager from './admin/CallManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db, auth, storage } from '@/firebase';
import { serverTimestamp, FieldValue } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import type { Emote } from '@/types/upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import EmotesSection from './EmotesSection';
import { generateEmoteId, formatEmoteName, createEmote } from '@/types/upload';
import { initializeOasisEmoteId } from '@/types/upload';

interface AdminPageProps {
  oasis: {
    id: string;
    name: string;
    theme: string;
    tier?: string;
    extraEmotes?: number;
  };
  themeColors: ThemeColors;
}

const AdminPage: React.FC<AdminPageProps> = ({ oasis, themeColors }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const isPremium = oasis.tier === 'Premium';
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [isUploadingEmote, setIsUploadingEmote] = useState(false);
  const { toast } = useToast();
  const [selectedEmotes, setSelectedEmotes] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emoteToDelete, setEmoteToDelete] = useState<string | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [isNamingDialogOpen, setIsNamingDialogOpen] = useState(false);
  const [pendingEmoteFile, setPendingEmoteFile] = useState<File | null>(null);
  const [emoteName, setEmoteName] = useState('');
  
  // Emote slot calculations
  const BASE_SLOTS = isPremium ? 500 : 25;
  const MAX_EXTRA_SLOTS = 2500;
  const SLOTS_PER_DOLLAR = 250;
  
  // Calculate extra slots (capped at MAX_EXTRA_SLOTS)
  const extraSlots = Math.min(
    (oasis.extraEmotes || 0) * SLOTS_PER_DOLLAR,
    MAX_EXTRA_SLOTS
  );
  
  // Calculate total slots (capped based on tier)
  const totalEmoteLimit = Math.min(
    BASE_SLOTS + extraSlots,
    isPremium ? 3000 : 2525
  );
  
  // Calculate remaining purchasable slots
  const remainingPurchasableSlots = isPremium 
    ? 0 // Premium tier can't purchase more slots
    : Math.max(0, MAX_EXTRA_SLOTS - extraSlots); // For base tier

  // Calculate how many dollars worth of slots can still be purchased
  const remainingPurchasableDollars = Math.ceil(remainingPurchasableSlots / SLOTS_PER_DOLLAR);

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

  const handleEmoteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    setPendingEmoteFile(file);
    setEmoteName(file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'));
    setIsNamingDialogOpen(true);
    e.target.value = ''; // Reset input
  };

  const handleEmoteNameSubmit = async () => {
    if (!pendingEmoteFile || !emoteName) return;

    setIsUploadingEmote(true);
    try {
      const newEmote = await createEmote(oasis.id, pendingEmoteFile, emoteName);
      setEmotes(prev => [...prev, newEmote]);
      
      toast({
        title: "Success",
        description: `Emote :${emoteName}: added successfully!`
      });
      setIsNamingDialogOpen(false);
      setPendingEmoteFile(null);
      setEmoteName('');
    } catch (error) {
      console.error('Error uploading emote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload emote",
        variant: "destructive"
      });
    } finally {
      setIsUploadingEmote(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedEmotes.map(emoteId =>
          deleteDoc(doc(db, 'oasis', oasis.id, 'emotes', emoteId))
        )
      );
      setEmotes(prev => prev.filter(emote => !selectedEmotes.includes(emote.id)));
      setSelectedEmotes([]);
      setBulkDeleteMode(false);
      toast({
        title: "Success",
        description: `${selectedEmotes.length} emotes deleted successfully!`
      });
    } catch (error) {
      console.error('Error deleting emotes:', error);
      toast({
        title: "Error",
        description: "Failed to delete emotes",
        variant: "destructive"
      });
    }
  };

  const deleteEmote = async (emoteId: string) => {
    try {
      await deleteDoc(doc(db, 'oasis', oasis.id, 'emotes', emoteId));
      setEmotes(emotes.filter(emote => emote.id !== emoteId));
      toast({
        title: "Success",
        description: "Emote deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting emote:', error);
      toast({
        title: "Error",
        description: "Failed to delete emote",
        variant: "destructive"
      });
    } finally {
      setEmoteToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    const loadEmotes = async () => {
      try {
        // First ensure oasis has an emote ID
        await initializeOasisEmoteId(oasis.id);
        
        const emotesRef = collection(db, 'oasis', oasis.id, 'emotes');
        const emotesSnap = await getDocs(emotesRef);
        const emotesData = emotesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Emote[];
        setEmotes(emotesData);
      } catch (error) {
        console.error('Error loading emotes:', error);
        toast({
          title: "Error",
          description: "Failed to load emotes",
          variant: "destructive"
        });
      }
    };

    loadEmotes();
  }, [oasis.id]);

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
          <TabsTrigger value="emotes" className="data-[state=active]:bg-black">
            <Smile className="w-4 h-4 mr-2" />
            Emotes
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
              <AdminChat themeColors={themeColors} oasisId={oasis.id} />
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

        <TabsContent value="emotes">
          <EmotesSection
            emotes={emotes}
            totalEmoteLimit={totalEmoteLimit}
            BASE_SLOTS={BASE_SLOTS}
            isPremium={isPremium}
            extraSlots={extraSlots}
            SLOTS_PER_DOLLAR={SLOTS_PER_DOLLAR}
            isUploadingEmote={isUploadingEmote}
            handleEmoteUpload={handleEmoteUpload}
            handleBulkDelete={handleBulkDelete}
            handleSingleDelete={deleteEmote}
            selectedEmotes={selectedEmotes}
            setSelectedEmotes={setSelectedEmotes}
            bulkDeleteMode={bulkDeleteMode}
            setBulkDeleteMode={setBulkDeleteMode}
          />

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  {bulkDeleteMode 
                    ? `Are you sure you want to delete ${selectedEmotes.length} emotes? This action cannot be undone.`
                    : 'Are you sure you want to delete this emote? This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (bulkDeleteMode) {
                      handleBulkDelete();
                    } else if (emoteToDelete) {
                      deleteEmote(emoteToDelete);
                    }
                    setDeleteDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isNamingDialogOpen} onOpenChange={setIsNamingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Name Your Emote</DialogTitle>
                <DialogDescription>
                  Choose a name for your emote. This will be used when typing the emote in chat.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-black/20 rounded-lg overflow-hidden">
                    {pendingEmoteFile && (
                      <img
                        src={URL.createObjectURL(pendingEmoteFile)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Emote Name</label>
                    <input
                      type="text"
                      value={emoteName}
                      onChange={(e) => setEmoteName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md mt-1"
                      placeholder="my_cool_emote"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNamingDialogOpen(false);
                    setPendingEmoteFile(null);
                    setEmoteName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEmoteNameSubmit}
                  disabled={!emoteName || isUploadingEmote}
                  style={{
                    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
                    color: '#fff',
                    textShadow: '0 0 5px rgba(255,255,255,0.5)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
                    border: 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isUploadingEmote ? 'Uploading...' : 'Upload Emote'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;