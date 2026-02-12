import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env') })

import { connectDB } from './config/db.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import goalRoutes from './routes/goalRoutes.js'
import milestoneRoutes from './routes/milestoneRoutes.js'
import codingDataRoutes from './routes/codingDataRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import academicsRoutes from './routes/academicsRoutes.js'
import systemRoutes from './routes/systemRoutes.js'

// Import models to ensure associations are loaded
import './models/index.js'
import User from './models/User.js'
import ProgressHistory from './models/ProgressHistory.js'
import CodingData from './models/CodingData.js'

// Seed demo accounts (admin, mentor, student)
const seedDemoAccounts = async () => {
    try {
        const salt = await bcrypt.genSalt(10)
        
        // Demo Admin Account
        const adminEmail = 'admin@edugrow.com'
        const existingAdmin = await User.findOne({ where: { email: adminEmail } })
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', salt)
            await User.create({
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                fullName: 'Admin User',
                department: 'Administration',
                phoneNumber: '+1234567890',
                address: 'Admin Office, Campus'
            })
            console.log('🔑 Demo Admin: admin@edugrow.com / admin123')
        }
        
        // Demo Mentor Account
        const mentorEmail = 'mentor@edugrow.com'
        const existingMentor = await User.findOne({ where: { email: mentorEmail } })
        if (!existingMentor) {
            const hashedPassword = await bcrypt.hash('mentor123', salt)
            await User.create({
                email: mentorEmail,
                password: hashedPassword,
                role: 'mentor',
                fullName: 'Dr. Sarah Johnson',
                department: 'CSE',
                phoneNumber: '+1234567891',
                address: 'Faculty Block, Room 305',
                expertise: 'Data Structures, Algorithms, Web Development'
            })
            console.log('🔑 Demo Mentor: mentor@edugrow.com / mentor123')
        }
        
        // Demo Student Account
        const studentEmail = 'student@edugrow.com'
        const existingStudent = await User.findOne({ where: { email: studentEmail } })
        if (!existingStudent) {
            const hashedPassword = await bcrypt.hash('student123', salt)
            await User.create({
                email: studentEmail,
                password: hashedPassword,
                role: 'student',
                fullName: 'John Alex Smith',
                department: 'CSE',
                rollNumber: 'CSE21001',
                year: 3,
                phoneNumber: '+1234567892',
                address: 'Hostel Block A, Room 201',
                codingProfiles: {
                    github: 'johnsmith',
                    leetcode: 'john_codes',
                    hackerrank: 'johnsmith21'
                },
                academics: {
                    cgpa: 8.5,
                    sgpa: 8.7,
                    attendance: 92
                },
                growthScore: 75
            })
            console.log('🔑 Demo Student: student@edugrow.com / student123')
        }
        
        // Get the demo student to seed progress history
        const demoStudent = await User.findOne({ where: { email: studentEmail } })
        if (demoStudent) {
            const studentId = demoStudent.id // UUID string
            
            // Check if progress history already exists
            const existingHistory = await ProgressHistory.findOne({ where: { studentId } })
            if (!existingHistory) {
                // Create 30 days of progress history for realistic charts
                const today = new Date()
                const progressRecords = []
                
                // Start values (30 days ago)
                let leetcodeTotal = 45
                let githubRepos = 8
                let githubCommits = 120
                let growthScore = 50
                
                for (let i = 29; i >= 0; i--) {
                    const recordDate = new Date(today)
                    recordDate.setDate(today.getDate() - i)
                    
                    // Gradual growth over time (realistic progression)
                    leetcodeTotal += Math.floor(Math.random() * 3) // 0-2 problems per day
                    githubCommits += Math.floor(Math.random() * 5) // 0-4 commits per day
                    if (Math.random() > 0.9) githubRepos += 1 // ~10% chance of new repo
                    growthScore = Math.min(100, Math.round(50 + (30 - i) * 0.83)) // Gradual increase
                    
                    progressRecords.push({
                        studentId: studentId,
                        recordDate: recordDate,
                        leetcodeTotal: leetcodeTotal,
                        leetcodeEasy: Math.round(leetcodeTotal * 0.5),
                        leetcodeMedium: Math.round(leetcodeTotal * 0.35),
                        leetcodeHard: Math.round(leetcodeTotal * 0.15),
                        githubRepos: githubRepos,
                        githubCommits: githubCommits,
                        hackerrankBadges: 3 + Math.floor(i / 10),
                        growthScore: growthScore
                    })
                }
                
                await ProgressHistory.bulkCreate(progressRecords)
                console.log('📊 Demo student progress history seeded (30 days)')
            }
            
            // Seed CodingData for demo student (for Skills Radar)
            const existingCodingData = await CodingData.findOne({ where: { studentId } })
            if (!existingCodingData) {
                await CodingData.create({
                    studentId: studentId,
                    github: {
                        publicRepos: 12,
                        totalStars: 25,
                        recentCommits: 156,
                        followers: 18,
                        totalContributions: 340
                    },
                    leetcode: {
                        totalSolved: 87,
                        easySolved: 45,
                        mediumSolved: 32,
                        hardSolved: 10,
                        ranking: 125000
                    },
                    hackerrank: {
                        badges: 6,
                        totalScore: 450,
                        submissionsByTrack: {
                            algorithms: 35,
                            data_structures: 28,
                            sql: 15,
                            python: 22
                        }
                    },
                    growthScore: 75,
                    lastSyncedAt: new Date()
                })
                console.log('💻 Demo student coding data seeded')
            }
        }
        
        console.log('\n✅ Demo accounts ready!')
        console.log('─────────────────────────────────────────')
        console.log('👨‍💼 Admin:   admin@edugrow.com   / admin123')
        console.log('👨‍🏫 Mentor:  mentor@edugrow.com  / mentor123')
        console.log('👨‍🎓 Student: student@edugrow.com / student123')
        console.log('─────────────────────────────────────────\n')
        
    } catch (err) {
        console.warn('⚠️ Demo accounts seed skipped:', err.message)
    }
}

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/milestones', milestoneRoutes)
app.use('/api/coding-data', codingDataRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/academics', academicsRoutes)
app.use('/api/system', systemRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'EduGrow+ API is running (PostgreSQL)',
        timestamp: new Date()
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Something went wrong!' })
})

const PORT = process.env.PORT || 5000

// Start server - don't block on database connection
const startServer = async () => {
    try {
        await connectDB()
        console.log('✅ Database connected')
        await seedDemoAccounts()
    } catch (error) {
        console.warn('⚠️ Database connection failed, starting in limited mode')
        console.warn('   Some features requiring database will not work')
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`)
    })
}

startServer()
