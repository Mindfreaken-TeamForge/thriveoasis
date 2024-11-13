import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import MemberCard from './MemberCard';

interface Member {
  id: string;
  name: string;
  role: string;
  joinedAt: Date;
  lastActive?: Date;
  status: 'online' | 'offline' | 'away';
}

interface MemberListProps {
  members: Member[];
  roles: { id: string; name: string }[];
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemove: (memberId: string) => void;
  onSettings: (memberId: string) => void;
}

const MemberList: React.FC<MemberListProps> = ({
  members,
  roles,
  onRoleChange,
  onRemove,
  onSettings,
}) => {
  return (
    <ScrollArea className="h-full">
      <AnimatePresence>
        {members.map((member, index) => (
          <MemberCard
            key={member.id}
            member={member}
            roles={roles}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
            onSettings={onSettings}
            index={index}
          />
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No members found matching your filters
          </div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
};

export default MemberList;