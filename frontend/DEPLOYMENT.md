# 🚀 Deployment Guide - EduGrow Plus

## 🔧 Fix for 404 NOT_FOUND Errors

The 404 errors you're experiencing are due to SPA (Single Page Application) routing issues. I've created configuration files to fix this for all major hosting providers.

## 📁 Added Configuration Files

### ✅ For Vercel Hosting (Recommended)
- **File:** `vercel.json` - Complete API + Frontend deployment
- **API Functions:** `api/` directory with serverless functions
- **Purpose:** Self-contained full-stack deployment

### ✅ For Netlify Hosting 
- **File:** `public/_redirects`
- **Purpose:** Frontend-only deployment (requires separate backend)

### ✅ For Apache/cPanel Hosting
- **File:** `public/.htaccess`
- **Purpose:** Traditional hosting redirect configuration

---

## 🚀 Vercel Deployment (Full-Stack)

### Step 1: Prepare Environment Variables

In Vercel Dashboard, add these environment variables:

```env
JWT_SECRET=edugrow_plus_secret_key_2026_secure_token_generation
DB_HOST=database-1.chyoqg44uw61.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres
```

### Step 2: Deploy to Vercel

**Option A: Vercel CLI**
```bash
cd frontend
npm install vercel -g
vercel
# Follow prompts and add environment variables
vercel --prod
```

**Option B: GitHub Integration**
1. Push to GitHub repository
2. Connect repository to Vercel
3. Set root directory to `frontend`
4. Add environment variables in Vercel dashboard
5. Deploy automatically

### Step 3: Test API Endpoints

After deployment, test these endpoints:
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/auth/login` - Login API
- `https://your-app.vercel.app/` - React app

---

## 🌐 Alternative Deployment Options

### Frontend Only + Separate Backend

If you prefer to deploy frontend and backend separately:

1. **Frontend**: Deploy to Vercel/Netlify (frontend only)
2. **Backend**: Deploy to Railway/Render/Heroku
3. **Update**: Set `VITE_API_URL` to your backend URL

---

## 📊 Deployment Comparison

| Platform | Frontend | Backend | Database | Complexity |
|----------|----------|---------|----------|------------|
| **Vercel (Full)** | ✅ | ✅ | External | Low |
| **Vercel + Railway** | ✅ | Railway | External | Medium |
| **Netlify + Render** | ✅ | Render | External | Medium |

---

## 🔧 Pre-Deploy Checklist

- [ ] Install dependencies: `npm install`
- [ ] Build successfully: `npm run build`
- [ ] Environment variables configured
- [ ] Database accessible from hosting platform
- [ ] Test API endpoints locally

---

## 🌐 Environment Variables Guide

### Development (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

### Production (Vercel Dashboard)
```env
JWT_SECRET=your_secure_secret
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
```

---

## 🔍 Troubleshooting

### API Endpoints Not Working
- Check environment variables in Vercel dashboard
- Verify database connection from Vercel logs
- Test `/api/health` endpoint first

### Frontend Routes 404
- Ensure `vercel.json` rewrites are configured
- Check build output directory is `dist`

### Database Connection Issues
- Verify database allows external connections
- Check firewall/security group settings
- Test connection from Vercel functions

---

## 📱 Testing Your Deployment

1. **Homepage:** Should load without errors
2. **API Health:** `/api/health` should return status
3. **Login:** Authentication should work
4. **Navigation:** All routes should work
5. **Direct URLs:** No 404 on page refresh

---

## 🎯 Production URLs

After deployment, your URLs will be:
- **Frontend:** `https://your-app.vercel.app`
- **API:** `https://your-app.vercel.app/api/*`
- **Health Check:** `https://your-app.vercel.app/api/health`

---

**Last Updated:** February 12, 2026