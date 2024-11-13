import React from 'react';
import { Shield, UserCog, MessageSquare, Settings } from 'lucide-react';
import PermissionCategory from './PermissionCategory';

interface PermissionsListProps {
  defaultPermissions: Record<string, string[]>;
  selectedPermissions: string[];
  expandedCategories: string[];
  togglePermission: (permission: string) => void;
  toggleCategory: (category: string) => void;
}

const categoryIcons = {
  general: Shield,
  moderation: UserCog,
  content: MessageSquare,
  advanced: Settings,
  voice: MessageSquare,
};

export default function PermissionsList({
  defaultPermissions,
  selectedPermissions,
  expandedCategories,
  togglePermission,
  toggleCategory,
}: PermissionsListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Permissions</h3>
      <div className="space-y-2">
        {Object.entries(defaultPermissions).map(([category, permissions]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || Shield;
          return (
            <PermissionCategory
              key={category}
              category={category}
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              isExpanded={expandedCategories.includes(category)}
              onToggleCategory={() => toggleCategory(category)}
              onTogglePermission={togglePermission}
              icon={Icon}
            />
          );
        })}
      </div>
    </div>
  );
}