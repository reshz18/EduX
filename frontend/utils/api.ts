import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Log API URL only in development
if (process.env.NODE_ENV !== 'production') {
  console.log('API_URL:', API_URL);
}

// Create axios instance with longer timeout for chat
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for chat operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== 'production') {
      const fullUrl = (config.baseURL || '') + (config.url || '');
      console.log('Making request to:', fullUrl);
    }
    const token = Cookies.get('token');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Response received:', response.status, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('Response error:', error);
    
    // Don't show toast for rate limit errors on progress updates (they'll retry automatically)
    const isProgressUpdate = error.config?.url?.includes('/progress/update');
    const isRateLimited = error.response?.status === 429;
    
    // Don't show toast for enrollment or reviews errors (handled by query error callbacks)
    const isEnrollmentCheck = error.config?.url?.includes('/enrollment');
    const isReviewsFetch = error.config?.url?.includes('/reviews/') && error.config?.method === 'get';
    
    if (isRateLimited && isProgressUpdate) {
      console.warn('Progress update rate limited, will retry on next interval');
      return Promise.reject(error);
    }
    
    if (isEnrollmentCheck || isReviewsFetch) {
      console.warn('Background fetch failed:', error.config?.url);
      return Promise.reject(error);
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    } else if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } else if (error.response?.status === 429) {
      // Rate limited - show a less intrusive message
      console.warn('Rate limited:', error.config?.url);
      toast.error('Too many requests. Please slow down.', { duration: 2000 });
    } else if (error.response?.status && error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if ((error.response?.data as any)?.message) {
      toast.error((error.response?.data as any).message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { api };

// API helper functions
export const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Making API call:', method, endpoint, data);
    }
    const response = await api({
      method,
      url: endpoint,
      data,
      ...config,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('API response:', response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error('API error:', error);
    throw error.response?.data || error;
  }
};

// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiCall('POST', '/auth/login', credentials),
  
  register: (userData: { name: string; username: string; email: string; password: string; role: string }) =>
    apiCall('POST', '/auth/register', userData),
  
  getProfile: () =>
    apiCall('GET', '/auth/me'),
  
  checkUsername: (username: string) =>
    apiCall('GET', `/auth/check-username/${username}`),
};

// Users API calls
export const usersAPI = {
  updateProfile: (data: any) =>
    apiCall('PUT', '/users/profile', data),
  
  addPoints: (points: number, reason?: string) =>
    apiCall('POST', '/users/points', { points, reason }),
  
  addBadge: (name: string) =>
    apiCall('POST', '/users/badges', { name }),
  
  getStats: () =>
    apiCall('GET', '/users/stats'),
  
  // Onboarding endpoints
  saveAvatar: (avatar: string) =>
    apiCall('POST', '/users/avatar', { avatar }),
  
  completeProfile: (data: any) =>
    apiCall('POST', '/users/complete-profile', data),
  
  checkUsername: (username: string) =>
    apiCall('GET', `/users/check-username/${username}`),
};

// Courses API calls
export const coursesAPI = {
  getCourses: (params?: any) =>
    apiCall('GET', '/courses', null, { params }),
  
  getCourse: (id: string) =>
    apiCall('GET', `/courses/${id}`),
  
  createCourse: (courseData: any) =>
    apiCall('POST', '/courses', courseData),
  
  updateCourse: (id: string, courseData: any) =>
    apiCall('PUT', `/courses/${id}`, courseData),
  
  enrollInCourse: (id: string) =>
    apiCall('POST', `/courses/${id}/enroll`),
  
  updateProgress: (id: string, data: { currentTime: number; totalDuration?: number }) =>
    apiCall('PUT', `/courses/${id}/progress`, data),
  
  getEnrollmentStatus: (id: string) =>
    apiCall('GET', `/courses/${id}/enrollment`),
  
  getMyCourses: () =>
    apiCall('GET', '/courses/my-courses'),

  getEducatorCourses: () =>
    apiCall('GET', '/courses/educator/my-courses'),

  getCourseStudents: (id: string) =>
    apiCall('GET', `/courses/${id}/students`),

  deleteCourse: (id: string) =>
    apiCall('DELETE', `/courses/${id}`),

  togglePublish: (id: string, isPublished: boolean) =>
    apiCall('PUT', `/courses/${id}`, { isPublished }),
  
  getProgress: (id: string) =>
    apiCall('GET', `/courses/${id}/progress`),
  
  completeChapter: (courseId: string, chapterId: string, timeSpent?: number) =>
    apiCall('POST', `/courses/${courseId}/chapters/${chapterId}/complete`, { timeSpent }),
  
  getLearningAnalytics: () =>
    apiCall('GET', '/courses/analytics/learning'),
  
  addReview: (id: string, rating: number, comment?: string) =>
    apiCall('POST', `/courses/${id}/review`, { rating, comment }),
};

// Community API calls
export const communityAPI = {
  getPosts: (params?: any) =>
    apiCall('GET', '/community', null, { params }),
  
  createPost: (postData: any) =>
    apiCall('POST', '/community', postData),
  
  likePost: (id: string) =>
    apiCall('POST', `/community/${id}/like`),
  
  addComment: (data: { id: string; content: string }) =>
    apiCall('POST', `/community/${data.id}/comment`, { content: data.content }),
  
  deletePost: (id: string) =>
    apiCall('DELETE', `/community/${id}`),
  
  getPost: (id: string) =>
    apiCall('GET', `/community/${id}`),
  
  updatePost: (id: string, postData: any) =>
    apiCall('PUT', `/community/${id}`, postData),
  
  getTrendingPosts: (limit = 10) =>
    apiCall('GET', '/community/trending/posts', null, { params: { limit } }),
  
  getUserPosts: (userId: string, params?: any) =>
    apiCall('GET', `/community/user/${userId}`, null, { params }),
  
  reportPost: (id: string, data: { reason: string; description?: string }) =>
    apiCall('POST', `/community/${id}/report`, data),
};

// Notes API calls
export const notesAPI = {
  getNotes: (params?: any) =>
    apiCall('GET', '/notes', null, { params }),
  
  getNote: (id: string) =>
    apiCall('GET', `/notes/${id}`),
  
  createNote: (noteData: any) =>
    apiCall('POST', '/notes', noteData),
  
  updateNote: (id: string, noteData: any) =>
    apiCall('PUT', `/notes/${id}`, noteData),
  
  deleteNote: (id: string) =>
    apiCall('DELETE', `/notes/${id}`),
  
  likeNote: (id: string) =>
    apiCall('POST', `/notes/${id}/like`),
};

// Certificates API calls
export const certificatesAPI = {
  getCertificates: () =>
    apiCall('GET', '/courses/certificates'),
  
  getDownloadUrl: (certificateId: string) =>
    `${API_URL}/certificates/${certificateId}/download`,
  
  downloadCertificate: async (certificateId: string) => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${API_URL}/certificates/${certificateId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download certificate');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error: any) {
      console.error('Certificate download error:', error);
      throw error;
    }
  }
};

// Leaderboard API calls
export const leaderboardAPI = {
  getLeaderboard: (params?: any) =>
    apiCall('GET', '/leaderboard', null, { params }),
  
  getUserRank: () =>
    apiCall('GET', '/leaderboard/rank'),
  
  getStats: () =>
    apiCall('GET', '/leaderboard/stats'),
};

// Rewards API calls
export const rewardsAPI = {
  spin: () =>
    apiCall('POST', '/rewards/spin'),
  
  canSpin: () =>
    apiCall('GET', '/rewards/can-spin'),
  
  getChallenges: () =>
    apiCall('GET', '/rewards/challenges'),
  
  completeChallenge: (challengeId: string) =>
    apiCall('POST', `/rewards/challenges/${challengeId}/complete`),
  
  getSpinHistory: (page = 1, limit = 10) =>
    apiCall('GET', '/rewards/spin-history', null, { params: { page, limit } }),
  
  getRewardsConfig: () =>
    apiCall('GET', '/rewards/rewards-config'),
};

// Chat API calls
export const chatAPI = {
  getSessions: () =>
    apiCall('GET', '/chat/sessions'),
  
  getSession: (id: string) =>
    apiCall('GET', `/chat/sessions/${id}`),
  
  createSession: (title?: string) =>
    apiCall('POST', '/chat/sessions', { title }),
  
  sendMessage: (sessionId: string, message: string) =>
    apiCall('POST', `/chat/sessions/${sessionId}/message`, { message }),
  
  editMessage: (sessionId: string, messageIndex: number, message: string) =>
    apiCall('PUT', `/chat/sessions/${sessionId}/message/${messageIndex}`, { message }),
  
  deleteSession: (id: string) =>
    apiCall('DELETE', `/chat/sessions/${id}`),
  
  updateSessionTitle: (id: string, title: string) =>
    apiCall('PUT', `/chat/sessions/${id}/title`, { title }),
};

// Upload API calls
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiCall('POST', '/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return apiCall('POST', '/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiCall('POST', '/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  deleteFile: (publicId: string, resourceType = 'image') =>
    apiCall('DELETE', `/upload/${publicId}`, null, { params: { resourceType } }),
};

// Notifications API calls
export const notificationsAPI = {
  getNotifications: (params?: any) =>
    apiCall('GET', '/notifications', null, { params }),
  
  markAsRead: (id: string) =>
    apiCall('PUT', `/notifications/${id}/read`),
  
  markAllAsRead: () =>
    apiCall('PUT', '/notifications/read-all'),
  
  deleteNotification: (id: string) =>
    apiCall('DELETE', `/notifications/${id}`),
  
  getStats: () =>
    apiCall('GET', '/notifications/stats'),
};

// Settings API calls
export const settingsAPI = {
  getSettings: () =>
    apiCall('GET', '/settings'),
  
  updateNotifications: (data: any) =>
    apiCall('PUT', '/settings/notifications', data),
  
  updatePrivacy: (data: any) =>
    apiCall('PUT', '/settings/privacy', data),
  
  updatePreferences: (data: any) =>
    apiCall('PUT', '/settings/preferences', data),
  
  resetSettings: () =>
    apiCall('POST', '/settings/reset'),
};

export const analyticsAPI = {
  getOverview: () => apiCall('GET', '/analytics/overview'),
  getCourseAnalytics: (courseId: string) => apiCall('GET', `/analytics/course/${courseId}`),
  getStudentAnalytics: (studentId: string) => apiCall('GET', `/analytics/student/${studentId}`),
  getPersonalAnalytics: () => apiCall('GET', '/analytics/me'),
  searchStudents: (query: string) => apiCall('GET', `/analytics/students/search?query=${encodeURIComponent(query)}`),
};


export const progressAPI = {
  updateProgress: (data: { 
    courseId: string, 
    lessonId: string, 
    watchedTime: number, 
    totalDuration: number, 
    isLessonCompleted?: boolean,
    isTabActive?: boolean 
  }) => apiCall('PUT', '/progress/update', data),
};

export const adminAPI = {
  getSignature: () => apiCall('GET', '/admin/signature'),
  updateSignature: (data: { name: string; signatureUrl: string }) => apiCall('PUT', '/admin/signature', data),
};

export const quizAPI = {
  getQuiz: (courseId: string) => apiCall('GET', `/quiz/${courseId}`),
  submitQuiz: (courseId: string, answers: { questionIndex: number; selectedOption: number }[]) => 
    apiCall('POST', `/quiz/${courseId}/submit`, { answers }),
};


export const reviewsAPI = {
  getReviews: (courseId: string, params?: any) => 
    apiCall('GET', `/reviews/${courseId}`, null, { params }),
  addReview: (courseId: string, rating: number, comment: string) =>
    apiCall('POST', `/reviews/${courseId}`, { rating, comment }),
  deleteReview: (reviewId: string) =>
    apiCall('DELETE', `/reviews/${reviewId}`),
  markHelpful: (reviewId: string) =>
    apiCall('POST', `/reviews/${reviewId}/helpful`),
};
