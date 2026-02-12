import express from 'express'
import pool from '../_config/db.js'

const router = express.Router()

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' })
    }
    
    try {
        const jwt = require('jsonwebtoken')
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// Get all users (with optional role filter)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { role, department } = req.query
        let whereClause = '1=1'
        let params = []
        let paramIndex = 1

        if (role) {
            whereClause += ` AND LOWER(role) = LOWER($${paramIndex})`
            params.push(role)
            paramIndex++
        }
        if (department) {
            whereClause += ` AND department = $${paramIndex}`
            params.push(department)
            paramIndex++
        }

        const result = await pool.query(
            `SELECT id, email, role, "fullName", "rollNumber", year, department, 
                    avatar, "employeeId", designation, specialization, "codingProfiles", 
                    "isActive", "createdAt", "updatedAt" 
             FROM "Users" WHERE ${whereClause}`,
            params
        )

        const users = result.rows.map(user => ({
            ...user,
            codingProfiles: typeof user.codingProfiles === 'string' ? 
                JSON.parse(user.codingProfiles || '{}') : user.codingProfiles
        }))
        
        res.json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get user by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, role, "fullName", "rollNumber", year, department, 
                    avatar, "employeeId", designation, specialization, "codingProfiles", 
                    academics, "bipCredentials", "growthScore", "assignedStudents", "isActive" 
             FROM "Users" WHERE id = $1`,
            [req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        const user = result.rows[0]
        const parsedUser = {
            ...user,
            codingProfiles: typeof user.codingProfiles === 'string' ? 
                JSON.parse(user.codingProfiles || '{}') : user.codingProfiles,
            academics: typeof user.academics === 'string' ? 
                JSON.parse(user.academics || '{}') : user.academics,
            bipCredentials: typeof user.bipCredentials === 'string' ? 
                JSON.parse(user.bipCredentials || '{}') : user.bipCredentials,
            assignedStudents: typeof user.assignedStudents === 'string' ? 
                JSON.parse(user.assignedStudents || '[]') : user.assignedStudents
        }
        
        res.json(parsedUser)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update user coding profiles
router.patch('/:id/coding-profiles', verifyToken, async (req, res) => {
    try {
        const currentResult = await pool.query(
            'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
            [req.params.id]
        )

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        const currentProfiles = typeof currentResult.rows[0].codingProfiles === 'string' ? 
            JSON.parse(currentResult.rows[0].codingProfiles || '{}') : 
            currentResult.rows[0].codingProfiles || {}

        // Merge existing profiles with new ones
        const updatedProfiles = { ...currentProfiles, ...req.body }

        const updateResult = await pool.query(
            `UPDATE "Users" 
             SET "codingProfiles" = $1, "updatedAt" = NOW() 
             WHERE id = $2 
             RETURNING id, email, role, "fullName", "codingProfiles"`,
            [JSON.stringify(updatedProfiles), req.params.id]
        )

        if (updateResult.rows.length > 0) {
            const user = updateResult.rows[0]
            const parsedUser = {
                ...user,
                codingProfiles: typeof user.codingProfiles === 'string' ? 
                    JSON.parse(user.codingProfiles || '{}') : user.codingProfiles
            }
            res.json(parsedUser)
        } else {
            res.status(404).json({ error: 'User not found' })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router