import React from 'react';
import { ChevronDown, Shield, LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PermissionCategoryProps {
  category: string;
  permissions: string[];
  selectedPermissions: string[];
  isExpanded: boolean;
  onToggleCategory: () => void;
  onTogglePermission: (permission: string) => void;
  icon: LucideIcon;
}

export default function PermissionCategory({
  category,
  permissions,
  selectedPermissions,
  isExpanded,
  onToggleCategory,
  onTogglePermission,
  icon: Icon,
}: PermissionCategoryProps) {
  const selectedCount = permissions.filter(p => selectedPermissions.includes(p)).length;

  return (
    <div className="mb-2">
      <Collapsible
        open={isExpanded}
        onOpenChange={onToggleCategory}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-lg"
          >
            <div className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors duration-200 rounded-lg cursor-pointer border border-gray-700">
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-white capitalize">{category}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
                  {selectedCount}/{permissions.length}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
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
                onClick={() => onTogglePermission(permission)}
                className="w-full p-3 flex items-center rounded-md hover:bg-gray-700/50 text-left transition-all duration-200 group"
              >
                <div 
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center mr-3 
                    transition-all duration-200
                    ${selectedPermissions.includes(permission)
                      ? 'bg-blue-500 border-blue-500 scale-110'
                      : 'border-2 border-gray-600 group-hover:border-gray-500'
                    }
                  `}
                >
                  <Shield 
                    className={`
                      w-4 h-4 transition-all duration-200
                      ${selectedPermissions.includes(permission)
                        ? 'text-white scale-100'
                        : 'text-gray-600 scale-75 opacity-50 group-hover:opacity-75'
                      }
                    `}
                  />
                </div>
                <span className="text-sm text-white">{permission}</span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}