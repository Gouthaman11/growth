import express from "express"
import serverless from "serverless-http"
import cors from "cors"

import userRoutes from "./_routes/users/index.js"
import authRoutes from "./_routes/auth/index.js"
import progressRoutes from "./_routes/progress/index.js"
import academicRoutes from "./_routes/academics/index.js"
import goalRoutes from "./_routes/goals/index.js"
import codingRoutes from "./_routes/coding-data/index.js"

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