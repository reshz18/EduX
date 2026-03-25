import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { coursesAPI, analyticsAPI, apiCall } from '@/utils/api';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Users, BarChart2,
  ChevronDown, ChevronUp, GripVertical, AlertCircle,
  Star, TrendingUp, Award, Video, Save,
  ArrowLeft, ArrowRight, Globe, Lock, List, Upload, Link as LinkIcon, Image
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from './ui/Card';
import Button from './ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Chapter {
  _id?: string;
  title: string;
  videoUrl: string;
  description: string;
  duration: string;
  order: number;
}

interface CourseForm {
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnail: string;
  tags: string;
  pointsRequired: number;
  isPublished: boolean;
  visibility: 'Public' | 'Private' | 'Unlisted';
  instructorSignatureUrl: string;
  chapters: Chapter[];
}

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'DevOps',
  'UI/UX Design', 'Digital Marketing', 'Business Analytics', 'Project Management',
  'Blockchain', 'Game Development', 'Mathematics', 'Physics', 'Other'
];

const EMPTY_FORM: CourseForm = {
  title: '', description: '', category: '', level: 'Beginner',
  thumbnail: '', tags: '', pointsRequired: 0, isPublished: false,
  visibility: 'Public', instructorSignatureUrl: '', chapters: []
};

const EMPTY_CHAPTER: Chapter = { title: '', videoUrl: '', description: '', duration: '', order: 0 };

