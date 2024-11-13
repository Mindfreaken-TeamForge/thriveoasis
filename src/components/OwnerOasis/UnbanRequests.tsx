import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';

interface UnbanRequest {
  id: string;
  userId: string;
  username: string;
  reason: string;
  timestamp: Date;
}

interface UnbanRequestsProps {
  themeColors: ThemeColors;
  oasisId: string;
  getContrastColor: (color: string) => string;
  cardStyle: React.CSSProperties;
}

const UnbanRequests: React.FC<UnbanRequestsProps> = ({
  themeColors,
  oasisId,
  getContrastColor,
  cardStyle,
}) => {
  const [unbanRequests, setUnbanRequests] = useState<UnbanRequest[]>([]);
  const [totalBannedMembers, setTotalBannedMembers] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!oasisId) {
        console.warn('Missing oasisId for unban requests');
        return;
      }

      try {
        // Fetch unban requests
        const unbanRequestsRef = collection(db, 'oasis', oasisId, 'unbanRequests');
        const unbanRequestsSnapshot = await getDocs(unbanRequestsRef);
        const unbanRequestsData = unbanRequestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as UnbanRequest[];
        setUnbanRequests(unbanRequestsData);

        // Fetch total banned members count
        const bannedMembersRef = collection(db, 'oasis', oasisId, 'bannedMembers');
        const bannedMembersSnapshot = await getDocs(bannedMembersRef);
        setTotalBannedMembers(bannedMembersSnapshot.size);
      } catch (error) {
        console.error('Error fetching unban data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch unban requests. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [oasisId, toast]);

  const handleUnbanRequest = async (requestId: string, approved: boolean) => {
    try {
      const request = unbanRequests.find((r) => r.id === requestId);
      if (!request) return;

      if (approved) {
        // Remove from banned members
        await deleteDoc(doc(db, 'oasis', oasisId, 'bannedMembers', request.userId));
        setTotalBannedMembers((prev) => prev - 1);
      }

      // Remove the unban request
      await deleteDoc(doc(db, 'oasis', oasisId, 'unbanRequests', requestId));
      setUnbanRequests((prev) => prev.filter((r) => r.id !== requestId));

      toast({
        title: 'Success',
        description: approved ? 'User unbanned successfully' : 'Request denied',
      });
    } catch (error) {
      console.error('Error handling unban request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process unban request',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card
      className="w-[250px] h-[350px] overflow-hidden relative transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
          Unban Requests
        </CardTitle>
        <CardDescription
          style={{
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          View Unban Request and banned members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Info className="mr-2" style={{ color: themeColors.secondary }} />
              <span className="text-gray-300">Total Banned Members</span>
            </div>
            <span className="font-semibold text-2xl text-white">
              {totalBannedMembers}
            </span>
          </div>

          <div className="space-y-2">
            {unbanRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${request.username}`}
                      />
                      <AvatarFallback>{request.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {request.username}
                      </p>
                      <p className="text-xs text-gray-400">{request.reason}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleUnbanRequest(request.id, true)}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleUnbanRequest(request.id, false)}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      size="sm"
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {unbanRequests.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No pending unban requests
              </div>
            )}
          </div>

          {unbanRequests.length > 0 && (
            <Button
              className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white"
              size="sm"
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              View All Requests
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnbanRequests;