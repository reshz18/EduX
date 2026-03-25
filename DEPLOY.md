# 🚀 Quick Deployment Guide

## Deploy Both Frontend & Backend to Vercel

### ✅ Yes, you can deploy both to Vercel!

You'll create **2 separate Vercel projects** from the same repository:
1. **Backend Project** (Express.js API)
2. **Frontend Project** (Next.js app)

---

## 📋 Prerequisites (5 minutes)

### 1. MongoDB Atlas
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create free cluster
- Create database user
- Whitelist IP: `0.0.0.0/0` (allows Vercel)
- Copy connection string

### 2. Cloudinary
- Sign up at [cloudinary.com](https://cloudinary.com)
- Get: Cloud Name, API Key, API Secret

### 3. AI API Keys
- **Gemini**: [ai.google.dev](https://ai.google.dev)
- **Grok**: [x.ai](https://x.ai)

### 4. Vercel Account
- Sign up at [vercel.com](https://vercel.com)
- Connect your GitHub/GitLab account

---

## 🎯 Deployment Steps (15 minutes)

### Step 1: Deploy Backend (5 min)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. **Import** your Git repository
4. Configure:
   ```
   Project Name: edux-backend
   Root Directory: backend
   Framework: Other
   ```
5. Click **"Environment Variables"**
6. Add these 9 variables:
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/edux_platform
   JWT_SECRET = your_super_secret_key_minimum_32_characters_long
   GEMINI_API_KEY = your_gemini_api_key
   GROK_API_KEY = your_grok_api_key
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY = your_cloudinary_key
   CLOUDINARY_API_SECRET = your_cloudinary_secret
   CLIENT_URL = https://your-frontend.vercel.app
   NODE_ENV = production
   ```
   *(You'll update CLIENT_URL after frontend deployment)*

7. Click **"Deploy"**
8. Wait for deployment (2-3 minutes)
9. **Copy your backend URL**: `https://edux-backend-xxx.vercel.app`

---

### Step 2: Deploy Frontend (5 min)

1. Click **"Add New Project"** again
2. **Import** the same repository
3. Configure:
   ```
   Project Name: edux-frontend
   Root Directory: frontend
   Framework: Next.js
   ```
4. Click **"Environment Variables"**
5. Add these 2 variables:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.vercel.app/api
   NEXT_PUBLIC_SOCKET_URL = https://your-backend-url.vercel.app
   ```
   *(Use the backend URL from Step 1)*

6. Click **"Deploy"**
7. Wait for deployment (3-4 minutes)
8. **Copy your frontend URL**: `https://edux-frontend-xxx.vercel.app`

---

### Step 3: Update CORS (2 min)

1. Go to **backend project** in Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Find `CLIENT_URL`
4. Update value to your frontend URL: `https://edux-frontend-xxx.vercel.app`
5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Click **"Redeploy"** on latest deployment

---

### Step 4: Test Your Platform (3 min)

1. Open your frontend URL
2. Test these features:
   - ✅ Register new account
   - ✅ Login
   - ✅ Browse courses
   - ✅ Enroll in course
   - ✅ Watch video
   - ✅ Take quiz
   - ✅ Check certificate

---

## 🎉 You're Live!

Your EdUx platform is now deployed:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`

---

## 📊 What You Get

### Vercel Free Tier Includes:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Git integration (auto-deploy on push)
- ✅ Preview deployments for PRs

### Limitations:
- ⚠️ Serverless function timeout: 10 seconds (hobby), 60 seconds (pro)
- ⚠️ Socket.io may need adjustments (WebSocket limitations)
- ⚠️ 100GB bandwidth/month (hobby tier)

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: 
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Check database user has read/write permissions

### Issue: "CORS error"
**Solution**:
- Verify `CLIENT_URL` in backend matches frontend URL exactly
- Make sure you redeployed backend after updating CLIENT_URL
- Check browser console for exact error

### Issue: "API calls failing"
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` in frontend is correct
- Check backend deployment logs in Vercel
- Test backend URL directly: `https://your-backend.vercel.app/api/test`

### Issue: "Socket.io not connecting"
**Solution**:
- Vercel serverless has WebSocket limitations
- Consider using polling fallback
- Or use external service like Pusher/Ably

### Issue: "File uploads not working"
**Solution**:
- Verify Cloudinary credentials are correct
- Check API key has upload permissions
- Review backend logs for errors

---

## 🔄 Updating Your Deployment

### Automatic Updates (Recommended)
1. Push changes to your Git repository
2. Vercel automatically deploys
3. Check deployment status in dashboard

### Manual Redeploy
1. Go to Vercel dashboard
2. Select project
3. Go to "Deployments"
4. Click "Redeploy" on any deployment

---

## 📈 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution times
- Check bandwidth usage
- Set up alerts

### MongoDB Atlas
- Monitor database connections
- Check query performance
- Set up alerts for high usage

---

## 💡 Pro Tips

1. **Custom Domains**: Add your own domain in Vercel project settings
2. **Environment Variables**: Use Vercel's environment variable groups for different environments
3. **Preview Deployments**: Every PR gets a preview URL automatically
4. **Analytics**: Enable Vercel Analytics for performance insights
5. **Logs**: Check function logs in Vercel dashboard for debugging

---

## 🆘 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**That's it! Your platform is live! 🎓✨**
