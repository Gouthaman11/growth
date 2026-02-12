const jwt = require('jsonwebtoken')
const pool = require('../_config/db.js')

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
        
        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        
        // Get student ID from URL parameter
        const { id: studentId } = req.query
        const { days = '30' } = req.query
        
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' })
        }

        // Calculate start date based on days parameter
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(days))

        // Get progress history from database
        const result = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 AND "recordDate" >= $2 
             ORDER BY "recordDate" ASC`,
            [studentId, startDate.toISOString()]
        )

        res.json(result.rows)
        
    } catch (error) {
        console.error('Progress History Error:', error)
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
}