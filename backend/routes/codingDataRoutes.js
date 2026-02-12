import express from 'express'
import CodingData from '../models/CodingData.js'
import User from '../models/User.js'
import ProgressHistory from '../models/ProgressHistory.js'
import { protect } from '../middleware/authMiddleware.js'
import {
    fetchGitHubData,
    fetchLeetCodeData,
    fetchHackerRankData,
    fetchAllPlatformData,
    calculateGrowthScore
} from '../services/codingPlatformService.js'

const router = express.Router()

// Get coding data for a student
router.get('/:studentId', protect, async (req, res) => {
    try {
        let codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            // Return empty structure instead of 404
            return res.json({
                studentId: req.params.studentId,
                github: {},
                leetcode: {},
                hackerrank: {}
            })
        }
        res.json(codingData)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create or update coding data
router.post('/:studentId', protect, async (req, res) => {
    try {
        const [codingData, created] = await CodingData.findOrCreate({
            where: { studentId: req.params.studentId },
            defaults: req.body
        })

        if (!created) {
            await codingData.update(req.body)
        }

        res.status(201).json(codingData)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update GitHub data
router.patch('/:studentId/github', protect, async (req, res) => {
    try {
        const codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            return res.status(404).json({ error: 'Coding data not found' })
        }

        const updatedGithub = { ...req.body, lastFetched: new Date() }
        await codingData.update({ github: updatedGithub })

        res.json(codingData)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update LeetCode data
router.patch('/:studentId/leetcode', protect, async (req, res) => {
    try {
        const codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            return res.status(404).json({ error: 'Coding data not found' })
        }

        const updatedLeetcode = { ...req.body, lastFetched: new Date() }
        await codingData.update({ leetcode: updatedLeetcode })

        res.json(codingData)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update HackerRank data
router.patch('/:studentId/hackerrank', protect, async (req, res) => {
    try {
        const codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            return res.status(404).json({ error: 'Coding data not found' })
        }

        const updatedHackerrank = { ...req.body, lastFetched: new Date() }
        await codingData.update({ hackerrank: updatedHackerrank })

        res.json(codingData)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update overall stats
router.patch('/:studentId/stats', protect, async (req, res) => {
    try {
        const codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            return res.status(404).json({ error: 'Coding data not found' })
        }

        await codingData.update({ overallStats: req.body })
        res.json(codingData)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Delete coding data
router.delete('/:studentId', protect, async (req, res) => {
    try {
        const deleted = await CodingData.destroy({ where: { studentId: req.params.studentId } })
        if (!deleted) {
            return res.status(404).json({ error: 'Coding data not found' })
        }
        res.json({ message: 'Coding data deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Fetch fresh GitHub data
router.post('/:studentId/fetch/github', protect, async (req, res) => {
    try {
        const { username } = req.body
        if (!username) {
            return res.status(400).json({ error: 'GitHub username required' })
        }

        const githubData = await fetchGitHubData(username)
        if (!githubData) {
            return res.status(404).json({ error: 'GitHub user not found' })
        }

        // Update or create coding data
        let codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            codingData = await CodingData.create({
                studentId: req.params.studentId,
                github: githubData
            })
        } else {
            await codingData.update({ github: githubData })
        }

        res.json({ github: githubData, message: 'GitHub data fetched successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Fetch fresh LeetCode data
router.post('/:studentId/fetch/leetcode', protect, async (req, res) => {
    try {
        const { username } = req.body
        if (!username) {
            return res.status(400).json({ error: 'LeetCode username required' })
        }

        const leetcodeData = await fetchLeetCodeData(username)
        if (!leetcodeData) {
            return res.status(404).json({ error: 'LeetCode user not found or API unavailable' })
        }

        // Update or create coding data
        let codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            codingData = await CodingData.create({
                studentId: req.params.studentId,
                leetcode: leetcodeData
            })
        } else {
            await codingData.update({ leetcode: leetcodeData })
        }

        res.json({ leetcode: leetcodeData, message: 'LeetCode data fetched successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Fetch fresh HackerRank data
router.post('/:studentId/fetch/hackerrank', protect, async (req, res) => {
    try {
        const { username } = req.body
        if (!username) {
            return res.status(400).json({ error: 'HackerRank username required' })
        }

        const hackerrankData = await fetchHackerRankData(username)

        // Update or create coding data
        let codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            codingData = await CodingData.create({
                studentId: req.params.studentId,
                hackerrank: hackerrankData
            })
        } else {
            await codingData.update({ hackerrank: hackerrankData })
        }

        res.json({ hackerrank: hackerrankData, message: 'HackerRank data fetched successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Sync all platform data and calculate growth score
router.post('/:studentId/sync', protect, async (req, res) => {
    try {
        console.log('Sync request for student:', req.params.studentId)
        
        // Get user to find coding profiles
        const user = await User.findByPk(req.params.studentId)
        if (!user) {
            console.log('User not found:', req.params.studentId)
            return res.status(404).json({ error: 'User not found' })
        }

        const codingProfiles = user.codingProfiles || {}
        console.log('User coding profiles:', JSON.stringify(codingProfiles))
        
        const results = {
            github: null,
            leetcode: null,
            hackerrank: null,
            growthScore: 0,
            messages: []
        }

        // Fetch all platform data
        if (codingProfiles.github) {
            console.log('Fetching GitHub for:', codingProfiles.github)
            results.github = await fetchGitHubData(codingProfiles.github)
            if (results.github) {
                results.messages.push('GitHub data synced')
                console.log('GitHub sync success')
            } else {
                console.log('GitHub sync returned null')
            }
        }

        if (codingProfiles.leetcode) {
            console.log('Fetching LeetCode for:', codingProfiles.leetcode)
            results.leetcode = await fetchLeetCodeData(codingProfiles.leetcode)
            if (results.leetcode) {
                results.messages.push('LeetCode data synced')
                console.log('LeetCode sync success:', results.leetcode.totalSolved, 'problems')
            } else {
                console.log('LeetCode sync returned null')
            }
        }

        if (codingProfiles.hackerrank) {
            console.log('Fetching HackerRank for:', codingProfiles.hackerrank)
            results.hackerrank = await fetchHackerRankData(codingProfiles.hackerrank)
            if (results.hackerrank) {
                results.messages.push('HackerRank data synced')
                console.log('HackerRank sync success')
            }
        }

        // Calculate growth score
        results.growthScore = calculateGrowthScore(
            results.github,
            results.leetcode,
            results.hackerrank,
            user.academics
        )

        // Update or create coding data
        let codingData = await CodingData.findOne({ where: { studentId: req.params.studentId } })
        if (!codingData) {
            codingData = await CodingData.create({
                studentId: req.params.studentId,
                github: results.github || {},
                leetcode: results.leetcode || {},
                hackerrank: results.hackerrank || {}
            })
        } else {
            const updateData = {}
            if (results.github) updateData.github = results.github
            if (results.leetcode) updateData.leetcode = results.leetcode
            if (results.hackerrank) updateData.hackerrank = results.hackerrank
            await codingData.update(updateData)
        }

        // Update user's growth score
        await user.update({ growthScore: results.growthScore })

        // Record progress history
        const today = new Date().toISOString().split('T')[0]
        try {
            await ProgressHistory.upsert({
                studentId: req.params.studentId,
                recordDate: today,
                leetcodeTotal: results.leetcode?.totalSolved || 0,
                leetcodeEasy: results.leetcode?.easySolved || 0,
                leetcodeMedium: results.leetcode?.mediumSolved || 0,
                leetcodeHard: results.leetcode?.hardSolved || 0,
                githubRepos: results.github?.publicRepos || 0,
                githubCommits: results.github?.recentCommits || 0,
                githubStars: results.github?.totalStars || 0,
                githubFollowers: results.github?.followers || 0,
                hackerrankBadges: results.hackerrank?.badges || 0,
                hackerrankCertificates: results.hackerrank?.certificates || 0,
                cgpa: user.academics?.cgpa || 0,
                sgpa: user.academics?.sgpa || 0,
                growthScore: results.growthScore
            })
            console.log('Progress history recorded for:', today)
        } catch (historyError) {
            console.error('Failed to record progress history:', historyError)
        }

        res.json({
            ...results,
            codingData,
            message: 'Platform data synced successfully'
        })
    } catch (error) {
        console.error('Sync error:', error)
        res.status(500).json({ error: error.message })
    }
})

export default router
