import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { initDB } from '../_config/db.js'
import User from '../_models/User.js'

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026', {
        expiresIn: '30d'
    })
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Initialize database
        await initDB()
        
        const { email, password, role, ...otherData } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

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
            role: role || 'student',
            ...otherData
        })

        if (user) {
            res.status(201).json({
                uid: user.id,
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