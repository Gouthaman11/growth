import express from 'express'
import Milestone from '../models/Milestone.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all milestones
router.get('/', protect, async (req, res) => {
    try {
        const { studentId, completed, category } = req.query
        let where = {}
        if (studentId) where.studentId = studentId
        if (completed !== undefined) where.completed = completed === 'true'
        if (category) where.category = category

        const milestones = await Milestone.findAll({
            where,
            order: [['date', 'ASC']]
        })
        res.json(milestones)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get milestone by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const milestone = await Milestone.findByPk(req.params.id)
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        res.json(milestone)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get milestones for a specific student
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const milestones = await Milestone.findAll({
            where: { studentId: req.params.studentId },
            order: [['date', 'ASC']]
        })
        res.json(milestones)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create milestone
router.post('/', protect, async (req, res) => {
    try {
        const milestone = await Milestone.create(req.body)
        res.status(201).json(milestone)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update milestone
router.patch('/:id', protect, async (req, res) => {
    try {
        const [updated] = await Milestone.update(req.body, {
            where: { id: req.params.id }
        })

        if (!updated) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        const milestone = await Milestone.findByPk(req.params.id)
        res.json(milestone)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Mark milestone as complete
router.patch('/:id/complete', protect, async (req, res) => {
    try {
        const [updated] = await Milestone.update({
            completed: true,
            completedAt: new Date()
        }, {
            where: { id: req.params.id }
        })

        if (!updated) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        const milestone = await Milestone.findByPk(req.params.id)
        res.json(milestone)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Delete milestone
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Milestone.destroy({ where: { id: req.params.id } })
        if (!deleted) {
            return res.status(404).json({ error: 'Milestone not found' })
        }
        res.json({ message: 'Milestone deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
