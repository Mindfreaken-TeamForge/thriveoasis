import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, X, Shield, UserCog, MessageSquare, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import ColorSelector from './RoleManagement/ColorSelector';
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
        const rolesRef = collection(db, 'users', oasisId, 'roles');
        const rolesSnapshot = await getDocs(rolesRef);
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
      const rolesRef = collection(db, 'users', oasisId, 'roles');
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
      const roleRef = doc(db, 'users', oasisId, 'roles', editingRole.id);
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
      await deleteDoc(doc(db, 'users', oasisId, 'roles', roleId));
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
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {editingRole ? 'Edit Role' : 'Create New Role'}
                    </h3>
                    {editingRole && (
                      <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-base font-medium text-white">
                        Role Name
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter role name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="h-12 text-base bg-gray-800 border-gray-700 text-white px-4 py-2 w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-base font-medium text-white">
                        Role Color
                      </label>
                      <ColorSelector
                        color={newRoleColor}
                        onChange={setNewRoleColor}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Permissions
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(defaultPermissions).map(([category, permissions]) => (
                      <Collapsible
                        key={category}
                        open={expandedCategories.includes(category)}
                        onOpenChange={() => toggleCategory(category)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-lg"
                          >
                            <div className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-200 rounded-lg cursor-pointer border border-gray-700">
                              <div className="flex items-center space-x-3">
                                {category === 'general' && (
                                  <Shield className="w-5 h-5 text-blue-400" />
                                )}
                                {category === 'moderation' && (
                                  <UserCog className="w-5 h-5 text-blue-400" />
                                )}
                                {category === 'content' && (
                                  <MessageSquare className="w-5 h-5 text-blue-400" />
                                )}
                                {category === 'advanced' && (
                                  <Settings className="w-5 h-5 text-blue-400" />
                                )}
                                <span className="text-sm font-medium text-white capitalize">
                                  {category}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
                                  {
                                    permissions.filter((p) =>
                                      selectedPermissions.includes(p)
                                    ).length
                                  }
                                  /{permissions.length}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                                    expandedCategories.includes(category)
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                />
                              </div>
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="mt-1 p-2 space-y-1 bg-gray-800/30 rounded-lg border border-gray-700/50">
                            {permissions.map((permission) => (
                              <button
                                key={permission}
                                type="button"
                                onClick={() => togglePermission(permission)}
                                className="w-full p-3 flex items-center rounded-md hover:bg-gray-700/50 text-left transition-all duration-200 group"
                              >
                                <div
                                  className={`
                                    w-6 h-6 rounded-lg flex items-center justify-center mr-3 
                                    transition-all duration-200
                                    ${
                                      selectedPermissions.includes(permission)
                                        ? 'bg-blue-500 border-blue-500 scale-110'
                                        : 'border-2 border-gray-600 group-hover:border-gray-500'
                                    }
                                  `}
                                >
                                  <Shield
                                    className={`
                                      w-4 h-4 transition-all duration-200
                                      ${
                                        selectedPermissions.includes(permission)
                                          ? 'text-white scale-100'
                                          : 'text-gray-600 scale-75 opacity-50 group-hover:opacity-75'
                                      }
                                    `}
                                  />
                                </div>
                                <span className="text-sm text-white">
                                  {permission}
                                </span>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  {editingRole ? (
                    <Button
                      onClick={handleUpdateRole}
                      className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    >
                      <Save className="h-4 w-4" />
                      <span className="whitespace-nowrap">Save Changes</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateRole}
                      className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="whitespace-nowrap">Create Role</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="w-1/2 bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Existing Roles
                </h3>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-120px)]">
                <div className="space-y-3">
                  {roles
                    .filter((role) =>
                      role.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((role) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-900 p-4 rounded-lg flex items-center justify-between group hover:bg-gray-800 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: role.color,
                              boxShadow: `0 0 8px ${role.color}`,
                            }}
                          />
                          <span className="text-white font-medium">
                            {role.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {role.permissions.length} permissions
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            onClick={() => handleEditRole(role)}
                            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}