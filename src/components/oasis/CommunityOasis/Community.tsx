import React, { useState, useEffect, useRef } from 'react';
import { Hash } from 'lucide-react';
import { db, auth } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs, Timestamp, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import PostComponent from './Post';
import NotificationBell from '../../NotificationBell';
import { ThemeColors } from '../../../themes';
import CreatePost from './CreatePost';
import type { ThemeMode } from '../../ThemeSelector/ThemeMode';

interface Post {
  id: string;
  author: string;
  authorId: string;
  content: string;
  likes: string[];
  timestamp: Date;
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

interface CommunityProps {
  oasisId: string;
  oasisName: string;
  themeColors: ThemeColors;
  themeMode?: ThemeMode;
  showInput?: boolean;
}

const MESSAGES_PER_PAGE = 30;

const Community: React.FC<CommunityProps> = ({ 
  oasisId, 
  oasisName, 
  themeColors,
  themeMode = 'gradient',
  showInput = false 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef(new Audio('/notification.mp3'));
  const lastPostTimestamp = useRef<Date | null>(null);
  const lastScrollPosition = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const initialLoadComplete = useRef(false);
  const attachmentLoadCount = useRef(0);
  const totalAttachments = useRef(0);

  // Function to scroll to bottom with a slight delay
  const scrollToBottom = (immediate = false) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    if (immediate) {
      scroll();
    } else {
      scrollTimeout.current = setTimeout(scroll, 100);
    }
  };

  // Handle attachment load tracking
  const handleAttachmentLoad = () => {
    attachmentLoadCount.current++;
    if (attachmentLoadCount.current === totalAttachments.current && isInitialLoad) {
      scrollToBottom(true);
    }
  };

  useEffect(() => {
    if (!oasisId) return;

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Check member status
    const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
    getDoc(memberRef).then(memberDoc => {
      if (!memberDoc.exists()) {
        console.error('User is not a member of this oasis');
        return;
      }
      console.log('Member permissions:', memberDoc.data().permissions);
      
      // Only set up posts listener if user is a member
      const postsRef = collection(db, 'users', user.uid, 'oasis', oasisId, 'posts');
      const q = query(
        postsRef, 
        orderBy('timestamp', 'desc'), 
        limit(MESSAGES_PER_PAGE)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Count total attachments for initial load
        if (isInitialLoad) {
          totalAttachments.current = snapshot.docs.filter(doc => doc.data().attachment).length;
          attachmentLoadCount.current = 0;
        }

        const newPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Post[];

        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setPosts(newPosts.reverse());

        if (lastPostTimestamp.current && 
            newPosts[0]?.timestamp > lastPostTimestamp.current &&
            !isInitialLoad) {
          notificationSound.current.play().catch(() => {});
          scrollToBottom();
        }

        lastPostTimestamp.current = newPosts[0]?.timestamp || null;

        if (!initialLoadComplete.current) {
          initialLoadComplete.current = true;
          if (totalAttachments.current === 0) {
            scrollToBottom(true);
          }
        }
      }, (error) => {
        console.error('Error fetching posts:', error);
      });

      return () => {
        unsubscribe();
        setIsInitialLoad(true);
        initialLoadComplete.current = false;
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }).catch(error => {
      console.error('Error checking member status:', error);
    });
  }, [oasisId]);

  const loadMoreMessages = async () => {
    if (!oasisId || isLoadingMore || !hasMoreMessages || !lastVisible) return;

    setIsLoadingMore(true);
    try {
      const postsRef = collection(db, 'oasis', oasisId, 'posts');
      const q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const olderPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Post[];

      if (olderPosts.length < MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setPosts(prev => [...olderPosts.reverse(), ...prev]);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop } = scrollRef.current;
    
    // Save scroll position
    lastScrollPosition.current = scrollTop;

    // Check if we need to load more messages
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      const currentHeight = scrollRef.current.scrollHeight;
      
      loadMoreMessages().then(() => {
        // After loading more messages, maintain the relative scroll position
        if (scrollRef.current) {
          const newHeight = scrollRef.current.scrollHeight;
          scrollRef.current.scrollTop = newHeight - currentHeight;
        }
      });
    }
  };

  const getBackground = () => {
    switch (themeMode) {
      case 'gradient':
        return `linear-gradient(145deg, ${themeColors.primary}20, ${themeColors.secondary}20)`;
      case 'primary':
        return `${themeColors.primary}20`;
      case 'secondary':
        return `${themeColors.secondary}20`;
      default:
        return 'rgba(17, 24, 39, 0.3)';
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      style={{
        background: getBackground(),
        color: themeColors.text,
      }}
    >
      {/* Messages Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-0.5 py-4 px-4 scroll-smooth"
        style={{ 
          background: 'rgba(17, 24, 39, 0.3)',
        }}
      >
        {isLoadingMore && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {posts.map((post, index) => {
          const prevPost = index > 0 ? posts[index - 1] : undefined;
          const isFirstInGroup = !prevPost || 
            prevPost.authorId !== post.authorId || 
            post.timestamp.getTime() - prevPost.timestamp.getTime() > 300000;

          return (
            <PostComponent 
              key={post.id} 
              post={post}
              oasisId={oasisId}
              themeColors={themeColors}
              themeMode={themeMode}
              isFirstInGroup={isFirstInGroup}
              previousPost={prevPost}
              onAttachmentLoad={handleAttachmentLoad}
            />
          );
        })}
      </div>

      {/* Fixed Input Area - Only shown when showInput is true */}
      {showInput && (
        <div 
          className="p-4 border-t border-gray-700"
          style={{
            background: `${themeColors.background}CC`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <CreatePost 
            oasisId={oasisId} 
            themeColors={themeColors}
            themeMode={themeMode}
            onPostCreated={() => scrollToBottom(true)}
          />
        </div>
      )}
    </div>
  );
};

export default Community;