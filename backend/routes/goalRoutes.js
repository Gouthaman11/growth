import express from 'express'
import Goal from '../models/Goal.js'
import { protect } from '../middleware/authMiddleware.js'
import { Op } from 'sequelize'

const router = express.Router()

// Get all goals (with optional filters)
router.get('/', protect, async (req, res) => {
    try {
        const { studentId, status, category } = req.query
        let where = {}
        if (studentId) where.studentId = studentId
        if (status) where.status = status
        if (category) where.category = category

        const goals = await Goal.findAll({
            where,
            order: [['deadline', 'ASC']]
        })
        res.json(goals)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get goal by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const goal = await Goal.findByPk(req.params.id)
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        res.json(goal)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get goals for a specific student
router.get('/student/:studentId', protect, async (req, res) => {
    try {
        const goals = await Goal.findAll({
            where: { studentId: req.params.studentId },
            order: [['deadline', 'ASC']]
        })
        res.json(goals)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get active goals
router.get('/student/:studentId/active', protect, async (req, res) => {
    try {
        const goals = await Goal.findAll({
            where: {
                studentId: req.params.studentId,
                status: { [Op.in]: ['not-started', 'in-progress', 'on-track'] }
            },
            order: [['deadline', 'ASC']]
        })
        res.json(goals)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create goal
router.post('/', protect, async (req, res) => {
    try {
        const goal = await Goal.create(req.body)
        res.status(201).json(goal)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update goal
router.patch('/:id', protect, async (req, res) => {
    try {
        const [updated] = await Goal.update(req.body, {
            where: { id: req.params.id }
        })
        if (!updated) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        const goal = await Goal.findByPk(req.params.id)
        res.json(goal)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update goal progress
router.patch('/:id/progress', protect, async (req, res) => {
    try {
        const { progress } = req.body
        const goal = await Goal.findByPk(req.params.id)

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' })
        }

        let updateData = { progress }

        // Auto-update status based on progress
        if (progress >= goal.total) {
            updateData.status = 'completed'
            updateData.completedAt = new Date()
        } else if (progress >= goal.total * 0.7) {
            updateData.status = 'on-track'
        } else if (progress > 0) {
            updateData.status = 'in-progress'
        }

        await goal.update(updateData)
        res.json(goal)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Mark goal as complete
router.patch('/:id/complete', protect, async (req, res) => {
    try {
        const [updated] = await Goal.update({
            status: 'completed',
            progress: req.body.total || 100, // Or retrieve total from goal if not passed
            completedAt: new Date()
        }, {
            where: { id: req.params.id }
        })

        if (!updated) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        const goal = await Goal.findByPk(req.params.id)
        res.json(goal)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Delete goal
router.delete('/:id', protect, async (req, res) => {
    try {
        const deleted = await Goal.destroy({ where: { id: req.params.id } })
        if (!deleted) {
            return res.status(404).json({ error: 'Goal not found' })
        }
        res.json({ message: 'Goal deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
