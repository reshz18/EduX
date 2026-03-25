# EduX Learning Platform

A modern, full-stack e-learning platform with AI-powered features, built with Next.js, Express.js, and MongoDB.

## Features

### Student Portal
- **Authentication & Onboarding**: Secure registration, profile setup, avatar selection
- **Course System**: Browse, enroll, watch videos with auto-save progress
- **AI Quiz Generation**: Dynamic quizzes powered by Grok AI
- **Quiz Review System**: Rate and review quiz quality
- **Certificates**: Auto-generated PDF certificates with QR codes
- **Notes System**: Take and organize notes while learning
- **Community Forum**: Create posts, like, comment with real-time updates
- **Leaderboard & Gamification**: Points, levels, streaks, achievements
- **Spin Wheel Rewards**: Daily rewards and challenges
- **EduxBot**: AI chatbot assistant powered by Gemini AI

### Enterprise/Admin Portal
- **Analytics Dashboard**: Real-time student and course metrics
- **Student Management**: View and manage enrolled students
- **Course Management**: Create, edit, publish courses
- **Creator Studio**: Content creation tools
- **Real-time Monitoring**: Live activity tracking

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js, Socket.io, JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Gemini AI (chatbot), Grok AI (quiz generation)
- **File Storage**: Cloudinary (images/videos)
- **PDF Generation**: PDFKit with QR codes
- **Real-time**: Socket.io for live updates

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edux-platform
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Environment Variables

**Backend** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edux_platform
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
edux-platform/
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & validation
│   └── scripts/            # Database seeders
├── frontend/               # Next.js application
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
└── docs/                  # Documentation
```

## API Endpoints (17 Routes)

- `/api/auth` - Authentication (register, login)
- `/api/users` - User management and profiles
- `/api/courses` - Course CRUD operations
- `/api/community` - Forum posts and interactions
- `/api/notes` - Note taking system
- `/api/certificates` - Certificate generation and download
- `/api/leaderboard` - Rankings and stats
- `/api/rewards` - Spin wheel and challenges
- `/api/chat` - AI chatbot (EduxBot)
- `/api/upload` - File uploads (Cloudinary)
- `/api/notifications` - Real-time notifications
- `/api/settings` - User preferences
- `/api/analytics` - Admin analytics
- `/api/progress` - Learning progress tracking
- `/api/admin` - Admin operations
- `/api/quiz` - AI quiz generation
- `/api/reviews` - Quiz review system

## Deployment to Vercel

### Option 1: Two Separate Projects (Recommended)

This approach gives you better control and independent scaling.

#### Prerequisites
1. **MongoDB Atlas**: Create cluster and get connection string
2. **Cloudinary**: Sign up and get API credentials  
3. **Gemini API**: Get API key from Google AI Studio
4. **Grok API**: Get API key from xAI
5. **Vercel Account**: Sign up at vercel.com

#### Step 1: Deploy Backend
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Project Name**: `edux-backend`
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
5. Add Environment Variables (9 required):
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key_32_chars_min
   GEMINI_API_KEY=your_gemini_key
   GROK_API_KEY=your_grok_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   CLIENT_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
6. Click "Deploy"
7. **Copy your backend URL** (e.g., `https://edux-backend.vercel.app`)

#### Step 2: Deploy Frontend
1. Click "Add New Project" again
2. Import the same repository
3. Configure:
   - **Project Name**: `edux-frontend`
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Add Environment Variables (2 required):
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.vercel.app
   ```
5. Click "Deploy"
6. **Copy your frontend URL** (e.g., `https://edux-frontend.vercel.app`)

#### Step 3: Update CORS
1. Go to backend project settings
2. Update `CLIENT_URL` environment variable with your frontend URL
3. Click "Redeploy"

#### Step 4: Test
- Visit your frontend URL
- Register/login
- Test all features

### Option 2: Single Monorepo (Advanced)

Deploy from root with `vercel.json` configuration (already included).

**Note**: This is more complex and may have limitations with Socket.io. Option 1 is recommended.

### Important Notes

⚠️ **Socket.io Limitations**: Vercel serverless functions have WebSocket limitations. If real-time features don't work:
- Consider using Vercel Edge Functions
- Use external WebSocket service (Pusher, Ably)
- Implement polling fallback

✅ **MongoDB Atlas**: Ensure IP whitelist includes `0.0.0.0/0` for Vercel

✅ **Environment Variables**: Never commit `.env` files. Always use Vercel dashboard to set them.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact the development team.
