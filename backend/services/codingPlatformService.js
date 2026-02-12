// Backend service to fetch coding platform data (avoids CORS issues)
// Note: HackerRank now uses REST API instead of Puppeteer scraping for speed

// Helper function to extract username from URL or return as-is if already a username
function extractUsername(input, platform) {
    if (!input) return null
    
    // Remove whitespace
    input = input.trim()
    
    // If it's a URL, extract the username
    try {
        if (input.includes('http') || input.includes('www.') || input.includes('.com')) {
            // Remove trailing slashes
            input = input.replace(/\/+$/, '')
            
            if (platform === 'github') {
                // Patterns: github.com/username, https://github.com/username
                const match = input.match(/github\.com\/([^\/\?]+)/i)
                return match ? match[1] : input
            }
            
            if (platform === 'leetcode') {
                // Patterns: leetcode.com/username, leetcode.com/u/username
                const matchU = input.match(/leetcode\.com\/u\/([^\/\?]+)/i)
                if (matchU) return matchU[1]
                const match = input.match(/leetcode\.com\/([^\/\?]+)/i)
                return match ? match[1] : input
            }
            
            if (platform === 'hackerrank') {
                // Patterns: hackerrank.com/username, hackerrank.com/profile/username
                const matchProfile = input.match(/hackerrank\.com\/profile\/([^\/\?]+)/i)
                if (matchProfile) return matchProfile[1]
                const match = input.match(/hackerrank\.com\/([^\/\?]+)/i)
                return match ? match[1] : input
            }
        }
    } catch (e) {
        console.error('Error parsing URL:', e)
    }
    
    // Return as-is if not a URL (already a username)
    return input
}

// GitHub API - Public API
export async function fetchGitHubData(input) {
    const username = extractUsername(input, 'github')
    if (!username) {
        console.log('GitHub: No username provided')
        return null
    }
    
    console.log(`Fetching GitHub data for username: "${username}"`)

    try {
        // Fetch user profile
        const userUrl = `https://api.github.com/users/${username}`
        console.log(`GitHub API URL: ${userUrl}`)
        
        const userResponse = await fetch(userUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'EduGrow-Plus-App'
            }
        })
        
        console.log(`GitHub API response status: ${userResponse.status}`)
        
        // Handle rate limiting
        if (userResponse.status === 403) {
            const remaining = userResponse.headers.get('X-RateLimit-Remaining')
            console.error('GitHub API rate limited. Remaining:', remaining)
            throw new Error('GitHub API rate limit exceeded. Please try again later.')
        }
        
        if (!userResponse.ok) {
            throw new Error(`GitHub user not found: ${username}`)
        }
        
        const userData = await userResponse.json()

        // For rate-limited scenario, just return basic user data
        let repos = []
        let totalStars = 0
        let languages = {}
        let recentCommits = 0
        
        try {
            // Fetch repositories
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'EduGrow-Plus-App'
                }
            })
            
            if (reposResponse.ok) {
                repos = await reposResponse.json()
                if (Array.isArray(repos)) {
                    totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
                    repos.forEach(repo => {
                        if (repo.language) {
                            languages[repo.language] = (languages[repo.language] || 0) + 1
                        }
                    })
                }
            }
        } catch (e) {
            console.log('Could not fetch repos, continuing with basic data')
        }
        
        try {
            // Fetch contribution data (events)
            const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'EduGrow-Plus-App'
                }
            })
            
            if (eventsResponse.ok) {
                const events = await eventsResponse.json()
                if (Array.isArray(events)) {
                    const pushEvents = events.filter(e => e.type === 'PushEvent')
                    recentCommits = pushEvents.reduce((sum, event) => sum + (event.payload?.commits?.length || 0), 0)
                }
            }
        } catch (e) {
            console.log('Could not fetch events, continuing with basic data')
        }

        return {
            username: userData.login,
            name: userData.name,
            avatar: userData.avatar_url,
            bio: userData.bio,
            publicRepos: userData.public_repos,
            repositories: userData.public_repos,
            followers: userData.followers,
            following: userData.following,
            totalStars,
            stars: totalStars,
            contributions: recentCommits,
            totalCommits: recentCommits,
            recentCommits,
            topLanguages: Object.entries(languages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([lang, count]) => ({ language: lang, count })),
            profileUrl: userData.html_url,
            createdAt: userData.created_at,
            lastFetched: new Date()
        }
    } catch (error) {
        console.error('GitHub API Error:', error.message)
        return null
    }
}

