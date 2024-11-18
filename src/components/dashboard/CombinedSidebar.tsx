import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  UserPlus,
  Gamepad2,
  User,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { auth } from '@/firebase';
import { ProfileModal } from '../ProfileModal';

interface Oasis {
  id: string;
  name: string;
  type: string;
  color: string;
  imageUrl?: string;
  isLocked?: boolean;
  theme: string;
}

interface CombinedSidebarProps {
  oasis: Oasis[];
  selectedOasis: Oasis | null;
  setSelectedOasis: (oasis: Oasis | null) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onLogout: () => void;
}

const data = {
  navMain: [
    {
      title: 'Stats',
      icon: BarChart,
      items: ['Valorant', 'Apex', 'Fortnite'],
    },
    {
      title: 'Oasis',
      icon: Users,
    },
    { title: 'Chat', icon: MessageCircle },
    {
      title: 'Free Agency',
      icon: Users,
      items: [
        { title: 'Content Creators', icon: UserPlus },
        {
          title: 'Players',
          icon: Gamepad2,
          items: ['Apex Legends', 'Valorant'],
        },
      ],
    },
  ],
};

const CombinedSidebar: React.FC<CombinedSidebarProps> = ({
  oasis,
  selectedOasis,
  setSelectedOasis,
  activeNav,
  setActiveNav,
  onLogout,
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const user = auth.currentUser;
  const { user: authUser, signOut } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    displayName: authUser?.displayName || '',
    photoURL: authUser?.photoURL || ''
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (authUser) {
        setUserProfile({
          displayName: authUser.displayName || '',
          photoURL: authUser.photoURL || ''
        });
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      setUserProfile({
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL || ''
      });
    }
  }, [authUser]);

  const sidebarStyle: React.CSSProperties = {
    background: 'rgb(17 24 39)',
    borderRight: '1px solid rgb(75 85 99)',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
  };

  const menuButtonStyle: React.CSSProperties = {
    background: 'rgb(31 41 55)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    border: 'none',
    transition: 'all 0.3s ease',
  };

  const activeMenuButtonStyle: React.CSSProperties = {
    ...menuButtonStyle,
    background: 'rgb(55 65 81)',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.7)',
  };

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleNavClick = (title: string) => {
    setSelectedOasis(null);
    const normalizedTitle = title.toLowerCase();
    setActiveNav(normalizedTitle);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const handleProfileClick = (event: Event) => {
    event.preventDefault();
    setIsProfileModalOpen(true);
  };

  return (
    <SidebarProvider>
      <Sidebar className="fixed left-0 top-0 h-screen z-50" style={sidebarStyle}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-40"
              >
                <SidebarMenuButton
                  size="lg"
                  onClick={() => {
                    setActiveNav('home');
                    setSelectedOasis(null);
                  }}
                  style={activeNav === 'home' ? activeMenuButtonStyle : menuButtonStyle}
                >
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="font-semibold text-white">
                      ThriveOasis
                    </span>
                    <span className="text-xs text-white/80">Home</span>
                  </div>
                </SidebarMenuButton>
              </motion.div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 px-4">
              Navigation
            </SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  open={openItems.includes(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <SidebarMenuItem>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full"
                    >
                      <CollapsibleTrigger className="w-full">
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.title)}
                          style={
                            activeNav === item.title.toLowerCase()
                              ? activeMenuButtonStyle
                              : menuButtonStyle
                          }
                        >
                          <item.icon className="mr-2 size-5" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.items && (
                            <ChevronDown
                              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                                openItems.includes(item.title)
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </motion.div>
                  </SidebarMenuItem>
                  {item.items && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) =>
                          typeof subItem === 'string' ? (
                            <SidebarMenuSubItem key={subItem}>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full"
                              >
                                <SidebarMenuSubButton style={menuButtonStyle}>
                                  <div className="w-full pl-9 pr-2 py-2">
                                    {subItem}
                                  </div>
                                </SidebarMenuSubButton>
                              </motion.div>
                            </SidebarMenuSubItem>
                          ) : (
                            <Collapsible key={subItem.title}>
                              <SidebarMenuSubItem>
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="w-full"
                                >
                                  <CollapsibleTrigger className="w-full">
                                    <SidebarMenuSubButton style={menuButtonStyle}>
                                      <div className="flex items-center justify-between w-full pl-9 pr-2">
                                        <div className="flex items-center">
                                          {subItem.icon && (
                                            <subItem.icon className="mr-2 h-4 w-4" />
                                          )}
                                          <span>{subItem.title}</span>
                                        </div>
                                        {subItem.items && (
                                          <ChevronDown
                                            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                              openItems.includes(subItem.title)
                                                ? 'rotate-180'
                                                : ''
                                            }`}
                                          />
                                        )}
                                      </div>
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                </motion.div>
                                {subItem.items && (
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subItem.items.map((nestedItem) => (
                                        <SidebarMenuSubItem key={nestedItem}>
                                          <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full"
                                          >
                                            <SidebarMenuSubButton style={menuButtonStyle}>
                                              <div className="w-full pl-11 pr-2 py-2">
                                                {nestedItem}
                                              </div>
                                            </SidebarMenuSubButton>
                                          </motion.div>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                )}
                              </SidebarMenuSubItem>
                            </Collapsible>
                          )
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-gray-700">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu 
                open={dropdownOpen} 
                onOpenChange={setDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    style={menuButtonStyle}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={userProfile.photoURL}
                        alt={userProfile.displayName || 'User'}
                      />
                      <AvatarFallback>
                        {userProfile.displayName
                          ? getInitials(userProfile.displayName)
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-3 font-semibold text-white">
                      {userProfile.displayName || 'User'}
                    </span>
                    <ChevronsUpDown className="ml-auto size-4 text-white" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel className="px-4 py-3 border-b border-gray-800">
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={userProfile.photoURL}
                          alt={userProfile.displayName || 'User'}
                        />
                        <AvatarFallback>
                          {userProfile.displayName
                            ? getInitials(userProfile.displayName)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white">
                          {userProfile.displayName || 'Guest User'}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <ProfileModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => {
                      setIsProfileModalOpen(false);
                      setDropdownOpen(false);
                    }}
                    onOpen={() => {
                      setIsProfileModalOpen(true);
                      setDropdownOpen(true);
                    }}
                  />

                  <DropdownMenuItem className="px-4 py-2 hover:bg-gray-800 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="px-4 py-2 hover:bg-gray-800 cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="px-4 py-2 hover:bg-gray-800 cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-gray-800" />

                  <DropdownMenuItem 
                    className="px-4 py-2 text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default CombinedSidebar;