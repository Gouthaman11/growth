import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { Sequelize } from 'sequelize'
import jwt from 'jsonwebtoken'

// ============ DATABASE CONFIG ============
const sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            connectTimeout: 60000
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    }
)

// ============ MODELS ============
import { DataTypes } from 'sequelize'

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'mentor', 'student'),
        defaultValue: 'student'
    },
    fullName: DataTypes.STRING,
    department: DataTypes.STRING,
    rollNumber: DataTypes.STRING,
    year: DataTypes.INTEGER,
    phoneNumber: DataTypes.STRING,
    address: DataTypes.TEXT,
    expertise: DataTypes.TEXT,
    codingProfiles: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    academics: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    growthScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    mentorId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true
})

const Goal = sequelize.define('Goal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    targetDate: DataTypes.DATE,
    status: {
        type: DataTypes.ENUM('not-started', 'in-progress', 'completed'),
        defaultValue: 'not-started'
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'general'
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'goals',
    timestamps: true
})

const Milestone = sequelize.define('Milestone', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    goalId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completedAt: DataTypes.DATE
}, {
    tableName: 'milestones',
    timestamps: true
})

const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    mentorId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('general', 'academic', 'coding', 'goal'),
        defaultValue: 'general'
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'feedback',
    timestamps: true
})

const ProgressHistory = sequelize.define('ProgressHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    recordDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    leetcodeTotal: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeEasy: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeMedium: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeHard: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubRepos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubCommits: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hackerrankBadges: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    growthScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'progress_history',
    timestamps: true
})

const CodingData = sequelize.define('CodingData', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    github: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    leetcode: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    hackerrank: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    growthScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastSyncedAt: DataTypes.DATE
}, {
    tableName: 'coding_data',
    timestamps: true
})

// Define associations
User.hasMany(Goal, { foreignKey: 'studentId' })
Goal.belongsTo(User, { foreignKey: 'studentId' })
Goal.hasMany(Milestone, { foreignKey: 'goalId' })
Milestone.belongsTo(Goal, { foreignKey: 'goalId' })
User.hasMany(Feedback, { as: 'receivedFeedback', foreignKey: 'studentId' })
User.hasMany(Feedback, { as: 'givenFeedback', foreignKey: 'mentorId' })
Feedback.belongsTo(User, { as: 'student', foreignKey: 'studentId' })
Feedback.belongsTo(User, { as: 'mentor', foreignKey: 'mentorId' })
User.hasMany(ProgressHistory, { foreignKey: 'studentId' })
ProgressHistory.belongsTo(User, { foreignKey: 'studentId' })
User.hasOne(CodingData, { foreignKey: 'studentId' })
CodingData.belongsTo(User, { foreignKey: 'studentId' })

// ============ AUTH MIDDLEWARE ============
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
        req.user = await User.findByPk(decoded.id)
        if (!req.user) {
            return res.status(401).json({ error: 'Invalid token.' })
        }
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' })
    }
}

// ============ EXPRESS APP ============
const app = express()

app.use(cors({
    origin: true,
    credentials: true
}))
app.use(express.json())

// Database connection (lazy, cached)
let dbInitialized = false
const initDB = async () => {
    if (!dbInitialized) {
        try {
            await sequelize.authenticate()
            await sequelize.sync({ alter: true })
            dbInitialized = true
            console.log('Database connected')
        } catch (error) {
            console.error('Database connection error:', error.message)
        }
    }
}

