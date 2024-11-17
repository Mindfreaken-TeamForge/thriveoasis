import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '@/components/ui/use-toast';
import DashboardContent from './dashboard/DashboardContent';
import CombinedNavigation from './dashboard/CombinedNavigation';
import OasisCreationModal from './OasisCreationModal';
import { createOasis, getOasisDetails } from '@/services/oasisService';
import { themes } from '@/themes';
import type { ThemeMode } from '@/components/ThemeSelector/ThemeMode';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
  themeMode?: ThemeMode;
  ownerId: string;
  memberCount?: number;
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeNav, setActiveNav] = useState('oasis');
  const [selectedOasis, setSelectedOasis] = useState<Oasis | null>(null);
  const [oasis, setOasis] = useState<Oasis[]>([]);
  const [joinedOasis, setJoinedOasis] = useState<Oasis[]>([]);
  const [isOasisOnboardingOpen, setIsOasisOnboardingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current theme based on selected Oasis or default
  const currentTheme = selectedOasis?.theme || 'Thrive Oasis(Default)';
  const themeColors = themes[currentTheme as keyof typeof themes] || themes['Thrive Oasis(Default)'];

  useEffect(() => {
    const fetchOasis = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user's created oasis
        const createdOasisRef = collection(db, 'users', user.uid, 'createdOasis');
        const createdOasisQuery = query(createdOasisRef, orderBy('createdAt', 'desc'));
        const createdOasisSnapshot = await getDocs(createdOasisQuery);
        
        const createdOasisPromises = createdOasisSnapshot.docs.map(async (doc) => {
          const oasisDetails = await getOasisDetails(doc.id);
          return oasisDetails as Oasis;
        });

        const createdOasisList = await Promise.all(createdOasisPromises);
        setOasis(createdOasisList);

        // Fetch joined oasis
        const joinedOasisRef = collection(db, 'users', user.uid, 'joinedOasis');
        const joinedOasisQuery = query(joinedOasisRef, orderBy('joinedAt', 'desc'));
        const joinedOasisSnapshot = await getDocs(joinedOasisRef);
        
        const joinedOasisPromises = joinedOasisSnapshot.docs.map(async (doc) => {
          const oasisDetails = await getOasisDetails(doc.id);
          return oasisDetails as Oasis;
        });

        const joinedOasisList = await Promise.all(joinedOasisPromises);
        setJoinedOasis(joinedOasisList);

      } catch (err) {
        console.error('Error fetching oasis data:', err);
        setError('Failed to load oasis data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load oasis data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOasis();
  }, [user, toast]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{
        background: themeColors.background,
        color: themeColors.text,
      }}>
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{
        background: themeColors.background,
        color: themeColors.text,
      }}
    >
      <CombinedNavigation
        oasis={[...oasis, ...joinedOasis]}
        selectedOasis={selectedOasis}
        setSelectedOasis={setSelectedOasis}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onLogout={onLogout}
      />

      <div className="flex-1 ml-[240px] h-screen overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <DashboardContent
            activeNav={activeNav}
            selectedOasis={selectedOasis}
            oasis={oasis}
            setOasis={setOasis}
            joinedOasis={joinedOasis}
            setJoinedOasis={setJoinedOasis}
            setSelectedOasis={setSelectedOasis}
            setIsOasisOnboardingOpen={setIsOasisOnboardingOpen}
            onLogout={onLogout}
          />
        )}
      </div>

      {isOasisOnboardingOpen && (
        <OasisCreationModal
          onClose={() => setIsOasisOnboardingOpen(false)}
          onCreateOasis={async (oasisData) => {
            if (!user) return;
            try {
              await createOasis(user.uid, oasisData);
              setOasis(prev => [...prev, { ...oasisData, ownerId: user.uid }]);
              setIsOasisOnboardingOpen(false);
              toast({
                title: 'Success',
                description: `Oasis "${oasisData.name}" created successfully!`,
              });
            } catch (error) {
              console.error('Error creating oasis:', error);
              toast({
                title: 'Error',
                description: 'Failed to create oasis. Please try again.',
                variant: 'destructive',
              });
            }
          }}
          initialOasisName=""
        />
      )}
    </div>
  );
}