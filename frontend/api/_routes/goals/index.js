import express from 'express'
import jwt from 'jsonwebtoken'
import pool from '../_config/db.js'

const router = express.Router()

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' })
    }

    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// Get all goals (with optional filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { studentId, status, category } = req.query
        let whereClause = '1=1'
        let params = []
        let paramIndex = 1

        if (studentId) {
            whereClause += ` AND "studentId" = $${paramIndex}`
            params.push(studentId)
            paramIndex++
        }
        if (status) {
            whereClause += ` AND status = $${paramIndex}`
            params.push(status)
            paramIndex++
        }
        if (category) {
            whereClause += ` AND category = $${paramIndex}`
            params.push(category)
            paramIndex++
        }

        const result = await pool.query(
            `SELECT * FROM "Goals" WHERE ${whereClause} ORDER BY deadline ASC`,
            params
        )

        res.json(result.rows)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get goal by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "Goals" WHERE id = $1',
            [req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' })
        }

        res.json(result.rows[0])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get goals for a specific student
router.get('/student/:studentId', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "Goals" WHERE "studentId" = $1 ORDER BY deadline ASC',
            [req.params.studentId]
        )

        res.json(result.rows)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get active goals for a student
router.get('/student/:studentId/active', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM "Goals" 
             WHERE "studentId" = $1 AND status IN ('not-started', 'in-progress', 'on-track')
             ORDER BY deadline ASC`,
            [req.params.studentId]
        )

        res.json(result.rows)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create goal
router.post('/', verifyToken, async (req, res) => {
    try {
        const { studentId, title, description, category, deadline, status } = req.body

        const result = await pool.query(
            `INSERT INTO "Goals" ("studentId", title, description, category, deadline, status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING *`,
            [studentId, title, description, category, deadline, status || 'not-started']
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update goal
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, category, deadline, status, progress } = req.body

        const updateFields = []
        const updateValues = []
        let paramIndex = 1

        if (title !== undefined) {
            updateFields.push(`title = $${paramIndex++}`)
            updateValues.push(title)
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex++}`)
            updateValues.push(description)
        }
        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex++}`)
            updateValues.push(category)
        }
        if (deadline !== undefined) {
            updateFields.push(`deadline = $${paramIndex++}`)
            updateValues.push(deadline)
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramIndex++}`)
            updateValues.push(status)
        }
        if (progress !== undefined) {
            updateFields.push(`progress = $${paramIndex++}`)
            updateValues.push(progress)
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' })
        }

        updateFields.push(`"updatedAt" = NOW()`)
        updateValues.push(req.params.id)

        const result = await pool.query(
            `UPDATE "Goals" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            updateValues
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Goal not found' })
        }

        res.json(result.rows[0])
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

export default router