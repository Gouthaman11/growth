import express from 'express'
import User from '../models/User.js'
import { protect, authorize } from '../middleware/authMiddleware.js'
import { Op, fn, col, where as seqWhere } from 'sequelize'
import { sequelize } from '../config/db.js'

const router = express.Router()

// Get all users — Admin sees ALL users (no filtering by logged-in user id)
// Optional query params ?role=...&department=... for convenience
router.get('/', protect, async (req, res) => {
    try {
        const { role, department } = req.query
        let where = {}

        // Case-insensitive role comparison for PostgreSQL
        if (role) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                seqWhere(fn('LOWER', col('role')), role.toLowerCase())
            ]
        }
        if (department) where.department = department

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] }
        })
        console.log("Fetched users:", { count: users.length, role: role || 'ALL', department: department || 'ALL' })
        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get students assigned to a specific mentor via mentor_id column
router.get('/mentor/:mentorId/students', protect, async (req, res) => {
    try {
        const { mentorId } = req.params

        // Query students where LOWER(role) = 'student' AND "mentorId" matches
        const result = await sequelize.query(
            `SELECT * FROM "Users" WHERE LOWER(role) = 'student' AND "mentorId" = :mentorId`,
            {
                replacements: { mentorId },
                type: sequelize.QueryTypes.SELECT
            }
        )
        console.log("Fetched users:", result)

        // Remove password from results
        const students = result.map(({ password, ...rest }) => rest)
        res.json(students)
    } catch (error) {
        console.error('Error fetching mentor students:', error)
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

// Get mentor's assigned students — supports both mentorId column and legacy JSONB assignedStudents
router.get('/:id/assigned-students', protect, async (req, res) => {
    try {
        const mentorId = req.params.id

        // Primary: find students with mentorId column pointing to this mentor
        const studentsByMentorId = await sequelize.query(
            `SELECT * FROM "Users" WHERE LOWER(role) = 'student' AND "mentorId" = :mentorId`,
            {
                replacements: { mentorId },
                type: sequelize.QueryTypes.SELECT
            }
        )

        let students = studentsByMentorId

        // Fallback: if no students found via mentorId column, try legacy JSONB assignedStudents
        if (students.length === 0) {
            const mentor = await User.findByPk(mentorId)
            if (!mentor) {
                return res.status(404).json({ error: 'Mentor not found' })
            }
            const assignedIds = mentor.getDataValue('assignedStudents') || []
            if (assignedIds.length > 0) {
                students = await User.findAll({
                    where: { id: { [Op.in]: assignedIds } },
                    attributes: { exclude: ['password'] },
                    raw: true
                })
            }
        }

        // Remove password from results
        const safeStudents = students.map(({ password, ...rest }) => rest)
        console.log("Fetched users:", { mentorId, count: safeStudents.length })
        res.json(safeStudents)
    } catch (error) {
        console.error('Error fetching assigned students:', error)
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
