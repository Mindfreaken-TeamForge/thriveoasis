import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  Flame,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  UserPlus,
  Gamepad2,
} from 'lucide-react';

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
      items: ['Home', 'Apex', 'Valorant', 'Fortnite', 'Call of Duty'],
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
                  <Flame className="size-6 text-white" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    style={menuButtonStyle}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.photoURL || undefined}
                        alt={user?.displayName || 'User'}
                      />
                      <AvatarFallback>
                        {user?.displayName
                          ? getInitials(user.displayName)
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-3 font-semibold text-white">
                      {user?.displayName || 'User'}
                    </span>
                    <ChevronsUpDown className="ml-auto size-4 text-white" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] bg-[rgb(17,24,39)] border-gray-700"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="text-center text-white">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="justify-center text-white hover:bg-gray-700">
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="justify-center text-white hover:bg-gray-700">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="justify-center text-white hover:bg-gray-700"
                      onClick={() => setActiveNav('settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="justify-center text-red-500 hover:bg-red-500/20 hover:text-red-400"
                    onClick={onLogout}
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