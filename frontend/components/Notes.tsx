import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notesAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Heart, 
  BookOpen,
  Tag,
  Calendar,
  User,
  Globe,
  Lock
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import LoadingSpinner from './LoadingSpinner';

interface Note {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  isPublic: boolean;
  category: string;
  tags: string[];
  likes: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    isPublic: true
  });

  // Fetch notes
  const { data: notesData, isLoading } = useQuery(
    ['notes', searchTerm, selectedCategory],
    () => notesAPI.getNotes({ 
      search: searchTerm || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined
    })
  );

  // Create note mutation
  const createNoteMutation = useMutation(notesAPI.createNote, {
    onSuccess: () => {
      queryClient.invalidateQueries('notes');
      setShowCreateModal(false);
      resetForm();
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => notesAPI.updateNote(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes');
        setEditingNote(null);
        resetForm();
      }
    }
  );

  // Delete note mutation
  const deleteNoteMutation = useMutation(notesAPI.deleteNote, {
    onSuccess: () => {
      queryClient.invalidateQueries('notes');
    }
  });

  // Like note mutation
  const likeNoteMutation = useMutation(notesAPI.likeNote, {
    onSuccess: () => {
      queryClient.invalidateQueries('notes');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'General',
      tags: '',
      isPublic: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const noteData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote._id, data: noteData });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', '),
      isPublic: note.isPublic
    });
    setShowCreateModal(true);
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleLike = (noteId: string) => {
    likeNoteMutation.mutate(noteId);
  };

  const categories = ['All', 'General', 'Web Development', 'Data Science', 'Design', 'Computer Science', 'AI', 'Other'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Study Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, organize, and share your learning notes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Note
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {(notesData as any)?.notes?.map((note: any) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {note.isPublic ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                    <Badge variant="outline" size="sm">
                      {note.category}
                    </Badge>
                  </div>
                  
                  {note.author._id === user?.id && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note._id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setViewingNote(note)}
                >
                  {note.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1 line-clamp-3">
                  {note.content.substring(0, 150)}...
                </p>

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.slice(0, 3).map((tag: any, index: number) => (
                      <Badge key={index} variant="secondary" size="sm">
                        #{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" size="sm">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <img
                      src={note.author.avatar}
                      alt={note.author.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{note.author.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{note.views}</span>
                    </div>
                    <button
                      onClick={() => handleLike(note._id)}
                      className={`flex items-center space-x-1 transition-colors ${
                        note.likes.includes(user?.id || '')
                          ? 'text-red-500'
                          : 'hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${note.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                      <span>{note.likes.length}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {(notesData as any)?.notes?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No notes found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Create your first note to get started'
            }
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Note
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCreateModal(false);
              setEditingNote(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter note title..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma separated)
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="react, javascript, tutorial"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your note content here..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this note public (others can view and like it)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingNote(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createNoteMutation.isLoading || updateNoteMutation.isLoading}
                  >
                    {editingNote ? 'Update Note' : 'Create Note'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Note Modal */}
      <AnimatePresence>
        {viewingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingNote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {viewingNote.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <img
                        src={viewingNote.author.avatar}
                        alt={viewingNote.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{viewingNote.author.name}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(viewingNote.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{viewingNote.views} views</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingNote(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline">{viewingNote.category}</Badge>
                {viewingNote.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="prose dark:prose-invert max-w-none mb-6">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
                  {viewingNote.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(viewingNote._id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    viewingNote.likes.includes(user?.id || '')
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${viewingNote.likes.includes(user?.id || '') ? 'fill-current' : ''}`} />
                  <span>{viewingNote.likes.length} likes</span>
                </button>

                {viewingNote.author._id === user?.id && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleEdit(viewingNote);
                        setViewingNote(null);
                      }}
                      icon={<Edit3 className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDelete(viewingNote._id);
                        setViewingNote(null);
                      }}
                      icon={<Trash2 className="w-4 h-4" />}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}