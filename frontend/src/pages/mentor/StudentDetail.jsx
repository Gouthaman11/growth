import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { userAPI, codingDataAPI, progressAPI, academicsAPI } from '../../services/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import {
    ArrowLeft,
    Github,
    Linkedin,
    Globe,
    Code2,
    GraduationCap,
    Calendar,
    Target,
    MessageSquare,
    TrendingUp,
    RefreshCw,
    ExternalLink,
    Award,
    Trophy,
    Activity,
    BookOpen
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar
} from 'recharts'
import './StudentDetail.css'

export default function StudentDetail() {
    const { id } = useParams()
    const [student, setStudent] = useState(null)
    const [platformData, setPlatformData] = useState(null)
    const [academicData, setAcademicData] = useState(null)
    const [progressHistory, setProgressHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        if (id) {
            loadStudent()
        }
    }, [id])

    const loadStudent = async () => {
        setLoading(true)
        try {
            // Load user data
            const data = await userAPI.getUser(id)
            if (data) {
                setStudent(data)

                // Load coding data from API
                try {
                    const codingData = await codingDataAPI.get(id)
                    if (codingData) {
                        setPlatformData({
                            github: codingData.github,
                            leetcode: codingData.leetcode,
                            hackerrank: codingData.hackerrank
                        })
                    }
                } catch (e) {
                    console.log('Coding data not available')
                }

                // Load academic data
                try {
                    const acadRes = await academicsAPI.getData(id)
                    if (acadRes?.data) {
                        setAcademicData(acadRes.data)
                    }
                } catch (e) {
                    console.log('Academic data not available')
                }

                // Load progress history
                try {
                    const history = await progressAPI.getHistory(id, 30)
                    setProgressHistory(history || [])
                } catch (e) {
                    console.log('Progress history not available')
                }
            }
        } catch (error) {
            console.error('Error loading student:', error)
        }
        setLoading(false)
    }

    const syncPlatformData = async () => {
        if (!id) return

        setSyncing(true)
        try {
            const syncResult = await codingDataAPI.syncAll(id)
            setPlatformData({
                github: syncResult.github,
                leetcode: syncResult.leetcode,
                hackerrank: syncResult.hackerrank
            })
            
            // Reload student to get updated growth score
            const data = await userAPI.getUser(id)
            if (data) {
                setStudent(data)
            }
        } catch (error) {
            console.error('Error syncing:', error)
        }
        setSyncing(false)
    }

    // Generate growth data from history or based on current score
    const growthScore = student?.growthScore || 0
    const getGrowthData = () => {
        if (progressHistory.length > 0) {
            return progressHistory.slice(-7).map(h => ({
                date: new Date(h.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: h.growthScore || 0
            }))
        }
        
        // Generate placeholder trend if no history
        return [
            { date: 'Sep', score: Math.max(0, growthScore - 30) },
            { date: 'Oct', score: Math.max(0, growthScore - 22) },
            { date: 'Nov', score: Math.max(0, growthScore - 15) },
            { date: 'Dec', score: Math.max(0, growthScore - 8) },
            { date: 'Jan', score: Math.max(0, growthScore - 3) },
            { date: 'Feb', score: growthScore },
        ]
    }

    // LeetCode breakdown for pie chart
    const getLeetCodeBreakdown = () => {
        const lc = platformData?.leetcode || {}
        return [
            { name: 'Easy', value: lc.easySolved || 0, color: '#22c55e' },
            { name: 'Medium', value: lc.mediumSolved || 0, color: '#f59e0b' },
            { name: 'Hard', value: lc.hardSolved || 0, color: '#ef4444' }
        ].filter(d => d.value > 0)
    }

    // Skills radar data
    const getSkillsData = () => {
        const totalProblems = platformData?.leetcode?.totalSolved || 0
        const repos = platformData?.github?.publicRepos || 0
        const commits = platformData?.github?.recentCommits || 0
        const hrBadges = platformData?.hackerrank?.badges || 0
        const cgpa = academicData?.cgpa || student?.academics?.cgpa || 0
        
        return [
            { skill: 'DSA', value: Math.min(100, Math.round(totalProblems / 2.5)), fullMark: 100 },
            { skill: 'Projects', value: Math.min(100, repos * 8), fullMark: 100 },
            { skill: 'Git Skills', value: Math.min(100, commits * 2 + repos * 4), fullMark: 100 },
            { skill: 'Certifications', value: Math.min(100, hrBadges * 10), fullMark: 100 },
            { skill: 'Academics', value: Math.min(100, cgpa * 10), fullMark: 100 },
        ]
    }

    const cgpa = academicData?.cgpa || student?.academics?.cgpa || 0
    const sgpa = academicData?.sgpa || student?.academics?.sgpa || 0
    const attendance = academicData?.attendance || student?.academics?.attendance || 0

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="loading-container">
                    <RefreshCw className="spin" size={32} />
                    <p>Loading student details...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (!student) {
        return (
            <DashboardLayout role="mentor">
                <div className="not-found">
                    <h2>Student not found</h2>
                    <Link to="/mentor/dashboard">
                        <Button variant="primary">Back to Dashboard</Button>
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="mentor">
            <div className="student-detail-page">
                <div className="detail-header">
                    <div className="header-with-back">
                        <Link to="/mentor/dashboard" className="back-link">
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </Link>
                    </div>
                    <div className="header-actions">
                        <Button variant="outline" icon={<RefreshCw size={18} className={syncing ? 'spin' : ''} />} onClick={syncPlatformData} disabled={syncing}>
                            {syncing ? 'Syncing...' : 'Sync Data'}
                        </Button>
                        <Link to={`/mentor/feedback?student=${id}`}>
                            <Button variant="primary" icon={<MessageSquare size={18} />}>
                                Give Feedback
                            </Button>
                        </Link>
                    </div>
                </div>

            {/* Student Profile Card */}
            <Card className="student-profile-card">
                <div className="profile-layout">
                    <div className="profile-main">
                        <div className="profile-avatar">
                            {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="profile-info">
                            <h2>{student.fullName || 'Unknown Student'}</h2>
                            <p className="student-id">{student.rollNumber || 'No Roll Number'} • {student.email}</p>
                            <div className="profile-badges">
                                <Badge variant="primary">{student.department?.toUpperCase() || 'N/A'}</Badge>
                                <Badge variant="secondary">Year {student.year || 'N/A'}</Badge>
                                <Badge
                                    variant={growthScore >= 70 ? 'success' : growthScore >= 50 ? 'warning' : 'error'}
                                >
                                    Growth Score: {growthScore}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="profile-links">
                        {student.codingProfiles?.github && (
                            <a href={`https://github.com/${student.codingProfiles.github}`} target="_blank" rel="noopener noreferrer" className="profile-link github">
                                <Github size={20} />
                            </a>
                        )}
                        {student.codingProfiles?.leetcode && (
                            <a href={`https://leetcode.com/u/${student.codingProfiles.leetcode}`} target="_blank" rel="noopener noreferrer" className="profile-link leetcode">
                                <Code2 size={20} />
                            </a>
                        )}
                        {student.codingProfiles?.hackerrank && (
                            <a href={`https://www.hackerrank.com/profile/${student.codingProfiles.hackerrank}`} target="_blank" rel="noopener noreferrer" className="profile-link hackerrank">
                                <Award size={20} />
                            </a>
                        )}
                        {student.codingProfiles?.linkedin && (
                            <a href={student.codingProfiles.linkedin} target="_blank" rel="noopener noreferrer" className="profile-link linkedin">
                                <Linkedin size={20} />
                            </a>
                        )}
                    </div>
                </div>
            </Card>

            {/* Stats Row */}
            <div className="stats-grid">
                <StatCard
                    title="Growth Score"
                    value={growthScore.toString()}
                    icon={<TrendingUp size={24} />}
                    iconColor="primary"
                />
                <StatCard
                    title="LeetCode"
                    value={(platformData?.leetcode?.totalSolved || 0).toString()}
                    change={`${platformData?.leetcode?.hardSolved || 0} Hard`}
                    icon={<Code2 size={24} />}
                    iconColor="accent"
                />
                <StatCard
                    title="GitHub Repos"
                    value={(platformData?.github?.publicRepos || 0).toString()}
                    change={`${platformData?.github?.followers || 0} followers`}
                    icon={<Github size={24} />}
                    iconColor="secondary"
                />
                <StatCard
                    title="CGPA"
                    value={cgpa.toFixed(1)}
                    change={`SGPA: ${sgpa.toFixed(1)}`}
                    icon={<BookOpen size={24} />}
                    iconColor="warning"
                />
            </div>

            {/* Academic Details */}
            <Card className="academic-summary-card">
                <CardHeader>
                    <CardTitle>
                        <GraduationCap size={18} />
                        Academic Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="academic-stats">
                        <div className="academic-stat-item">
                            <div className="gpa-circle" style={{ borderColor: cgpa >= 8 ? '#10b981' : cgpa >= 7 ? '#f59e0b' : '#ef4444' }}>
                                <span className="gpa-value">{cgpa.toFixed(2)}</span>
                                <span className="gpa-label">CGPA</span>
                            </div>
                        </div>
                        <div className="academic-stat-item">
                            <div className="gpa-circle" style={{ borderColor: sgpa >= 8 ? '#10b981' : sgpa >= 7 ? '#f59e0b' : '#ef4444' }}>
                                <span className="gpa-value">{sgpa.toFixed(2)}</span>
                                <span className="gpa-label">SGPA</span>
                            </div>
                        </div>
                        <div className="attendance-section">
                            <div className="attendance-header">
                                <span>Attendance</span>
                                <span className={attendance < 75 ? 'warning' : ''}>{attendance}%</span>
                            </div>
                            <ProgressBar value={attendance} max={100} variant={attendance >= 75 ? 'success' : 'error'} />
                            {attendance < 75 && (
                                <span className="attendance-warning">⚠️ Below 75% minimum</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="charts-row">
                <Card className="chart-card growth-chart">
                    <CardHeader>
                        <CardTitle><TrendingUp size={18} /> Growth Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={getGrowthData()}>
                                <defs>
                                    <linearGradient id="detailGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '0.85rem' }}
                                    labelStyle={{ fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#detailGrowthGradient)" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="chart-card skills-chart">
                    <CardHeader>
                        <CardTitle><Target size={18} /> Skills Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={getSkillsData()} cx="50%" cy="50%">
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="skill" stroke="#6b7280" fontSize={12} fontWeight={500} />
                                <Radar
                                    name="Skills"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.25}
                                    strokeWidth={2.5}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Cards */}
            <div className="platform-cards-grid">
                {/* GitHub Card */}
                {platformData?.github && (
                    <Card className="platform-card github-card">
                        <CardHeader>
                            <div className="card-header-row">
                                <CardTitle>
                                    <Github size={18} />
                                    GitHub
                                </CardTitle>
                                <a href={platformData.github.profileUrl || `https://github.com/${platformData.github.username}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="platform-stats">
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.github.publicRepos || 0}</span>
                                    <span className="stat-label">Repos</span>
                                </div>
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.github.recentCommits || 0}</span>
                                    <span className="stat-label">Commits</span>
                                </div>
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.github.totalStars || 0}</span>
                                    <span className="stat-label">Stars</span>
                                </div>
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.github.followers || 0}</span>
                                    <span className="stat-label">Followers</span>
                                </div>
                            </div>
                            {platformData.github.topLanguages?.length > 0 && (
                                <div className="languages-section">
                                    <span className="section-label">Top Languages:</span>
                                    <div className="language-tags">
                                        {platformData.github.topLanguages.slice(0, 4).map((lang, idx) => (
                                            <Badge key={idx} variant="secondary" size="sm">{lang.language}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* LeetCode Card */}
                {platformData?.leetcode && (
                    <Card className="platform-card leetcode-card">
                        <CardHeader>
                            <div className="card-header-row">
                                <CardTitle>
                                    <Code2 size={18} />
                                    LeetCode
                                </CardTitle>
                                <a href={platformData.leetcode.profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="leetcode-breakdown">
                                <div className="lc-chart">
                                    {getLeetCodeBreakdown().length > 0 ? (
                                        <ResponsiveContainer width="100%" height={120}>
                                            <PieChart>
                                                <Pie
                                                    data={getLeetCodeBreakdown()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={50}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {getLeetCodeBreakdown().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="no-data">No problems solved yet</div>
                                    )}
                                </div>
                                <div className="lc-details">
                                    <div className="lc-stat easy">
                                        <span className="dot" style={{background: '#22c55e'}}></span>
                                        <span>Easy: {platformData.leetcode.easySolved || 0}</span>
                                    </div>
                                    <div className="lc-stat medium">
                                        <span className="dot" style={{background: '#f59e0b'}}></span>
                                        <span>Medium: {platformData.leetcode.mediumSolved || 0}</span>
                                    </div>
                                    <div className="lc-stat hard">
                                        <span className="dot" style={{background: '#ef4444'}}></span>
                                        <span>Hard: {platformData.leetcode.hardSolved || 0}</span>
                                    </div>
                                    <div className="lc-total">
                                        Total: <strong>{platformData.leetcode.totalSolved || 0}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="lc-ranking">
                                <Trophy size={14} />
                                Ranking: #{platformData.leetcode.ranking?.toLocaleString() || 'N/A'}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* HackerRank Card */}
                {platformData?.hackerrank && (
                    <Card className="platform-card hackerrank-card">
                        <CardHeader>
                            <div className="card-header-row">
                                <CardTitle>
                                    <Award size={18} />
                                    HackerRank
                                </CardTitle>
                                <a href={platformData.hackerrank.profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="platform-stats">
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.hackerrank.badges || 0}</span>
                                    <span className="stat-label">Badges</span>
                                </div>
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.hackerrank.certificates || 0}</span>
                                    <span className="stat-label">Certificates</span>
                                </div>
                                <div className="platform-stat">
                                    <span className="stat-value">{platformData.hackerrank.solvedChallenges || 0}</span>
                                    <span className="stat-label">Solved</span>
                                </div>
                                <div className="platform-stat gold">
                                    <span className="stat-value">{platformData.hackerrank.goldBadges || 0}</span>
                                    <span className="stat-label">Gold</span>
                                </div>
                            </div>
                            {platformData.hackerrank.skills?.length > 0 && (
                                <div className="skills-section">
                                    <span className="section-label">Skills:</span>
                                    <div className="skill-tags">
                                        {platformData.hackerrank.skills.slice(0, 4).map((skill, idx) => (
                                            <Badge key={idx} variant="warning" size="sm">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
                {!platformData?.github && !platformData?.leetcode && !platformData?.hackerrank && (
                    <Card className="no-platforms-card">
                        <div className="empty-icon">
                            <Code2 size={28} />
                        </div>
                        <p>No coding platform data available yet.<br/>Click "Sync Data" to fetch the latest stats.</p>
                    </Card>
                )}
            </div>

            {/* Mentoring Notes */}
            <Card className="mentoring-card">
                <CardHeader>
                    <CardTitle>
                        <MessageSquare size={18} />
                        Mentor Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mentoring-actions">
                        <Link to={`/mentor/feedback?student=${id}`}>
                            <Button variant="primary" icon={<MessageSquare size={18} />}>
                                Send Feedback
                            </Button>
                        </Link>
                        <Button variant="outline" icon={<Activity size={18} />}>
                            View Feedback History
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
        </DashboardLayout>
    )
}
