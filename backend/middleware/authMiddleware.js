import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const protect = async (req, res, next) => {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1]

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Get user from the token
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            })

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' })
            }

            next()
        } catch (error) {
            console.error(error)
            res.status(401).json({ error: 'Not authorized, token failed' })
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' })
    }
}

// Middleware to check for specific roles (case-insensitive)
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role?.toLowerCase()
        const allowedRoles = roles.map(r => r.toLowerCase())
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `User role ${req.user.role} is not authorized to access this route`
            })
        }
        next()
    }
}

export { protect, authorize }
