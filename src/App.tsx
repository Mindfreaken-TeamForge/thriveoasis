import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from 'firebase/auth';
import { Users, Target, Rocket } from 'lucide-react';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import AnimatedGrass from './components/AnimatedGrass';
import { Button } from './components/ui/button';
import { auth } from './firebase';
import { ThemeProvider } from 'next-themes'
import { ProfileProvider } from '@/contexts/ProfileContext';
import { AuthProvider } from './lib/auth';
import { setupPresence } from './services/presenceService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const shinyBlackButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: 'auto',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0 2rem'
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      
      // Set up presence for all user's Oases
      if (user) {
        const setupUserPresence = async () => {
          try {
            // Get all oases the user is a member of
            const userOasisRef = collection(db, 'users', user.uid, 'joinedOasis');
            const oasisSnapshot = await getDocs(userOasisRef);
            
            // Set up presence for each oasis
            oasisSnapshot.forEach((doc) => {
              setupPresence(user.uid, doc.id);
            });

            // Also set up presence for created oases
            const createdOasisRef = collection(db, 'users', user.uid, 'createdOasis');
            const createdOasisSnapshot = await getDocs(createdOasisRef);
            
            createdOasisSnapshot.forEach((doc) => {
              setupPresence(user.uid, doc.id);
            });
          } catch (error) {
            console.error('Error setting up presence:', error);
          }
        };

        setupUserPresence();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <AuthProvider>
      <ProfileProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {user ? (
            <div className="w-full h-screen overflow-hidden">
              <Dashboard user={user} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="min-h-screen h-screen overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-300 p-0 relative">
              {/* Animated Sun */}
              <motion.div
                className="absolute top-8 right-16 w-32 h-32 rounded-full bg-gradient-to-b from-yellow-200 to-yellow-400"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  boxShadow: '0 0 60px rgba(255, 255, 0, 0.4)',
                  zIndex: 10,
                }}
              />

              {/* Animated Clouds */}
              {[...Array(6)].map((_, i) => renderCloud(i))}

              {/* Animated Grass */}
              <AnimatedGrass />

              <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-transparent bg-clip-text">
                  THRIVE OASIS
                </h1>
                <h2 className="text-2xl text-blue-900 max-w-2xl mx-auto mb-12">
                  Cultivating Community, Elevating Competition
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 mb-12 relative">
                  {[
                    {
                      icon: Users,
                      title: 'Connect & Collaborate',
                      description:
                        'Join a thriving community of gamers, creators, and esports enthusiasts. Build lasting connections and grow together.',
                    },
                    {
                      icon: Target,
                      title: 'Achieve Excellence',
                      description:
                        'Access professional tools, analytics, and resources designed to help you reach your gaming and content creation goals.',
                    },
                    {
                      icon: Rocket,
                      title: 'Launch Your Career',
                      description:
                        'Transform your passion into a profession with our comprehensive platform for gaming and content creation.',
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/30 backdrop-blur-md p-6 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <div className="flex justify-center mb-4">
                        <feature.icon size={60} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-blue-800 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-blue-900">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={shinyBlackButtonStyle}
                >
                  Get Started
                </Button>
              </div>

              <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
              />
            </div>
          )}
        </ThemeProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

const renderCloud = (index: number) => {
  const baseWidth = Math.random() * 150 + 200;
  const baseHeight = baseWidth * 0.6;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  // Always start clouds from left of screen
  const initialX = -baseWidth;
  const duration = Math.random() * 40 + 80;
  const startDelay = (index / 6) * duration; // Stagger the start of each cloud
  
  const puffs = Array.from({ length: Math.floor(Math.random() * 4) + 3 });
  
  return (
    <motion.div
      key={index}
      className="absolute"
      style={{
        width: baseWidth + 'px',
        height: baseHeight + 'px',
        top: Math.random() * 20 + index * 8 + '%',
        left: initialX,
        zIndex: 10,
      }}
      animate={{
        x: [0, screenWidth + baseWidth],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay: startDelay,
      }}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
        }}
      />
      
      {puffs.map((_, i) => {
        const puffSize = baseWidth * (Math.random() * 0.3 + 0.4);
        const xPos = Math.random() * (baseWidth - puffSize);
        const yPos = Math.random() * (baseHeight - puffSize) - baseHeight * 0.2;
        
        return (
          <div 
            key={i}
            className="absolute"
            style={{
              width: puffSize + 'px',
              height: puffSize + 'px',
              left: xPos + 'px',
              top: yPos + 'px',
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
              borderRadius: '50%',
              filter: 'blur(8px)',
            }}
          />
        );
      })}
      
      {Array.from({ length: 3 }).map((_, i) => {
        const detailSize = baseWidth * (Math.random() * 0.15 + 0.1);
        const xPos = Math.random() * (baseWidth - detailSize);
        const yPos = Math.random() * (baseHeight - detailSize) - baseHeight * 0.1;
        
        return (
          <div 
            key={`detail-${i}`}
            className="absolute"
            style={{
              width: detailSize + 'px',
              height: detailSize + 'px',
              left: xPos + 'px',
              top: yPos + 'px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              filter: 'blur(4px)',
            }}
          />
        );
      })}
    </motion.div>
  );
};