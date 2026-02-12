import express from 'express'
import Feedback from '../models/Feedback.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all feedback (with optional filters)
router.get('/', protect, async (req, res) => {
    try {
        const { studentId, mentorId, type } = req.query
        let where = {}
        if (studentId) where.studentId = studentId
        if (mentorId) where.mentorId = mentorId
        if (type) where.type = type

        const feedback = await Feedback.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: 50
        })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get feedback by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id)
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' })
        }
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get feedback for a specific student
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findAll({
            where: { studentId: req.params.studentId },
            order: [['createdAt', 'DESC']]
        })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get feedback given by a specific mentor
router.get('/mentor/:mentorId', protect, async (req, res) => {
    try {
        const feedback = await Feedback.findAll({
            where: { mentorId: req.params.mentorId },
            order: [['createdAt', 'DESC']]
        })
        res.json(feedback)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create feedback
router.post('/', protect, async (req, res) => {
    try {
        const feedback = await Feedback.create(req.body)
        res.status(201).json(feedback)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update feedback
router.patch('/:id', protect, async (req, res) => {
    try {
        const [updated] = await Feedback.update(req.body, {
            where: { id: req.params.id }
        })

        if (!updated) {
            return res.status(404).json({ error: 'Feedback not found' })
        }

        const feedback = await Feedback.findByPk(req.params.id)
        res.json(feedback)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Mark feedback as read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        const [updated] = await Feedback.update(
            { isRead: true },
            { where: { id: req.params.id } }
        )

        if (!updated) {
            return res.status(404).json({ error: 'Feedback not found' })
        }
        const feedback = await Feedback.findByPk(req.params.id)
        res.json(feedback)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Delete feedback
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Feedback.destroy({ where: { id: req.params.id } })
        if (!deleted) {
            return res.status(404).json({ error: 'Feedback not found' })
        }
        res.json({ message: 'Feedback deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
