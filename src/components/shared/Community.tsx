import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Send, Flag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Post {
  id: number;
  author: string;
  content: string;
  likes: number;
  comments: Comment[];
}

interface Comment {
  id: number;
  author: string;
  content: string;
}

interface CommunityProps {
  oasisName: string;
  oasisType: string;
}

const Community: React.FC<CommunityProps> = ({ oasisName, oasisType }) => {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'User1',
      content: 'Hello everyone!',
      likes: 5,
      comments: [],
    },
    {
      id: 2,
      author: 'User2',
      content: 'Excited to be part of this community!',
      likes: 3,
      comments: [],
    },
  ]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      setPosts([
        {
          id: posts.length + 1,
          author: 'CurrentUser',
          content: newPost,
          likes: 0,
          comments: [],
        },
        ...posts,
      ]);
      setNewPost('');
    }
  };

  const handleLike = (id: number) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  const handleComment = (postId: number, comment: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: post.comments.length + 1,
                  author: 'CurrentUser',
                  content: comment,
                },
              ],
            }
          : post
      )
    );
  };

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-purple-900 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-400">
          {oasisName} Community
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="feed">
          <TabsList className="mb-4">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="feed">
            <form onSubmit={handlePostSubmit} className="mb-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="flex-grow bg-gray-700 text-white"
                />
                <Button
                  type="submit"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Send size={16} />
                </Button>
              </div>
            </form>
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={`https://api.dicebear.com/6.x/initials/svg?seed=${post.author}`}
                        />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-purple-400">
                        {post.author}
                      </p>
                    </div>
                    <p className="mt-1">{post.content}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <ThumbsUp size={16} className="mr-1" /> {post.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <MessageSquare size={16} className="mr-1" />{' '}
                        {post.comments.length}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Share2 size={16} className="mr-1" /> Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Flag size={16} className="mr-1" /> Report
                      </Button>
                    </div>
                    {post.comments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-gray-700 p-2 rounded"
                          >
                            <p className="text-sm font-semibold">
                              {comment.author}
                            </p>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      <Input
                        type="text"
                        placeholder="Write a comment..."
                        className="bg-gray-700 text-white text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(
                              post.id,
                              (e.target as HTMLInputElement).value
                            );
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="trending">
            <p>Trending content for {oasisType} oasis coming soon!</p>
          </TabsContent>
          <TabsContent value="events">
            <p>Upcoming events for {oasisType} oasis coming soon!</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Community;
