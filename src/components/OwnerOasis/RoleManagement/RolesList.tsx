import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface RolesListProps {
  roles: Role[];
  handleEditRole: (role: Role) => void;
  handleDeleteRole: (roleId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function RolesList({
  roles,
  handleEditRole,
  handleDeleteRole,
  searchTerm,
  setSearchTerm,
}: RolesListProps) {
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Existing Roles</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-gray-900 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredRoles.map((role) => (
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
              <span className="text-white font-medium">{role.name}</span>
              <span className="text-gray-400 text-sm">
                {role.permissions.length} permissions
              </span>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                onClick={() => handleEditRole(role)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDeleteRole(role.id)}
                className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}