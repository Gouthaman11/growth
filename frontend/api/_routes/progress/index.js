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

// Get progress history for a student
router.get('/:studentId', verifyToken, async (req, res) => {
    try {
        const { days = 30 } = req.query
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(days))

        const result = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 AND "recordDate" >= $2 
             ORDER BY "recordDate" ASC`,
            [req.params.studentId, startDate.toISOString()]
        )

        res.json(result.rows)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get weekly comparison
router.get('/:studentId/weekly-comparison', verifyToken, async (req, res) => {
    try {
        const today = new Date()
        const lastWeek = new Date()
        lastWeek.setDate(today.getDate() - 7)

        // Get latest record
        const currentResult = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 
             ORDER BY "recordDate" DESC 
             LIMIT 1`,
            [req.params.studentId]
        )

        // Get record from a week ago
        const previousResult = await pool.query(
            `SELECT * FROM "ProgressHistory" 
             WHERE "studentId" = $1 AND "recordDate" <= $2 
             ORDER BY "recordDate" DESC 
             LIMIT 1`,
            [req.params.studentId, lastWeek.toISOString()]
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
        res.status(500).json({ error: error.message })
    }
})

export default router