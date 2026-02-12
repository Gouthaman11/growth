import express from 'express'
import { Op } from 'sequelize'
import ProgressHistory from '../models/ProgressHistory.js'
import User from '../models/User.js'
import CodingData from '../models/CodingData.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Get progress history for a student
router.get('/:studentId', protect, async (req, res) => {
    try {
        const { days = 30 } = req.query
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(days))
        
        const history = await ProgressHistory.findAll({
            where: {
                studentId: req.params.studentId,
                recordDate: { [Op.gte]: startDate }
            },
            order: [['recordDate', 'ASC']]
        })
        
        res.json(history)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get weekly comparison
router.get('/:studentId/weekly-comparison', protect, async (req, res) => {
    try {
        const today = new Date()
        const lastWeek = new Date()
        lastWeek.setDate(today.getDate() - 7)
        
        // Get latest record
        const current = await ProgressHistory.findOne({
            where: { studentId: req.params.studentId },
            order: [['recordDate', 'DESC']]
        })
        
        // Get record from a week ago
        const previous = await ProgressHistory.findOne({
            where: {
                studentId: req.params.studentId,
                recordDate: { [Op.lte]: lastWeek }
            },
            order: [['recordDate', 'DESC']]
        })
        
        const comparison = {
            current: current?.toJSON() || {},
            previous: previous?.toJSON() || {},
            changes: {}
        }
        
        if (current && previous) {
            comparison.changes = {
                leetcodeTotal: current.leetcodeTotal - previous.leetcodeTotal,
                githubCommits: current.githubCommits - previous.githubCommits,
                githubRepos: current.githubRepos - previous.githubRepos,
                growthScore: current.growthScore - previous.growthScore
            }
        }
        
        res.json(comparison)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get monthly summary
router.get('/:studentId/monthly-summary', protect, async (req, res) => {
    try {
        const today = new Date()
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        
        const thisMonth = await ProgressHistory.findAll({
            where: {
                studentId: req.params.studentId,
                recordDate: { [Op.gte]: monthStart }
            },
            order: [['recordDate', 'ASC']]
        })
        
        const prevMonth = await ProgressHistory.findAll({
            where: {
                studentId: req.params.studentId,
                recordDate: {
                    [Op.gte]: prevMonthStart,
                    [Op.lt]: monthStart
                }
            },
            order: [['recordDate', 'ASC']]
        })
        
        res.json({
            thisMonth,
            prevMonth,
            summary: {
                thisMonthRecords: thisMonth.length,
                prevMonthRecords: prevMonth.length
            }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Record today's progress (called internally or by cron)
router.post('/:studentId/record', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.studentId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        
        const codingData = await CodingData.findOne({
            where: { studentId: req.params.studentId }
        })
        
        const today = new Date().toISOString().split('T')[0]
        
        const [record, created] = await ProgressHistory.findOrCreate({
            where: {
                studentId: req.params.studentId,
                recordDate: today
            },
            defaults: {
                leetcodeTotal: codingData?.leetcode?.totalSolved || 0,
                leetcodeEasy: codingData?.leetcode?.easySolved || 0,
                leetcodeMedium: codingData?.leetcode?.mediumSolved || 0,
                leetcodeHard: codingData?.leetcode?.hardSolved || 0,
                githubRepos: codingData?.github?.publicRepos || 0,
                githubCommits: codingData?.github?.recentCommits || 0,
                githubStars: codingData?.github?.totalStars || 0,
                githubFollowers: codingData?.github?.followers || 0,
                hackerrankBadges: codingData?.hackerrank?.badges || 0,
                hackerrankCertificates: codingData?.hackerrank?.certificates || 0,
                cgpa: user.academics?.cgpa || 0,
                sgpa: user.academics?.sgpa || 0,
                growthScore: user.growthScore || 0
            }
        })
        
        if (!created) {
            // Update existing record
            await record.update({
                leetcodeTotal: codingData?.leetcode?.totalSolved || record.leetcodeTotal,
                leetcodeEasy: codingData?.leetcode?.easySolved || record.leetcodeEasy,
                leetcodeMedium: codingData?.leetcode?.mediumSolved || record.leetcodeMedium,
                leetcodeHard: codingData?.leetcode?.hardSolved || record.leetcodeHard,
                githubRepos: codingData?.github?.publicRepos || record.githubRepos,
                githubCommits: codingData?.github?.recentCommits || record.githubCommits,
                githubStars: codingData?.github?.totalStars || record.githubStars,
                githubFollowers: codingData?.github?.followers || record.githubFollowers,
                hackerrankBadges: codingData?.hackerrank?.badges || record.hackerrankBadges,
                hackerrankCertificates: codingData?.hackerrank?.certificates || record.hackerrankCertificates,
                cgpa: user.academics?.cgpa || record.cgpa,
                sgpa: user.academics?.sgpa || record.sgpa,
                growthScore: user.growthScore || record.growthScore
            })
        }
        
        res.json({ record, created })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
