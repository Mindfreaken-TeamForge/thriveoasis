import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, Clock } from 'lucide-react';
import { ThemeColors } from '@/themes';
import { db } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';

interface BannedUser {
  id: string;
  name: string;
  reason: string;
  bannedAt: Date;
  bannedBy: string;
}

interface BannedListProps {
  oasisId: string;
  themeColors: ThemeColors;
}

// Mock data for testing
const mockBannedUsers: BannedUser[] = [
  {
    id: '1',
    name: 'John Doe',
    reason: 'Spamming in chat',
    bannedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    bannedBy: 'Moderator Mike',
  },
  {
    id: '2',
    name: 'Jane Smith',
    reason: 'Inappropriate behavior',
    bannedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    bannedBy: 'Admin Alice',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    reason: 'Multiple rule violations',
    bannedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
    bannedBy: 'Owner Oliver',
  },
];

const BannedList: React.FC<BannedListProps> = ({ oasisId, themeColors }) => {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check access first
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !oasisId) {
        setHasAccess(false);
        return;
      }

      try {
        const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const data = memberDoc.data();
          const hasModAccess = 
            data.role === 'owner' || 
            data.role === 'administrator' ||
            data.permissions?.includes('moderate_content');
          setHasAccess(hasModAccess);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [user, oasisId]);

  // Load banned users only if has access
  useEffect(() => {
    if (!hasAccess || !oasisId) return;

    const bannedUsersRef = collection(db, 'oasis', oasisId, 'bannedMembers');
    const q = query(bannedUsersRef, orderBy('bannedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannedData: BannedUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bannedData.push({
          id: doc.id,
          name: data.userName || 'Unknown User',
          reason: data.reason || 'No reason provided',
          bannedAt: data.bannedAt?.toDate() || new Date(),
          bannedBy: data.bannedBy || 'Unknown Moderator',
        });
      });
      setBannedUsers(bannedData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching banned users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch banned users',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [oasisId, hasAccess, toast]);

  const handleUnban = async (userId: string) => {
    if (!hasAccess) return;

    try {
      await deleteDoc(doc(db, 'oasis', oasisId, 'bannedMembers', userId));
      toast({
        title: 'Success',
        description: 'User has been unbanned',
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unban user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = bannedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search banned users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <AnimatePresence>
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800/70 transition-all duration-200 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                    />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium text-white">
                      {user.name}
                    </span>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Banned {user.bannedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnban(user.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-500/20 hover:bg-green-500/30 text-green-400"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Unban
                </Button>
              </div>

              <div className="text-xs text-gray-400 pl-11">
                <span className="text-red-400">Reason:</span> {user.reason}
              </div>
              <div className="text-xs text-gray-400 pl-11">
                <span className="text-red-400">Banned by:</span> {user.bannedBy}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No banned users found
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BannedList;