import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import './Auth.css'

export default function Login() {
    const navigate = useNavigate()
    const { login, signInWithGoogle } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(formData.email, formData.password)

            // Navigate based on role (result contains user data)
            if (result) {
                // Use replace to prevent back button issues
                if (result.role === 'student') {
                    navigate('/student/dashboard', { replace: true })
                } else if (result.role === 'mentor') {
                    navigate('/mentor/dashboard', { replace: true })
                } else if (result.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true })
                } else {
                    navigate('/', { replace: true })
                }
            }
        } catch (err) {
            console.error(err)
            // Customize error based on response
            setError(err.message || 'Failed to sign in. Please try again.')
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle()
            // For Google sign-in, user needs to complete profile
            navigate('/auth/select-role')
        } catch (err) {
            console.error(err)
            setError('Failed to sign in with Google')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-gradient"></div>
                <div className="auth-pattern"></div>
            </div>

            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="18" fill="url(#loginLogoGradient)" />
                            <path d="M12 22 L18 28 L28 16" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 10 L20 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <circle cx="20" cy="8" r="2" fill="white" />
                            <defs>
                                <linearGradient id="loginLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a365d" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="auth-logo-text">EduGrow<span className="auth-logo-plus">+</span></span>
                </Link>

                <div className="auth-content auth-form-container">
                    <div className="auth-header">
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Sign in to continue to your dashboard</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            icon={<Mail size={20} />}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <div className="password-input-wrapper">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                icon={<Lock size={20} />}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="auth-options">
                            <label className="checkbox-wrapper">
                                <input type="checkbox" className="checkbox" />
                                <span className="checkbox-label">Remember me</span>
                            </label>
                            <Link to="/auth/forgot-password" className="auth-link">
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="auth-social">
                        <button className="auth-social-btn" onClick={handleGoogleSignIn} type="button">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <p className="auth-footer-text">
                        Don't have an account?{' '}
                        <Link to="/auth/select-role" className="auth-link">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
