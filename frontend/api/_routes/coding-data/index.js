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

// Helper functions for fetching data from platforms
const extractUsername = (input, platform) => {
    if (!input || input.trim() === '') return null
    
    const cleanInput = input.trim()
    
    try {
        if (platform === 'github') {
            const match = cleanInput.match(/github\.com\/([^\/\?]+)/i)
            return match ? match[1] : cleanInput
        }
        if (platform === 'leetcode') {
            const matchU = cleanInput.match(/leetcode\.com\/u\/([^\/\?]+)/i)
            const matchDirect = cleanInput.match(/leetcode\.com\/([^\/\?]+)/i)
            
            if (matchU) return matchU[1]
            if (matchDirect && !matchDirect[1].includes('/')) return matchDirect[1]
        }
        if (platform === 'hackerrank') {
            const matchProfile = cleanInput.match(/hackerrank\.com\/profile\/([^\/\?]+)/i)
            const matchDirect = cleanInput.match(/hackerrank\.com\/([^\/\?]+)/i)
            
            if (matchProfile) return matchProfile[1]
            if (matchDirect && !matchDirect[1].includes('/')) return matchDirect[1]
        }
    } catch (e) {
        console.error('Error parsing URL:', e)
    }
    
    return cleanInput
}

const fetchGitHubData = async (input) => {
    const username = extractUsername(input, 'github')
    if (!username) return null
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'EduGrow-Plus-App'
            }
        })
        
        if (!response.ok) throw new Error(`GitHub user not found: ${username}`)
        
        const userData = await response.json()
        
        return {
            username: userData.login,
            name: userData.name,
            avatar: userData.avatar_url,
            bio: userData.bio,
            publicRepos: userData.public_repos,
            followers: userData.followers,
            following: userData.following,
            profileUrl: userData.html_url,
            createdAt: userData.created_at,
            lastFetched: new Date()
        }
    } catch (error) {
        console.error('GitHub API Error:', error.message)
        throw error
    }
}

const fetchLeetCodeData = async (input) => {
    const username = extractUsername(input, 'leetcode')
    if (!username) return null
    
    try {
        const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`)
        
        if (response.ok) {
            const data = await response.json()
            if (data.status === 'success' || data.totalSolved !== undefined) {
                return {
                    username: username,
                    ranking: data.ranking || 0,
                    totalSolved: data.totalSolved || 0,
                    easySolved: data.easySolved || 0,
                    mediumSolved: data.mediumSolved || 0,
                    hardSolved: data.hardSolved || 0,
                    acceptanceRate: data.acceptanceRate || 0,
                    profileUrl: `https://leetcode.com/u/${username}`,
                    lastFetched: new Date()
                }
            }
        }
        
        throw new Error(`LeetCode data not found for: ${username}`)
    } catch (error) {
        console.error('LeetCode API Error:', error.message)
        throw error
    }
}

// Get coding data for a student
router.get('/:studentId', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "CodingData" WHERE "studentId" = $1',
            [req.params.studentId]
        )

        if (result.rows.length === 0) {
            return res.json({
                studentId: req.params.studentId,
                github: {},
                leetcode: {},
                hackerrank: {}
            })
        }

        const codingData = result.rows[0]
        const parsedData = {
            ...codingData,
            github: typeof codingData.github === 'string' ? JSON.parse(codingData.github || '{}') : codingData.github || {},
            leetcode: typeof codingData.leetcode === 'string' ? JSON.parse(codingData.leetcode || '{}') : codingData.leetcode || {},
            hackerrank: typeof codingData.hackerrank === 'string' ? JSON.parse(codingData.hackerrank || '{}') : codingData.hackerrank || {}
        }
        res.json(parsedData)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Fetch GitHub data
router.post('/:studentId/fetch/github', verifyToken, async (req, res) => {
    try {
        const { username } = req.body
        if (!username) {
            return res.status(400).json({ error: 'GitHub username is required' })
        }

        const githubData = await fetchGitHubData(username)
        
        // Update or create coding data
        const existingResult = await pool.query(
            'SELECT github FROM "CodingData" WHERE "studentId" = $1',
            [req.params.studentId]
        )

        if (existingResult.rows.length > 0) {
            await pool.query(
                `UPDATE "CodingData" 
                 SET github = $1, "updatedAt" = NOW() 
                 WHERE "studentId" = $2`,
                [JSON.stringify(githubData), req.params.studentId]
            )
        } else {
            await pool.query(
                `INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [req.params.studentId, JSON.stringify(githubData), JSON.stringify({}), JSON.stringify({})]
            )
        }

        res.json({
            success: true,
            message: 'GitHub data fetched and saved successfully',
            data: githubData
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Fetch LeetCode data
router.post('/:studentId/fetch/leetcode', verifyToken, async (req, res) => {
    try {
        const { username } = req.body
        if (!username) {
            return res.status(400).json({ error: 'LeetCode username is required' })
        }

        const leetcodeData = await fetchLeetCodeData(username)
        
        // Update or create coding data
        const existingResult = await pool.query(
            'SELECT leetcode FROM "CodingData" WHERE "studentId" = $1',
            [req.params.studentId]
        )

        if (existingResult.rows.length > 0) {
            await pool.query(
                `UPDATE "CodingData" 
                 SET leetcode = $1, "updatedAt" = NOW() 
                 WHERE "studentId" = $2`,
                [JSON.stringify(leetcodeData), req.params.studentId]
            )
        } else {
            await pool.query(
                `INSERT INTO "CodingData" ("studentId", github, leetcode, hackerrank, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [req.params.studentId, JSON.stringify({}), JSON.stringify(leetcodeData), JSON.stringify({})]
            )
        }

        res.json({
            success: true,
            message: 'LeetCode data fetched and saved successfully',
            data: leetcodeData
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router