import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import { useAuth } from '../../context/AuthContext'
import { codingDataAPI, academicsAPI, goalsAPI, progressAPI, feedbackAPI } from '../../services/api'
import { 
    FileText, 
    Download, 
    Calendar, 
    Share2, 
    TrendingUp, 
    Code2, 
    GraduationCap,
    Target,
    MessageSquare,
    RefreshCw,
    CheckCircle2,
    Clock,
    Award,
    Github
} from 'lucide-react'
import './Reports.css'

export default function Reports() {
    const { currentUser, userData } = useAuth()
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState(null)
    const [generatingPDF, setGeneratingPDF] = useState(false)

    useEffect(() => {
        if (currentUser) {
            fetchReportData()
        }
    }, [currentUser])

    const fetchReportData = async () => {
        if (!currentUser) return
        setLoading(true)
        try {
            // Use the same API services as the Dashboard
            const [codingData, academicsRes, goalsData, progressHistory, feedbackData] = await Promise.all([
                codingDataAPI.get(currentUser.uid).catch(() => null),
                academicsAPI.getData(currentUser.uid).catch(() => ({ data: null })),
                goalsAPI.getByStudent(currentUser.uid).catch(() => []),
                progressAPI.getHistory(currentUser.uid, 30).catch(() => []),
                feedbackAPI.getByStudent(currentUser.uid).catch(() => [])
            ])

            // Calculate goal stats
            const goals = goalsData || []
            const completedGoals = goals.filter(g => g.status === 'completed').length
            const totalGoals = goals.length

            const academics = academicsRes?.data || null

            // Calculate growth trend from progress history
            let growthTrend = 0
            const history = progressHistory || []
            if (history.length >= 2) {
                const recent = history.slice(-7)
                const older = history.slice(-14, -7)
                if (recent.length > 0 && older.length > 0) {
                    const recentAvg = recent.reduce((sum, p) => sum + (p.overall_score || 0), 0) / recent.length
                    const olderAvg = older.reduce((sum, p) => sum + (p.overall_score || 0), 0) / older.length
                    growthTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) : 0
                }
            }

            // Extract coding stats from codingData (same format as Dashboard)
            const leetcodeCount = codingData?.leetcode?.problems?.all || codingData?.leetcode?.totalSolved || 0
            const githubContribs = codingData?.github?.contributions || codingData?.github?.totalContributions || 0
            const githubRepos = codingData?.github?.repositories || codingData?.github?.publicRepos || 0
            const hackerrankScore = codingData?.hackerrank?.score || codingData?.hackerrank?.totalScore || 0
            const hackerrankBadges = codingData?.hackerrank?.badges?.length || 0
            const currentStreak = codingData?.github?.currentStreak || codingData?.currentStreak || 0

            // Calculate overall growth score
            const growthScore = codingData?.growthScore || userData?.growthScore || 0

            setReportData({
                coding: {
                    leetcode: leetcodeCount,
                    github: githubContribs,
                    githubRepos: githubRepos,
                    hackerrank: hackerrankScore,
                    hackerrankBadges: hackerrankBadges,
                    streak: currentStreak,
                    growthScore: growthScore
                },
                academics: {
                    cgpa: academics?.cgpa || academics?.currentCGPA || 0,
                    sgpa: academics?.current_sgpa || academics?.currentSGPA || 0,
                    attendance: academics?.attendance || academics?.attendancePercentage || 0,
                    semester: academics?.currentSemester || 'N/A'
                },
                goals: {
                    completed: completedGoals,
                    total: totalGoals,
                    completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
                    activeGoals: goals.filter(g => g.status === 'in_progress' || g.status === 'active')
                },
                feedback: {
                    total: (feedbackData || []).length,
                    recent: (feedbackData || []).slice(0, 3)
                },
                growth: {
                    trend: growthTrend,
                    totalDays: history.length,
                    score: growthScore
                },
                generatedAt: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            })
        } catch (error) {
            console.error('Error fetching report data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrintReport = () => {
        setGeneratingPDF(true)
        setTimeout(() => {
            window.print()
            setGeneratingPDF(false)
        }, 500)
    }

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Reports</h1>
                    <p className="dashboard-subtitle">Loading your progress report...</p>
                </div>
                <div className="reports-loading">
                    <RefreshCw className="spinning" size={32} />
                    <p>Gathering your data...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="student">
            <div className="dashboard-header reports-header">
                <div>
                    <h1 className="dashboard-title">Progress Report</h1>
                    <p className="dashboard-subtitle">
                        Generated on {reportData?.generatedAt}
                    </p>
                </div>
                <div className="reports-actions">
                    <Button 
                        variant="ghost" 
                        icon={<RefreshCw size={16} />}
                        onClick={fetchReportData}
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="primary" 
                        icon={<Download size={16} />}
                        onClick={handlePrintReport}
                        loading={generatingPDF}
                    >
                        {generatingPDF ? 'Preparing...' : 'Print / Save PDF'}
                    </Button>
                </div>
            </div>

            <div className="report-content printable">
                {/* Overview Cards */}
                <div className="report-overview">
                    <Card className="report-stat-card">
                        <div className="report-stat-icon growth">
                            <TrendingUp size={24} />
                        </div>
                        <div className="report-stat-content">
                            <span className="report-stat-label">Growth Score</span>
                            <span className="report-stat-value">{reportData?.coding.growthScore || 0}</span>
                            <span className="report-stat-sub">Overall Performance</span>
                        </div>
                    </Card>

                    <Card className="report-stat-card">
                        <div className="report-stat-icon coding">
                            <Code2 size={24} />
                        </div>
                        <div className="report-stat-content">
                            <span className="report-stat-label">LeetCode</span>
                            <span className="report-stat-value">{reportData?.coding.leetcode}</span>
                            <span className="report-stat-sub">Problems Solved</span>
                        </div>
                    </Card>

                    <Card className="report-stat-card">
                        <div className="report-stat-icon academic">
                            <GraduationCap size={24} />
                        </div>
                        <div className="report-stat-content">
                            <span className="report-stat-label">CGPA</span>
                            <span className="report-stat-value">{reportData?.academics.cgpa?.toFixed(2) || '0.00'}</span>
                            <span className="report-stat-sub">SGPA: {reportData?.academics.sgpa?.toFixed(2) || '0.00'}</span>
                        </div>
                    </Card>

                    <Card className="report-stat-card">
                        <div className="report-stat-icon goals">
                            <Target size={24} />
                        </div>
                        <div className="report-stat-content">
                            <span className="report-stat-label">Goals</span>
                            <span className="report-stat-value">{reportData?.goals.completed}/{reportData?.goals.total}</span>
                            <span className="report-stat-sub">{reportData?.goals.completionRate}% Completed</span>
                        </div>
                    </Card>
                </div>

                {/* Detailed Sections */}
                <div className="report-sections">
                    {/* Coding Progress */}
                    <Card className="report-section">
                        <CardHeader>
                            <CardTitle icon={<Code2 size={20} />}>Coding Progress</CardTitle>
                            <Badge variant="primary" size="sm">Growth Score: {reportData?.coding.growthScore || 0}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="report-metrics">
                                <div className="report-metric">
                                    <div className="metric-header">
                                        <span className="metric-label">LeetCode Problems</span>
                                        <span className="metric-value">{reportData?.coding.leetcode}</span>
                                    </div>
                                    <ProgressBar 
                                        value={Math.min(reportData?.coding.leetcode || 0, 500)} 
                                        max={500} 
                                        variant="primary"
                                        showLabel={false}
                                    />
                                </div>
                                <div className="report-metric">
                                    <div className="metric-header">
                                        <span className="metric-label">GitHub Contributions</span>
                                        <span className="metric-value">{reportData?.coding.github}</span>
                                    </div>
                                    <ProgressBar 
                                        value={Math.min(reportData?.coding.github || 0, 1000)} 
                                        max={1000} 
                                        variant="success"
                                        showLabel={false}
                                    />
                                </div>
                                <div className="report-metric">
                                    <div className="metric-header">
                                        <span className="metric-label">GitHub Repositories</span>
                                        <span className="metric-value">{reportData?.coding.githubRepos}</span>
                                    </div>
                                    <ProgressBar 
                                        value={Math.min(reportData?.coding.githubRepos || 0, 50)} 
                                        max={50} 
                                        variant="success"
                                        showLabel={false}
                                    />
                                </div>
                                <div className="report-metric">
                                    <div className="metric-header">
                                        <span className="metric-label">HackerRank Score</span>
                                        <span className="metric-value">{reportData?.coding.hackerrank}</span>
                                    </div>
                                    <ProgressBar 
                                        value={Math.min(reportData?.coding.hackerrank || 0, 2000)} 
                                        max={2000} 
                                        variant="accent"
                                        showLabel={false}
                                    />
                                </div>
                                <div className="report-highlights">
                                    <div className="report-highlight">
                                        <Award size={20} />
                                        <span>Current Streak: <strong>{reportData?.coding.streak} days</strong></span>
                                    </div>
                                    {reportData?.coding.hackerrankBadges > 0 && (
                                        <div className="report-highlight">
                                            <Award size={20} />
                                            <span>HackerRank Badges: <strong>{reportData?.coding.hackerrankBadges}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Progress */}
                    <Card className="report-section">
                        <CardHeader>
                            <CardTitle icon={<GraduationCap size={20} />}>Academic Progress</CardTitle>
                            {reportData?.academics.semester !== 'N/A' && (
                                <Badge variant="secondary" size="sm">Semester {reportData?.academics.semester}</Badge>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="report-metrics">
                                <div className="report-gpa-display">
                                    <div className="gpa-item">
                                        <div className="gpa-circle large">
                                            <span className="gpa-value">{reportData?.academics.cgpa?.toFixed(2) || '0.00'}</span>
                                            <span className="gpa-label">CGPA</span>
                                        </div>
                                    </div>
                                    <div className="gpa-item">
                                        <div className="gpa-circle">
                                            <span className="gpa-value">{reportData?.academics.sgpa?.toFixed(2) || '0.00'}</span>
                                            <span className="gpa-label">SGPA</span>
                                        </div>
                                    </div>
                                    <div className="gpa-item">
                                        <div className="gpa-circle">
                                            <span className="gpa-value">{reportData?.academics.attendance || 0}%</span>
                                            <span className="gpa-label">Attendance</span>
                                        </div>
                                    </div>
                                </div>
                                {reportData?.academics.cgpa > 0 && (
                                    <div className="report-highlight academic-highlight">
                                        <GraduationCap size={20} />
                                        <span>
                                            {reportData?.academics.cgpa >= 9 ? 'Outstanding Performance! Keep it up!' :
                                             reportData?.academics.cgpa >= 8 ? 'Great Performance! Almost there!' :
                                             reportData?.academics.cgpa >= 7 ? 'Good Performance! Room for improvement.' :
                                             'Keep working hard to improve your grades.'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals Summary */}
                    <Card className="report-section">
                        <CardHeader>
                            <CardTitle icon={<Target size={20} />}>Goals Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="goals-summary-grid">
                                <div className="goals-summary-item">
                                    <CheckCircle2 size={24} className="icon-success" />
                                    <div>
                                        <span className="summary-value">{reportData?.goals.completed}</span>
                                        <span className="summary-label">Completed</span>
                                    </div>
                                </div>
                                <div className="goals-summary-item">
                                    <Clock size={24} className="icon-warning" />
                                    <div>
                                        <span className="summary-value">{reportData?.goals.total - reportData?.goals.completed}</span>
                                        <span className="summary-label">In Progress</span>
                                    </div>
                                </div>
                                <div className="goals-summary-item">
                                    <Target size={24} className="icon-primary" />
                                    <div>
                                        <span className="summary-value">{reportData?.goals.total}</span>
                                        <span className="summary-label">Total Goals</span>
                                    </div>
                                </div>
                            </div>
                            <div className="report-metric" style={{ marginTop: 'var(--spacing-4)' }}>
                                <div className="metric-header">
                                    <span className="metric-label">Completion Rate</span>
                                    <span className="metric-value">{reportData?.goals.completionRate}%</span>
                                </div>
                                <ProgressBar 
                                    value={reportData?.goals.completionRate || 0} 
                                    max={100} 
                                    variant="success"
                                    showLabel={false}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mentor Feedback */}
                    <Card className="report-section">
                        <CardHeader>
                            <CardTitle icon={<MessageSquare size={20} />}>Recent Feedback</CardTitle>
                            <Badge variant="primary" size="sm">{reportData?.feedback.total} Total</Badge>
                        </CardHeader>
                        <CardContent>
                            {reportData?.feedback.recent.length > 0 ? (
                                <div className="feedback-list">
                                    {reportData.feedback.recent.map((fb, idx) => (
                                        <div key={idx} className="feedback-item">
                                            <div className="feedback-header">
                                                <Badge 
                                                    variant={fb.type === 'positive' ? 'success' : fb.type === 'improvement' ? 'warning' : 'info'} 
                                                    size="sm"
                                                >
                                                    {fb.type || 'General'}
                                                </Badge>
                                                <span className="feedback-date">
                                                    {new Date(fb.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="feedback-message">{fb.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-feedback">No feedback received yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
