# 🎓 EduGrow+ - Growth Monitoring & Career Intelligence Platform

A comprehensive Student-Mentor-Admin platform for tracking academic progress, coding achievements, and career development.

## 📁 Project Structure

```
GROWTH_MONITORING/
├── frontend/                 # React + Vite Frontend
│   ├── src/                 # React components and pages
│   ├── public/              # Static assets
│   ├── index.html           # Main HTML file
│   ├── vite.config.js       # Vite configuration
│   ├── package.json         # Frontend dependencies
│   └── DEPLOYMENT.md        # Deployment guide
│
├── backend/                 # Node.js + Express Backend
│   ├── server.js           # Main server file
│   ├── controllers/        # Request handlers
│   ├── routes/             # API route definitions
│   ├── models/             # Database models
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── config/             # Configuration files
│   └── package.json        # Backend dependencies
│
├── package.json            # Root package.json (workspace manager)
├── DEMO_CREDENTIALS.md     # Test account credentials
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd GROWTH_MONITORING
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   Or install individually:
   ```bash
   npm run install:frontend
   npm run install:backend
   ```

3. **Environment Setup:**
   
   **Backend (.env file in `/backend`):**
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   # Optional: For specific database config
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=edugrow_plus
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```
   
   **Frontend (.env file in `/frontend`):**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_FIREBASE_API_KEY=your_firebase_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Start Development:**
   ```bash
   # Start both frontend and backend concurrently
   npm run dev
   
   # Or start individually:
   npm run dev:frontend    # Runs on http://localhost:5173
   npm run dev:backend     # Runs on http://localhost:5000
   ```

## 📝 Available Scripts

### Root Level Commands
```bash
npm run install:all      # Install dependencies for both frontend and backend
npm run dev             # Start both servers in development mode
npm run build           # Build both frontend and backend
npm run start           # Start both servers in production mode 
npm run clean           # Clean node_modules and build artifacts
```

### Frontend Commands (in `/frontend`)
```bash
npm run dev             # Start Vite dev server (localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

### Backend Commands (in `/backend`) 
```bash
npm run dev             # Start with nodemon (auto-restart)
npm start               # Start production server
```

## 🔑 Demo Accounts

See [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) for test account credentials:
- **Admin:** admin@edugrow.com / admin123
- **Mentor:** mentor@edugrow.com / mentor123  
- **Student:** student@edugrow.com / student123

## 🌐 Application Features

### 👨‍🎓 Student Dashboard
- Academic progress tracking (CGPA, SGPA, Attendance)
- Coding platform integration (GitHub, LeetCode, HackerRank)
- Goal setting and milestone tracking
- Performance reports and analytics

### 👨‍🏫 Mentor Dashboard  
- Student progress oversight
- Feedback and guidance system
- Performance analytics
- Student management tools

### 👨‍💼 Admin Dashboard
- User management (Students & Mentors)
- System announcements
- Platform integrations
- Analytics and reporting

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Firebase** - Authentication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Puppeteer** - Web scraping (coding platforms)

## 🚀 Deployment

### Frontend Deployment
The frontend includes configuration for multiple hosting providers:
- **Vercel** (Recommended) - `vercel.json`
- **Netlify** - `public/_redirects`
- **Apache/cPanel** - `public/.htaccess`

See [frontend/DEPLOYMENT.md](frontend/DEPLOYMENT.md) for detailed deployment instructions.

### Backend Deployment
Deploy to any Node.js hosting service:
- **Render** / **Railway** / **Heroku**
- **Vercel Functions** (serverless)
- **Digital Ocean** / **AWS** / **Azure**

## 📊 Database Schema

The application uses PostgreSQL with Sequelize ORM. Key models:
- **User** - Student/Mentor/Admin accounts
- **Goal** - Academic and coding goals
- **Milestone** - Progress tracking points
- **CodingData** - Platform performance data
- **ProgressHistory** - Historical tracking
- **Feedback** - Mentor feedback system

## 🔧 Development Guidelines

1. **Code Structure:**
   - Frontend components in `/frontend/src/components`
   - Pages in `/frontend/src/pages`
   - Backend routes in `/backend/routes`
   - Controllers in `/backend/controllers`

2. **API Endpoints:**
   - Authentication: `/api/auth/*`
   - Users: `/api/users/*`
   - Goals: `/api/goals/*`
   - Progress: `/api/progress/*`
   - Coding Data: `/api/coding/*`

3. **Best Practices:**
   - Use TypeScript for better code quality
   - Follow React functional components pattern
   - Implement proper error handling
   - Use environment variables for secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include error logs and environment details

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0