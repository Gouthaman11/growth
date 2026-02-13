import User from './User.js'
import Feedback from './Feedback.js'
import Goal from './Goal.js'
import Milestone from './Milestone.js'
import CodingData from './CodingData.js'
import ProgressHistory from './ProgressHistory.js'

// Define associations

// Mentor <-> Student (via mentorId on student)
User.hasMany(User, { foreignKey: 'mentorId', as: 'assignedStudentUsers' })
User.belongsTo(User, { foreignKey: 'mentorId', as: 'mentorUser' })

// User <-> Feedback
User.hasMany(Feedback, { foreignKey: 'studentId', as: 'receivedFeedback' })
User.hasMany(Feedback, { foreignKey: 'mentorId', as: 'givenFeedback' })
Feedback.belongsTo(User, { foreignKey: 'studentId', as: 'student' })
Feedback.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor' })

// User <-> Goal
User.hasMany(Goal, { foreignKey: 'studentId', as: 'goals' })
Goal.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

// User <-> Milestone
User.hasMany(Milestone, { foreignKey: 'studentId', as: 'milestones' })
Milestone.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

// User <-> CodingData
User.hasOne(CodingData, { foreignKey: 'studentId', as: 'codingData' })
CodingData.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

// User <-> ProgressHistory
User.hasMany(ProgressHistory, { foreignKey: 'studentId', as: 'progressHistory' })
ProgressHistory.belongsTo(User, { foreignKey: 'studentId', as: 'student' })

export { User, Feedback, Goal, Milestone, CodingData, ProgressHistory }
