# Deployment Guide - Free Hosting

This guide walks you through deploying your Options Strategy Backtester for **free** using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Git repository with your code pushed
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Render account (sign up at [render.com](https://render.com))

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Render Settings

Fill in the following settings:

- **Name**: `backtest-api` (or your preferred name)
- **Region**: Choose closest to your location
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty
- **Runtime**: **Python 3**
- **Build Command**:
  ```
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**:
  ```
  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

### Step 4: Add Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.13.0` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (You'll update this later) |

### Step 5: Deploy

1. Select **Free** plan
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. Copy your backend URL (e.g., `https://backtest-api.onrender.com`)

⚠️ **Important**: Free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New"** → **"Project"**

### Step 2: Import Repository

1. Click **"Import"** next to your repository
2. Vercel will automatically detect it's a Vite project

### Step 3: Configure Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### Step 4: Add Environment Variable

Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://backtest-api.onrender.com` (your Render URL) |

⚠️ Replace with your actual Render backend URL from Part 1, Step 5.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL (e.g., `https://your-app.vercel.app`)

---

## Part 3: Update CORS Configuration

### Update Backend Environment Variable

1. Go back to your Render dashboard
2. Navigate to your **backtest-api** service
3. Go to **"Environment"**
4. Update the `FRONTEND_URL` variable with your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Part 4: Test Your Deployment

1. Visit your Vercel frontend URL
2. The app should load and connect to the backend
3. Try validating a strategy
4. Try running a backtest

If you encounter errors, check the browser console (F12) for details.

---

## Troubleshooting

### Backend Issues

**Problem**: 502 Bad Gateway or backend not responding
- **Solution**: Wait 30 seconds after first request (free tier wakes from sleep)

**Problem**: Module not found errors
- **Solution**: Check that `requirements.txt` includes all dependencies

**Problem**: CORS errors
- **Solution**: Verify `FRONTEND_URL` environment variable matches your Vercel URL exactly

### Frontend Issues

**Problem**: Cannot connect to API
- **Solution**: Verify `VITE_API_URL` environment variable is correct
- **Solution**: Check that backend URL uses `https://` not `http://`

**Problem**: Environment variables not working
- **Solution**: Rebuild the frontend on Vercel after changing environment variables

---

## Alternative Free Hosting Options

### Backend Alternatives

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| **Render** | 750 hrs/month | Sleeps after 15 min inactivity |
| **Railway** | $5 credit/month | Limited hours |
| **Fly.io** | 3 VMs free | 256MB RAM each |
| **PythonAnywhere** | 1 web app | Limited CPU time |

### Frontend Alternatives

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| **Vercel** | Unlimited | 100GB bandwidth/month |
| **Netlify** | Unlimited | 100GB bandwidth/month |
| **Cloudflare Pages** | Unlimited | 500 builds/month |
| **GitHub Pages** | Unlimited | Static sites only |

---

## Cost Optimization Tips

1. **Keep backend alive**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 5 minutes (free)
2. **Optimize build times**: Cache dependencies to speed up deployments
3. **Monitor usage**: Both Vercel and Render have dashboards to track usage
4. **Use environment variables**: Never hardcode URLs or secrets

---

## Next Steps

Once deployed, consider:

- Setting up a custom domain (free on Vercel)
- Adding monitoring and error tracking
- Implementing CI/CD for automated deployments
- Setting up staging and production environments

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
