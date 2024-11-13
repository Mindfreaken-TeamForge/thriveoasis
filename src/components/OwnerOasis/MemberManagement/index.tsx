import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeColors } from '../../../themes';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';

import MemberFilters from './MemberFilters';
import MemberList from './MemberList';
import MemberStats from './MemberStats';

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

  const handleMemberSettings = (memberId: string) => {
    // TODO: Implement member settings modal
    console.log('Open settings for member:', memberId);
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

  const stats = {
    totalMembers: members.length,
    onlineMembers: members.filter(m => m.status === 'online').length,
    averageActiveTime: '2.5 hours',
    newestMember: members[0]?.name,
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
      className="w-full h-[calc(100vh-12rem)] flex flex-col"
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

        <MemberStats stats={stats} />

        <MemberFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          roles={roles}
        />
      </CardHeader>

      <CardContent className="flex-grow min-h-0 p-4">
        <MemberList
          members={filteredAndSortedMembers}
          roles={roles}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
          onSettings={handleMemberSettings}
        />
      </CardContent>
    </Card>
  );
};

export default MemberManagement;