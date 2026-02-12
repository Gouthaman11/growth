const jwt = require('jsonwebtoken')
const pool = require('../../_config/db.js')

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method !== 'PATCH') {
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
        
        // Get user ID from URL parameter  
        const { id: userId } = req.query
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        const {
            github,
            leetcode, 
            hackerrank,
            linkedin,
            portfolio
        } = req.body

        // Get current user coding profiles
        const currentResult = await pool.query(
            'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
            [userId]
        )

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        const currentProfiles = typeof currentResult.rows[0].codingProfiles === 'string' 
            ? JSON.parse(currentResult.rows[0].codingProfiles || '{}') 
            : currentResult.rows[0].codingProfiles || {}

        // Update only provided fields, keep existing ones
        const updatedProfiles = {
            github: github !== undefined ? github : (currentProfiles.github || ''),
            leetcode: leetcode !== undefined ? leetcode : (currentProfiles.leetcode || ''),
            hackerrank: hackerrank !== undefined ? hackerrank : (currentProfiles.hackerrank || ''),
            linkedin: linkedin !== undefined ? linkedin : (currentProfiles.linkedin || ''),
            portfolio: portfolio !== undefined ? portfolio : (currentProfiles.portfolio || '')
        }

        // Update user coding profiles
        const updateResult = await pool.query(
            `UPDATE "Users" 
             SET "codingProfiles" = $1, "updatedAt" = NOW() 
             WHERE id = $2 
             RETURNING id, email, role, "fullName", "codingProfiles"`,
            [JSON.stringify(updatedProfiles), userId]
        )

        if (updateResult.rows.length > 0) {
            const user = updateResult.rows[0]
            const parsedUser = {
                ...user,
                codingProfiles: typeof user.codingProfiles === 'string' 
                    ? JSON.parse(user.codingProfiles || '{}') 
                    : user.codingProfiles
            }
            
            res.json({
                success: true,
                message: 'Coding profiles updated successfully',
                user: parsedUser
            })
        } else {
            res.status(404).json({ error: 'User not found' })
        }
        
    } catch (error) {
        console.error('Update Profile Links Error:', error)
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' })
        } else {
            res.status(500).json({ 
                error: error.message,
                details: 'Failed to update profile links'
            })
        }
    }
}