// Initialize DB on first request
app.use(async (req, res, next) => {
    await initDB()
    next()
})

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role, fullName, department, rollNumber, year, phoneNumber, address, expertise, codingProfiles, academics } = req.body
        
        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' })
        }
        
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        
        const user = await User.create({
            email,
            password: hashedPassword,
            role,
            fullName,
            department,
            rollNumber,
            year,
            phoneNumber,
            address,
            expertise,
            codingProfiles: codingProfiles || {},
            academics: academics || {}
        })
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' })
        
        res.status(201).json({
            message: 'Registration successful',
            user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
            token
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        
        const user = await User.findOne({ where: { email } })
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }
        
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' })
        }
        
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' })
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                rollNumber: user.rollNumber,
                year: user.year,
                codingProfiles: user.codingProfiles,
                academics: user.academics,
                growthScore: user.growthScore,
                mentorId: user.mentorId
            },
            token
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        res.json({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            fullName: req.user.fullName,
            department: req.user.department,
            rollNumber: req.user.rollNumber,
            year: req.user.year,
            phoneNumber: req.user.phoneNumber,
            address: req.user.address,
            expertise: req.user.expertise,
            codingProfiles: req.user.codingProfiles,
            academics: req.user.academics,
            growthScore: req.user.growthScore,
            mentorId: req.user.mentorId
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ USER ROUTES ============
app.get('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        await user.update(req.body)
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const { role, department } = req.query
        const where = {}
        if (role) where.role = role
        if (department) where.department = department
        
        const users = await User.findAll({ where })
        res.json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        await user.destroy()
        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ GOAL ROUTES ============
app.get('/api/goals', authMiddleware, async (req, res) => {
    try {
        const { studentId } = req.query
        const where = studentId ? { studentId } : { studentId: req.user.id }
        const goals = await Goal.findAll({
            where,
            include: [{ model: Milestone }],
            order: [['createdAt', 'DESC']]
        })
        res.json(goals)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/goals', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.create({
            ...req.body,
            studentId: req.body.studentId || req.user.id
        })
        res.status(201).json(goal)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findByPk(req.params.id)
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        await goal.update(req.body)
        res.json(goal)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findByPk(req.params.id)
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        await goal.destroy()
        res.json({ message: 'Goal deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ MILESTONE ROUTES ============
app.get('/api/milestones', authMiddleware, async (req, res) => {
    try {
        const { goalId } = req.query
        const milestones = await Milestone.findAll({
            where: goalId ? { goalId } : {},
            include: [{ model: Goal }]
        })
        res.json(milestones)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/milestones', authMiddleware, async (req, res) => {
    try {
        const milestone = await Milestone.create(req.body)
        res.status(201).json(milestone)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/milestones/:id', authMiddleware, async (req, res) => {
    try {
        const milestone = await Milestone.findByPk(req.params.id)
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        await milestone.update(req.body)
        res.json(milestone)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/milestones/:id', authMiddleware, async (req, res) => {
    try {
        const milestone = await Milestone.findByPk(req.params.id)
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        await milestone.destroy()
        res.json({ message: 'Milestone deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ FEEDBACK ROUTES ============
app.get('/api/feedback', authMiddleware, async (req, res) => {
    try {
        const { studentId, mentorId } = req.query
        const where = {}
        if (studentId) where.studentId = studentId
        if (mentorId) where.mentorId = mentorId
        
        const feedback = await Feedback.findAll({
            where,
            include: [
                { model: User, as: 'student', attributes: ['id', 'fullName', 'email'] },
                { model: User, as: 'mentor', attributes: ['id', 'fullName', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/feedback', authMiddleware, async (req, res) => {
    try {
        const feedback = await Feedback.create({
            ...req.body,
            mentorId: req.body.mentorId || req.user.id
        })
        res.status(201).json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/feedback/:id', authMiddleware, async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id)
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' })
        }
        await feedback.update(req.body)
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ PROGRESS ROUTES ============
app.get('/api/progress', authMiddleware, async (req, res) => {
    try {
        const { studentId, days } = req.query
        const targetStudentId = studentId || req.user.id
        const numDays = parseInt(days) || 30
        
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - numDays)
        
        const history = await ProgressHistory.findAll({
            where: {
                studentId: targetStudentId,
                recordDate: {
                    [Sequelize.Op.gte]: startDate
                }
            },
            order: [['recordDate', 'ASC']]
        })
        res.json(history)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/progress', authMiddleware, async (req, res) => {
    try {
        const record = await ProgressHistory.create({
            ...req.body,
            studentId: req.body.studentId || req.user.id
        })
        res.status(201).json(record)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ CODING DATA ROUTES ============
app.get('/api/coding-data', authMiddleware, async (req, res) => {
    try {
        const { studentId } = req.query
        const targetStudentId = studentId || req.user.id
        
        const codingData = await CodingData.findOne({
            where: { studentId: targetStudentId }
        })
        
        if (!codingData) {
            return res.json({
                github: {},
                leetcode: {},
                hackerrank: {},
                growthScore: 0
            })
        }
        res.json(codingData)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/coding-data', authMiddleware, async (req, res) => {
    try {
        const studentId = req.body.studentId || req.user.id
        
        let codingData = await CodingData.findOne({ where: { studentId } })
        
        if (codingData) {
            await codingData.update(req.body)
        } else {
            codingData = await CodingData.create({
                ...req.body,
                studentId
            })
        }
        res.json(codingData)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.post('/api/coding-data/sync', authMiddleware, async (req, res) => {
    try {
        const studentId = req.user.id
        let codingData = await CodingData.findOne({ where: { studentId } })
        
        if (codingData) {
            await codingData.update({ lastSyncedAt: new Date() })
        }
        
        res.json({ message: 'Sync initiated', lastSyncedAt: new Date() })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ ACADEMICS ROUTES ============
app.get('/api/academics', authMiddleware, async (req, res) => {
    try {
        const { studentId } = req.query
        const targetStudentId = studentId || req.user.id
        
        const user = await User.findByPk(targetStudentId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        
        res.json({
            cgpa: user.academics?.cgpa || 0,
            sgpa: user.academics?.sgpa || 0,
            attendance: user.academics?.attendance || 0,
            subjects: user.academics?.subjects || []
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/academics', authMiddleware, async (req, res) => {
    try {
        const { studentId } = req.query
        const targetStudentId = studentId || req.user.id
        
        const user = await User.findByPk(targetStudentId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        
        await user.update({
            academics: {
                ...user.academics,
                ...req.body
            }
        })
        
        res.json(user.academics)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// ============ SYSTEM ROUTES ============
app.get('/api/system/stats', authMiddleware, async (req, res) => {
    try {
        const totalStudents = await User.count({ where: { role: 'student' } })
        const totalMentors = await User.count({ where: { role: 'mentor' } })
        const totalGoals = await Goal.count()
        const completedGoals = await Goal.count({ where: { status: 'completed' } })
        
        res.json({
            totalStudents,
            totalMentors,
            totalGoals,
            completedGoals,
            activeUsers: totalStudents + totalMentors
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'EduGrow+ API is running on Vercel',
        timestamp: new Date()
    })
})

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' })
})

// Export for Vercel
export default app