// ─── YouTube URL → embed URL ──────────────────────────────────────────────────
function toEmbedUrl(url: string): string {
  if (!url) return '';
  // Already embed
  if (url.includes('youtube.com/embed/')) return url;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onEdit, onDelete, onTogglePublish, onViewStudents, onViewAnalytics }: {
  course: any;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onViewStudents: () => void;
  onViewAnalytics: () => void;
}) {
  return (
    <Card hover className="p-0 overflow-hidden">
      <div className="relative">
        <img
          src={course.thumbnail || 'https://via.placeholder.com/400x200?text=No+Thumbnail'}
          alt={course.title}
          className="w-full h-40 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Thumbnail'; }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            course.isPublished ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
            {course.level}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{course.enrollmentCount || 0}</p>
            <p className="text-xs text-gray-500">Students</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{course.chapters?.length || 0}</p>
            <p className="text-xs text-gray-500">Chapters</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {course.rating?.average?.toFixed(1) || '—'}
            </p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button onClick={onTogglePublish} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            course.isPublished
              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100'
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
          }`}>
            {course.isPublished ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
          </button>
          <button onClick={onViewStudents} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="w-3 h-3" /> Students
          </button>
          <button onClick={onViewAnalytics} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-100 transition-colors">
            <BarChart2 className="w-3 h-3" /> Analytics
          </button>
          <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Chapter Editor ───────────────────────────────────────────────────────────
function ChapterEditor({ chapter, index, total, onChange, onDelete, onMoveUp, onMoveDown }: {
  chapter: Chapter; index: number; total: number;
  onChange: (ch: Chapter) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [videoInputType, setVideoInputType] = useState<'url' | 'upload'>('url');
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const embedUrl = toEmbedUrl(chapter.videoUrl);

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video file size must be less than 100MB');
      return;
    }

    // Create object URL for preview
    const videoUrl = URL.createObjectURL(file);
    onChange({ ...chapter, videoUrl });
    toast.success('Video uploaded successfully');
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 font-medium text-gray-900 dark:text-white truncate">
          {chapter.title || `Chapter ${index + 1}`}
        </span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button disabled={index === 0} onClick={onMoveUp} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button disabled={index === total - 1} onClick={onMoveDown} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapter Title *</label>
              <input
                type="text"
                value={chapter.title}
                onChange={e => onChange({ ...chapter, title: e.target.value })}
                placeholder="e.g. Introduction to React"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration *</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={(() => {
                        if (!chapter.duration) return '';
                        const parts = chapter.duration.toString().split(':');
                        return parts.length === 3 ? parts[0] : '0';
                      })()}
                      onChange={e => {
                        const hours = e.target.value;
                        const parts = chapter.duration.toString().split(':');
                        const minutes = parts.length >= 2 ? parts[parts.length - 2] : '0';
                        const seconds = parts[parts.length - 1] || '0';
                        onChange({ ...chapter, duration: `${hours}:${minutes}:${seconds}` });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">h</span>
                  </div>
                </div>
                <span className="text-gray-400">:</span>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={(() => {
                        if (!chapter.duration) return '';
                        const parts = chapter.duration.toString().split(':');
                        if (parts.length === 3) return parts[1];
                        if (parts.length === 2) return parts[0];
                        return '0';
                      })()}
                      onChange={e => {
                        const minutes = e.target.value.padStart(2, '0');
                        const parts = chapter.duration.toString().split(':');
                        const hours = parts.length === 3 ? parts[0] : '0';
                        const seconds = parts[parts.length - 1] || '0';
                        onChange({ ...chapter, duration: `${hours}:${minutes}:${seconds}` });
                      }}
                      placeholder="00"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">m</span>
                  </div>
                </div>
                <span className="text-gray-400">:</span>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={(() => {
                        if (!chapter.duration) return '';
                        const parts = chapter.duration.toString().split(':');
                        return parts[parts.length - 1] || '0';
                      })()}
                      onChange={e => {
                        const seconds = e.target.value.padStart(2, '0');
                        const parts = chapter.duration.toString().split(':');
                        const hours = parts.length === 3 ? parts[0] : '0';
                        const minutes = parts.length >= 2 ? parts[parts.length - 2] : '0';
                        onChange({ ...chapter, duration: `${hours}:${minutes}:${seconds}` });
                      }}
                      placeholder="00"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">s</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter video duration (hours:minutes:seconds)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Source</label>
            
            {/* Toggle between URL and Upload */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVideoInputType('url')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  videoInputType === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                YouTube URL
              </button>
              <button
                type="button"
                onClick={() => setVideoInputType('upload')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  videoInputType === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </button>
            </div>

            {videoInputType === 'url' ? (
              <input
                type="url"
                value={chapter.videoUrl}
                onChange={e => onChange({ ...chapter, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or embed URL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            ) : (
              <div>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {chapter.videoUrl && !chapter.videoUrl.includes('youtube') ? 'Change Video' : 'Upload Video File'}
                  </span>
                </button>
                {chapter.videoUrl && !chapter.videoUrl.includes('youtube') && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Video uploaded</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Max size: 100MB. Supported formats: MP4, WebM, MOV</p>
              </div>
            )}
          </div>

          {/* Video Preview */}
          {chapter.videoUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {embedUrl && (embedUrl.includes('youtube.com/embed/') || embedUrl.includes('youtu.be')) ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-48"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={chapter.title}
                />
              ) : chapter.videoUrl.startsWith('blob:') || chapter.videoUrl.startsWith('http') ? (
                <video
                  src={chapter.videoUrl}
                  controls
                  className="w-full h-48 bg-black"
                />
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
            <textarea
              value={chapter.description}
              onChange={e => onChange({ ...chapter, description: e.target.value })}
              placeholder="What will students learn in this chapter?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Course Form (Create / Edit) ──────────────────────────────────────────────
function CourseFormView({ initial, onSave, onCancel }: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [step, setStep] = useState(1);
  const [isCustomCategory, setIsCustomCategory] = useState(() => {
    return initial && initial.category && !CATEGORIES.includes(initial.category);
  });
  const [thumbnailInputType, setThumbnailInputType] = useState<'url' | 'upload'>('url');
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CourseForm>(() => {
    if (!initial) return EMPTY_FORM;
    return {
      title: initial.title || '',
      description: initial.description || '',
      category: initial.category || '',
      level: initial.level || 'Beginner',
      thumbnail: initial.thumbnail || '',
      tags: (initial.tags || []).join(', '),
      pointsRequired: initial.pointsRequired || 0,
      isPublished: initial.isPublished || false,
      visibility: initial.visibility || 'Public',
      instructorSignatureUrl: initial.instructorSignatureUrl || '',
      chapters: (initial.chapters || []).map((ch: any, i: number) => ({
        _id: ch._id,
        title: ch.title || '',
        videoUrl: ch.videoUrl || '',
        description: ch.description || '',
        duration: ch.duration || '',
        order: ch.order ?? i,
      })),
    };
  });

  const set = (key: keyof CourseForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addChapter = () => {
    setForm(f => ({
      ...f,
      chapters: [...f.chapters, { ...EMPTY_CHAPTER, order: f.chapters.length }]
    }));
  };

  const updateChapter = (i: number, ch: Chapter) => {
    setForm(f => {
      const chs = [...f.chapters];
      chs[i] = ch;
      return { ...f, chapters: chs };
    });
  };

  const deleteChapter = (i: number) => {
    setForm(f => ({ ...f, chapters: f.chapters.filter((_, idx) => idx !== i).map((ch, idx) => ({ ...ch, order: idx })) }));
  };

  const moveChapter = (i: number, dir: -1 | 1) => {
    setForm(f => {
      const chs = [...f.chapters];
      const j = i + dir;
      if (j < 0 || j >= chs.length) return f;
      [chs[i], chs[j]] = [chs[j], chs[i]];
      return { ...f, chapters: chs.map((ch, idx) => ({ ...ch, order: idx })) };
    });
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('thumbnail', ev.target?.result as string);
      toast.success('Thumbnail uploaded');
    };
    reader.readAsDataURL(file);
  };

  const [sigInputType, setSigInputType] = useState<'draw' | 'upload'>('draw');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.includes('image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    
    if (!isImage) {
      toast.error('Please select a valid image file');
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Signature size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('instructorSignatureUrl', ev.target?.result as string);
      toast.success('Signature uploaded');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
    
    if (sigFileInputRef.current) sigFileInputRef.current.value = '';
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    set('instructorSignatureUrl', '');
  };

  const saveSignature = () => {
    if (sigCanvasRef.current?.isEmpty()) {
      toast.error('Please provide a signature first');
      return;
    }
    // Use getCanvas() to avoid trim-canvas module errors
    const dataUrl = sigCanvasRef.current?.getCanvas().toDataURL('image/png');
    set('instructorSignatureUrl', dataUrl);
    toast.success('Signature drawn successfully');
  };

  const validateStep1 = () => {
    if (!form.title.trim()) { 
      toast.error('Course title is required'); 
      return false; 
    }
    if (form.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return false;
    }
    if (form.title.trim().length > 200) {
      toast.error('Title must be less than 200 characters');
      return false;
    }
    if (!form.description.trim()) { 
      toast.error('Description is required'); 
      return false; 
    }
    if (form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters (currently ' + form.description.trim().length + ')');
      return false;
    }
    if (form.description.trim().length > 2000) {
      toast.error('Description must be less than 2000 characters');
      return false;
    }
    if (!form.category) { 
      toast.error('Category is required'); 
      return false; 
    }
    if (!form.thumbnail.trim()) { 
      toast.error('Thumbnail is required'); 
      return false; 
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateStep1()) { setStep(1); return; }
    
    console.log('=== HANDLE SUBMIT ===');
    console.log('Raw form data:', form);
    
    // Helper function to convert duration (string h:mm:ss or mm:ss or number) to seconds
    const durationToSeconds = (duration: string | number): number => {
      if (!duration) return 0;
      if (typeof duration === 'number') return duration;
      if (typeof duration !== 'string') return 0;
      
      const parts = duration.split(':').map(p => parseInt(p) || 0);
      
      if (parts.length === 3) {
        // h:mm:ss format
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
      } else if (parts.length === 2) {
        // mm:ss format (legacy)
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
      } else if (parts.length === 1) {
        // Just seconds
        return parts[0];
      }
      
      return parseInt(duration) || 0;
    };
    
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      chapters: form.chapters.map((ch, i) => ({ 
        ...ch, 
        order: i,
        duration: durationToSeconds(ch.duration)
      })),
    };
    
    console.log('Processed payload:', payload);
    console.log('Chapters with converted duration:', payload.chapters);
    
    onSave(payload);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEdit ? 'Update your course details and content' : 'Build your course step by step'}
          </p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
        {[{ n: 1, label: 'Basic Info' }, { n: 2, label: 'Content' }, { n: 3, label: 'Settings' }].map(({ n, label }) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === n
                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {n}. {label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Course Title *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Complete React Developer Course" className={inputCls} maxLength={200} />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/200 characters (minimum 3)</p>
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="What will students learn? What are the prerequisites?" rows={4}
                className={`${inputCls} resize-none`} maxLength={2000} />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000 characters (minimum 10)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category *</label>
                <select 
                  value={isCustomCategory ? 'Other' : form.category} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setIsCustomCategory(true);
                      set('category', '');
                    } else {
                      setIsCustomCategory(false);
                      set('category', val);
                    }
                  }} 
                  className={inputCls}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {isCustomCategory && (
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    className={`${inputCls} mt-2`}
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Difficulty Level *</label>
                <select value={form.level} onChange={e => set('level', e.target.value as any)} className={inputCls}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Thumbnail *</label>

              {/* Toggle URL / Upload */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setThumbnailInputType('url')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailInputType === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailInputType('upload')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailInputType === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
              </div>

              {thumbnailInputType === 'url' ? (
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={e => set('thumbnail', e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                  className={inputCls}
                />
              ) : (
                <div>
                  <input
                    ref={thumbnailFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {form.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail Image'}
                    </span>
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Max size: 5MB. Supported: JPG, PNG, WebP, GIF</p>
                </div>
              )}

              {form.thumbnail && (
                <img
                  src={form.thumbnail}
                  alt="Thumbnail preview"
                  className="mt-2 h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-600 w-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
            <div>
              <label className={labelCls}>Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="react, javascript, frontend" className={inputCls} />
            </div>
            
            <div>
              <label className={labelCls}>Instructor Signature (For Certificates) *</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSigInputType('draw')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sigInputType === 'draw'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSigInputType('upload')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sigInputType === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
              </div>

              {sigInputType === 'draw' ? (
                <div className="space-y-2">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white overflow-hidden shadow-inner">
                    <SignatureCanvas 
                      ref={sigCanvasRef}
                      penColor="black"
                      canvasProps={{ width: 500, height: 150, className: 'w-full h-36 cursor-crosshair' }} 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearSignature} type="button">Clear</Button>
                    <Button variant="primary" size="sm" onClick={saveSignature} type="button">Save Signature</Button>
                  </div>
                  {form.instructorSignatureUrl && form.instructorSignatureUrl.startsWith('data:image') && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Signature saved</p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={sigFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => sigFileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {form.instructorSignatureUrl ? 'Change Signature' : 'Upload Signature Image (PNG preferred)'}
                    </span>
                  </button>
                  {form.instructorSignatureUrl && (
                    <img
                      src={form.instructorSignatureUrl}
                      alt="Signature preview"
                      className="mt-2 h-16 object-contain bg-white rounded-lg p-2 border border-gray-200"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Content ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Course Chapters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{form.chapters.length} chapter{form.chapters.length !== 1 ? 's' : ''} added</p>
              </div>
              <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addChapter}>
                Add Chapter
              </Button>
            </div>

            {form.chapters.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <Video className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">No chapters yet</p>
                <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addChapter}>
                  Add First Chapter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {form.chapters.map((ch, i) => (
                  <ChapterEditor
                    key={i}
                    chapter={ch}
                    index={i}
                    total={form.chapters.length}
                    onChange={updated => updateChapter(i, updated)}
                    onDelete={() => deleteChapter(i)}
                    onMoveUp={() => moveChapter(i, -1)}
                    onMoveDown={() => moveChapter(i, 1)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Settings ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Points Required to Enroll</label>
              <input type="number" min={0} value={form.pointsRequired}
                onChange={e => set('pointsRequired', parseInt(e.target.value) || 0)} className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Set to 0 for free enrollment</p>
            </div>
            <div>
              <label className={labelCls}>Visibility</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: 'Public', icon: <Globe className="w-4 h-4" />, desc: 'Anyone can find and enroll' },
                  { val: 'Unlisted', icon: <List className="w-4 h-4" />, desc: 'Only with direct link' },
                  { val: 'Private', icon: <Lock className="w-4 h-4" />, desc: 'Only you can see it' },
                ].map(({ val, icon, desc }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('visibility', val)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      form.visibility === val
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className={`mb-1 ${form.visibility === val ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Publish Course</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Make this course available to students</p>
              </div>
              <button
                type="button"
                onClick={() => set('isPublished', !form.isPublished)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
          icon={<ArrowLeft className="w-4 h-4" />}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < 3 ? (
          <Button variant="primary" onClick={() => { if (step === 1 && !validateStep1()) return; setStep(s => s + 1); }}
            icon={<ArrowRight className="w-4 h-4" />}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSubmit} icon={<Save className="w-4 h-4" />}>
            {isEdit ? 'Save Changes' : 'Create Course'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Students View ────────────────────────────────────────────────────────────
function StudentsView({ courseId, courseTitle, onBack }: { courseId: string; courseTitle: string; onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [search, setSearch] = useState('');

  const { data: students, isLoading } = useQuery(
    ['course-students', courseId],
    () => coursesAPI.getCourseStudents(courseId),
    { enabled: !!courseId }
  );

  const list = ((students as any[]) || []).filter(s => {
    const matchFilter = filter === 'all' || (filter === 'completed' && s.completed) || (filter === 'in-progress' && !s.completed);
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{courseTitle}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {(['all', 'in-progress', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading students...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Student</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Progress</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Enrolled</th>
                  <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {list.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {s.avatar ? <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" /> : <span className="text-blue-600 font-bold text-xs">{s.name[0]}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.completed ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {s.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView({ courseId, courseTitle, onBack }: { courseId: string; courseTitle: string; onBack: () => void }) {
  const { data: analytics, isLoading } = useQuery(
    ['course-analytics', courseId],
    () => apiCall<any>('GET', `/courses/${courseId}/analytics`),
    { enabled: !!courseId }
  );

  const stats = analytics as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{courseTitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-6 h-6 text-white" />} label="Total Enrolled" value={stats?.totalEnrolled || 0} color="bg-blue-600" />
            <StatCard icon={<Award className="w-6 h-6 text-white" />} label="Completed" value={stats?.completedCount || 0} color="bg-green-600" />
            <StatCard icon={<TrendingUp className="w-6 h-6 text-white" />} label="Completion Rate" value={`${stats?.completionRate || 0}%`} color="bg-purple-600" />
            <StatCard icon={<Star className="w-6 h-6 text-white" />} label="Avg Rating" value={stats?.averageRating?.toFixed(1) || '—'} color="bg-amber-500" />
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Progress Distribution</h3>
            <div className="space-y-3">
              {stats?.progressDistribution && Object.entries(stats.progressDistribution).map(([range, count]: [string, any]) => {
                const total = stats.totalEnrolled || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={range} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{range}%</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-green-600">{(stats?.revenue || 0).toLocaleString()} pts</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total points earned from enrollments</p>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Main CreatorStudio Component ─────────────────────────────────────────────
type StudioView = 'dashboard' | 'create' | 'edit' | 'students' | 'analytics';

export default function CreatorStudio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<StudioView>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery(
    'educator-courses',
    coursesAPI.getEducatorCourses,
    { refetchOnWindowFocus: false }
  );

  const courseList: any[] = (courses as any) || [];

  // Aggregate stats
  const totalStudents = courseList.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const avgRating = courseList.length
    ? (courseList.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / courseList.length).toFixed(1)
    : '—';
  const publishedCount = courseList.filter(c => c.isPublished).length;

  // Mutations
  const createMutation = useMutation(
    (data: any) => {
      console.log('=== CREATING COURSE ===');
      console.log('Form data:', data);
      console.log('Chapters:', JSON.stringify(data.chapters, null, 2));
      return coursesAPI.createCourse(data);
    },
    {
      onSuccess: () => {
        toast.success('Course created successfully');
        queryClient.invalidateQueries('educator-courses');
        setView('dashboard');
      },
      onError: (error: any) => { 
        console.error('=== COURSE CREATION ERROR ===');
        console.error('Full error:', error);
        console.error('Response:', error?.response);
        console.error('Response data:', error?.response?.data);
        
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to create course';
        toast.error(errorMessage);
        
        // Show validation errors if present
        if (error?.response?.data?.errors) {
          console.error('Validation errors:', error.response.data.errors);
          error.response.data.errors.forEach((err: any) => {
            const msg = err.msg || err.message || JSON.stringify(err);
            toast.error(`${err.param || 'Field'}: ${msg}`);
          });
        }
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => {
      console.log('Updating course:', id, data);
      return coursesAPI.updateCourse(id, data);
    },
    {
      onSuccess: () => {
        toast.success('Course updated successfully');
        queryClient.invalidateQueries('educator-courses');
        setView('dashboard');
      },
      onError: (error: any) => { 
        console.error('Course update error:', error);
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to update course';
        toast.error(errorMessage);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => coursesAPI.deleteCourse(id),
    {
      onSuccess: () => {
        toast.success('Course deleted');
        queryClient.invalidateQueries('educator-courses');
        setConfirmDelete(null);
      },
      onError: () => { toast.error('Failed to delete course'); },
    }
  );

  const togglePublishMutation = useMutation(
    ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      coursesAPI.togglePublish(id, isPublished),
    {
      onSuccess: (_, vars) => {
        toast.success(vars.isPublished ? 'Course published' : 'Course unpublished');
        queryClient.invalidateQueries('educator-courses');
      },
      onError: () => { toast.error('Failed to update publish status'); },
    }
  );

  // ── Sub-views ──
  if (view === 'create') {
    return (
      <CourseFormView
        onSave={(data) => createMutation.mutate(data)}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  if (view === 'edit' && selectedCourse) {
    return (
      <CourseFormView
        initial={selectedCourse}
        onSave={(data) => updateMutation.mutate({ id: selectedCourse._id || selectedCourse.id, data })}
        onCancel={() => { setView('dashboard'); setSelectedCourse(null); }}
      />
    );
  }

  if (view === 'students' && selectedCourse) {
    return (
      <StudentsView
        courseId={selectedCourse._id || selectedCourse.id}
        courseTitle={selectedCourse.title}
        onBack={() => { setView('dashboard'); setSelectedCourse(null); }}
      />
    );
  }

  if (view === 'analytics' && selectedCourse) {
    return (
      <AnalyticsView
        courseId={selectedCourse._id || selectedCourse.id}
        courseTitle={selectedCourse.title}
        onBack={() => { setView('dashboard'); setSelectedCourse(null); }}
      />
    );
  }

  // ── Dashboard ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Course</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {user?.name?.split(' ')[0]}. Manage your courses and track student progress.
          </p>
        </div>
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-6 h-6 text-white" />} label="Total Courses" value={courseList.length} color="bg-blue-600" />
        <StatCard icon={<Users className="w-6 h-6 text-white" />} label="Total Students" value={totalStudents} color="bg-purple-600" />
        <StatCard icon={<Star className="w-6 h-6 text-white" />} label="Avg Rating" value={avgRating} color="bg-amber-500" />
        <StatCard icon={<Globe className="w-6 h-6 text-white" />} label="Published" value={publishedCount} color="bg-green-600" />
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : courseList.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first course to get started</p>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseList.map(course => (
            <CourseCard
              key={course._id || course.id}
              course={course}
              onEdit={() => { setSelectedCourse(course); setView('edit'); }}
              onDelete={() => setConfirmDelete(course._id || course.id)}
              onTogglePublish={() => togglePublishMutation.mutate({
                id: course._id || course.id,
                isPublished: !course.isPublished,
              })}
              onViewStudents={() => { setSelectedCourse(course); setView('students'); }}
              onViewAnalytics={() => { setSelectedCourse(course); setView('analytics'); }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Course?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. All enrolled students will lose access.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(confirmDelete)}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
