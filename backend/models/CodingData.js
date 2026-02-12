import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

const CodingData = sequelize.define('CodingData', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    // GitHub Data stored as JSON
    github: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: '',
            repositories: 0,
            publicRepos: 0,
            totalCommits: 0,
            contributions: 0,
            stars: 0,
            followers: 0,
            following: 0,
            topLanguages: [],
            recentActivity: []
        }
    },
    // LeetCode Data stored as JSON
    leetcode: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: '',
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            ranking: 0,
            acceptanceRate: 0,
            contestRating: 0,
            contestsAttended: 0,
            streak: 0,
            recentSubmissions: []
        }
    },
    // HackerRank Data stored as JSON
    hackerrank: {
        type: DataTypes.JSONB,
        defaultValue: {
            username: '',
            badges: 0,
            stars: 0,
            certifications: [],
            skills: []
        }
    },
    // Aggregated Stats
    overallStats: {
        type: DataTypes.JSONB,
        defaultValue: {
            totalProblemsSolved: 0,
            totalProjects: 0,
            totalContributions: 0,
            codingStreak: 0,
            lastActive: null
        }
    }
}, {
    timestamps: true
})

export default CodingData
