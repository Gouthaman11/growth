const jwt = require('jsonwebtoken')
const pool = require('../_config/db.js')

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026')
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method !== 'PUT') {
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
        
        const {
            fullName,
            rollNumber,
            year,
            department,
            avatar,
            employeeId,
            designation,
            specialization,
            github,
            leetcode,
            hackerrank,
            linkedin,
            portfolio
        } = req.body

        // Get current user data
        const currentUser = await pool.query(
            'SELECT "codingProfiles" FROM "Users" WHERE id = $1',
            [decoded.id]
        )

        if (currentUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Merge existing coding profiles with new ones
        const existingProfiles = typeof currentUser.rows[0].codingProfiles === 'string' 
            ? JSON.parse(currentUser.rows[0].codingProfiles || '{}') 
            : currentUser.rows[0].codingProfiles || {}

        const updatedCodingProfiles = {
            github: github !== undefined ? github : existingProfiles.github || '',
            leetcode: leetcode !== undefined ? leetcode : existingProfiles.leetcode || '',
            hackerrank: hackerrank !== undefined ? hackerrank : existingProfiles.hackerrank || '',
            linkedin: linkedin !== undefined ? linkedin : existingProfiles.linkedin || '',
            portfolio: portfolio !== undefined ? portfolio : existingProfiles.portfolio || ''
        }

        // Build update query dynamically
        const updateFields = []
        const updateValues = []
        let paramCount = 1

        if (fullName !== undefined) {
            updateFields.push(`"fullName" = $${paramCount++}`)
            updateValues.push(fullName)
        }
        if (rollNumber !== undefined) {
            updateFields.push(`"rollNumber" = $${paramCount++}`)
            updateValues.push(rollNumber)
        }
        if (year !== undefined) {
            updateFields.push(`year = $${paramCount++}`)
            updateValues.push(year)
        }
        if (department !== undefined) {
            updateFields.push(`department = $${paramCount++}`)
            updateValues.push(department)
        }
        if (avatar !== undefined) {
            updateFields.push(`avatar = $${paramCount++}`)
            updateValues.push(avatar)
        }
        if (employeeId !== undefined) {
            updateFields.push(`"employeeId" = $${paramCount++}`)
            updateValues.push(employeeId)
        }
        if (designation !== undefined) {
            updateFields.push(`designation = $${paramCount++}`)
            updateValues.push(designation)
        }
        if (specialization !== undefined) {
            updateFields.push(`specialization = $${paramCount++}`)
            updateValues.push(specialization)
        }

        // Always update coding profiles if any profile field is provided
        if (github !== undefined || leetcode !== undefined || hackerrank !== undefined || 
            linkedin !== undefined || portfolio !== undefined) {
            updateFields.push(`"codingProfiles" = $${paramCount++}`)
            updateValues.push(JSON.stringify(updatedCodingProfiles))
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' })
        }

        // Add updatedAt
        updateFields.push(`"updatedAt" = NOW()`)
        
        // Add user ID for WHERE clause
        updateValues.push(decoded.id)

        const updateQuery = `
            UPDATE "Users" 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING id, email, role, "fullName", "rollNumber", year, department, 
                      avatar, "employeeId", designation, specialization, "codingProfiles", 
                      academics, "bipCredentials", "growthScore", "assignedStudents", "isActive"
        `

        const result = await pool.query(updateQuery, updateValues)

        if (result.rows.length > 0) {
            const user = result.rows[0]
            const responseUser = {
                ...user,
                uid: user.id,
                codingProfiles: typeof user.codingProfiles === 'string' ? JSON.parse(user.codingProfiles || '{}') : user.codingProfiles,
                academics: typeof user.academics === 'string' ? JSON.parse(user.academics || '{}') : user.academics,
                bipCredentials: typeof user.bipCredentials === 'string' ? JSON.parse(user.bipCredentials || '{}') : user.bipCredentials,
                assignedStudents: typeof user.assignedStudents === 'string' ? JSON.parse(user.assignedStudents || '[]') : user.assignedStudents
            }
            
            res.json({
                message: 'Profile updated successfully',
                user: responseUser
            })
        } else {
            res.status(404).json({ error: 'User not found' })
        }
        
    } catch (error) {
        console.error('Update Profile Error:', error)
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid token' })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
}