import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import ProgressHistory from '../models/ProgressHistory.js'
import CodingData from '../models/CodingData.js'
import { sequelize } from '../config/db.js'

const router = express.Router()

// @route   POST /api/system/reset-demo-data
// @desc    Reset and seed demo accounts
// @access  Public (for development)
router.post('/reset-demo-data', async (req, res) => {
    try {
        console.log('🔄 Starting database reset...')
        // NOTE: sequelize.sync({ alter: true }) removed — tables already exist in production.
        // Running sync during a request blocks the response and risks schema corruption.

        const salt = await bcrypt.genSalt(10)

        // Demo Admin Account
        const adminEmail = 'admin@edugrow.com'
        await User.destroy({ where: { email: adminEmail } })
        const hashedAdminPassword = await bcrypt.hash('admin123', salt)
        await User.create({
            email: adminEmail,
            password: hashedAdminPassword,
            role: 'admin',
            fullName: 'Admin User',
            department: 'Administration',
            phoneNumber: '+1234567890',
            address: 'Admin Office, Campus'
        })
        console.log('✅ Admin account created')

        // Demo Mentor Account
        const mentorEmail = 'mentor@edugrow.com'
        await User.destroy({ where: { email: mentorEmail } })
        const hashedMentorPassword = await bcrypt.hash('mentor123', salt)
        await User.create({
            email: mentorEmail,
            password: hashedMentorPassword,
            role: 'mentor',
            fullName: 'Dr. Sarah Johnson',
            department: 'CSE',
            phoneNumber: '+1234567891',
            address: 'Faculty Block, Room 305',
            expertise: 'Data Structures, Algorithms, Web Development'
        })
        console.log('✅ Mentor account created')

        // Demo Student Account
        const studentEmail = 'student@edugrow.com'
        await User.destroy({ where: { email: studentEmail } })
        const hashedStudentPassword = await bcrypt.hash('student123', salt)
        await User.create({
            email: studentEmail,
            password: hashedStudentPassword,
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
        console.log('✅ Student account created')

        // Get the newly created student
        const demoStudent = await User.findOne({ where: { email: studentEmail } })

        // Clear existing progress history and coding data for this student
        await ProgressHistory.destroy({ where: { studentId: demoStudent.id } })
        await CodingData.destroy({ where: { studentId: demoStudent.id } })

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
            leetcodeTotal += Math.floor(Math.random() * 3)
            githubCommits += Math.floor(Math.random() * 5)
            if (Math.random() > 0.9) githubRepos += 1
            growthScore = Math.min(100, Math.round(50 + (30 - i) * 0.83))

            progressRecords.push({
                studentId: demoStudent.id,
                recordDate: recordDate,
                leetcodeTotal: leetcodeTotal,
                leetcodeEasy: Math.round(leetcodeTotal * 0.5),
                leetcodeMedium: Math.round(leetcodeTotal * 0.35),
                leetcodeHard: Math.round(leetcodeTotal * 0.15),
                githubRepos: githubRepos,
                githubCommits: githubCommits,
                hackerrankBadges: 3 + Math.floor((30 - i) / 10),
                growthScore: growthScore
            })
        }

        await ProgressHistory.bulkCreate(progressRecords)
        console.log('📊 Progress history seeded (30 days)')

        // Seed CodingData for demo student
        await CodingData.create({
            studentId: demoStudent.id,
            github: {
                publicRepos: githubRepos,
                totalStars: 25,
                recentCommits: githubCommits,
                followers: 18,
                totalContributions: 340
            },
            leetcode: {
                totalSolved: leetcodeTotal,
                easySolved: Math.round(leetcodeTotal * 0.5),
                mediumSolved: Math.round(leetcodeTotal * 0.35),
                hardSolved: Math.round(leetcodeTotal * 0.15),
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
            growthScore: growthScore,
            lastSyncedAt: new Date()
        })
        console.log('💻 Coding data seeded')

        res.json({
            success: true,
            message: 'Demo data reset successfully',
            accounts: {
                admin: { email: 'admin@edugrow.com', password: 'admin123' },
                mentor: { email: 'mentor@edugrow.com', password: 'mentor123' },
                student: { email: 'student@edugrow.com', password: 'student123' }
            }
        })

        console.log('\n✅ Demo accounts ready!')
        console.log('─────────────────────────────────────────')
        console.log('👨‍💼 Admin:   admin@edugrow.com   / admin123')
        console.log('👨‍🏫 Mentor:  mentor@edugrow.com  / mentor123')
        console.log('👨‍🎓 Student: student@edugrow.com / student123')
        console.log('─────────────────────────────────────────\n')

    } catch (error) {
        console.error('❌ Reset failed:', error)
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to reset demo data'
        })
    }
})

// @route   GET /api/system/db-status
// @desc    Check database connection and table status
// @access  Public
router.get('/db-status', async (req, res) => {
    try {
        await sequelize.authenticate()

        const userCount = await User.count()
        const adminCount = await User.count({ where: { role: 'admin' } })
        const mentorCount = await User.count({ where: { role: 'mentor' } })
        const studentCount = await User.count({ where: { role: 'student' } })

        res.json({
            success: true,
            database: 'Connected',
            connection: {
                host: sequelize.config.host,
                database: sequelize.config.database,
                dialect: sequelize.config.dialect
            },
            users: {
                total: userCount,
                admins: adminCount,
                mentors: mentorCount,
                students: studentCount
            },
            demoAccountsReady: {
                admin: await User.findOne({ where: { email: 'admin@edugrow.com' } }) !== null,
                mentor: await User.findOne({ where: { email: 'mentor@edugrow.com' } }) !== null,
                student: await User.findOne({ where: { email: 'student@edugrow.com' } }) !== null
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            database: 'Disconnected',
            error: error.message
        })
    }
})

export default router
