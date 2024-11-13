import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Info, ChevronUp } from 'lucide-react';
import { ThemeColors } from '../../themes';
import { db } from '../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';

interface BannedUser {
  id: string;
  name: string;
  reason: string;
}

interface BannedUsersProps {
  themeColors: ThemeColors;
  oasisId: string;
  cardStyle: React.CSSProperties;
}

const BannedUsers: React.FC<BannedUsersProps> = ({
  themeColors,
  oasisId,
  cardStyle,
}) => {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);

  useEffect(() => {
    const fetchBannedUsers = async () => {
      const bannedUsersRef = collection(db, 'users', oasisId, 'bannedUsers');
      const bannedUsersSnapshot = await getDocs(bannedUsersRef);
      const bannedUsersData = bannedUsersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as BannedUser)
      );
      setBannedUsers(bannedUsersData);
    };

    fetchBannedUsers();
  }, [oasisId]);

  const onUnban = (userId: string) => {
    console.log(`Unbanning user ${userId}`);
  };

  return (
    <Card
      className="md:col-span-2 relative transition-all duration-300 hover:scale-105 hover:shadow-lg"
      style={{
        background: 'rgb(17 24 39)',
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `1px solid rgb(75 85 99)`,
      }}
    >
      <CardHeader>
        <CardTitle
          className="text-xl text-white"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Banned Users
        </CardTitle>
        <CardDescription
          style={{
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          Manage banned users in your oasis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {bannedUsers.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between py-2 px-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center">
                <Avatar className="mr-2">
                  <AvatarImage
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                  />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white">{user.name}</span>
              </div>
              <div className="flex items-center">
                <Badge variant="destructive" className="mr-2">
                  Banned
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-8 w-8 bg-gray-700 hover:bg-gray-600"
                      >
                        <Info className="h-4 w-4 text-gray-300" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Reason: {user.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  onClick={() => onUnban(user.id)}
                >
                  Unban
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            View All Banned Users
            <ChevronUp className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannedUsers;