import React from 'react';
import { motion } from 'framer-motion';
import { Clock, UserX, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Member {
  id: string;
  name: string;
  role: string;
  joinedAt: Date;
  lastActive?: Date;
  status: 'online' | 'offline' | 'away';
}

interface MemberCardProps {
  member: Member;
  roles: { id: string; name: string }[];
  onRoleChange: (memberId: string, newRole: string) => void;
  onRemove: (memberId: string) => void;
  onSettings: (memberId: string) => void;
  index: number;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  roles,
  onRoleChange,
  onRemove,
  onSettings,
  index,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="mb-2"
    >
      <div className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${member.name}`}
                  alt={member.name}
                />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                getStatusColor(member.status)
              } border-2 border-gray-900`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{member.name}</h3>
                <Badge
                  variant="secondary"
                  className={`${
                    member.role === 'owner'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : member.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {member.role}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Joined {formatDate(member.joinedAt)}</span>
                {member.lastActive && (
                  <>
                    <span>•</span>
                    <span>Last active {formatDate(member.lastActive)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Select
              value={member.role}
              onValueChange={(value) => onRoleChange(member.id, value)}
            >
              <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.name}
                    className="text-white hover:bg-gray-700"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSettings(member.id)}
              className="bg-gray-700 hover:bg-gray-600"
            >
              <Settings className="w-4 h-4 text-gray-300" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(member.id)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
            >
              <UserX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MemberCard;