import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const ProgressHistory = sequelize.define('ProgressHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    recordDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Metrics snapshot
    leetcodeTotal: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeEasy: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeMedium: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    leetcodeHard: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubRepos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubCommits: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubStars: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    githubFollowers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hackerrankBadges: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hackerrankCertificates: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cgpa: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    sgpa: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    growthScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    indexes: [
        { fields: ['studentId', 'recordDate'], unique: true },
        { fields: ['studentId'] },
        { fields: ['recordDate'] }
    ]
})

export default ProgressHistory
