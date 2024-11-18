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
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import BannedList from './MemberManagementSidebar/BannedList';

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

    // Listen for member updates in Firestore
    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const membersQuery = query(membersRef);
    
    // Listen for presence updates in Realtime Database
    const presenceRef = ref(rtdb, `presence/${oasisId}`);

    const unsubscribeMembers = onSnapshot(membersQuery, async (snapshot) => {
      const membersList: Member[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        // Fetch user profile data
        const userRef = doc(db, 'users', docSnapshot.id);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        membersList.push({
          id: docSnapshot.id,
          displayName: userData?.displayName || data.displayName || 'Unknown User',
          photoURL: userData?.photoURL || data.photoURL,
          role: data.role || 'member',
          joinedAt: data.joinedAt?.toDate() || new Date(),
          online: false,
          lastSeen: undefined
        });
      }

      setMembers(membersList);
    });

    // Listen for presence changes
    onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      let onlineUsers = 0;

      setMembers(prevMembers => 
        prevMembers.map(member => {
          const presence = presenceData[member.id];
          if (presence?.online) onlineUsers++;
          
          return {
            ...member,
            online: !!presence?.online,
            lastSeen: presence?.lastSeen ? new Date(presence.lastSeen) : undefined
          };
        })
      );

      setOnlineCount(onlineUsers);
    });

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

  const filteredMembers = members.filter(member =>
    member.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group members by role and online status
  const groupedMembers = {
    owner: filteredMembers.filter(m => m.role === 'owner'),
    administrator: filteredMembers.filter(m => m.role === 'administrator'),
    moderator: filteredMembers.filter(m => m.role === 'moderator'),
    member: filteredMembers.filter(m => m.role === 'member'),
  };

  const roleLabels = {
    owner: 'Owner',
    administrator: 'Administrators',
    moderator: 'Moderators',
    member: 'Members',
  };

  const renderMemberGroup = (role: keyof typeof groupedMembers) => {
    const roleMembers = groupedMembers[role];
    if (roleMembers.length === 0) return null;

    const onlineMembers = roleMembers.filter(m => m.online);
    const offlineMembers = roleMembers.filter(m => !m.online);

    return (
      <div key={role} className="mb-4">
        <h3 className="text-gray-400 text-sm font-medium px-2 mb-2">
          {roleLabels[role]} — {roleMembers.length}
        </h3>

        {/* Online Members */}
        {onlineMembers.map(member => (
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
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
              </div>
              <div>
                <span className="text-gray-200">{member.displayName}</span>
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
        ))}

        {/* Offline Members */}
        {offlineMembers.map(member => (
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
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2 border-gray-900" />
              </div>
              <div>
                <span className="text-gray-400">{member.displayName}</span>
                {member.lastSeen && (
                  <p className="text-xs text-gray-500">
                    Last seen: {member.lastSeen.toLocaleString()}
                  </p>
                )}
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
        ))}
      </div>
    );
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

      {['owner', 'administrator', 'moderator', 'member'].map(role => 
        renderMemberGroup(role as keyof typeof groupedMembers)
      )}
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
    <div className="w-60 border-l border-gray-800 flex flex-col bg-gray-900">
      <Tabs defaultValue="members" className="flex-1">
        <TabsList className="w-full bg-gray-800 rounded-none p-1 space-x-1">
          <TabsTrigger value="members">Members</TabsTrigger>
          {canSeeBannedList && <TabsTrigger value="banned">Banned</TabsTrigger>}
        </TabsList>

        <TabsContent value="members" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <MemberList oasisId={oasisId} themeColors={themeColors} />
          </ScrollArea>
        </TabsContent>

        {canSeeBannedList && (
          <TabsContent value="banned" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-140px)]">
              <BannedList oasisId={oasisId} themeColors={themeColors} />
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MemberManagementSidebar;
