import React from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColorSelector from './ColorSelector';
import PermissionsList from './PermissionsList';

interface RoleCreationPanelProps {
  editingRole: any;
  newRoleName: string;
  setNewRoleName: (name: string) => void;
  newRoleColor: string;
  setNewRoleColor: (color: string) => void;
  selectedPermissions: string[];
  togglePermission: (permission: string) => void;
  defaultPermissions: Record<string, string[]>;
  handleCreateRole: () => void;
  handleUpdateRole: () => void;
  handleCancelEdit: () => void;
  expandedCategories: string[];
  toggleCategory: (category: string) => void;
}

export default function RoleCreationPanel({
  editingRole,
  newRoleName,
  setNewRoleName,
  newRoleColor,
  setNewRoleColor,
  selectedPermissions,
  togglePermission,
  defaultPermissions,
  handleCreateRole,
  handleUpdateRole,
  handleCancelEdit,
  expandedCategories,
  toggleCategory,
}: RoleCreationPanelProps) {
  return (
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
              className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium text-white">Role Name</Label>
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
            <Label className="text-base font-medium text-white">Role Color</Label>
            <ColorSelector
              color={newRoleColor}
              onChange={setNewRoleColor}
            />
          </div>
        </div>
      </div>

      <PermissionsList
        defaultPermissions={defaultPermissions}
        selectedPermissions={selectedPermissions}
        expandedCategories={expandedCategories}
        togglePermission={togglePermission}
        toggleCategory={toggleCategory}
      />

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
  );
}