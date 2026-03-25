export enum UserRole {
  STUDENT = 'STUDENT',
  EDUCATOR = 'EDUCATOR',
  ADMIN = 'ADMIN'
}

export type Visibility = 'Public' | 'Private' | 'Unlisted';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  points: number;
  coursesCompleted: CourseEnrollment[];
  coursesEnrolled: CourseEnrollment[];
  badges: Badge[];
  phone?: string;
  bio?: string;
  username?: string;
  skills?: string[];
  educationLevel?: string;
  interests?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  location?: string;
  isOnboarded?: boolean;
}

export interface Badge {
  name: string;
  earnedAt: string;
}

export interface CourseEnrollment {
  courseId: string | Course;
  enrolledAt?: string;
  completedAt?: string;
  progress: number;
}

export interface Course {
  id: string;
  _id?: string; // MongoDB ObjectId field
  title: string;
  description: string;
  instructor: string | User;
  instructorName: string;
  thumbnail: string;
  category: string;
  tags: string[];
  price?: number;
  pointsRequired: number;
  chapters: Chapter[];
  lessons?: Lesson[]; // Add lessons field for video courses
  totalDuration?: string | number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolledStudents: string[];
  rating: {
    average: number;
    count: number;
  };
  reviews: Review[];
  isPublished: boolean;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id?: string;
  title: string;
  videoId: string;
  duration?: number;
}

export interface Chapter {
  id?: string;
  _id?: string;
  title: string;
  videoUrl?: string;
  videoId?: string;
  duration: string | number;
  description: string;
  order: number;
}

export interface Review {
  user: string | User;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  _id?: string; // MongoDB ObjectId field
  author: string | User;
  content: string;
  image?: string;
  likes: string[];
  comments: Comment[];
  isAnonymous: boolean;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean; // User interaction status from backend
  isAuthor?: boolean; // Whether current user is the author
}

export interface Comment {
  id: string;
  _id?: string; // MongoDB ObjectId field
  author: string | User;
  content: string;
  likes: string[];
  createdAt: string;
  isLiked?: boolean; // User interaction status
}

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string | User;
  isPublic: boolean;
  tags: string[];
  category: string;
  likes: string[];
  views: number;
  course?: string | Course;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  _id: string;
  id?: string;
  userId: string | User;
  courseId: string | Course;
  certificateId: string;
  userName: string;
  courseName: string;
  instructorName: string;
  issuedAt: string;
  completionDate: string;
}

export interface ChatSession {
  id: string;
  user: string;
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  points: number;
  coursesCompleted: number;
  badges: number;
}

export interface SpinReward {
  points: number;
  probability: number;
  label: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: {
    points: number;
    badge?: string;
    other?: string;
  };
  completed: boolean;
  progress: number;
  target: number;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  visibility: Visibility;
  thumbnailUrl: string;
  status: 'Live' | 'Processing' | 'Draft';
  uploadDate: string;
  duration: string;
  fileSize: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  file: File | null;
  thumbnail: string | null;
}

export enum View {
  DASHBOARD = 'Dashboard',
  COURSES = 'Courses',
  REWARDS = 'Spin Rewards',
  COMMUNITY = 'Community',
  BOT = 'EduxBot',
  CREATOR = 'Create Course',
  NOTES = 'Notes',
  CERTIFICATES = 'Certificates',
  LEADERBOARD = 'Leaderboard',
  SETTINGS = 'Settings',
  ANALYTICS = 'Analytics'
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface OnboardingData {
  avatar?: string;
  fullName?: string;
  username?: string;
  bio?: string;
  interests?: string[];
  educationLevel?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  location?: string;
  // Educator-specific
  institution?: string;
  teachingExperience?: string;
  subjectsTaught?: string[];
}

export interface Avatar {
  id: string;
  name: string;
  url: string;
}