const jwt = require('jsonwebtoken')
const pool = require('../_config/db.js')

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    
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
            
            // Get student ID from URL parameter
            const { id: studentId } = req.query
            
            if (!studentId) {
                return res.status(400).json({ error: 'Student ID is required' })
            }

            // Get coding data for the student
            const result = await pool.query(
                'SELECT * FROM "CodingData" WHERE "studentId" = $1',
                [studentId]
            )

            if (result.rows.length === 0) {
                // Return empty structure instead of 404
                res.json({
                    studentId: studentId,
                    github: {},
                    leetcode: {},
                    hackerrank: {}
                })
            } else {
                const codingData = result.rows[0]
                // Parse JSON fields
                const parsedData = {
                    ...codingData,
                    github: typeof codingData.github === 'string' ? JSON.parse(codingData.github || '{}') : codingData.github || {},
                    leetcode: typeof codingData.leetcode === 'string' ? JSON.parse(codingData.leetcode || '{}') : codingData.leetcode || {},
                    hackerrank: typeof codingData.hackerrank === 'string' ? JSON.parse(codingData.hackerrank || '{}') : codingData.hackerrank || {}
                }
                res.json(parsedData)
            }
            
        } catch (error) {
            console.error('Get Coding Data Error:', error)
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({ error: 'Invalid token' })
            } else {
                res.status(500).json({ error: error.message })
            }
        }
    }
    else if (req.method === 'POST') {
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

            const { github, leetcode, hackerrank, ...otherData } = req.body

            // Check if coding data exists
            const existingResult = await pool.query(
                'SELECT id FROM "CodingData" WHERE "studentId" = $1',
                [studentId]
            )

            if (existingResult.rows.length > 0) {
                // Update existing record
                const updateQuery = `
                    UPDATE "CodingData" 
                    SET github = $1, leetcode = $2, hackerrank = $3, "updatedAt" = NOW()
                    WHERE "studentId" = $4 
                    RETURNING *
                `
                const result = await pool.query(updateQuery, [
                    JSON.stringify(github || {}),
                    JSON.stringify(leetcode || {}),
                    JSON.stringify(hackerrank || {}),
                    studentId
                ])
                
                const codingData = result.rows[0]
                const parsedData = {
                    ...codingData,
                    github: typeof codingData.github === 'string' ? JSON.parse(codingData.github || '{}') : codingData.github,
                    leetcode: typeof codingData.leetcode === 'string' ? JSON.parse(codingData.leetcode || '{}') : codingData.leetcode,
                    hackerrank: typeof codingData.hackerrank === 'string' ? JSON.parse(codingData.hackerrank || '{}') : codingData.hackerrank
                }
                res.json(parsedData)
            } else {
                // Create new record
                const insertQuery = `
                    INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    RETURNING *
                `
                const result = await pool.query(insertQuery, [
                    studentId,
                    JSON.stringify(github || {}),
                    JSON.stringify(leetcode || {}),
                    JSON.stringify(hackerrank || {})
                ])
                
                const codingData = result.rows[0]
                const parsedData = {
                    ...codingData,
                    github: typeof codingData.github === 'string' ? JSON.parse(codingData.github || '{}') : codingData.github,
                    leetcode: typeof codingData.leetcode === 'string' ? JSON.parse(codingData.leetcode || '{}') : codingData.leetcode,
                    hackerrank: typeof codingData.hackerrank === 'string' ? JSON.parse(codingData.hackerrank || '{}') : codingData.hackerrank
                }
                res.status(201).json(parsedData)
            }
            
        } catch (error) {
            console.error('Create/Update Coding Data Error:', error)
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({ error: 'Invalid token' })
            } else {
                res.status(500).json({ error: error.message })
            }
        }
    }
    else {
        res.status(405).json({ error: 'Method not allowed' })
    }
}