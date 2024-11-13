import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import RoleCreationPanel from './RoleCreationPanel';
import RolesList from './RolesList';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface RoleManagementProps {
  oasisId: string;
  onClose: () => void;
}

const defaultPermissions = {
  general: [
    'View Channels',
    'Manage Channels',
    'Create Invites',
    'Change Oasis Settings',
  ],
  moderation: [
    'Kick Members',
    'Ban Members',
    'Manage Messages',
    'View Audit Log',
    'Manage Nicknames',
  ],
  content: [
    'Send Messages',
    'Embed Links',
    'Attach Files',
    'Add Reactions',
    'Use External Emojis',
    'Mention Everyone',
  ],
  voice: [
    'Connect',
    'Speak',
    'Stream',
    'Mute Members',
    'Deafen Members',
    'Move Members',
  ],
  advanced: [
    'Manage Roles',
    'Manage Webhooks',
    'Manage Oasis',
    'Administrator',
  ],
};

export default function RoleManagement({
  oasisId,
  onClose,
}: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3b82f6');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'general',
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const rolesRef = collection(db, 'oasis', oasisId, 'roles');
        const rolesQuery = query(rolesRef);
        const rolesSnapshot = await getDocs(rolesQuery);
        const rolesData = rolesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Role)
        );
        setRoles(rolesData);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch roles. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [oasisId, toast]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a role name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const rolesRef = collection(db, 'oasis', oasisId, 'roles');
      const newRole = {
        name: newRoleName,
        color: newRoleColor,
        permissions: selectedPermissions,
      };

      const docRef = await addDoc(rolesRef, newRole);
      setRoles((prev) => [...prev, { ...newRole, id: docRef.id }]);

      handleCancelEdit();

      toast({
        title: 'Success',
        description: 'Role created successfully!',
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const roleRef = doc(db, 'oasis', oasisId, 'roles', editingRole.id);
      const updatedRole = {
        name: newRoleName,
        color: newRoleColor,
        permissions: selectedPermissions,
      };

      await updateDoc(roleRef, updatedRole);

      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id ? { ...role, ...updatedRole } : role
        )
      );

      handleCancelEdit();

      toast({
        title: 'Success',
        description: 'Role updated successfully!',
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteDoc(doc(db, 'oasis', oasisId, 'roles', roleId));
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      toast({
        title: 'Success',
        description: 'Role deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleColor(role.color);
    setSelectedPermissions(role.permissions);
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleColor('#3b82f6');
    setSelectedPermissions([]);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-7xl h-[90vh] mx-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800"
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <div className="flex items-center">
              <h2 className="text-3xl font-bold text-white">Role Management</h2>
              {isOffline && (
                <div className="ml-4 flex items-center text-yellow-500">
                  <WifiOff className="w-5 h-5 mr-2" />
                  <span className="text-sm">Offline Mode</span>
                </div>
              )}
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 flex gap-6 p-6 overflow-hidden">
            <div className="w-1/2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
              <RoleCreationPanel
                editingRole={editingRole}
                newRoleName={newRoleName}
                setNewRoleName={setNewRoleName}
                newRoleColor={newRoleColor}
                setNewRoleColor={setNewRoleColor}
                selectedPermissions={selectedPermissions}
                togglePermission={togglePermission}
                defaultPermissions={defaultPermissions}
                handleCreateRole={handleCreateRole}
                handleUpdateRole={handleUpdateRole}
                handleCancelEdit={handleCancelEdit}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
              />
            </div>

            <div className="w-1/2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
              <RolesList
                roles={roles}
                handleEditRole={handleEditRole}
                handleDeleteRole={handleDeleteRole}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}