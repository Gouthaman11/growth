import express from "express"

const router = express.Router()

// Import auth handlers
import loginHandler from "./login.js"
import registerHandler from "./register.js"
import profileHandler from "./profile.js"
import updateProfileHandler from "./update-profile.js"
import updateProfileLinksHandler from "./update-profile-links.js"

// Convert serverless functions to Express routes
router.post("/login", async (req, res) => {
    try {
        await loginHandler({ ...req, method: 'POST', headers: req.headers, body: req.body, query: req.query }, res)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post("/register", async (req, res) => {
    try {
        await registerHandler({ ...req, method: 'POST', headers: req.headers, body: req.body, query: req.query }, res)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get("/profile", async (req, res) => {
    try {
        await profileHandler({ ...req, method: 'GET', headers: req.headers, body: req.body, query: req.query }, res)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.put("/update-profile", async (req, res) => {
    try {
        await updateProfileHandler({ ...req, method: 'PUT', headers: req.headers, body: req.body, query: req.query }, res)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch("/update-profile-links", async (req, res) => {
    try {
        await updateProfileLinksHandler({ ...req, method: 'PATCH', headers: req.headers, body: req.body, query: req.query }, res)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router