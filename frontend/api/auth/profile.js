const jwt = require('jsonwebtoken')
const { initDB } = require('../_config/db.js')
const User = require('../_models/User.js')

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Get token from header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' })
        }
        
        const token = authHeader.substring(7) // Remove "Bearer " prefix
        const decoded = verifyToken(token)
        
        // Initialize database
        await initDB()
        
        const user = await User.findByPk(decoded.id, {
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
    } catch (error) {
        console.error('Profile Error:', error)
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
}