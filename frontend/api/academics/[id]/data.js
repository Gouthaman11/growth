const jwt = require('jsonwebtoken')
const pool = require('../../_config/db.js')

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method === 'GET') {
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

            // Get user academic data
            const result = await pool.query(
                'SELECT academics FROM "Users" WHERE id = $1',
                [userId]
            )

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' })
            }

            const user = result.rows[0]
            const academics = typeof user.academics === 'string' 
                ? JSON.parse(user.academics || '{}') 
                : user.academics || {}

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
            console.error('Get Academic Data Error:', error)
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({ success: false, error: 'Invalid token' })
            } else {
                res.status(500).json({ success: false, error: error.message })
            }
        }
    }
    else if (req.method === 'PUT') {
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
            const { cgpa, sgpa, attendance, currentSemester, semesters, totalCredits, earnedCredits } = req.body
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' })
            }

            // Get current user data
            const currentResult = await pool.query(
                'SELECT academics FROM "Users" WHERE id = $1',
                [userId]
            )

            if (currentResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' })
            }

            const currentAcademics = typeof currentResult.rows[0].academics === 'string' 
                ? JSON.parse(currentResult.rows[0].academics || '{}') 
                : currentResult.rows[0].academics || {}

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

            // Update user academics
            await pool.query(
                'UPDATE "Users" SET academics = $1, "updatedAt" = NOW() WHERE id = $2',
                [JSON.stringify(updatedAcademics), userId]
            )

            res.json({
                success: true,
                message: 'Academic data updated successfully',
                data: updatedAcademics
            })
            
        } catch (error) {
            console.error('Update Academic Data Error:', error)
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({ success: false, error: 'Invalid token' })
            } else {
                res.status(500).json({ success: false, error: error.message })
            }
        }
    }
    else {
        res.status(405).json({ error: 'Method not allowed' })
    }
}