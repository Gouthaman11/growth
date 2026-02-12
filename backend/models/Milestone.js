import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const Milestone = sequelize.define('Milestone', {
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
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('Coding', 'Learning', 'Projects', 'Academic', 'Career', 'Other'),
        defaultValue: 'Other'
    }
}, {
    timestamps: true
})

export default Milestone
