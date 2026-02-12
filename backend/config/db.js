import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Use PostgreSQL on AWS RDS for online storage
const sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '12345678',
    {
        host: process.env.DB_HOST || 'database-1.chyoqg44uw61.eu-north-1.rds.amazonaws.com',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            connectTimeout: 60000 // 60 seconds timeout
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000
        }
    }
)

const connectDB = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ PostgreSQL Connected Successfully (AWS RDS)')
        console.log(`   Host: ${sequelize.config.host}`)
        console.log(`   Database: ${sequelize.config.database}`)
        // Sync models - using { alter: true } to update tables without dropping data
        await sequelize.sync({ alter: true })
        console.log('📊 Database Synced')
        return true
    } catch (error) {
        console.error('❌ PostgreSQL Connection Error:', error.message)
        console.error('   Please check your network connection and AWS RDS settings')
        return false
    }
}

export { sequelize, connectDB }
