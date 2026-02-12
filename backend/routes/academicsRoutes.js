import express from 'express';
import { User } from '../models/index.js';
import { testBIPConnection } from '../services/bipService.js';

const router = express.Router();

// Test BIP portal connection
router.get('/test-connection', async (req, res) => {
    try {
        const result = await testBIPConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get BIP status (for showing portal link)
router.get('/:userId/bip-status', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const academics = user.academics || {};
        
        res.json({
            success: true,
            portalUrl: 'https://bip.bitsathy.ac.in',
            usesGoogleSSO: true,
            lastSynced: academics.lastSynced || null,
            hasData: !!(academics.cgpa || academics.sgpa || academics.attendance),
            message: 'BIP uses Google SSO. Please login to portal and enter your data manually.'
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get academic data
router.get('/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            data: user.academics || {
                cgpa: 0,
                sgpa: 0,
                attendance: 0,
                totalCredits: 0,
                earnedCredits: 0,
                currentSemester: 1,
                semesters: []
            },
            lastSynced: user.academics?.lastSynced || null
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update academic data (manual entry)
router.put('/:userId/data', async (req, res) => {
    try {
        const { userId } = req.params;
        const { cgpa, sgpa, attendance, currentSemester, semesters, totalCredits, earnedCredits } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const currentAcademics = user.academics || {};
        const updatedAcademics = {
            ...currentAcademics,
            cgpa: cgpa !== undefined ? parseFloat(cgpa) : currentAcademics.cgpa || 0,
            sgpa: sgpa !== undefined ? parseFloat(sgpa) : currentAcademics.sgpa || 0,
            attendance: attendance !== undefined ? parseFloat(attendance) : currentAcademics.attendance || 0,
            currentSemester: currentSemester || currentAcademics.currentSemester || 1,
            totalCredits: totalCredits || currentAcademics.totalCredits || 0,
            earnedCredits: earnedCredits || currentAcademics.earnedCredits || 0,
            semesters: semesters || currentAcademics.semesters || [],
            lastSynced: new Date().toISOString()
        };

        await user.update({ academics: updatedAcademics });

        res.json({
            success: true,
            message: 'Academic data updated successfully',
            data: updatedAcademics
        });

    } catch (error) {
        console.error('Error updating academic data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Quick update for basic academic data (CGPA, SGPA, Attendance)
router.patch('/:userId/quick-update', async (req, res) => {
    try {
        const { userId } = req.params;
        const { cgpa, sgpa, attendance } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const currentAcademics = user.academics || {};
        const updatedAcademics = {
            ...currentAcademics,
            cgpa: cgpa !== undefined ? parseFloat(cgpa) : currentAcademics.cgpa,
            sgpa: sgpa !== undefined ? parseFloat(sgpa) : currentAcademics.sgpa,
            attendance: attendance !== undefined ? parseFloat(attendance) : currentAcademics.attendance,
            lastSynced: new Date().toISOString()
        };

        await user.update({ academics: updatedAcademics });

        res.json({
            success: true,
            message: 'Academic data updated',
            data: updatedAcademics
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add semester data
router.post('/:userId/semesters', async (req, res) => {
    try {
        const { userId } = req.params;
        const { semesterNumber, gpa, credits, subjects } = req.body;
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const currentAcademics = user.academics || {};
        const semesters = currentAcademics.semesters || [];
        
        // Check if semester already exists
        const existingIndex = semesters.findIndex(s => s.number === semesterNumber);
        
        const semesterData = {
            number: semesterNumber,
            name: `Semester ${semesterNumber}`,
            gpa: parseFloat(gpa) || 0,
            credits: parseInt(credits) || 0,
            subjects: subjects || []
        };

        if (existingIndex >= 0) {
            semesters[existingIndex] = semesterData;
        } else {
            semesters.push(semesterData);
            semesters.sort((a, b) => a.number - b.number);
        }

        const updatedAcademics = {
            ...currentAcademics,
            semesters,
            currentSemester: Math.max(currentAcademics.currentSemester || 1, semesterNumber),
            lastSynced: new Date().toISOString()
        };

        await user.update({ academics: updatedAcademics });

        res.json({
            success: true,
            message: `Semester ${semesterNumber} data saved`,
            data: updatedAcademics
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;