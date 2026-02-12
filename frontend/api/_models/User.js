import { DataTypes } from 'sequelize'
import { sequelize } from '../_config/db.js'

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'mentor', 'admin'),
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    year: {
        type: DataTypes.STRING,
        allowNull: true
    },
    codingProfiles: {
        type: DataTypes.JSONB,
        defaultValue: {
            github: '',
            leetcode: '',
            hackerrank: '',
            linkedin: '',
            portfolio: ''
        }
    },
    academics: {
        type: DataTypes.JSONB,
        defaultValue: {
            cgpa: 0,
            sgpa: 0,
            attendance: 0,
            totalCredits: 0,
            earnedCredits: 0,
            currentSemester: 1,
            semesters: [],
            lastSynced: null
        }
    },
    growthScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    employeeId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    designation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
})

export default User