import { Sequelize } from 'sequelize'
import User from '../_models/User.js'

const sequelize = new Sequelize(
    process.env.DATABASE_URL || process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres', 
    process.env.DB_PASS || 'postgres',
    {
        host: process.env.DB_HOST || 'database-1.chyoqg44uw61.eu-north-1.rds.amazonaws.com',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            connectTimeout: 60000
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    }
)

// Initialize database connection for serverless
export const initDB = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        return sequelize
    } catch (error) {
        console.error('Database connection error:', error)
        throw error
    }
}

export { sequelize }
export default sequelize