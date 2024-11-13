import React, { useState } from 'react';
import { Send, Pin, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeColors } from '@/themes';
import { auth } from '@/firebase';

interface Message {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  timestamp: Date;
  isPinned?: boolean;
}

interface AdminChatProps {
  themeColors: ThemeColors;
}

const AdminChat: React.FC<AdminChatProps> = ({ themeColors }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      author: 'System',
      authorRole: 'System',
      content: 'Welcome to the Admin Chat. This chat is permanent and messages cannot be deleted.',
      timestamp: new Date(),
      isPinned: true
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    const message: Message = {
      id: Date.now().toString(),
      author: user?.displayName || 'Unknown Admin',
      authorRole: 'Admin',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const togglePin = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isPinned: !msg.isPinned }
          : msg
      )
    );
  };

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <div 
      className="flex flex-col h-[800px] rounded-lg overflow-hidden"
      style={{
        background: themeColors.background,
        boxShadow: `0 0 20px ${themeColors.accent}`,
        border: `3px solid ${themeColors.primary}`,
      }}
    >
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center mb-4">
          Admin Chat
          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
            Permanent
          </span>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages or users..."
            className="pl-10 pr-4 py-2 bg-gray-800 border-gray-700 text-white w-full"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {sortedMessages.map((message) => (
            <div
              key={message.id}
              className={`relative group ${
                message.isPinned ? 'bg-gray-800/50' : 'bg-gray-900/30'
              } p-4 rounded-lg`}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.author}`} />
                  <AvatarFallback>{message.author[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">
                      {message.author}
                      <span className="ml-2 text-xs text-blue-400">
                        {message.authorRole}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.isPinned && (
                      <Pin className="h-3 w-3 text-blue-400" />
                    )}
                  </div>
                  <p className="text-gray-200 mt-1 text-sm leading-relaxed">{message.content}</p>
                </div>
                <Button
                  onClick={() => togglePin(message.id)}
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pin className={`h-4 w-4 ${message.isPinned ? 'text-blue-400' : 'text-gray-400'}`} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white px-4 py-2"
          />
          <Button
            onClick={handleSendMessage}
            className="px-4 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;