// LeetCode API - Using multiple API sources for reliability
export async function fetchLeetCodeData(input) {
    const username = extractUsername(input, 'leetcode')
    if (!username) return null
    
    console.log(`Fetching LeetCode data for: ${username}`)

    // Try the public LeetCode Stats API first (more reliable)
    try {
        const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`, {
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (response.ok) {
            const data = await response.json()
            if (data.status === 'success' || data.totalSolved !== undefined) {
                return {
                    username: username,
                    ranking: data.ranking || 0,
                    reputation: 0,
                    totalSolved: data.totalSolved || 0,
                    easySolved: data.easySolved || 0,
                    mediumSolved: data.mediumSolved || 0,
                    hardSolved: data.hardSolved || 0,
                    streak: 0,
                    totalActiveDays: 0,
                    acceptanceRate: data.acceptanceRate || 0,
                    profileUrl: `https://leetcode.com/u/${username}`,
                    lastFetched: new Date()
                }
            }
        }
    } catch (error) {
        console.log('LeetCode Stats API failed, trying alternative...')
    }

    // Try alternative API
    try {
        const response = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`, {
            headers: {
                'Accept': 'application/json'
            }
        })
        
        if (response.ok) {
            const data = await response.json()
            return {
                username: username,
                ranking: 0,
                reputation: 0,
                totalSolved: data.solvedProblem || 0,
                easySolved: data.easySolved || 0,
                mediumSolved: data.mediumSolved || 0, 
                hardSolved: data.hardSolved || 0,
                streak: 0,
                totalActiveDays: 0,
                acceptanceRate: 0,
                profileUrl: `https://leetcode.com/u/${username}`,
                lastFetched: new Date()
            }
        }
    } catch (error) {
        console.log('Alternative LeetCode API failed, trying direct GraphQL...')
    }

    // Fallback to direct LeetCode GraphQL
    try {
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    profile {
                        ranking
                        reputation
                        starRating
                    }
                    submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    userCalendar {
                        streak
                        totalActiveDays
                    }
                }
            }
        `

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'Origin': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        })

        const data = await response.json()

        if (data.data?.matchedUser) {
            const user = data.data.matchedUser
            const submissions = user.submitStatsGlobal?.acSubmissionNum || []

            let easy = 0, medium = 0, hard = 0, total = 0
            submissions.forEach(sub => {
                if (sub.difficulty === 'Easy') easy = sub.count
                if (sub.difficulty === 'Medium') medium = sub.count
                if (sub.difficulty === 'Hard') hard = sub.count
                if (sub.difficulty === 'All') total = sub.count
            })

            return {
                username: user.username,
                ranking: user.profile?.ranking || 0,
                reputation: user.profile?.reputation || 0,
                totalSolved: total,
                easySolved: easy,
                mediumSolved: medium,
                hardSolved: hard,
                streak: user.userCalendar?.streak || 0,
                totalActiveDays: user.userCalendar?.totalActiveDays || 0,
                acceptanceRate: total > 0 ? Math.round((total / (total + 50)) * 100) : 0,
                profileUrl: `https://leetcode.com/u/${username}`,
                lastFetched: new Date()
            }
        }
    } catch (error) {
        console.error('LeetCode GraphQL Error:', error.message)
    }
    
    console.error('All LeetCode API methods failed for:', username)
    return null
}

