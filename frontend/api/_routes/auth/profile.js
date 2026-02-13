import jwt from 'jsonwebtoken'
import pool from '../../_config/db.js'

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

export default async function handler(req, res) {
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

        // Get user from database
        const result = await pool.query(
            `SELECT 
                id, email, role, "fullName", "rollNumber", year, department, 
                avatar, "employeeId", designation, specialization, "codingProfiles", 
                academics, "bipCredentials", "growthScore", "assignedStudents", "isActive" 
            FROM "Users" WHERE id = $1`,
            [decoded.id]
        )

        if (result.rows.length > 0) {
            const user = result.rows[0]
            // Parse JSON fields
            const parsedUser = {
                ...user,
                uid: user.id, // Compatibility
                codingProfiles: typeof user.codingProfiles === 'string' ? JSON.parse(user.codingProfiles || '{}') : user.codingProfiles,
                academics: typeof user.academics === 'string' ? JSON.parse(user.academics || '{}') : user.academics,
                bipCredentials: typeof user.bipCredentials === 'string' ? JSON.parse(user.bipCredentials || '{}') : user.bipCredentials,
                assignedStudents: typeof user.assignedStudents === 'string' ? JSON.parse(user.assignedStudents || '[]') : user.assignedStudents
            }

            res.json(parsedUser)
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