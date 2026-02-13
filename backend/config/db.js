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

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        await sequelize.authenticate()
        console.log('DB connected')
        isConnected = true
    } catch (error) {
        console.error('DB connection failed:', error.message)
        isConnected = false
        throw error
    }
}

export { sequelize, connectDB }
