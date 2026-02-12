import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { email, password, role, ...otherData } = req.body

        // Check if user exists
        const userExists = await User.findOne({ where: { email } })

        if (userExists) {
            return res.status(400).json({ error: 'Email is already in use. Please use a different email.' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            role,
            ...otherData
        })

        if (user) {
            res.status(201).json({
                uid: user.id, // Keeping 'uid' for frontend compatibility
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                token: generateToken(user.id)
            })
        } else {
            res.status(400).json({ error: 'Invalid user data' })
        }
    } catch (error) {
        console.error('Register Error:', error)
        res.status(500).json({ error: error.message })
    }
}

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        // Check for user email
        const user = await User.findOne({ where: { email } })

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                uid: user.id, // Keeping 'uid' for frontend compatibility
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                token: generateToken(user.id)
            })
        } else {
            res.status(401).json({ error: 'Invalid email or password' })
        }
    } catch (error) {
        console.error('Login Error:', error)
        res.status(500).json({ error: error.message })
    }
}

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
    })

    if (user) {
        res.json({
            ...user.toJSON(),
            uid: user.id // Compatibility
        })
    } else {
        res.status(404).json({ error: 'User not found' })
    }
}

export { registerUser, loginUser, getUserProfile }