// HackerRank - Web scraping to fetch profile data
export async function fetchHackerRankData(input) {
    const username = extractUsername(input, 'hackerrank')
    if (!username) return null

    console.log(`Fetching HackerRank data for: ${username}`)
    
    const profileUrl = `https://www.hackerrank.com/profile/${username}`
    
    try {
        // Use HackerRank REST API endpoints (much faster than puppeteer)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
        
        let badges = []
        let certificates = []
        let submissions = {}
        let skills = []
        let totalSolved = 0
        
        // Fetch badges
        try {
            const badgesRes = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers })
            if (badgesRes.ok) {
                const badgesData = await badgesRes.json()
                badges = badgesData.models || []
            }
        } catch (e) {
            console.log('Could not fetch badges:', e.message)
        }
        
        // Fetch submission histories (solved count by track)
        try {
            const submissionsRes = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/submission_histories`, { headers })
            if (submissionsRes.ok) {
                submissions = await submissionsRes.json()
                // Count total submissions across all tracks
                totalSolved = Object.values(submissions).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0)
            }
        } catch (e) {
            console.log('Could not fetch submissions:', e.message)
        }
        
        // Fetch certificates
        try {
            const certsRes = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/certificates`, { headers })
            if (certsRes.ok) {
                const certsData = await certsRes.json()
                certificates = certsData.data || []
            }
        } catch (e) {
            console.log('Could not fetch certificates:', e.message)
        }
        
        // Fetch user profile for skills
        try {
            const profileRes = await fetch(`https://www.hackerrank.com/rest/hackers/${username}`, { headers })
            if (profileRes.ok) {
                const profileData = await profileRes.json()
                if (profileData.model?.skills) {
                    skills = profileData.model.skills.slice(0, 10)
                }
            }
        } catch (e) {
            console.log('Could not fetch profile:', e.message)
        }
        
        // Count badge types
        const goldBadges = badges.filter(b => b.stars === 5 || b.badge_name?.includes('gold')).length
        const silverBadges = badges.filter(b => b.stars >= 3 && b.stars < 5).length
        const bronzeBadges = badges.filter(b => b.stars < 3).length
        
        console.log(`HackerRank data fetched: ${badges.length} badges, ${totalSolved} solved, ${certificates.length} certs`)
        
        return {
            username,
            badges: badges.length,
            certificates: certificates.length,
            points: 0,
            solvedChallenges: totalSolved,
            skills,
            goldBadges,
            silverBadges,
            bronzeBadges,
            badgeDetails: badges.slice(0, 10).map(b => ({ name: b.badge_name, stars: b.stars })),
            certificateDetails: certificates.slice(0, 5).map(c => ({ name: c.certificate_name, date: c.created_at })),
            submissionsByTrack: submissions,
            profileUrl,
            lastFetched: new Date()
        }

    } catch (error) {
        console.error('HackerRank API error:', error.message)
        
        return {
            username,
            badges: 0,
            certificates: 0,
            points: 0,
            solvedChallenges: 0,
            skills: [],
            profileUrl,
            lastFetched: new Date(),
            error: 'Could not fetch data - profile may be private'
        }
    }
}

// Calculate growth score
export function calculateGrowthScore(github, leetcode, hackerrank, academics) {
    let score = 0
    let factors = 0

    // GitHub contribution (max 25 points)
    if (github && github.publicRepos) {
        const githubScore = Math.min(25,
            (github.publicRepos * 2) +
            (github.totalStars * 0.5) +
            (github.recentCommits * 0.3)
        )
        score += githubScore
        factors++
    }

    // LeetCode problems (max 30 points)
    if (leetcode && leetcode.totalSolved) {
        const lcScore = Math.min(30,
            (leetcode.easySolved * 0.1) +
            (leetcode.mediumSolved * 0.3) +
            (leetcode.hardSolved * 0.8)
        )
        score += lcScore
        factors++
    }

    // HackerRank (max 15 points)
    if (hackerrank && hackerrank.badges) {
        const hrScore = Math.min(15,
            (hackerrank.badges * 0.5) +
            (hackerrank.certificates * 2)
        )
        score += hrScore
        factors++
    }

    // Academics (max 30 points)
    if (academics?.cgpa) {
        const academicScore = (academics.cgpa / 10) * 30
        score += academicScore
        factors++
    }

    // Normalize to 100
    const normalizedScore = factors > 0 ? Math.round((score / factors) * (100 / 25)) : 0
    return Math.min(100, normalizedScore)
}

// Fetch all platform data
export async function fetchAllPlatformData(codingProfiles) {
    const results = {
        github: null,
        leetcode: null,
        hackerrank: null
    }

    const promises = []

    if (codingProfiles?.github) {
        promises.push(
            fetchGitHubData(codingProfiles.github).then(data => { results.github = data })
        )
    }

    if (codingProfiles?.leetcode) {
        promises.push(
            fetchLeetCodeData(codingProfiles.leetcode).then(data => { results.leetcode = data })
        )
    }

    if (codingProfiles?.hackerrank) {
        promises.push(
            fetchHackerRankData(codingProfiles.hackerrank).then(data => { results.hackerrank = data })
        )
    }

    await Promise.all(promises)

    return results
}
