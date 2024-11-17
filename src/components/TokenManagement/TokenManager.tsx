import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, List, UserPlus } from 'lucide-react';
import { tokenService } from '@/services/tokenService';
import InviteModal from './InviteModal';
import TokenList from './TokenList';
import { useToast } from '@/components/ui/use-toast';
import { auth, db } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface TokenManagerProps {
  oasisId: string;
  userRole: string;
}

const TokenManager: React.FC<TokenManagerProps> = ({ oasisId, userRole }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const canCreatePermanentTokens = ['owner', 'admin'].includes(userRole);

  const buttonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const tokensRef = collection(db, 'oasis', oasisId, 'tokens');
      const q = query(tokensRef, where('createdBy', '==', auth.currentUser?.uid));
      const snapshot = await getDocs(q);
      
      const tokensList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Token[];
      
      setTokens(tokensList);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invite codes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async (
    type: 'permanent' | 'temporary',
    maxUses?: number,
    expirationHours?: number
  ) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create invites.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let newToken;
      if (type === 'permanent' && canCreatePermanentTokens) {
        newToken = await tokenService.createPermanentToken(
          oasisId,
          user.uid,
          maxUses
        );
      } else {
        if (!expirationHours) {
          toast({
            title: 'Error',
            description: 'Expiration time is required for temporary invites.',
            variant: 'destructive',
          });
          return;
        }
        newToken = await tokenService.createTemporaryToken(
          oasisId,
          user.uid,
          expirationHours,
          maxUses
        );
      }

      await fetchTokens();
      return { code: newToken.code };
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateToken = async (tokenId: string) => {
    try {
      const newCode = await tokenService.regenerateTokenCode(tokenId, oasisId);
      setTokens(prev =>
        prev.map(token =>
          token.id === tokenId ? { ...token, code: newCode } : token
        )
      );
      toast({
        title: 'Success',
        description: 'Invite code regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate invite code',
        variant: 'destructive',
      });
    }
  };

  const handleDisableToken = async (tokenId: string) => {
    try {
      await tokenService.disableToken(tokenId, oasisId);
      setTokens(prev =>
        prev.map(token =>
          token.id === tokenId ? { ...token, isEnabled: false } : token
        )
      );
      toast({
        title: 'Success',
        description: 'Invite code disabled successfully',
      });
    } catch (error) {
      console.error('Error disabling token:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable invite code',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full flex items-center justify-between" style={buttonStyle}>
            <span className="text-sm">Invite Members</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-[200px] bg-gray-800 border-gray-700"
          align="end"
          sideOffset={5}
        >
          <DropdownMenuItem
            onClick={() => setIsCreateModalOpen(true)}
            className="text-white hover:bg-gray-700 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create New Invite
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsListModalOpen(true);
              fetchTokens();
            }}
            className="text-white hover:bg-gray-700 cursor-pointer"
          >
            <List className="w-4 h-4 mr-2" />
            View My Invites
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Invite</DialogTitle>
          </DialogHeader>
          <InviteModal
            isOpen={true}
            onClose={() => setIsCreateModalOpen(false)}
            onCreateToken={handleCreateToken}
            canCreatePermanentTokens={canCreatePermanentTokens}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isListModalOpen} onOpenChange={setIsListModalOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Your Invite Codes</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <TokenList
              tokens={tokens}
              onRegenerateToken={handleRegenerateToken}
              onDisableToken={handleDisableToken}
              userRole={userRole}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenManager;