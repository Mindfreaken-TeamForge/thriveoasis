import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db, rtdb } from '@/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { useUserProfile } from '@/hooks/useUserProfiles';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeColors } from '@/themes';

interface Member {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'administrator' | 'moderator' | 'member';
  online: boolean;
  lastSeen: string;
}

interface MembersSidebarProps {
  oasisId: string;
  themeColors: ThemeColors;
}

const MembersSidebar: React.FC<MembersSidebarProps> = ({ oasisId, themeColors }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!oasisId) return;

    // Listen for member updates in Firestore
    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const membersQuery = query(membersRef);
    
    // Listen for presence updates in Realtime Database
    const presenceRef = ref(rtdb, `presence/${oasisId}`);

    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersList: Member[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        membersList.push({
          id: doc.id,
          displayName: data.displayName || 'Unknown User',
          photoURL: data.photoURL,
          role: data.role || 'member',
          online: false,
          lastSeen: new Date().toISOString()
        });
      });

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
            lastSeen: presence?.lastSeen || member.lastSeen
          };
        })
      );

      setOnlineCount(onlineUsers);
    });

    return () => {
      unsubscribeMembers();
    };
  }, [oasisId]);

  const groupedMembers = members.reduce((groups, member) => {
    const role = member.role;
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(member);
    return groups;
  }, {} as Record<string, Member[]>);

  const roleOrder = ['owner', 'administrator', 'moderator', 'member'];
  const roleLabels = {
    owner: 'Owner',
    administrator: 'Administrators',
    moderator: 'Moderators',
    member: 'Members'
  };

  return (
    <div 
      className="w-60 bg-gray-900 border-l border-gray-700 flex flex-col"
      style={{
        boxShadow: `0 0 20px ${themeColors.accent}20`,
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Members
          </h2>
          <span className="text-sm text-gray-400">
            {onlineCount} online
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {roleOrder.map(role => {
            const roleMembers = groupedMembers[role] || [];
            if (roleMembers.length === 0) return null;

            const onlineMembers = roleMembers.filter(m => m.online);
            const offlineMembers = roleMembers.filter(m => !m.online);

            return (
              <div key={role} className="mb-6">
                <h3 className="text-gray-400 text-sm font-medium px-2 mb-2">
                  {roleLabels[role]} — {roleMembers.length}
                </h3>

                {/* Online Members */}
                {onlineMembers.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-800 group cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>
                          {member.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Circle className="w-3 h-3 text-green-500 absolute -bottom-0.5 -right-0.5 fill-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{member.displayName}</span>
                  </motion.div>
                ))}

                {/* Offline Members */}
                {offlineMembers.map(member => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-800 group cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>
                          {member.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Circle className="w-3 h-3 text-gray-500 absolute -bottom-0.5 -right-0.5 fill-gray-500" />
                    </div>
                    <span className="text-gray-400 text-sm">{member.displayName}</span>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MembersSidebar; 