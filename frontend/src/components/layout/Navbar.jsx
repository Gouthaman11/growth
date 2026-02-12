import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'
import './Navbar.css'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Integrations', href: '#integrations' },
        { label: 'Testimonials', href: '#testimonials' },
    ]

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div className="navbar-logo-icon">
                        <svg viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="18" fill="url(#logoGradient)" />
                            <path d="M12 22 L18 28 L28 16" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 10 L20 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <circle cx="20" cy="8" r="2" fill="white" />
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1a365d" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="navbar-logo-text">EduGrow<span className="navbar-logo-plus">+</span></span>
                </Link>

                <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
                    <ul className="navbar-links">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <a href={link.href} className="navbar-link" onClick={() => setIsOpen(false)}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="navbar-actions">
                        <Link to="/auth/login">
                            <Button variant="ghost">Log In</Button>
                        </Link>
                        <Link to="/auth/select-role">
                            <Button variant="primary">Get Started</Button>
                        </Link>
                    </div>
                </div>

                <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    )
}
