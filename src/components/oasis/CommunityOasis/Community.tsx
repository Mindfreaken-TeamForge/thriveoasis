import React, { useState, useEffect, useRef } from 'react';
import { Hash } from 'lucide-react';
import { auth, db } from '@/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import Post from './Post';
import NotificationBell from '@/components/NotificationBell';
import { ThemeColors } from '@/themes';
import CreatePost from './CreatePost';

interface Post {
  id: string;
  author: string;
  authorId: string;
  content: string;
  likes: string[];
  timestamp: Date;
}

interface CommunityProps {
  oasisId: string;
  oasisName: string;
  themeColors: ThemeColors;
  showInput?: boolean;
}

const Community: React.FC<CommunityProps> = ({ 
  oasisId, 
  oasisName, 
  themeColors,
  showInput = false 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef(new Audio('/notification.mp3'));
  const lastPostTimestamp = useRef<Date | null>(null);

  useEffect(() => {
    if (!oasisId) return;

    const postsRef = collection(db, 'oasis', oasisId, 'posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Post[];

      if (lastPostTimestamp.current && 
          newPosts[0]?.timestamp > lastPostTimestamp.current &&
          newPosts[0]?.authorId !== auth.currentUser?.uid) {
        notificationSound.current.play().catch(() => {});
      }

      lastPostTimestamp.current = newPosts[0]?.timestamp || null;
      setPosts(newPosts.reverse());
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [oasisId]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      style={{
        background: themeColors.background,
        color: themeColors.text,
      }}
    >
      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 py-4 px-4"
        style={{ 
          scrollBehavior: 'smooth',
          background: 'rgba(17, 24, 39, 0.3)',
        }}
      >
        {posts.map((post, index) => {
          const prevPost = index > 0 ? posts[index - 1] : null;
          const isFirstInGroup = !prevPost || 
            prevPost.authorId !== post.authorId || 
            post.timestamp.getTime() - prevPost.timestamp.getTime() > 300000;

          return (
            <Post 
              key={post.id} 
              post={post}
              oasisId={oasisId}
              themeColors={themeColors}
              isFirstInGroup={isFirstInGroup}
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
            onPostCreated={scrollToBottom}
          />
        </div>
      )}
    </div>
  );
};

export default Community;