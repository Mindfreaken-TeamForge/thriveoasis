"use client"

import React from 'react'
import { Search, MoreVertical } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
}

interface Member {
  id: string
  name: string
  role: "owner" | "admin" | "member"
  joinedAt: Date
  avatarInitials: string
  avatarColor: string
}

interface MemberManagementSidebarProps {
  oasisId: string
  themeColors: ThemeColors
}

const MemberList: React.FC<{ oasisId: string; themeColors: ThemeColors }> = ({ oasisId, themeColors }) => {
  const members: Member[] = [
    { 
      id: '1', 
      name: 'Mindfreaken', 
      role: 'owner', 
      joinedAt: new Date('2024-11-12'),
      avatarInitials: 'MI',
      avatarColor: '#ff4d4d'
    }
  ]

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="px-4 py-2 hover:bg-gray-800/50 transition-colors duration-200 rounded-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 rounded">
                <AvatarFallback 
                  style={{ backgroundColor: member.avatarColor }}
                  className="text-white text-sm font-medium"
                >
                  {member.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-100">
                    {member.name}
                  </span>
                  {member.role === 'owner' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-medium">
                      {member.role}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  Joined {member.joinedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-700 hover:text-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-gray-800 border-gray-700"
              >
                <DropdownMenuItem className="text-gray-100 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                  Manage Roles
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 hover:text-red-300 focus:bg-red-500/20 focus:text-red-300 cursor-pointer">
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}

const BannedList: React.FC<{ oasisId: string; themeColors: ThemeColors }> = ({ oasisId, themeColors }) => {
  return (
    <div className="p-4 text-sm text-gray-400">
      No banned members
    </div>
  )
}

const MemberManagementSidebar: React.FC<MemberManagementSidebarProps> = ({
  oasisId,
  themeColors,
}) => {
  return (
    <div 
      className="w-60 border-l border-gray-800 flex flex-col bg-gray-900"
    >
      <Tabs defaultValue="members" className="flex-1">
        <TabsList className="w-full bg-gray-800 rounded-none p-1 space-x-1">
          <TabsTrigger 
            value="members" 
            className="flex-1 rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
          >
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="banned" 
            className="flex-1 rounded-md data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
          >
            Banned
          </TabsTrigger>
        </TabsList>

        <div className="p-2 border-b border-gray-800">
  <div className="relative">
    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
    <Input
      placeholder="Search members..."
      className="w-full bg-gray-800 border-gray-700 pl-8 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-gray-600 focus-visible:ring-offset-0"
    />
  </div>
</div>

        <TabsContent value="members" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <MemberList 
              oasisId={oasisId}
              themeColors={themeColors}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="banned" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <BannedList 
              oasisId={oasisId}
              themeColors={themeColors}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MemberManagementSidebar