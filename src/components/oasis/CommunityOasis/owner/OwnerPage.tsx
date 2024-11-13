import React, { useState } from 'react';
import { ThemeColors, themes } from '@/themes';
import OasisStatistics from '@/components/OwnerOasis/OasisStatistics';
import QuickActions from '@/components/OwnerOasis/QuickActions';
import UnbanRequests from '@/components/OwnerOasis/UnbanRequests';
import RoleManagement from '@/components/OwnerOasis/RoleManagement';

interface OwnerPageProps {
  oasis: {
    id: string;
    name: string;
    theme: string;
    tier?: string;
  };
  themeColors: ThemeColors;
  onThemeChange: (theme: string) => void;
}

const OwnerPage: React.FC<OwnerPageProps> = ({ oasis, themeColors, onThemeChange }) => {
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${themeColors.accent}`,
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <OasisStatistics
        themeColors={themeColors}
        oasisId={oasis.id}
        cardStyle={cardStyle}
      />
      <QuickActions
        themeColors={themeColors}
        currentTheme={oasis.theme}
        themes={themes}
        handleThemeChange={onThemeChange}
        setIsRoleManagementOpen={setIsRoleManagementOpen}
        cardStyle={cardStyle}
        oasisData={oasis}
      />
      <UnbanRequests
        themeColors={themeColors}
        oasisId={oasis.id}
        getContrastColor={getContrastColor}
        cardStyle={cardStyle}
      />

      {isRoleManagementOpen && (
        <RoleManagement
          oasisId={oasis.id}
          onClose={() => setIsRoleManagementOpen(false)}
        />
      )}
    </div>
  );
};

export default OwnerPage;