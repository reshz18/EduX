import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { communityAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types';
import { Users, Heart, MessageCircle, Plus, Search, TrendingUp, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function Community() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data: postsData, isLoading } = useQuery(
    ['community-posts', searchTerm, selectedCategory],
    () => communityAPI.getPosts({ search: searchTerm, category: selectedCategory !== 'All' ? selectedCategory : undefined })
  ) as { data: { posts: Post[] } | undefined, isLoading: boolean };

  const createPostMutation = useMutation(communityAPI.createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries('community-posts');
      setNewPostContent('');
      setNewPostCategory('General');
      setShowCreatePost(false);
      toast.success('Post created!');
    },
    onError: () => toast.error('Failed to create post')
  });

  const likePostMutation = useMutation(communityAPI.likePost, {
    onSuccess: () => queryClient.invalidateQueries('community-posts'),
    onError: () => toast.error('Failed to like post')
  });

  const addCommentMutation = useMutation(communityAPI.addComment, {
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries('community-posts');
      setCommentInputs(prev => ({ ...prev, [variables.id]: '' }));
      toast.success('Comment added!');
    },
    onError: () => toast.error('Failed to add comment')
  });

  const handleCreatePost = () => {
    if (!user) { toast.error('Please log in to create posts'); return; }
    if (newPostContent.trim()) createPostMutation.mutate({ content: newPostContent, category: newPostCategory, tags: [] });
  };

  const handleLikePost = (postId: string) => {
    if (!user) { toast.error('Please log in to like posts'); return; }
    likePostMutation.mutate(postId);
  };

  const handleAddComment = (postId: string) => {
    if (!user) { toast.error('Please log in to comment'); return; }
    const content = commentInputs[postId]?.trim();
    if (content) addCommentMutation.mutate({ id: postId, content });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId); else newSet.add(postId);
      return newSet;
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const categories = ['All', 'General', 'Technology', 'Design', 'Career', 'Study Tips'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Professional Community</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Connect and share insights</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { if (!user) { toast.error('Please log in'); return; } setShowCreatePost(true); }} className="bg-slate-900 hover:bg-slate-800 text-white">Create Post</Button>
      </div>
      <Card className="p-6">
        <div className="flex gap-4">
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="w-4 h-4" />} className="flex-1" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border rounded-lg">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </Card>
      {postsData?.posts?.map((post: Post) => {
        const postId = post._id || post.id;
        return (
          <Card key={postId} className="p-6">
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img src={typeof post.author === 'object' ? post.author.avatar : '/default-avatar.png'} alt="Author" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">{typeof post.author === 'object' ? post.author.name : 'Anonymous'}</p>
                  <p className="text-sm text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant="secondary" size="sm">{post.category}</Badge>
            </div>
            <p className="mb-4">{post.content}</p>
            <div className="flex items-center space-x-6 pt-4 border-t">
              <button onClick={() => handleLikePost(postId)} disabled={!user} className={`flex items-center space-x-2 ${!user ? 'text-slate-400 cursor-not-allowed' : post.isLiked ? 'text-red-600' : 'text-slate-500 hover:text-red-500'}`}>
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes.length}</span>
              </button>
              <button onClick={() => toggleComments(postId)} className="flex items-center space-x-2 text-slate-500 hover:text-blue-600">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments.length}</span>
              </button>
            </div>
            {expandedComments.has(postId) && (
              <div className="mt-4 space-y-3">
                {user && (
                  <div className="flex space-x-2">
                    <input type="text" placeholder="Comment..." value={commentInputs[postId] || ''} onChange={(e) => setCommentInputs(prev => ({ ...prev, [postId]: e.target.value }))} onKeyPress={(e) => { if (e.key === 'Enter') handleAddComment(postId); }} className="flex-1 px-3 py-2 border rounded-lg" />
                    <Button size="sm" onClick={() => handleAddComment(postId)}><Send className="w-4 h-4" /></Button>
                  </div>
                )}
                {post.comments.map((comment, idx) => (
                  <div key={idx} className="flex space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <img src={typeof comment.author === 'object' ? comment.author.avatar : '/default-avatar.png'} alt="Commenter" className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{typeof comment.author === 'object' ? comment.author.name : 'Anonymous'}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      {postsData?.posts?.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
          <Button variant="primary" onClick={() => { if (!user) { toast.error('Please log in'); return; } setShowCreatePost(true); }}>Create First Post</Button>
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreatePost(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Post</h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.filter(cat => cat !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Post Content */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    What's on your mind?
                  </label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your thoughts, ask questions, or start a discussion..."
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {newPostContent.length} characters
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || createPostMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createPostMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}