import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Goal = sequelize.define('Goal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('Coding', 'Learning', 'Projects', 'Academic', 'Other'),
        defaultValue: 'Other'
    },
    progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    status: {
        type: DataTypes.ENUM('not-started', 'in-progress', 'on-track', 'completed', 'overdue'),
        defaultValue: 'not-started'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    assignedBy: {
        type: DataTypes.STRING,
        defaultValue: 'Self'
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
})

export default Goal
