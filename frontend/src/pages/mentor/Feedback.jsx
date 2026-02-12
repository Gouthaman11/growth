import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { TextArea, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Send, Star, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { feedbackAPI } from '../../services/api'
import './MentorDashboard.css'
import './Feedback.css'

const feedbackTypes = [
    { value: 'monthly', label: 'Monthly Review' },
    { value: 'goal', label: 'Goal Check-in' },
    { value: 'performance', label: 'Performance Evaluation' },
    { value: 'general', label: 'General Feedback' },
]

export default function Feedback() {
    const { userData, getAllStudents } = useAuth()
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [students, setStudents] = useState([])
    const [recentFeedback, setRecentFeedback] = useState([])
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        student: '',
        type: '',
        strengths: '',
        improvements: '',
        goals: '',
        notes: ''
    })

    useEffect(() => {
        loadData()
    }, [userData])

    const loadData = async () => {
        try {
            // Load students
            const studentsData = await getAllStudents()
            const studentOptions = studentsData.map(s => ({
                value: s.uid,
                label: `${s.fullName} (${s.rollNumber || 'N/A'})`
            }))
            setStudents(studentOptions)

            // Load recent feedback by this mentor
            if (userData?.uid) {
                const feedbackData = await feedbackAPI.getByMentor(userData.uid)
                setRecentFeedback(feedbackData.slice(0, 5))
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!rating || !formData.student || !formData.type) {
            alert('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            await feedbackAPI.create({
                studentId: formData.student,
                mentorId: userData.uid,
                type: formData.type,
                rating: rating,
                strengths: formData.strengths,
                improvements: formData.improvements,
                goals: formData.goals,
                notes: formData.notes
            })

            alert('Feedback submitted successfully!')

            // Reset form
            setFormData({
                student: '',
                type: '',
                strengths: '',
                improvements: '',
                goals: '',
                notes: ''
            })
            setRating(0)

            // Reload feedback list
            loadData()
        } catch (error) {
            console.error('Error submitting feedback:', error)
            alert('Failed to submit feedback. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getTypeLabel = (type) => {
        const typeObj = feedbackTypes.find(t => t.value === type)
        return typeObj ? typeObj.label : type
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <DashboardLayout role="mentor">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Feedback & Evaluation</h1>
                    <p className="dashboard-subtitle">Provide structured feedback to your students</p>
                </div>
            </div>

            <div className="feedback-layout">
                <div className="feedback-form-container">
                    <Card variant="default" padding="lg">
                        <CardHeader>
                            <CardTitle>New Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="feedback-form" onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <Select
                                        label="Select Student"
                                        options={students}
                                        placeholder="Choose a student"
                                        value={formData.student}
                                        onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                        required
                                    />
                                    <Select
                                        label="Feedback Type"
                                        options={feedbackTypes}
                                        placeholder="Select type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="rating-input">
                                    <label className="input-label">Overall Rating</label>
                                    <div className="stars-container">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="star-btn"
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star
                                                    size={28}
                                                    fill={(hoveredRating || rating) >= star ? '#f59e0b' : 'none'}
                                                    color="#f59e0b"
                                                />
                                            </button>
                                        ))}
                                        <span className="rating-text">
                                            {rating === 1 && 'Needs Improvement'}
                                            {rating === 2 && 'Below Average'}
                                            {rating === 3 && 'Average'}
                                            {rating === 4 && 'Good'}
                                            {rating === 5 && 'Excellent'}
                                        </span>
                                    </div>
                                </div>

                                <TextArea
                                    label="Key Strengths"
                                    placeholder="What is the student doing well?"
                                    value={formData.strengths}
                                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                    rows={3}
                                />

                                <TextArea
                                    label="Areas for Improvement"
                                    placeholder="What areas need more focus?"
                                    value={formData.improvements}
                                    onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                                    rows={3}
                                />

                                <TextArea
                                    label="Recommended Goals"
                                    placeholder="Suggest specific goals for the next period"
                                    value={formData.goals}
                                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                    rows={2}
                                />

                                <TextArea
                                    label="Additional Notes"
                                    placeholder="Any other observations or comments"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    icon={<Send size={18} />}
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="feedback-sidebar">
                    <Card variant="default" padding="lg">
                        <CardHeader>
                            <CardTitle>Recent Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="recent-feedback-list">
                                {recentFeedback.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                        No feedback given yet
                                    </p>
                                ) : (
                                    recentFeedback.map((item, idx) => (
                                        <div key={idx} className="recent-feedback-item">
                                            <div className="recent-feedback-avatar">
                                                <User size={16} />
                                            </div>
                                            <div className="recent-feedback-content">
                                                <strong>{item.studentId}</strong>
                                                <div className="recent-feedback-meta">
                                                    <Badge variant="default" size="sm">{getTypeLabel(item.type)}</Badge>
                                                    <span>{formatDate(item.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="recent-feedback-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={12} fill={i < item.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="gradient" padding="lg">
                        <CardContent>
                            <div className="feedback-tip">
                                <h4>💡 Feedback Tips</h4>
                                <ul>
                                    <li>Be specific and actionable</li>
                                    <li>Balance positive and constructive points</li>
                                    <li>Set measurable goals</li>
                                    <li>Follow up on previous feedback</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
