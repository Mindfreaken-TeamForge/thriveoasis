import React from 'react';
import CombinedSidebar from './CombinedSidebar';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
}

interface CombinedNavigationProps {
  oasis: Oasis[];
  selectedOasis: Oasis | null;
  setSelectedOasis: (oasis: Oasis | null) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onLogout: () => void;
}

const CombinedNavigation: React.FC<CombinedNavigationProps> = ({
  oasis,
  selectedOasis,
  setSelectedOasis,
  activeNav,
  setActiveNav,
  onLogout,
}) => {
  return (
    <CombinedSidebar
      oasis={oasis}
      selectedOasis={selectedOasis}
      setSelectedOasis={setSelectedOasis}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      onLogout={onLogout}
    />
  );
};

export default CombinedNavigation;
