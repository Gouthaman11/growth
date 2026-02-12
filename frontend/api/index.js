import express from "express"
import serverless from "serverless-http"
import cors from "cors"

import authRoutes from "./auth/authRoutes.js"
import userRoutes from "./users/userRoutes.js"
import progressRoutes from "./progress/progressRoutes.js"
import academicRoutes from "./academics/academicRoutes.js"
import goalRoutes from "./goals/goalRoutes.js"
import codingRoutes from "./coding-data/codingRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/academics", academicRoutes)
app.use("/api/goals", goalRoutes)
app.use("/api/coding-data", codingRoutes)

export default serverless(app)