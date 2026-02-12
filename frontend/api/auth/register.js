const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../_config/db.js')
const { v4: uuidv4 } = require('uuid')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026', {
        expiresIn: '30d'
    })
}

module.exports = async function handler(req, res) {
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
        const { email, password, role, fullName, ...otherData } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM "Users" WHERE email = $1',
            [email]
        )

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already in use. Please use a different email.' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create user
        const userId = uuidv4()
        const result = await pool.query(
            'INSERT INTO "Users" (id, email, password, role, "fullName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
            [userId, email, hashedPassword, role || 'student', fullName || '']
        )

        if (result.rows.length > 0) {
            const user = result.rows[0]
            res.status(201).json({
                uid: user.id,
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName || user.full_name,
                token: generateToken(user.id)
            })
        } else {
            res.status(400).json({ error: 'Failed to create user' })
        }
    } catch (error) {
        console.error('Register Error:', error)
        res.status(500).json({ error: error.message })
    }
}