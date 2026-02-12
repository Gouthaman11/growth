const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../_config/db.js')
const { v4: uuidv4 } = require('uuid')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'edugrow_plus_secret_key_2026', {
        expiresIn: '30d'
    })
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { 
            email, 
            password, 
            role, 
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
            portfolio,
            ...otherData 
        } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM "Users" WHERE email = $1',
            [email]
        )

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already in use. Please use a different email.' })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Prepare coding profiles JSON
        const codingProfiles = {
            github: github || '',
            leetcode: leetcode || '',
            hackerrank: hackerrank || '',
            linkedin: linkedin || '',
            portfolio: portfolio || ''
        }

        // Prepare academics JSON for students
        const academics = {
            cgpa: 0,
            sgpa: 0,
            attendance: 0,
            totalCredits: 0,
            earnedCredits: 0,
            currentSemester: 1,
            semesters: [],
            lastSynced: null
        }

        // Prepare BIP credentials JSON
        const bipCredentials = {
            email: '',
            password: '',
            lastSync: null,
            syncStatus: 'never'
        }

        // Create user with all profile fields
        const userId = uuidv4()
        const result = await pool.query(
            `INSERT INTO "Users" (
                id, email, password, role, "fullName", "rollNumber", year, department, 
                avatar, "employeeId", designation, specialization, "codingProfiles", 
                academics, "bipCredentials", "growthScore", "assignedStudents", "isActive", 
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()) 
            RETURNING *`,
            [
                userId, 
                email, 
                hashedPassword, 
                role || 'student', 
                fullName || '',
                rollNumber || null,
                year || null,
                department || null,
                avatar || null,
                employeeId || null,
                designation || null,
                specialization || null,
                JSON.stringify(codingProfiles),
                JSON.stringify(academics),
                JSON.stringify(bipCredentials),
                0, // growthScore
                JSON.stringify([]), // assignedStudents
                true // isActive
            ]
        )

        if (result.rows.length > 0) {
            const user = result.rows[0]
            res.status(201).json({
                uid: user.id,
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName || user.full_name,
                rollNumber: user.rollNumber,
                year: user.year,
                department: user.department,
                codingProfiles: typeof user.codingProfiles === 'string' ? JSON.parse(user.codingProfiles) : user.codingProfiles,
                token: generateToken(user.id)
            })
        } else {
            res.status(400).json({ error: 'Failed to create user' })
        }
    } catch (error) {
        console.error('Register Error:', error)
        res.status(500).json({ error: error.message })
    }
}