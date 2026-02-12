import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { codingDataAPI, userAPI } from '../../services/api'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import { Github, Code2, RefreshCw, ExternalLink, Trophy, Star, GitBranch, GitCommit, Save, AlertCircle } from 'lucide-react'
import './StudentDashboard.css'

export default function CodingPlatforms() {
    const { currentUser, userData, refreshUserData } = useAuth()
    const [platformData, setPlatformData] = useState({
        github: null,
        leetcode: null,
        hackerrank: null
    })
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [profiles, setProfiles] = useState({
        github: '',
        leetcode: '',
        hackerrank: ''
    })
    const [saveStatus, setSaveStatus] = useState('')

    useEffect(() => {
        if (currentUser) {
            loadData()
        }
    }, [currentUser])

    useEffect(() => {
        if (userData?.codingProfiles) {
            setProfiles({
                github: userData.codingProfiles.github || '',
                leetcode: userData.codingProfiles.leetcode || '',
                hackerrank: userData.codingProfiles.hackerrank || ''
            })
        }
    }, [userData])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await codingDataAPI.get(currentUser.uid)
            if (data) {
                setPlatformData({
                    github: data.github,
                    leetcode: data.leetcode,
                    hackerrank: data.hackerrank
                })
            }
        } catch (error) {
            console.error('Error loading coding data:', error)
        }
        setLoading(false)
    }

    const handleSaveProfiles = async () => {
        setSaveStatus('saving')
        try {
            await userAPI.updateCodingProfiles(currentUser.uid, profiles)
            setSaveStatus('saved')
            setEditMode(false)
            if (refreshUserData) await refreshUserData()
            
            // Auto-sync after saving profiles
            setSyncing(true)
            try {
                const result = await codingDataAPI.syncAll(currentUser.uid)
                setPlatformData({
                    github: result.github,
                    leetcode: result.leetcode,
                    hackerrank: result.hackerrank
                })
            } catch (syncError) {
                console.error('Auto-sync error:', syncError)
            }
            setSyncing(false)
            
            setTimeout(() => setSaveStatus(''), 2000)
        } catch (error) {
            console.error('Error saving profiles:', error)
            setSaveStatus('error')
        }
    }

    const handleSyncAll = async () => {
        setSyncing(true)
        try {
            const result = await codingDataAPI.syncAll(currentUser.uid)
            setPlatformData({
                github: result.github,
                leetcode: result.leetcode,
                hackerrank: result.hackerrank
            })
        } catch (error) {
            console.error('Error syncing data:', error)
        }
        setSyncing(false)
    }

    const handleSyncPlatform = async (platform) => {
        if (!profiles[platform]) return
        
        setSyncing(true)
        try {
            let result
            switch (platform) {
                case 'github':
                    result = await codingDataAPI.fetchGithub(currentUser.uid, profiles.github)
                    setPlatformData(prev => ({ ...prev, github: result.github }))
                    break
                case 'leetcode':
                    result = await codingDataAPI.fetchLeetcode(currentUser.uid, profiles.leetcode)
                    setPlatformData(prev => ({ ...prev, leetcode: result.leetcode }))
                    break
                case 'hackerrank':
                    result = await codingDataAPI.fetchHackerrank(currentUser.uid, profiles.hackerrank)
                    setPlatformData(prev => ({ ...prev, hackerrank: result.hackerrank }))
                    break
            }
        } catch (error) {
            console.error(`Error syncing ${platform}:`, error)
        }
        setSyncing(false)
    }

    const formatLastSync = (date) => {
        if (!date) return 'Never synced'
        const d = new Date(date)
        const now = new Date()
        const diff = Math.floor((now - d) / 60000) // minutes
        if (diff < 1) return 'Just now'
        if (diff < 60) return `${diff} mins ago`
        if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
        return d.toLocaleDateString()
    }

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="loading-container">
                    <RefreshCw className="spin" size={32} />
                    <p>Loading coding platforms...</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout role="student">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Coding Platforms</h1>
                    <p className="dashboard-subtitle">Track your progress across all coding platforms</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? 'Cancel' : 'Edit Profiles'}
                    </Button>
                    <Button 
                        variant="primary" 
                        icon={<RefreshCw size={18} className={syncing ? 'spin' : ''} />}
                        onClick={handleSyncAll}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync All'}
                    </Button>
                </div>
            </div>

            {/* Edit Profiles Section */}
            {editMode && (
                <Card variant="default" padding="lg" style={{ marginBottom: '20px' }}>
                    <CardHeader>
                        <CardTitle>Update Your Profile Usernames</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                    <Github size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    GitHub Username
                                </label>
                                <Input
                                    value={profiles.github}
                                    onChange={(e) => setProfiles(prev => ({ ...prev, github: e.target.value }))}
                                    placeholder="e.g., octocat"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                    <Code2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    LeetCode Username
                                </label>
                                <Input
                                    value={profiles.leetcode}
                                    onChange={(e) => setProfiles(prev => ({ ...prev, leetcode: e.target.value }))}
                                    placeholder="e.g., leetcoder123"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                    <Code2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    HackerRank Username
                                </label>
                                <Input
                                    value={profiles.hackerrank}
                                    onChange={(e) => setProfiles(prev => ({ ...prev, hackerrank: e.target.value }))}
                                    placeholder="e.g., hacker_dev"
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Button variant="primary" icon={<Save size={16} />} onClick={handleSaveProfiles}>
                                Save Profiles
                            </Button>
                            {saveStatus === 'saved' && <span style={{ color: 'var(--success)' }}>✓ Saved!</span>}
                            {saveStatus === 'error' && <span style={{ color: 'var(--error)' }}>Error saving</span>}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="platform-grid">
                {/* GitHub Card */}
                <Card variant="default" padding="lg" className="platform-card">
                    <div className="platform-header">
                        <div className="platform-icon github">
                            <Github size={24} />
                        </div>
                        <div className="platform-info">
                            <h3>GitHub</h3>
                            <span>{profiles.github ? `@${profiles.github}` : 'Not connected'}</span>
                        </div>
                        {platformData.github?.profileUrl && (
                            <a href={platformData.github.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />} />
                            </a>
                        )}
                    </div>

                    {platformData.github ? (
                        <>
                            <div className="platform-stats">
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.github.publicRepos || 0}</div>
                                    <div className="platform-stat-label">Repositories</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.github.contributions || platformData.github.recentCommits || 0}</div>
                                    <div className="platform-stat-label">Contributions</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.github.stars || platformData.github.totalStars || 0}</div>
                                    <div className="platform-stat-label">Stars</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.github.followers || 0}</div>
                                    <div className="platform-stat-label">Followers</div>
                                </div>
                            </div>

                            <div className="platform-highlights">
                                <div className="platform-highlight">
                                    <GitCommit size={16} />
                                    <span>{platformData.github.recentCommits || 0} recent commits</span>
                                </div>
                                {platformData.github.topLanguages?.length > 0 && (
                                    <div className="platform-highlight">
                                        <Code2 size={16} />
                                        <span>Top: {platformData.github.topLanguages.slice(0, 3).map(l => l.language).join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>Add your GitHub username to see stats</p>
                        </div>
                    )}

                    <div className="sync-status">
                        <div className="sync-info">
                            <span className="sync-dot"></span>
                            <span>{formatLastSync(platformData.github?.lastFetched)}</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<RefreshCw size={14} className={syncing ? 'spin' : ''} />}
                            onClick={() => handleSyncPlatform('github')}
                            disabled={!profiles.github || syncing}
                        >
                            Refresh
                        </Button>
                    </div>
                </Card>

                {/* LeetCode Card */}
                <Card variant="default" padding="lg" className="platform-card">
                    <div className="platform-header">
                        <div className="platform-icon leetcode">
                            <Code2 size={24} />
                        </div>
                        <div className="platform-info">
                            <h3>LeetCode</h3>
                            <span>{profiles.leetcode || 'Not connected'}</span>
                        </div>
                        {platformData.leetcode?.profileUrl && (
                            <a href={platformData.leetcode.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />} />
                            </a>
                        )}
                    </div>

                    {platformData.leetcode ? (
                        <>
                            <div className="platform-stats">
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.leetcode.totalSolved || 0}</div>
                                    <div className="platform-stat-label">Problems Solved</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value" style={{ color: 'var(--success)' }}>{platformData.leetcode.easySolved || 0}</div>
                                    <div className="platform-stat-label">Easy</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value" style={{ color: 'var(--warning)' }}>{platformData.leetcode.mediumSolved || 0}</div>
                                    <div className="platform-stat-label">Medium</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value" style={{ color: 'var(--error)' }}>{platformData.leetcode.hardSolved || 0}</div>
                                    <div className="platform-stat-label">Hard</div>
                                </div>
                            </div>

                            <div className="platform-highlights">
                                {platformData.leetcode.ranking > 0 && (
                                    <div className="platform-highlight">
                                        <Trophy size={16} />
                                        <span>Ranking: #{platformData.leetcode.ranking.toLocaleString()}</span>
                                    </div>
                                )}
                                {platformData.leetcode.streak > 0 && (
                                    <div className="platform-highlight">
                                        <Star size={16} />
                                        <span>{platformData.leetcode.streak} day streak</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>Add your LeetCode username to see stats</p>
                        </div>
                    )}

                    <div className="sync-status">
                        <div className="sync-info">
                            <span className="sync-dot"></span>
                            <span>{formatLastSync(platformData.leetcode?.lastFetched)}</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<RefreshCw size={14} className={syncing ? 'spin' : ''} />}
                            onClick={() => handleSyncPlatform('leetcode')}
                            disabled={!profiles.leetcode || syncing}
                        >
                            Refresh
                        </Button>
                    </div>
                </Card>

                {/* HackerRank Card */}
                <Card variant="default" padding="lg" className="platform-card">
                    <div className="platform-header">
                        <div className="platform-icon hackerrank">
                            <Code2 size={24} />
                        </div>
                        <div className="platform-info">
                            <h3>HackerRank</h3>
                            <span>{profiles.hackerrank || 'Not connected'}</span>
                        </div>
                        {platformData.hackerrank?.profileUrl && (
                            <a href={platformData.hackerrank.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />} />
                            </a>
                        )}
                    </div>

                    {platformData.hackerrank ? (
                        <>
                            <div className="platform-stats">
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.hackerrank.badges || 0}</div>
                                    <div className="platform-stat-label">Badges</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.hackerrank.certificates || 0}</div>
                                    <div className="platform-stat-label">Certificates</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.hackerrank.points || 0}</div>
                                    <div className="platform-stat-label">Points</div>
                                </div>
                                <div className="platform-stat">
                                    <div className="platform-stat-value">{platformData.hackerrank.rank || '-'}</div>
                                    <div className="platform-stat-label">Rank</div>
                                </div>
                            </div>

                            <div className="platform-highlights">
                                {platformData.hackerrank.note && (
                                    <div className="platform-highlight" style={{ color: 'var(--text-secondary)' }}>
                                        <AlertCircle size={16} />
                                        <span style={{ fontSize: '12px' }}>Manual entry required - no API</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>Add your HackerRank username to see stats</p>
                        </div>
                    )}

                    <div className="sync-status">
                        <div className="sync-info">
                            <span className="sync-dot"></span>
                            <span>{formatLastSync(platformData.hackerrank?.lastFetched)}</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={<RefreshCw size={14} className={syncing ? 'spin' : ''} />}
                            onClick={() => handleSyncPlatform('hackerrank')}
                            disabled={!profiles.hackerrank || syncing}
                        >
                            Refresh
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Problem Solving Summary */}
            {platformData.leetcode && (
                <Card variant="default" padding="lg">
                    <CardHeader>
                        <CardTitle>LeetCode Problem Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="problem-categories">
                            <div className="problem-category">
                                <div className="category-header">
                                    <span className="category-name">Easy Problems</span>
                                    <Badge variant="success">{platformData.leetcode.easySolved || 0}</Badge>
                                </div>
                                <div className="category-bar">
                                    <div 
                                        className="category-fill" 
                                        style={{ 
                                            width: `${Math.min(100, ((platformData.leetcode.easySolved || 0) / 800) * 100)}%`,
                                            backgroundColor: 'var(--success)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div className="problem-category">
                                <div className="category-header">
                                    <span className="category-name">Medium Problems</span>
                                    <Badge variant="warning">{platformData.leetcode.mediumSolved || 0}</Badge>
                                </div>
                                <div className="category-bar">
                                    <div 
                                        className="category-fill warning" 
                                        style={{ 
                                            width: `${Math.min(100, ((platformData.leetcode.mediumSolved || 0) / 1700) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div className="problem-category">
                                <div className="category-header">
                                    <span className="category-name">Hard Problems</span>
                                    <Badge variant="error">{platformData.leetcode.hardSolved || 0}</Badge>
                                </div>
                                <div className="category-bar">
                                    <div 
                                        className="category-fill error" 
                                        style={{ 
                                            width: `${Math.min(100, ((platformData.leetcode.hardSolved || 0) / 750) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    )
}
