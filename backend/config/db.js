import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
)

const connectDB = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ PostgreSQL Connected Successfully (AWS RDS)')
        console.log(`   Host: ${sequelize.config.host}`)
        console.log(`   Database: ${sequelize.config.database}`)
        // Database tables should already exist in production
        console.log('📊 Database Ready')
        return true
    } catch (error) {
        console.error('❌ PostgreSQL Connection Error:', error.message)
        console.error('   Please check your network connection and AWS RDS settings')
        return false
    }
}

export { sequelize, connectDB }
