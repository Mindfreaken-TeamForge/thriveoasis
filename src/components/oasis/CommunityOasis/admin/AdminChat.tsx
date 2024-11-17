import React, { useState, useEffect, useRef } from 'react';
import { Send, Pin, Search, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeColors } from '@/themes';
import { auth, db } from '@/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  where
} from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Message {
  id: string;
  author: string;
  authorId: string;
  authorRole: string;
  content: string;
  timestamp: Date;
  isPinned?: boolean;
}

interface AdminChatProps {
  themeColors: ThemeColors;
  oasisId: string;
}

const AdminChat: React.FC<AdminChatProps> = ({ themeColors, oasisId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!oasisId) return;

    const messagesRef = collection(db, 'oasis', oasisId, 'adminMessages');
    
    // Initialize system message if needed
    const initializeSystemMessage = async () => {
      // Check if system message already exists
      const systemMessageQuery = query(
        messagesRef, 
        where('authorId', '==', 'system'),
        where('authorRole', '==', 'System')
      );
      
      const systemMessageSnapshot = await getDocs(systemMessageQuery);
      
      if (systemMessageSnapshot.empty) {
        const systemMessage = {
          author: 'System',
          authorId: 'system',
          authorRole: 'System',
          content: 'Welcome to the Admin Chat. This chat is permanent and messages cannot be deleted.',
          timestamp: serverTimestamp(),
          isPinned: true,
        };

        try {
          await addDoc(messagesRef, systemMessage);
        } catch (error) {
          console.error('Error adding system message:', error);
        }
      }
    };

    // Set up real-time listener for messages
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: Message[] = [];
      const pinnedList: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        const message = {
          id: doc.id,
          author: data.author,
          authorId: data.authorId,
          authorRole: data.authorRole,
          content: data.content,
          timestamp: timestamp?.toDate() || new Date(),
          isPinned: data.isPinned || false,
        };
        
        if (message.isPinned) {
          pinnedList.push(message);
        }
        messagesList.push(message);
      });
      
      setMessages(messagesList);
      setPinnedMessages(pinnedList);
      setIsLoading(false);
    });

    // Initialize system message
    initializeSystemMessage();

    return () => {
      unsubscribeMessages();
    };
  }, [oasisId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to send messages',
        variant: 'destructive',
      });
      return;
    }

    try {
      const messagesRef = collection(db, 'oasis', oasisId, 'adminMessages');
      await addDoc(messagesRef, {
        author: user.displayName || 'Unknown Admin',
        authorId: user.uid,
        authorRole: 'Admin',
        content: newMessage,
        timestamp: serverTimestamp(),
        isPinned: false,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const togglePin = async (messageId: string, currentPinned: boolean) => {
    try {
      const messageRef = doc(db, 'oasis', oasisId, 'adminMessages', messageId);
      await updateDoc(messageRef, {
        isPinned: !currentPinned,
      });

      toast({
        title: 'Success',
        description: `Message ${currentPinned ? 'unpinned' : 'pinned'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message pin status',
        variant: 'destructive',
      });
    }
  };

  const handleReport = async () => {
    if (!selectedMessage || !reportReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the report',
        variant: 'destructive',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to report messages',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addDoc(collection(db, 'system-reports'), {
        type: 'admin-chat',
        oasisId,
        messageId: selectedMessage.id,
        messageContent: selectedMessage.content,
        messageAuthor: selectedMessage.author,
        messageTimestamp: selectedMessage.timestamp,
        reportedBy: user.uid,
        reporterName: user.displayName || 'Unknown Admin',
        reason: reportReason,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Report submitted to system administrators',
      });

      setIsReportDialogOpen(false);
      setReportReason('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
    }
  };

  const renderMessage = (message: Message, isPinnedSection: boolean = false) => (
    <div
      key={message.id}
      className={`relative group ${
        message.isPinned ? 'bg-gray-800/50' : 'bg-gray-900/30'
      } p-4 rounded-lg mb-2`}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.author}`} />
          <AvatarFallback>{message.author[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white text-sm">
              {message.author}
              <span className="ml-2 text-xs text-blue-400">
                {message.authorRole}
              </span>
            </span>
            <span className="text-xs text-gray-400">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.isPinned && !isPinnedSection && (
              <Pin className="h-3 w-3 text-red-400" />
            )}
          </div>
          <p className="text-gray-200 mt-1 text-sm leading-relaxed break-words">
            {message.content}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => togglePin(message.id, !!message.isPinned)}
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pin className={`h-4 w-4 ${message.isPinned ? 'text-red-400' : 'text-gray-400'}`} />
          </Button>
          <Button
            onClick={() => {
              setSelectedMessage(message);
              setIsReportDialogOpen(true);
            }}
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </Button>
        </div>
      </div>
    </div>
  );

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden"
        style={{
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-700 bg-gray-900 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              Admin Chat
              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                Permanent
              </span>
            </h2>
            {pinnedMessages.length > 0 && (
              <Popover open={showPinnedMessages} onOpenChange={setShowPinnedMessages}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20"
                  >
                    <Pin className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{pinnedMessages.length} pinned</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-700">
                  <div className="p-2">
                    <ScrollArea className="h-[300px]">
                      {pinnedMessages.map(message => renderMessage(message, true))}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
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

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollAreaRef}>
          {filteredMessages.map(message => renderMessage(message))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border-gray-700 text-white"
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

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              Report to System Administrators
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-400">Message by:</span>
                <span className="text-sm text-white">{selectedMessage?.author}</span>
              </div>
              <p className="text-sm text-gray-300">{selectedMessage?.content}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Reason for Report</Label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please provide details about why you're reporting this message..."
                className="h-32 bg-gray-800 border-gray-700 text-white resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsReportDialogOpen(false);
                  setReportReason('');
                  setSelectedMessage(null);
                }}
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminChat;