import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import {
    TrendingUp,
    Code2,
    MessageSquare,
    Target,
    Github,
    UserCheck,
    Users,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Star,
    Play
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
    return (
        <div className="landing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-pattern"></div>
                </div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="hero-badge animate-fade-in-down">
                            <span className="hero-badge-dot"></span>
                            Trusted by 50+ Universities
                        </div>
                        <h1 className="hero-title animate-fade-in-up">
                            Track Student Growth.
                            <br />
                            <span className="text-gradient">Build Career Readiness.</span>
                        </h1>
                        <p className="hero-subtitle animate-fade-in-up">
                            An intelligent platform to monitor academics, skills, and coding progress.
                            Empower students, mentors, and administrators with data-driven insights.
                        </p>
                        <div className="hero-actions animate-fade-in-up">
                            <Link to="/auth/select-role">
                                <Button variant="primary" size="lg" icon={<ArrowRight size={20} />} iconPosition="right">
                                    Get Started
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" icon={<Play size={20} />}>
                                Request Demo
                            </Button>
                        </div>
                        <div className="hero-stats animate-fade-in-up">
                            <div className="hero-stat">
                                <span className="hero-stat-value">10K+</span>
                                <span className="hero-stat-label">Students</span>
                            </div>
                            <div className="hero-stat-divider"></div>
                            <div className="hero-stat">
                                <span className="hero-stat-value">500+</span>
                                <span className="hero-stat-label">Mentors</span>
                            </div>
                            <div className="hero-stat-divider"></div>
                            <div className="hero-stat">
                                <span className="hero-stat-value">95%</span>
                                <span className="hero-stat-label">Placement Rate</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual animate-fade-in">
                        <div className="hero-dashboard-preview">
                            <div className="hero-dashboard-header">
                                <div className="hero-dashboard-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                            <div className="hero-dashboard-content">
                                <div className="hero-chart-preview">
                                    <div className="hero-chart-bar" style={{ height: '60%' }}></div>
                                    <div className="hero-chart-bar" style={{ height: '80%' }}></div>
                                    <div className="hero-chart-bar" style={{ height: '45%' }}></div>
                                    <div className="hero-chart-bar" style={{ height: '90%' }}></div>
                                    <div className="hero-chart-bar" style={{ height: '70%' }}></div>
                                    <div className="hero-chart-bar" style={{ height: '85%' }}></div>
                                </div>
                                <div className="hero-score-preview">
                                    <div className="hero-score-circle">
                                        <span>87</span>
                                    </div>
                                    <p>Growth Score</p>
                                </div>
                            </div>
                        </div>
                        <div className="hero-floating-card hero-floating-card-1 animate-float">
                            <Code2 size={24} />
                            <div>
                                <span>LeetCode</span>
                                <strong>324 Problems</strong>
                            </div>
                        </div>
                        <div className="hero-floating-card hero-floating-card-2 animate-float" style={{ animationDelay: '0.5s' }}>
                            <Github size={24} />
                            <div>
                                <span>GitHub</span>
                                <strong>847 Contributions</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section features" id="features">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Why EduGrow+</span>
                        <h2 className="section-title">Everything You Need for Student Success</h2>
                        <p className="section-subtitle">
                            A comprehensive platform that connects academics with career readiness
                        </p>
                    </div>
                    <div className="features-grid">
                        <Card variant="glass" padding="lg" hover className="feature-card animate-fade-in-up">
                            <div className="card-icon">
                                <TrendingUp size={24} />
                            </div>
                            <CardContent>
                                <h3 className="feature-title">Academic Tracking</h3>
                                <p className="feature-description">
                                    Monitor GPA, attendance, and course progress with real-time updates and trend analysis.
                                </p>
                            </CardContent>
                        </Card>
                        <Card variant="glass" padding="lg" hover className="feature-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="card-icon card-icon-secondary">
                                <Code2 size={24} />
                            </div>
                            <CardContent>
                                <h3 className="feature-title">Skill & Coding Analytics</h3>
                                <p className="feature-description">
                                    Track coding practice across platforms and measure technical skill development.
                                </p>
                            </CardContent>
                        </Card>
                        <Card variant="glass" padding="lg" hover className="feature-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="card-icon card-icon-accent">
                                <MessageSquare size={24} />
                            </div>
                            <CardContent>
                                <h3 className="feature-title">Mentor Feedback System</h3>
                                <p className="feature-description">
                                    Structured feedback loops between mentors and students for continuous improvement.
                                </p>
                            </CardContent>
                        </Card>
                        <Card variant="glass" padding="lg" hover className="feature-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                                <Target size={24} />
                            </div>
                            <CardContent>
                                <h3 className="feature-title">Placement Readiness</h3>
                                <p className="feature-description">
                                    AI-powered insights on job readiness with personalized improvement recommendations.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="section integrations" id="integrations">
                <div className="container">
                    <div className="integrations-content">
                        <div className="integrations-text">
                            <span className="section-badge">Platform Integrations</span>
                            <h2 className="section-title">Connect Your Coding Journey</h2>
                            <p className="section-subtitle">
                                Automatically fetch coding activity and skill growth data from all major platforms.
                            </p>
                            <ul className="integrations-list">
                                <li><CheckCircle2 size={20} /> Real-time sync with GitHub activity</li>
                                <li><CheckCircle2 size={20} /> LeetCode problem tracking</li>
                                <li><CheckCircle2 size={20} /> HackerRank skill badges</li>
                                <li><CheckCircle2 size={20} /> CodeChef contest ratings</li>
                            </ul>
                        </div>
                        <div className="integrations-logos">
                            <div className="integration-logo github">
                                <Github size={40} />
                                <span>GitHub</span>
                            </div>
                            <div className="integration-logo leetcode">
                                <Code2 size={40} />
                                <span>LeetCode</span>
                            </div>
                            <div className="integration-logo hackerrank">
                                <Code2 size={40} />
                                <span>HackerRank</span>
                            </div>
                            <div className="integration-logo codechef">
                                <Code2 size={40} />
                                <span>CodeChef</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="section how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">How It Works</span>
                        <h2 className="section-title">Simple Steps to Success</h2>
                        <p className="section-subtitle">
                            Get started in minutes and transform your institution's growth tracking
                        </p>
                    </div>
                    <div className="steps-container">
                        <div className="step animate-slide-in-left">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <div className="step-icon">
                                    <UserCheck size={28} />
                                </div>
                                <h3 className="step-title">Student Registers & Links Profiles</h3>
                                <p className="step-description">
                                    Students create their account and connect GitHub, LeetCode, and other coding platforms.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step animate-fade-in-up">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <div className="step-icon step-icon-secondary">
                                    <Users size={28} />
                                </div>
                                <h3 className="step-title">Mentor Tracks & Guides</h3>
                                <p className="step-description">
                                    Mentors monitor progress, set goals, and provide structured feedback to students.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step animate-slide-in-right">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <div className="step-icon step-icon-accent">
                                    <BarChart3 size={28} />
                                </div>
                                <h3 className="step-title">Admin Analyzes & Improves</h3>
                                <p className="step-description">
                                    Administrators get institution-wide insights to improve placement outcomes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Role-Based Experience Section */}
            <section className="section role-experience">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Tailored Experience</span>
                        <h2 className="section-title">Built for Every Role</h2>
                        <p className="section-subtitle">
                            Each user gets a personalized dashboard designed for their needs
                        </p>
                    </div>
                    <div className="roles-grid">
                        <div className="role-card role-student">
                            <div className="role-card-header">
                                <div className="role-icon">👨‍🎓</div>
                                <h3>Student View</h3>
                            </div>
                            <ul className="role-features">
                                <li>Personal growth dashboard</li>
                                <li>Coding platform stats</li>
                                <li>Goal tracking & milestones</li>
                                <li>Mentor feedback history</li>
                            </ul>
                            <div className="role-preview">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect fill='%23f3f4f6' width='300' height='180' rx='8'/%3E%3Crect fill='%231a365d' x='20' y='20' width='80' height='30' rx='4'/%3E%3Crect fill='%2310b981' x='110' y='20' width='80' height='30' rx='4'/%3E%3Crect fill='%238b5cf6' x='200' y='20' width='80' height='30' rx='4'/%3E%3Crect fill='%23e5e7eb' x='20' y='70' width='260' height='90' rx='4'/%3E%3C/svg%3E" alt="Student Dashboard Preview" />
                            </div>
                        </div>
                        <div className="role-card role-mentor">
                            <div className="role-card-header">
                                <div className="role-icon">👨‍🏫</div>
                                <h3>Mentor View</h3>
                            </div>
                            <ul className="role-features">
                                <li>Assigned students overview</li>
                                <li>Progress alerts & notifications</li>
                                <li>Skill gap analysis</li>
                                <li>Feedback & evaluation tools</li>
                            </ul>
                            <div className="role-preview">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect fill='%23f3f4f6' width='300' height='180' rx='8'/%3E%3Crect fill='%2310b981' x='20' y='20' width='120' height='30' rx='4'/%3E%3Crect fill='%23e5e7eb' x='20' y='60' width='260' height='50' rx='4'/%3E%3Crect fill='%23e5e7eb' x='20' y='120' width='260' height='40' rx='4'/%3E%3C/svg%3E" alt="Mentor Dashboard Preview" />
                            </div>
                        </div>
                        <div className="role-card role-admin">
                            <div className="role-card-header">
                                <div className="role-icon">🏛️</div>
                                <h3>Admin View</h3>
                            </div>
                            <ul className="role-features">
                                <li>Institution analytics</li>
                                <li>Placement readiness index</li>
                                <li>Department comparisons</li>
                                <li>Reports & announcements</li>
                            </ul>
                            <div className="role-preview">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect fill='%23f3f4f6' width='300' height='180' rx='8'/%3E%3Crect fill='%238b5cf6' x='20' y='20' width='260' height='60' rx='4'/%3E%3Crect fill='%23e5e7eb' x='20' y='90' width='125' height='70' rx='4'/%3E%3Crect fill='%23e5e7eb' x='155' y='90' width='125' height='70' rx='4'/%3E%3C/svg%3E" alt="Admin Dashboard Preview" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="section testimonials" id="testimonials">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-badge">Testimonials</span>
                        <h2 className="section-title">Trusted by Educators</h2>
                        <p className="section-subtitle">
                            See what universities and students are saying about EduGrow+
                        </p>
                    </div>
                    <div className="testimonials-grid">
                        <Card variant="default" padding="lg" className="testimonial-card">
                            <div className="testimonial-stars">
                                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}
                            </div>
                            <p className="testimonial-text">
                                "EduGrow+ transformed how we track student progress. Our placement rate increased by 30% in just one year."
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">DR</div>
                                <div>
                                    <strong>Dr. Rajesh Kumar</strong>
                                    <span>Placement Director, IIT Delhi</span>
                                </div>
                            </div>
                        </Card>
                        <Card variant="default" padding="lg" className="testimonial-card">
                            <div className="testimonial-stars">
                                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}
                            </div>
                            <p className="testimonial-text">
                                "The coding platform integration is incredible. I can finally see all my progress in one place."
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">PS</div>
                                <div>
                                    <strong>Priya Sharma</strong>
                                    <span>B.Tech Student, NIT Trichy</span>
                                </div>
                            </div>
                        </Card>
                        <Card variant="default" padding="lg" className="testimonial-card">
                            <div className="testimonial-stars">
                                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />)}
                            </div>
                            <p className="testimonial-text">
                                "As a mentor, I can now provide targeted feedback based on actual data. It's a game changer."
                            </p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar">AM</div>
                                <div>
                                    <strong>Ankit Mehta</strong>
                                    <span>Senior Mentor, BITS Pilani</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Transform Student Growth Today</h2>
                        <p className="cta-subtitle">
                            Join 50+ universities already using EduGrow+ to drive better outcomes
                        </p>
                        <div className="cta-actions">
                            <Link to="/auth/select-role">
                                <Button variant="white" size="lg" icon={<ArrowRight size={20} />} iconPosition="right">
                                    Start Free
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="cta-btn-outline">
                                Schedule Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
