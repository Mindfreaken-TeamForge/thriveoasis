import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { RoleType } from '@/types/role';

export function useRole(oasisId: string) {
  const [role, setRole] = useState<RoleType>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user || !oasisId) {
        setIsLoading(false);
        return;
      }

      try {
        const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);

        if (memberDoc.exists()) {
          setRole(memberDoc.data().role as RoleType);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch role'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [oasisId]);

  const hasPermission = (permission: string): boolean => {
    switch (role) {
      case 'owner':
        return true;
      case 'admin':
        return permission !== 'administrator' && permission !== 'manage_roles';
      case 'moderator':
        return ['kick_members', 'ban_members', 'manage_messages', 'view_audit_log'].includes(permission);
      case 'member':
        return ['create_posts', 'view_channels'].includes(permission);
      default:
        return false;
    }
  };

  const canAccessTab = (tab: string): boolean => {
    switch (tab) {
      case 'owner':
        return role === 'owner';
      case 'admin':
        return ['owner', 'admin'].includes(role);
      case 'moderation':
        return ['owner', 'admin', 'moderator'].includes(role);
      case 'community':
        return true;
      default:
        return false;
    }
  };

  return {
    role,
    isLoading,
    error,
    hasPermission,
    canAccessTab,
    isOwner: role === 'owner',
    isAdmin: ['owner', 'admin'].includes(role),
    isModerator: ['owner', 'admin', 'moderator'].includes(role),
  };
}