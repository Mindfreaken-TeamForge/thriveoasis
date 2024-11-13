import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Clock, UserX, Settings, Filter } from 'lucide-react';
import { ThemeColors } from '../../themes';
import { db, auth } from '@/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  role: string;
  joinedAt: Date;
  lastActive?: Date;
  status: 'online' | 'offline' | 'away';
}

interface MemberManagementProps {
  themeColors: ThemeColors;
  oasisId: string;
  getContrastColor: (color: string) => string;
  cardStyle: React.CSSProperties;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  themeColors,
  oasisId,
  cardStyle,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joinedAt'>('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!oasisId) return;

      try {
        setIsLoading(true);
        const membersRef = collection(db, 'oasis', oasisId, 'members');
        const membersQuery = query(membersRef, orderBy('joinedAt', 'desc'));
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().userName || 'Unknown User',
          role: doc.data().role || 'member',
          joinedAt: doc.data().joinedAt?.toDate() || new Date(),
          lastActive: doc.data().lastActive?.toDate(),
          status: doc.data().status || 'offline',
        })) as Member[];
        setMembers(membersData);

        const rolesRef = collection(db, 'oasis', oasisId, 'roles');
        const rolesSnapshot = await getDocs(rolesRef);
        const rolesData = rolesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setRoles(rolesData);
      } catch (error) {
        console.error('Error fetching member data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch member data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [oasisId, toast]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const memberRef = doc(db, 'oasis', oasisId, 'members', memberId);
      await updateDoc(memberRef, { role: newRole });
      
      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'oasis', oasisId, 'members', memberId));
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const filteredAndSortedMembers = members
    .filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === 'role') {
        return sortOrder === 'asc'
          ? a.role.localeCompare(b.role)
          : b.role.localeCompare(a.role);
      }
      return sortOrder === 'asc'
        ? a.joinedAt.getTime() - b.joinedAt.getTime()
        : b.joinedAt.getTime() - a.joinedAt.getTime();
    });

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

  if (isLoading) {
    return (
      <Card className="w-full h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </Card>
    );
  }

  return (
    <Card
  className="w-full h-[calc(100vh-6rem)] flex flex-col"
  style={{
    background: 'rgb(17 24 39)',
    boxShadow: `0 0 20px ${themeColors.accent}`,
    border: `1px solid rgb(75 85 99)`,
  }}
>
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-xl text-white">
              Member Management
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm">
            {members.length} Members
          </Badge>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <Filter className={`w-4 h-4 transform transition-transform ${
                sortOrder === 'desc' ? 'rotate-180' : ''
              }`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow min-h-0 p-4">
        <ScrollArea className="h-full">
          <AnimatePresence>
            {filteredAndSortedMembers.map((member, index) => (
              <motion.div
                key={member.id}
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
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
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        <Settings className="w-4 h-4 text-gray-300" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredAndSortedMembers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No members found matching your filters
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MemberManagement;