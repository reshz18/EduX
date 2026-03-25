const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Post = require('../models/Post');
const Note = require('../models/Note');
const Challenge = require('../models/Challenge');
const Notification = require('../models/Notification');
const UserProgress = require('../models/UserProgress');
const UserSettings = require('../models/UserSettings');
const { SpinReward, UserSpinHistory } = require('../models/SpinReward');
const Certificate = require('../models/Certificate');
const ChatSession = require('../models/ChatSession');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edux_platform');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Post.deleteMany({});
    await Note.deleteMany({});
    await Challenge.deleteMany({});
    await Notification.deleteMany({});
    await UserProgress.deleteMany({});
    await UserSettings.deleteMany({});
    await SpinReward.deleteMany({});
    await UserSpinHistory.deleteMany({});
    await Certificate.deleteMany({});
    await ChatSession.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        name: 'Reshwant Kumar',
        email: 'reshwant@edux.com',
        password: 'password123', // Will be hashed by the pre-save middleware
        role: 'STUDENT',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reshwant',
        points: 1250,
        badges: [
          { name: 'Fast Learner' },
          { name: 'Top Contributor' }
        ],
        isOnboarded: true,
        username: 'reshwant_kumar',
        bio: 'Passionate learner exploring new technologies',
        interests: ['Web Development', 'AI', 'Machine Learning'],
        educationLevel: 'Bachelor\'s Degree'
      },
      {
        name: 'Dr. Mahesh Sharma',
        email: 'mahesh@edux.com',
        password: 'password123',
        role: 'EDUCATOR',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mahesh',
        points: 0,
        badges: [
          { name: 'Master Teacher' }
        ],
        isOnboarded: true,
        username: 'dr_mahesh',
        bio: 'Experienced educator in computer science',
        interests: ['Teaching', 'React', 'Web Development'],
        educationLevel: 'PhD'
      },
      {
        name: 'Prof. Chakresh Patel',
        email: 'chakresh@edux.com',
        password: 'password123',
        role: 'EDUCATOR',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chakresh',
        points: 0,
        badges: [
          { name: 'Expert Instructor' }
        ],
        isOnboarded: true,
        username: 'prof_chakresh',
        bio: 'Quantum computing researcher and educator',
        interests: ['Quantum Computing', 'Physics', 'Research'],
        educationLevel: 'PhD'
      },
      {
        name: 'Krishna Singh',
        email: 'krishna@edux.com',
        password: 'password123',
        role: 'EDUCATOR',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Krishna',
        points: 0,
        badges: [
          { name: 'Innovation Leader' }
        ],
        isOnboarded: true,
        username: 'krishna_singh',
        bio: 'AI enthusiast and design expert',
        interests: ['AI', 'UI/UX Design', 'Innovation'],
        educationLevel: 'Master\'s Degree'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@edux.com',
        password: 'password123',
        role: 'STUDENT',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        points: 950,
        badges: [
          { name: 'Quick Learner' }
        ],
        isOnboarded: true,
        username: 'priya_sharma',
        bio: 'Computer science student with a passion for learning',
        interests: ['Programming', 'Data Science', 'Web Development'],
        educationLevel: 'Bachelor\'s Degree'
      }
    ]);

    console.log('Created sample users');

    // Create sample courses
    const courses = await Course.create([
      {
        title: 'Advanced React Patterns',
        description: 'Master advanced React concepts including hooks, context, and performance optimization techniques.',
        instructor: users[1]._id, // Dr. Mahesh
        instructorName: 'Dr. Mahesh Sharma',
        thumbnail: 'https://picsum.photos/400/225?random=1',
        category: 'Web Development',
        tags: ['React', 'JavaScript', 'Frontend'],
        pointsRequired: 0,
        chapters: [
          {
            title: 'Introduction to Advanced Patterns',
            videoUrl: 'https://example.com/video1',
            duration: '15:30',
            description: 'Overview of advanced React patterns',
            order: 1
          },
          {
            title: 'Custom Hooks Deep Dive',
            videoUrl: 'https://example.com/video2',
            duration: '22:45',
            description: 'Creating and using custom hooks effectively',
            order: 2
          }
        ],
        level: 'Advanced',
        isPublished: true,
        rating: { average: 4.8, count: 24 }
      },
      {
        title: 'AI Integration Masterclass',
        description: 'Learn how to integrate AI services into modern web applications using various APIs and frameworks.',
        instructor: users[3]._id, // Krishna
        instructorName: 'Krishna Singh',
        thumbnail: 'https://picsum.photos/400/225?random=2',
        category: 'Artificial Intelligence',
        tags: ['AI', 'Machine Learning', 'APIs'],
        pointsRequired: 0,
        chapters: [
          {
            title: 'AI Fundamentals for Developers',
            videoUrl: 'https://example.com/video3',
            duration: '18:20',
            description: 'Understanding AI concepts for web developers',
            order: 1
          }
        ],
        level: 'Intermediate',
        isPublished: true,
        rating: { average: 4.6, count: 18 }
      },
      {
        title: 'Quantum Computing Basics',
        description: 'Introduction to quantum computing principles and their applications in modern technology.',
        instructor: users[2]._id, // Chakresh
        instructorName: 'Prof. Chakresh Patel',
        thumbnail: 'https://picsum.photos/400/225?random=3',
        category: 'Computer Science',
        tags: ['Quantum', 'Physics', 'Computing'],
        pointsRequired: 500,
        chapters: [
          {
            title: 'Quantum Mechanics Basics',
            videoUrl: 'https://example.com/video4',
            duration: '25:10',
            description: 'Fundamental principles of quantum mechanics',
            order: 1
          }
        ],
        level: 'Advanced',
        isPublished: true,
        rating: { average: 4.9, count: 12 }
      },
      {
        title: 'UI/UX Design Principles',
        description: 'Master the fundamentals of user interface and user experience design.',
        instructor: users[3]._id, // Krishna
        instructorName: 'Krishna Singh',
        thumbnail: 'https://picsum.photos/400/225?random=4',
        category: 'Design',
        tags: ['UI', 'UX', 'Design'],
        pointsRequired: 300,
        chapters: [
          {
            title: 'Design Thinking Process',
            videoUrl: 'https://example.com/video5',
            duration: '20:15',
            description: 'Understanding the design thinking methodology',
            order: 1
          }
        ],
        level: 'Beginner',
        isPublished: true,
        rating: { average: 4.7, count: 31 }
      }
    ]);

    console.log('Created sample courses');

    // Enroll student in some courses
    users[0].coursesEnrolled.push(
      { courseId: courses[0]._id, progress: 100 },
      { courseId: courses[1]._id, progress: 45 }
    );
    users[0].coursesCompleted.push(
      { courseId: courses[0]._id, progress: 100 }
    );

    await users[0].save();

    // Create sample community posts
    const posts = await Post.create([
      {
        author: users[0]._id,
        content: 'Just completed the Advanced React Patterns course! The custom hooks section was incredibly insightful. Anyone else working with React hooks?',
        category: 'Web Development',
        tags: ['React', 'Hooks'],
        likes: [users[4]._id]
      },
      {
        author: users[4]._id,
        content: 'Does anyone have good resources for learning quantum computing? The math seems quite challenging.',
        category: 'Computer Science',
        tags: ['Quantum', 'Math'],
        isAnonymous: false
      },
      {
        author: users[0]._id,
        content: 'Pro tip: When designing user interfaces, always start with user research. Understanding your users is key to creating great experiences!',
        category: 'Design',
        tags: ['UI', 'UX', 'Tips'],
        likes: [users[4]._id]
      }
    ]);

    console.log('Created sample posts');

    // Create sample notes
    const notes = await Note.create([
      {
        title: 'React Hooks Cheat Sheet',
        content: `# React Hooks Quick Reference

## useState
- Manages component state
- Returns [state, setState]
- Example: const [count, setCount] = useState(0)

## useEffect
- Handles side effects
- Runs after render
- Example: useEffect(() => { /* effect */ }, [dependencies])

## useContext
- Consumes context values
- Avoids prop drilling
- Example: const value = useContext(MyContext)`,
        author: users[0]._id,
        isPublic: true,
        category: 'Web Development',
        tags: ['React', 'Hooks', 'Cheatsheet'],
        likes: [users[4]._id]
      },
      {
        title: 'Quantum Computing Key Concepts',
        content: `# Quantum Computing Fundamentals

## Qubits
- Quantum bits that can be in superposition
- Can represent 0, 1, or both simultaneously

## Entanglement
- Quantum particles become correlated
- Measuring one affects the other instantly

## Superposition
- Quantum systems exist in multiple states
- Collapses to definite state when measured`,
        author: users[4]._id,
        isPublic: true,
        category: 'Computer Science',
        tags: ['Quantum', 'Physics', 'Notes']
      },
      {
        title: 'My Private Study Notes',
        content: 'These are my personal notes for the AI course...',
        author: users[0]._id,
        isPublic: false,
        category: 'Artificial Intelligence',
        tags: ['AI', 'Personal']
      }
    ]);

    console.log('Created sample notes');

    // Create sample challenges
    const challenges = await Challenge.create([
      {
        title: 'Daily Login Streak',
        description: 'Log in to the platform for 7 consecutive days',
        type: 'weekly',
        reward: {
          points: 200,
          badge: 'Consistent Learner'
        },
        requirements: {
          action: 'login_streak',
          target: 7,
          timeframe: 168 // 7 days in hours
        },
        isActive: true
      },
      {
        title: 'Course Completion Champion',
        description: 'Complete any course to earn bonus points',
        type: 'daily',
        reward: {
          points: 150,
          badge: 'Course Finisher'
        },
        requirements: {
          action: 'complete_course',
          target: 1,
          timeframe: 24
        },
        isActive: true
      },
      {
        title: 'Community Contributor',
        description: 'Make 5 posts in the community section',
        type: 'weekly',
        reward: {
          points: 100,
          badge: 'Community Helper'
        },
        requirements: {
          action: 'community_post',
          target: 5,
          timeframe: 168
        },
        isActive: true
      },
      {
        title: 'Knowledge Sharer',
        description: 'Create 3 public notes to help other learners',
        type: 'monthly',
        reward: {
          points: 300,
          badge: 'Knowledge Guru'
        },
        requirements: {
          action: 'create_note',
          target: 3,
          timeframe: 720 // 30 days
        },
        isActive: true
      }
    ]);

    console.log('Created sample challenges');

    // Create sample notifications for users
    const notifications = await Notification.create([
      {
        recipient: users[0]._id,
        type: 'course_completion',
        title: 'Course Completed!',
        message: 'Congratulations! You have successfully completed "Advanced React Patterns"',
        data: { courseId: courses[0]._id, courseName: 'Advanced React Patterns' },
        isRead: false,
        priority: 'high'
      },
      {
        recipient: users[0]._id,
        type: 'badge_earned',
        title: 'New Badge Earned!',
        message: 'You have earned the "Fast Learner" badge for your dedication!',
        data: { badgeName: 'Fast Learner' },
        isRead: true,
        priority: 'medium'
      },
      {
        recipient: users[4]._id,
        type: 'new_message',
        title: 'New Community Reply',
        message: 'Someone replied to your quantum computing question',
        data: { postId: posts[1]._id },
        isRead: false,
        priority: 'low'
      },
      {
        recipient: users[0]._id,
        type: 'system_announcement',
        title: 'Welcome to EduX Platform!',
        message: 'Welcome to our learning community. Start exploring courses and connect with fellow learners!',
        data: {},
        isRead: false,
        priority: 'medium'
      }
    ]);

    console.log('Created sample notifications');

    // Create user progress records
    const progressRecords = await UserProgress.create([
      {
        user: users[0]._id,
        course: courses[0]._id,
        chaptersCompleted: [
          { chapterId: 'chapter-1', completedAt: new Date(), timeSpent: 25 },
          { chapterId: 'chapter-2', completedAt: new Date(), timeSpent: 30 }
        ],
        totalProgress: 100,
        totalTimeSpent: 55,
        isCompleted: true,
        completedAt: new Date(),
        grade: 'A'
      },
      {
        user: users[0]._id,
        course: courses[1]._id,
        chaptersCompleted: [
          { chapterId: 'chapter-1', completedAt: new Date(), timeSpent: 20 }
        ],
        totalProgress: 45,
        totalTimeSpent: 20,
        isCompleted: false
      },
      {
        user: users[4]._id,
        course: courses[3]._id,
        chaptersCompleted: [],
        totalProgress: 0,
        totalTimeSpent: 0,
        isCompleted: false
      }
    ]);

    console.log('Created user progress records');

    // Create user settings
    const userSettings = await UserSettings.create([
      {
        user: users[0]._id,
        notifications: {
          email: {
            courseUpdates: true,
            newMessages: true,
            achievements: true,
            weeklyDigest: false,
            marketing: false
          },
          push: {
            courseReminders: true,
            achievements: true,
            messages: false
          }
        },
        privacy: {
          profileVisibility: 'public',
          showProgress: true,
          showBadges: true,
          allowMessages: true
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          autoplay: true,
          playbackSpeed: 1.25
        }
      },
      {
        user: users[4]._id,
        notifications: {
          email: {
            courseUpdates: true,
            newMessages: true,
            achievements: true,
            weeklyDigest: true,
            marketing: false
          },
          push: {
            courseReminders: true,
            achievements: true,
            messages: true
          }
        },
        privacy: {
          profileVisibility: 'public',
          showProgress: true,
          showBadges: true,
          allowMessages: true
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          autoplay: false,
          playbackSpeed: 1.0
        }
      }
    ]);

    console.log('Created user settings');

    // Create spin rewards configuration
    const spinRewards = await SpinReward.create([
      {
        user: users[0]._id,
        rewardType: 'points',
        rewardValue: { points: 50 },
        probability: 30,
        isActive: true
      },
      {
        user: users[0]._id,
        rewardType: 'points',
        rewardValue: { points: 100 },
        probability: 25,
        isActive: true
      },
      {
        user: users[0]._id,
        rewardType: 'badge',
        rewardValue: { badgeName: 'Lucky Spinner' },
        probability: 10,
        isActive: true
      }
    ]);

    // Create spin history for users
    const spinHistory = await UserSpinHistory.create([
      {
        user: users[0]._id,
        lastSpinAt: new Date(),
        spinsToday: 1,
        totalSpins: 15,
        rewards: [
          {
            rewardType: 'points',
            rewardValue: { points: 100 },
            earnedAt: new Date()
          }
        ]
      }
    ]);

    console.log('Created spin rewards and history');

    // Create sample certificates
    const certificates = await Certificate.create([
      {
        user: users[0]._id,
        course: courses[0]._id,
        certificateId: 'CERT-' + Date.now() + '-REACT001',
        completionDate: new Date(),
        grade: 'A',
        skills: ['React', 'JavaScript', 'Frontend Development'],
        verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/CERT-${Date.now()}-REACT001`
      },
      {
        user: users[4]._id,
        course: courses[3]._id,
        certificateId: 'CERT-' + Date.now() + '-DESIGN001',
        completionDate: new Date(),
        grade: 'B+',
        skills: ['UI Design', 'UX Design', 'Design Thinking'],
        verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/CERT-${Date.now()}-DESIGN001`
      }
    ]);

    console.log('Created sample certificates');

    // Create sample chat sessions
    const chatSessions = await ChatSession.create([
      {
        user: users[0]._id,
        title: 'React Hooks Questions',
        messages: [
          {
            role: 'user',
            content: 'Can you explain how useEffect works in React?',
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: 'useEffect is a React Hook that lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount combined in React class components. The basic syntax is useEffect(() => { /* effect */ }, [dependencies]). The dependency array controls when the effect runs.',
            timestamp: new Date()
          },
          {
            role: 'user',
            content: 'What about cleanup in useEffect?',
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: 'Great question! Cleanup in useEffect is handled by returning a function from your effect. This cleanup function runs before the component unmounts or before the effect runs again. For example: useEffect(() => { const timer = setInterval(() => {}, 1000); return () => clearInterval(timer); }, []). This prevents memory leaks and ensures proper cleanup.',
            timestamp: new Date()
          }
        ]
      },
      {
        user: users[4]._id,
        title: 'Design Principles Help',
        messages: [
          {
            role: 'user',
            content: 'What are the key principles of good UI design?',
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: 'The key principles of good UI design include: 1) Clarity - make interfaces easy to understand, 2) Consistency - use familiar patterns, 3) Hierarchy - organize information logically, 4) Feedback - provide clear responses to user actions, 5) Accessibility - design for all users, and 6) Simplicity - remove unnecessary elements. These principles help create intuitive and user-friendly interfaces.',
            timestamp: new Date()
          }
        ]
      },
      {
        user: users[0]._id,
        title: 'Study Tips Request',
        messages: [
          {
            role: 'user',
            content: 'I\'m struggling to stay focused while studying. Any tips?',
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: 'Here are some effective study tips to improve focus: 1) Use the Pomodoro Technique (25 min study, 5 min break), 2) Create a dedicated study space free from distractions, 3) Break large topics into smaller, manageable chunks, 4) Use active learning techniques like summarizing and teaching concepts aloud, 5) Take regular breaks to prevent mental fatigue, and 6) Stay hydrated and maintain good posture. Remember, consistency is key!',
            timestamp: new Date()
          }
        ]
      }
    ]);

    console.log('Created sample chat sessions');

    console.log('✅ Database seeded successfully!');
    console.log('\nSample accounts created:');
    console.log('Student: reshwant@edux.com / password123');
    console.log('Educator: mahesh@edux.com / password123');
    console.log('Educator: chakresh@edux.com / password123');
    console.log('Educator: krishna@edux.com / password123');
    console.log('Student: priya@edux.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData();