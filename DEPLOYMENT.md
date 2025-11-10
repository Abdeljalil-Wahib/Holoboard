# Holoboard Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is now ready for deployment! Here's what has been configured:

### Web App (Next.js)

- ✅ Build script updated (removed --turbopack for production)
- ✅ Environment variables configured (.env.local and .env.example)
- ✅ Socket.IO URL uses environment variable
- ✅ .gitignore created

### Server (Socket.IO)

- ✅ Environment variables for PORT, HOST, and ALLOWED_ORIGINS
- ✅ Production build script added
- ✅ TypeScript configuration added
- ✅ CORS configured to accept multiple origins

---

## 🚀 Deployment Steps

### Step 1: Test Build Locally (Optional but Recommended)

```bash
# Test web build
cd packages/web
npm run build

# Test server build
cd ../server
npm run build
```

### Step 2: Deploy the Server

The Socket.IO server needs to run on a platform that supports WebSocket connections. Here are the best options:

#### Option A: Deploy to Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your Holoboard repository
4. **Important Settings:**
   - Root Directory: `packages/server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add Environment Variables in Railway:**

   ```
   PORT=3001
   HOST=0.0.0.0
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

   (You'll update `ALLOWED_ORIGINS` after deploying the web app)

6. Deploy! Railway will give you a URL like: `https://your-app.railway.app`

#### Option B: Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. **Settings:**
   - Name: holoboard-server
   - Root Directory: `packages/server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Environment Variables:**

   ```
   PORT=3001
   HOST=0.0.0.0
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

6. Deploy! Render will give you a URL.

---

### Step 3: Push to GitHub

```bash
cd /home/awahib/Work/holoboard

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/holoboard.git
git branch -M main
git push -u origin main
```

---

### Step 4: Deploy Web App to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click "Add New" → "Project"

3. Import your Holoboard repository

4. **Configure Project:**

   - Framework Preset: Next.js
   - Root Directory: `packages/web`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. **Add Environment Variable:**
   Click "Environment Variables" and add:

   ```
   Name: NEXT_PUBLIC_SOCKET_URL
   Value: https://your-server.railway.app (or your Render URL)
   ```

   Make sure to use the URL from Step 2!

6. Click "Deploy"

7. Once deployed, **copy your Vercel URL** (e.g., `https://holoboard.vercel.app`)

---

### Step 5: Update Server CORS Settings

Go back to your server platform (Railway or Render) and update the `ALLOWED_ORIGINS` environment variable:

```
ALLOWED_ORIGINS=https://holoboard.vercel.app,https://holoboard-preview.vercel.app
```

Add both your production URL and any preview URLs. You can add multiple domains separated by commas.

---

## 🎉 You're Done!

Your Holoboard app should now be live! Visit your Vercel URL to test it.

### Troubleshooting

**If the whiteboard doesn't connect:**

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
3. Verify `ALLOWED_ORIGINS` includes your Vercel URL in the server
4. Make sure the server is running (check Railway/Render logs)

**Common Issues:**

- CORS errors → Update `ALLOWED_ORIGINS` on the server
- Connection timeout → Check if server is running
- 404 errors → Verify root directory settings

---

## 📝 Future Updates

When you make changes:

1. Push to GitHub:

   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Vercel will auto-deploy the web app
3. Railway/Render will auto-deploy the server

---

## 🔧 Local Development

To run locally after cloning:

```bash
# Install dependencies
cd packages/web && npm install
cd ../server && npm install

# Start server
cd packages/server
npm run dev

# Start web app (in another terminal)
cd packages/web
npm run dev
```

Visit http://localhost:3000

---

Good luck with your deployment! 🚀
