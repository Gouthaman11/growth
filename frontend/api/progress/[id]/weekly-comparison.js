const jwt = require('jsonwebtoken')
const pool = require('../../_config/db.js')

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
        
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' })
        }

        // Calculate dates
        const today = new Date()
        const lastWeek = new Date()
        lastWeek.setDate(today.getDate() - 7)

        // Get latest record
        const currentResult = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 
             ORDER BY "recordDate" DESC 
             LIMIT 1`,
            [studentId]
        )

        // Get record from a week ago
        const previousResult = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 AND "recordDate" <= $2 
             ORDER BY "recordDate" DESC 
             LIMIT 1`,
            [studentId, lastWeek.toISOString()]
        )

        const current = currentResult.rows[0] || {}
        const previous = previousResult.rows[0] || {}

        const comparison = {
            current,
            previous,
            changes: {}
        }

        if (current && previous) {
            comparison.changes = {
                leetcodeTotal: (current.leetcodeTotal || 0) - (previous.leetcodeTotal || 0),
                githubCommits: (current.githubCommits || 0) - (previous.githubCommits || 0),
                githubRepos: (current.githubRepos || 0) - (previous.githubRepos || 0),
                growthScore: (current.growthScore || 0) - (previous.growthScore || 0)
            }
        }

        res.json(comparison)
        
    } catch (error) {
        console.error('Weekly Comparison Error:', error)
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
}