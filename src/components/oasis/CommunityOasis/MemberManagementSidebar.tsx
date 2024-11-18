'use client';

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db, rtdb } from '@/firebase';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, onValue, get } from 'firebase/database';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import BannedList from './MemberManagementSidebar/BannedList';
import { ThemeColors } from '@/themes';

interface Member {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'administrator' | 'moderator' | 'member';
  joinedAt: Date;
  online: boolean;
  lastSeen?: Date;
}

interface MemberManagementSidebarProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const MemberList: React.FC<{ oasisId: string; themeColors: ThemeColors }> = ({
  oasisId,
  themeColors,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const userRole = useUserRole(oasisId, user?.uid);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!oasisId) return;

    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const membersQuery = query(membersRef);
    
    // Listen for presence updates in Realtime Database
    const globalPresenceRef = ref(rtdb, 'presence/global');
    const oasisPresenceRef = ref(rtdb, `presence/${oasisId}`);

    const unsubscribeMembers = onSnapshot(membersQuery, async (snapshot) => {
      const membersList: Member[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const userRef = doc(db, 'users', docSnapshot.id);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // Check if member document exists, if not create it
        const memberRef = doc(db, 'oasis', oasisId, 'members', docSnapshot.id);
        const memberDoc = await getDoc(memberRef);
        
        if (!memberDoc.exists()) {
          // Create member document with default values
          await setDoc(memberRef, {
            displayName: userData?.displayName || 'Unknown User',
            photoURL: userData?.photoURL || null,
            role: 'member',
            joinedAt: new Date(),
            permissions: ['send_messages'], // Default permissions
          });
        }
        
        // Get presence data
        const globalPresenceSnapshot = await get(ref(rtdb, `presence/global/${docSnapshot.id}`));
        const oasisPresenceSnapshot = await get(ref(rtdb, `presence/${oasisId}/${docSnapshot.id}`));
        
        const globalPresence = globalPresenceSnapshot.val();
        const oasisPresence = oasisPresenceSnapshot.val();
        
        membersList.push({
          id: docSnapshot.id,
          displayName: userData?.displayName || data.displayName || 'Unknown User',
          photoURL: userData?.photoURL || data.photoURL,
          role: data.role || 'member',
          joinedAt: data.joinedAt?.toDate() || new Date(),
          online: globalPresence?.online || oasisPresence?.online || false,
          lastSeen: globalPresence?.lastSeen ? new Date(globalPresence.lastSeen) : undefined
        });
      }

      setMembers(membersList);
      const onlineMembers = membersList.filter(member => member.online);
      setOnlineCount(onlineMembers.length);
    });

    // Listen for real-time presence changes in both locations
    const handlePresenceUpdate = () => {
      setMembers(prevMembers => {
        const updatedMembers = prevMembers.map(async member => {
          const globalPresenceSnapshot = await get(ref(rtdb, `presence/global/${member.id}`));
          const oasisPresenceSnapshot = await get(ref(rtdb, `presence/${oasisId}/${member.id}`));
          
          const globalPresence = globalPresenceSnapshot.val();
          const oasisPresence = oasisPresenceSnapshot.val();
          
          return {
            ...member,
            online: globalPresence?.online || oasisPresence?.online || false
          };
        });
        
        Promise.all(updatedMembers).then(resolvedMembers => {
          const onlineCount = resolvedMembers.filter(member => member.online).length;
          setOnlineCount(onlineCount);
          setMembers(resolvedMembers);
        });
        
        return prevMembers; // Return previous state while updating
      });
    };

    onValue(globalPresenceRef, handlePresenceUpdate);
    onValue(oasisPresenceRef, handlePresenceUpdate);

    return () => {
      unsubscribeMembers();
    };
  }, [oasisId]);

  const canManageRole = (memberRole: string) => {
    if (userRole === 'owner') return true;
    if (userRole === 'administrator' && memberRole !== 'owner' && memberRole !== 'administrator') return true;
    if (userRole === 'moderator' && memberRole === 'member') return true;
    return false;
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          bg: `${themeColors.primary}40`,
          text: themeColors.primary,
          label: 'Owner'
        };
      case 'administrator':
        return {
          bg: `${themeColors.secondary}40`,
          text: themeColors.secondary,
          label: 'Admin'
        };
      case 'moderator':
        return {
          bg: 'rgba(168, 85, 247, 0.4)',
          text: '#A855F7',
          label: 'Mod'
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.4)',
          text: '#9CA3AF',
          label: 'Member'
        };
    }
  };

  const renderMemberItem = (member: Member) => {
    const roleBadge = getRoleBadgeStyle(member.role);

    return (
      <div
        key={member.id}
        className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-800 group"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.photoURL} />
              <AvatarFallback>
                {member.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                member.online ? 'bg-green-500' : 'bg-gray-500'
              }`} 
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-sm ${member.online ? 'text-gray-200' : 'text-gray-400'}`}>
              {member.displayName}
            </span>
            <div 
              className="text-xs px-2 rounded-full"
              style={{ 
                backgroundColor: roleBadge.bg,
                color: roleBadge.text
              }}
            >
              {roleBadge.label}
            </div>
          </div>
        </div>

        {canManageRole(member.role) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Manage Roles</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<Member['role'], string> = {
    owner: 'Owner',
    administrator: 'Administrators',
    moderator: 'Moderators',
    member: 'Members',
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-gray-900 p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="pl-10 bg-gray-800 border-gray-700"
          />
        </div>
        <div className="mt-2 text-sm text-gray-400">
          {onlineCount} members online
        </div>
      </div>

      {(['owner', 'administrator', 'moderator', 'member'] as const).map(role => {
        const roleMembers = members.filter(m => m.role === role);
        if (roleMembers.length === 0) return null;

        return (
          <div key={role} className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium px-2 mb-2">
              {roleLabels[role]} — {roleMembers.length}
            </h3>
            {roleMembers.map(renderMemberItem)}
          </div>
        );
      })}
    </div>
  );
};

const MemberManagementSidebar: React.FC<MemberManagementSidebarProps> = ({
  oasisId,
  themeColors,
}) => {
  const { user } = useAuth();
  const userRole = useUserRole(oasisId, user?.uid);
  const canSeeBannedList = userRole === 'owner' || userRole === 'administrator' || userRole === 'moderator';

  return (
    <div 
      className="fixed right-0 top-0 bottom-0 w-60 border-l border-gray-800 bg-gray-900 z-50 flex flex-col"
      style={{ height: '100vh' }}
    >
      <Tabs defaultValue="members" className="flex-1 flex flex-col">
        <TabsList className="sticky top-0 w-full bg-gray-800 rounded-none p-1 space-x-1 z-10">
          <TabsTrigger value="members">Members</TabsTrigger>
          {canSeeBannedList && <TabsTrigger value="banned">Banned</TabsTrigger>}
        </TabsList>

        <div className="flex-1 overflow-hidden flex flex-col">
          <TabsContent value="members" className="flex-1 m-0 h-full">
            <ScrollArea className="h-[calc(100vh-48px)]">
              <MemberList oasisId={oasisId} themeColors={themeColors} />
            </ScrollArea>
          </TabsContent>

          {canSeeBannedList && (
            <TabsContent value="banned" className="flex-1 m-0 h-full">
              <ScrollArea className="h-[calc(100vh-48px)]">
                <BannedList oasisId={oasisId} themeColors={themeColors} />
              </ScrollArea>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default MemberManagementSidebar;
