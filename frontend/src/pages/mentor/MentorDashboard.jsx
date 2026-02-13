import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userAPI } from '../../services/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import {
    Users,
    AlertTriangle,
    TrendingUp,
    MessageSquare,
    Eye,
    ArrowUpRight,
    RefreshCw,
    Search,
    Filter,
    Code2,
    Github,
    GraduationCap,
    ChevronRight,
    TrendingDown,
    ArrowUp,
    ArrowDown,
    Activity,
    Sparkles,
    Target,
    Calendar
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import './MentorDashboard.css'

export default function MentorDashboard() {
    const { userData, getAllStudents } = useAuth()
    const navigate = useNavigate()
    const [allStudents, setAllStudents] = useState([])
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAllDepartments, setShowAllDepartments] = useState(false)
    const [sortBy, setSortBy] = useState('growthScore') // 'growthScore', 'name', 'improvement'
    const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
    const [stats, setStats] = useState({
        totalStudents: 0,
        alerts: 0,
        avgGrowthScore: 0,
        feedbackGiven: 0,
        improving: 0,
        declining: 0
    })

    const mentorDepartment = userData?.department?.toLowerCase()

    useEffect(() => {
        loadStudents()
    }, [])

    // Filter students by department when allStudents or filter changes
    useEffect(() => {
        let filtered = allStudents

        // Filter by mentor's department unless showing all
        if (!showAllDepartments && mentorDepartment) {
            filtered = allStudents.filter(s => 
                s.department?.toLowerCase() === mentorDepartment
            )
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(s => 
                s.fullName?.toLowerCase().includes(term) ||
                s.rollNumber?.toLowerCase().includes(term) ||
                s.email?.toLowerCase().includes(term)
            )
        }

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            let compareValue = 0
            switch (sortBy) {
                case 'growthScore':
                    compareValue = (b.growthScore || 0) - (a.growthScore || 0)
                    break
                case 'name':
                    compareValue = (a.fullName || '').localeCompare(b.fullName || '')
                    break
                case 'improvement':
                    const aTrend = calculateTrend(a)
                    const bTrend = calculateTrend(b)
                    compareValue = bTrend - aTrend
                    break
                case 'cgpa':
                    compareValue = (b.academics?.cgpa || 0) - (a.academics?.cgpa || 0)
                    break
                default:
                    compareValue = 0
            }
            return sortOrder === 'desc' ? compareValue : -compareValue
        })

        setStudents(filtered)
        
        // Calculate stats for filtered students
        const totalStudents = filtered.length
        const alerts = filtered.filter(s => (s.growthScore || 0) < 50 || (s.academics?.attendance || 100) < 75).length
        const avgGrowthScore = totalStudents > 0
            ? Math.round(filtered.reduce((sum, s) => sum + (s.growthScore || 0), 0) / totalStudents)
            : 0
        const improving = filtered.filter(s => calculateTrend(s) > 0).length
        const declining = filtered.filter(s => calculateTrend(s) < 0).length

        setStats({
            totalStudents,
            alerts,
            avgGrowthScore,
            feedbackGiven: Math.floor(totalStudents * 0.8),
            improving,
            declining
        })
    }, [allStudents, showAllDepartments, searchTerm, mentorDepartment, sortBy, sortOrder])

    // Calculate student's trend (mock calculation - would need historical data)
    const calculateTrend = (student) => {
        // This is a mock - in real scenario you'd compare with historical data
        const score = student.growthScore || 0
        if (score >= 70) return Math.floor(Math.random() * 10) + 5
        if (score >= 50) return Math.floor(Math.random() * 10) - 5
        return -Math.floor(Math.random() * 5) - 3
    }

    const loadStudents = async () => {
        setLoading(true)
        try {
            // Try mentor-specific route first (students with mentorId), fall back to all students
            let fetchedStudents = []
            if (userData?.id) {
                try {
                    fetchedStudents = await userAPI.getMentorStudents(userData.id)
                } catch (e) {
                    console.warn('Mentor-specific route failed, falling back to getAllStudents:', e)
                }
            }
            // Fallback: get all students if mentor route returned empty or failed
            if (fetchedStudents.length === 0) {
                fetchedStudents = await getAllStudents()
            }
            console.log("Fetched users:", fetchedStudents)
            setAllStudents(fetchedStudents)
        } catch (error) {
            console.error('Error loading students:', error)
        }
        setLoading(false)
    }

    // Department-wise performance data from actual students
    const getDepartmentData = () => {
        const depts = {}
        allStudents.forEach(student => {
            const dept = student.department?.toUpperCase() || 'OTHER'
            if (!depts[dept]) {
                depts[dept] = { scores: [], count: 0 }
            }
            depts[dept].scores.push(student.growthScore || 0)
            depts[dept].count++
        })

        return Object.entries(depts).map(([name, data]) => ({
            name,
            avgScore: data.scores.length > 0
                ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
                : 0,
            count: data.count
        }))
    }

    // Performance distribution for pie chart
    const getPerformanceDistribution = () => {
        const excellent = students.filter(s => (s.growthScore || 0) >= 80).length
        const good = students.filter(s => (s.growthScore || 0) >= 60 && (s.growthScore || 0) < 80).length
        const average = students.filter(s => (s.growthScore || 0) >= 40 && (s.growthScore || 0) < 60).length
        const atRisk = students.filter(s => (s.growthScore || 0) < 40).length

        return [
            { name: 'Excellent', value: excellent, color: '#10b981' },
            { name: 'Good', value: good, color: '#3b82f6' },
            { name: 'Average', value: average, color: '#f59e0b' },
            { name: 'At Risk', value: atRisk, color: '#ef4444' }
        ].filter(d => d.value > 0)
    }

    // Students needing attention (low growth score or attendance)
    const alertStudents = students
        .filter(s => (s.growthScore || 0) < 50 || (s.academics?.attendance || 100) < 75)
        .sort((a, b) => (a.growthScore || 0) - (b.growthScore || 0))
        .slice(0, 5)

    // Top performers
    const topPerformers = [...students]
        .sort((a, b) => (b.growthScore || 0) - (a.growthScore || 0))
        .slice(0, 5)

    // Common skill gaps
    const skillGaps = [
        { skill: 'Data Structures', percentage: 45, students: Math.floor(students.length * 0.45) },
        { skill: 'System Design', percentage: 62, students: Math.floor(students.length * 0.62) },
        { skill: 'SQL/Database', percentage: 38, students: Math.floor(students.length * 0.38) },
        { skill: 'Web Development', percentage: 55, students: Math.floor(students.length * 0.55) },
    ]

    // Get growth trend over time (mock data - would be real in production)
    const getGrowthTrendData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const avgScore = stats.avgGrowthScore || 60
        
        return months.map((month, idx) => ({
            month,
            avgScore: Math.max(30, Math.min(100, avgScore - (5 - idx) * 8 + Math.random() * 10)),
            improving: Math.floor(stats.improving * (0.6 + idx * 0.08)),
            atRisk: Math.floor(stats.alerts * (1.2 - idx * 0.1))
        }))
    }

    // Get most active students (by recent activity)
    const getMostActiveStudents = () => {
        return [...students]
            .sort((a, b) => {
                const aActivity = (a.codingData?.githubCommits || 0) + (a.codingData?.leetcodeRecent || 0)
                const bActivity = (b.codingData?.githubCommits || 0) + (b.codingData?.leetcodeRecent || 0)
                return bActivity - aActivity
            })
            .slice(0, 5)
    }

    // Get improvement leaders (students showing most improvement)
    const getImprovementLeaders = () => {
        return [...students]
            .map(s => ({ ...s, trend: calculateTrend(s) }))
            .filter(s => s.trend > 0)
            .sort((a, b) => b.trend - a.trend)
            .slice(0, 5)
    }

    const TrendIndicator = ({ value }) => {
        if (!value || value === 0) return <span className="trend-neutral">—</span>
        return value > 0 ? (
            <span className="trend-up">
                <ArrowUp size={14} /> {value}
            </span>
        ) : (
            <span className="trend-down">
                <ArrowDown size={14} /> {Math.abs(value)}
            </span>
        )
    }

    const handleViewStudent = (studentId) => {
        navigate(`/mentor/student/${studentId}`)
    }

    if (loading) {
        return (
            <DashboardLayout role="mentor">
                <div className="loading-container">
                    <RefreshCw className="spin" size={32} />
                    <p>Loading mentor dashboard...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="mentor">
            <div className="mentor-dashboard">
                <div className="dashboard-header">
                    <div className="header-info">
                        <h1 className="dashboard-title">Mentor Dashboard</h1>
                        <p className="dashboard-subtitle">
                            Welcome, {userData?.fullName || 'Mentor'}! 
                            {mentorDepartment && <span className="dept-badge">{mentorDepartment.toUpperCase()} Department</span>}
                        </p>
                    </div>
                    <div className="header-actions">
                        <Button variant="outline" icon={<RefreshCw size={18} />} onClick={loadStudents}>
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="My Students"
                        value={stats.totalStudents.toString()}
                        change={showAllDepartments ? 'All departments' : `${mentorDepartment?.toUpperCase() || ''} only`}
                        icon={<Users size={24} />}
                        iconColor="primary"
                    />
                    <StatCard
                        title="Need Attention"
                        value={stats.alerts.toString()}
                        change={stats.alerts > 0 ? 'Requires follow-up' : 'All good!'}
                        changeType={stats.alerts > 0 ? 'negative' : 'positive'}
                        icon={<AlertTriangle size={24} />}
                        iconColor="warning"
                    />
                    <StatCard
                        title="Avg Growth Score"
                        value={stats.avgGrowthScore.toString()}
                        change="Out of 100"
                        changeType={stats.avgGrowthScore >= 60 ? 'positive' : 'neutral'}
                        icon={<TrendingUp size={24} />}
                        iconColor="accent"
                    />
                    <StatCard
                        title="Improving Students"
                        value={stats.improving.toString()}
                        change={`${stats.declining} declining`}
                        changeType={stats.improving > stats.declining ? 'positive' : 'warning'}
                        icon={<Sparkles size={24} />}
                        iconColor="secondary"
                    />
                </div>

                {/* Growth Overview Card */}
                <Card variant="gradient" padding="lg" className="growth-overview-card">
                    <CardContent>
                        <div className="growth-overview-header">
                            <div>
                                <h3 className="growth-overview-title">Class Growth Overview</h3>
                                <p className="growth-overview-subtitle">Monitor your students' progress trends</p>
                            </div>
                            <div className="growth-stats-mini">
                                <div className="growth-mini-stat success">
                                    <Activity size={18} />
                                    <span>{stats.improving} Improving</span>
                                </div>
                                <div className="growth-mini-stat warning">
                                    <TrendingDown size={18} />
                                    <span>{stats.declining} Need Support</span>
                                </div>
                            </div>
                        </div>
                        <div className="growth-trend-chart">
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={getGrowthTrendData()}>
                                    <defs>
                                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                                    <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(0,0,0,0.8)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avgScore"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fill="url(#scoreGradient)"
                                        name="Avg Score"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search students by name, roll number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-controls">
                        <div className="sort-dropdown">
                            <Filter size={16} />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="growthScore">Sort by Score</option>
                                <option value="improvement">Sort by Improvement</option>
                                <option value="name">Sort by Name</option>
                                <option value="cgpa">Sort by CGPA</option>
                            </select>
                            <button 
                                className="sort-order-btn"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            >
                                {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            </button>
                        </div>
                        <div className="filter-toggle">
                            <button 
                                className={`filter-btn ${!showAllDepartments ? 'active' : ''}`}
                                onClick={() => setShowAllDepartments(false)}
                            >
                                My Department
                            </button>
                            <button 
                                className={`filter-btn ${showAllDepartments ? 'active' : ''}`}
                                onClick={() => setShowAllDepartments(true)}
                            >
                                All Departments
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="mentor-content-grid">
                    {/* Left Column */}
                    <div className="content-column">
                        {/* Improvement Leaders */}
                        <Card className="improvement-card">
                            <CardHeader>
                                <div className="card-header-row">
                                    <CardTitle>
                                        <Sparkles size={18} className="icon-success" />
                                        Improvement Leaders
                                    </CardTitle>
                                    <Badge variant="success">{stats.improving}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {getImprovementLeaders().length > 0 ? (
                                    <div className="improvement-list">
                                        {getImprovementLeaders().map((student, idx) => (
                                            <div 
                                                key={student.id || idx} 
                                                className="improvement-item"
                                                onClick={() => handleViewStudent(student.id)}
                                            >
                                                <div className="student-avatar-sm success">
                                                    {student.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div className="improvement-info">
                                                    <span className="name">{student.fullName}</span>
                                                    <div className="improvement-details">
                                                        <Badge variant="success" size="sm">+{student.trend} pts</Badge>
                                                        <span className="dept">{student.department?.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <span className="score success">{student.growthScore || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <span className="emoji">📈</span>
                                        <p>No improvement data yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Students Needing Attention */}
                        <Card className="alert-card">
                            <CardHeader>
                                <div className="card-header-row">
                                    <CardTitle>
                                        <AlertTriangle size={18} className="icon-warning" />
                                        Students Needing Attention
                                    </CardTitle>
                                    <Badge variant="warning">{alertStudents.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {alertStudents.length > 0 ? (
                                    <div className="alert-students-list">
                                        {alertStudents.map((student, idx) => (
                                            <div 
                                                key={student.id || idx} 
                                                className="alert-student-item"
                                                onClick={() => handleViewStudent(student.id)}
                                            >
                                                <div className="student-avatar-lg">
                                                    {student.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div className="student-details">
                                                    <h4>{student.fullName || 'Unknown'}</h4>
                                                    <p>{student.rollNumber} • {student.department?.toUpperCase()}</p>
                                                    <div className="alert-badges">
                                                        {(student.growthScore || 0) < 50 && (
                                                            <Badge variant="error" size="sm">Score: {student.growthScore || 0}</Badge>
                                                        )}
                                                        {(student.academics?.attendance || 100) < 75 && (
                                                            <Badge variant="warning" size="sm">Attendance: {student.academics?.attendance || 0}%</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="chevron" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <span className="emoji">🎉</span>
                                        <p>All students are performing well!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Performers */}
                        <Card className="performers-card">
                            <CardHeader>
                                <div className="card-header-row">
                                    <CardTitle>
                                        <TrendingUp size={18} className="icon-success" />
                                        Top Performers
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="performers-list">
                                    {topPerformers.map((student, idx) => (
                                        <div 
                                            key={student.id || idx} 
                                            className="performer-item"
                                            onClick={() => handleViewStudent(student.id)}
                                        >
                                            <span className="rank">#{idx + 1}</span>
                                            <div className="student-avatar-sm">
                                                {student.fullName?.charAt(0) || 'S'}
                                            </div>
                                            <div className="performer-info">
                                                <span className="name">{student.fullName}</span>
                                                <span className="dept">{student.department?.toUpperCase()}</span>
                                            </div>
                                            <span className="score">{student.growthScore || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Charts */}
                    <div className="content-column">
                        {/* Performance Distribution */}
                        <Card className="chart-card">
                            <CardHeader>
                                <CardTitle>Performance Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="pie-chart-container">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={getPerformanceDistribution()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {getPerformanceDistribution().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="pie-legend">
                                        {getPerformanceDistribution().map((item, idx) => (
                                            <div key={idx} className="legend-item">
                                                <span className="legend-dot" style={{ background: item.color }}></span>
                                                <span className="legend-label">{item.name}</span>
                                                <span className="legend-value">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Department Performance */}
                        <Card className="chart-card">
                            <CardHeader>
                                <CardTitle>Department Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={getDepartmentData()} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                                        <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={60} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(value, name) => [value, 'Avg Score']}
                                        />
                                        <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {/* Student Table */}
                <Card className="students-table-card">
                    <CardHeader>
                        <div className="card-header-row">
                            <CardTitle>All Students</CardTitle>
                            <span className="table-count">{students.length} students</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="students-table">
                            <div className="students-table-header">
                                <span>Student</span>
                                <span>Department</span>
                                <span>Year</span>
                                <span>Growth Score</span>
                                <span>Trend</span>
                                <span>CGPA</span>
                                <span>Status</span>
                                <span>Actions</span>
                            </div>
                            <div className="students-table-body">
                                {students.slice(0, 20).map((student, idx) => {
                                    const trend = calculateTrend(student)
                                    return (
                                        <div key={student.id || idx} className="students-table-row">
                                            <div className="student-cell">
                                                <div className="student-avatar">{student.fullName?.charAt(0) || 'S'}</div>
                                                <div className="student-info">
                                                    <span className="student-name">{student.fullName || 'Unknown'}</span>
                                                    <span className="student-roll">{student.rollNumber || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <span className="dept-cell">{student.department?.toUpperCase() || 'N/A'}</span>
                                            <span className="year-cell">{student.year ? `Year ${student.year}` : 'N/A'}</span>
                                            <div className="score-cell">
                                                <span className="score-value" style={{
                                                    color: (student.growthScore || 0) >= 70 ? '#10b981' : 
                                                           (student.growthScore || 0) >= 50 ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {student.growthScore || 0}
                                                </span>
                                            </div>
                                            <div className="trend-cell">
                                                <TrendIndicator value={trend} />
                                            </div>
                                            <span className="cgpa-cell">{student.academics?.cgpa?.toFixed(1) || 'N/A'}</span>
                                            <Badge
                                                variant={(student.growthScore || 0) >= 70 ? 'success' : (student.growthScore || 0) >= 50 ? 'warning' : 'error'}
                                                size="sm"
                                            >
                                                {(student.growthScore || 0) >= 70 ? 'Good' : (student.growthScore || 0) >= 50 ? 'Average' : 'At Risk'}
                                            </Badge>
                                            <div className="actions-cell">
                                                <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    icon={<Eye size={14} />}
                                                    onClick={() => handleViewStudent(student.id)}
                                                >
                                                    View
                                                </Button>
                                                <Link to={`/mentor/feedback?student=${student.id}`}>
                                                    <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />} />
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {students.length === 0 && (
                            <div className="empty-state">
                                <span className="emoji">📚</span>
                                <p>No students found in {showAllDepartments ? 'any department' : 'your department'}.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Skill Gaps */}
                <Card className="skill-gaps-card">
                    <CardHeader>
                        <CardTitle>Common Skill Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="skill-gaps-grid">
                            {skillGaps.map((gap, idx) => (
                                <div key={idx} className="skill-gap-item">
                                    <div className="skill-gap-header">
                                        <span className="skill-gap-name">{gap.skill}</span>
                                        <span className="skill-gap-count">{gap.students} students</span>
                                    </div>
                                    <ProgressBar value={100 - gap.percentage} max={100} variant="primary" size="sm" />
                                    <span className="skill-gap-pct">{100 - gap.percentage}% proficient</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
