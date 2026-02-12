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

// Get BIP portal status
router.get('/:userId/bip-status', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT academics FROM "Users" WHERE id = $1',
            [req.params.userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        const user = result.rows[0]
        const academics = typeof user.academics === 'string' ? 
            JSON.parse(user.academics || '{}') : user.academics || {}
        
        res.json({
            success: true,
            portalUrl: 'https://bip.bitsathy.ac.in',
            usesGoogleSSO: true,
            lastSynced: academics.lastSynced || null,
            hasData: !!(academics.cgpa || academics.sgpa || academics.attendance),
            message: 'BIP uses Google SSO. Please login to portal and enter your data manually.'
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Get academic data
router.get('/:userId/data', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT academics FROM "Users" WHERE id = $1',
            [req.params.userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        const user = result.rows[0]
        const academics = typeof user.academics === 'string' ? 
            JSON.parse(user.academics || '{}') : user.academics || {}

        const defaultAcademics = {
            cgpa: 0,
            sgpa: 0,
            attendance: 0,
            totalCredits: 0,
            earnedCredits: 0,
            currentSemester: 1,
            semesters: [],
            lastSynced: null
        }

        res.json({
            success: true,
            data: { ...defaultAcademics, ...academics },
            lastSynced: academics?.lastSynced || null
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

// Update academic data
router.put('/:userId/data', verifyToken, async (req, res) => {
    try {
        const { cgpa, sgpa, attendance, currentSemester, semesters, totalCredits, earnedCredits } = req.body
        
        const currentResult = await pool.query(
            'SELECT academics FROM "Users" WHERE id = $1',
            [req.params.userId]
        )

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        const currentAcademics = typeof currentResult.rows[0].academics === 'string' ? 
            JSON.parse(currentResult.rows[0].academics || '{}') : 
            currentResult.rows[0].academics || {}

        const updatedAcademics = {
            ...currentAcademics,
            cgpa: cgpa !== undefined ? parseFloat(cgpa) : currentAcademics.cgpa || 0,
            sgpa: sgpa !== undefined ? parseFloat(sgpa) : currentAcademics.sgpa || 0,
            attendance: attendance !== undefined ? parseFloat(attendance) : currentAcademics.attendance || 0,
            currentSemester: currentSemester || currentAcademics.currentSemester || 1,
            totalCredits: totalCredits || currentAcademics.totalCredits || 0,
            earnedCredits: earnedCredits || currentAcademics.earnedCredits || 0,
            semesters: semesters || currentAcademics.semesters || [],
            lastSynced: new Date().toISOString()
        }

        await pool.query(
            'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
            [JSON.stringify(updatedAcademics), req.params.userId]
        )

        res.json({
            success: true,
            message: 'Academic data updated successfully',
            data: updatedAcademics
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router