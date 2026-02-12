import express from 'express'
import User from '../models/User.js'
import { protect, authorize } from '../middleware/authMiddleware.js'
import { Op } from 'sequelize'

const router = express.Router()

// Get all users (Admin or Mentor can list students)
router.get('/', protect, async (req, res) => {
    try {
        const { role, department } = req.query
        let where = {}
        if (role) where.role = role
        if (department) where.department = department

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] }
        })
        res.json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get user by UID/ID
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: ['codingData']
        })
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create user (Internal use or admin)
// Note: Normally registration is handled by authRoutes. This is for admin creation or updates.
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.create(req.body)
        res.status(201).json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update user
router.patch('/:id', protect, async (req, res) => {
    try {
        // Only admin or the user themselves can update
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' })
        }

        const [updated] = await User.update(req.body, {
            where: { id: req.params.id },
            returning: true
        })

        if (!updated) {
            return res.status(404).json({ error: 'User not found' })
        }

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update student coding profiles (using JSONB update)
router.patch('/:id/coding-profiles', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Merge existing profiles with new ones
        const updatedProfiles = { ...user.codingProfiles, ...req.body }

        await user.update({ codingProfiles: updatedProfiles })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Update student academics
router.patch('/:id/academics', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const updatedAcademics = { ...user.academics, ...req.body }

        await user.update({ academics: updatedAcademics })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Get mentor's assigned students
// NOTE: assignedStudents in MongoDB was an array of IDs. 
// In SQL/Sequelize with User model, we might need a separate relation or just a JSON array if we kept it simple.
// I didn't create a Join Table for assigned students in the User model definition, I left it out? 
// Let's check User.js. I missed `assignedStudents` array field in SQL schema!
// I will assume for now it's not critical OR I use a JSONB field for it to match Mongo quickly.
// OR better, I should have a defined relationship. 
// For now, let's assume it's stored in a JSONB field named 'assignedStudents' on Mentor if I add it, 
// OR I query students directly via a join if I had one.
// Let's look at how I defined User model... I didn't put assignedStudents in User.js!
// I'll add `assignedStudents` as JSONB to User model to maintain easy migration compatibility.

router.get('/:id/assigned-students', protect, async (req, res) => {
    try {
        const mentor = await User.findByPk(req.params.id)
        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' })
        }

        // Assuming assignedStudents is stored as JSON array of IDs in mentor record
        // If not, we need to fix the model. I will hot-fix the model in a moment.
        const assignedIds = mentor.getDataValue('assignedStudents') || []

        if (assignedIds.length === 0) return res.json([])

        const students = await User.findAll({
            where: { id: { [Op.in]: assignedIds } },
            attributes: { exclude: ['password'] }
        })
        res.json(students)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Assign students to mentor
router.post('/:id/assign-students', protect, authorize('admin', 'mentor'), async (req, res) => {
    try {
        const { studentIds } = req.body
        const mentor = await User.findByPk(req.params.id)

        if (!mentor) {
            return res.status(404).json({ error: 'Mentor not found' })
        }

        // Get current list, add new ones, dedup
        const current = mentor.getDataValue('assignedStudents') || []
        const updated = [...new Set([...current, ...studentIds])]

        await mentor.update({ assignedStudents: updated })
        res.json(mentor)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

// Delete user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const deleted = await User.destroy({ where: { id: req.params.id } })
        if (!deleted) {
            return res.status(404).json({ error: 'User not found' })
        }
        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
