import React, { useState, useEffect } from 'react';
import { Search, Clock, Users, RefreshCw, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeColors } from '@/themes';
import { db } from '@/firebase';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';

interface Invite {
  id: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isEnabled: boolean;
  maxUses?: number;
  currentUses: number;
  type: 'permanent' | 'temporary';
}

interface InviteListProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const InviteList: React.FC<InviteListProps> = ({ oasisId, themeColors }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvites();
  }, [oasisId]);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      const invitesRef = collection(db, 'oasis', oasisId, 'invites');
      const invitesSnapshot = await getDocs(invitesRef);
      
      const invitesList = invitesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          code: data.code || '',
          createdBy: data.createdBy || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          isEnabled: data.isEnabled ?? true,
          maxUses: data.maxUses,
          currentUses: data.currentUses || 0,
          type: data.type || 'permanent'
        } as Invite;
      });

      setInvites(invitesList);
    } catch (error) {
      console.error('Error fetching invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCode = async (inviteId: string) => {
    try {
      const inviteRef = doc(db, 'oasis', oasisId, 'invites', inviteId);
      const newCode = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await updateDoc(inviteRef, { code: newCode });
      
      setInvites(prev => prev.map(invite => 
        invite.id === inviteId ? { ...invite, code: newCode } : invite
      ));

      toast({
        title: 'Success',
        description: 'Invite code regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating code:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate invite code',
        variant: 'destructive',
      });
    }
  };

  const handleDisableInvite = async (inviteId: string) => {
    try {
      const inviteRef = doc(db, 'oasis', oasisId, 'invites', inviteId);
      await updateDoc(inviteRef, { isEnabled: false });
      
      setInvites(prev => prev.map(invite => 
        invite.id === inviteId ? { ...invite, isEnabled: false } : invite
      ));

      toast({
        title: 'Success',
        description: 'Invite disabled successfully',
      });
    } catch (error) {
      console.error('Error disabling invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable invite',
        variant: 'destructive',
      });
    }
  };

  const filteredInvites = invites.filter(invite => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invite.code.toLowerCase().includes(searchLower) ||
      invite.createdBy.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search invites..."
          className="pl-10 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {filteredInvites.map((invite) => (
            <div
              key={invite.id}
              className="bg-gray-800/50 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <code className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      {invite.code}
                    </code>
                    <span className={`text-sm px-2 py-1 rounded ${
                      invite.isEnabled 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {invite.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-400">
                      Created by: {invite.createdBy}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {invite.type === 'temporary' && invite.expiresAt
                          ? `Expires: ${invite.expiresAt.toLocaleDateString()}`
                          : 'Never expires'}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        {invite.currentUses}
                        {invite.maxUses ? `/${invite.maxUses}` : ''} uses
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleRegenerateCode(invite.id)}
                    className="p-2 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 rounded-full"
                    disabled={!invite.isEnabled}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {invite.isEnabled && (
                    <Button
                      onClick={() => handleDisableInvite(invite.id)}
                      className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-full"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredInvites.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No invites found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InviteList;