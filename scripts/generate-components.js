#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/github-stats.json');
const COMPONENTS_DIR = path.join(__dirname, '../data/components');

function readStatsData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error(`Error reading data: ${error.message}`);
        process.exit(1);
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Jupyter Notebook': '#DA5B0B',
        'Shell': '#89e051',
        'Dart': '#00B4AB'
    };
    return colors[language] || '#6e7681';
}

function generateProfileHeader(profile) {
    const joinDate = new Date(profile.createdAt);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.toLocaleString('default', { month: 'long' });

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }
        .profile-card {
            display: flex;
            align-items: center;
            gap: 30px;
            max-width: 800px;
            width: 100%;
        }
        .avatar {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 5px solid #58a6ff;
            box-shadow: 0 8px 32px rgba(88, 166, 255, 0.3);
        }
        .profile-info {
            color: #f0f6fc;
        }
        .name {
            font-size: 2.8rem;
            font-weight: 700;
            margin: 0 0 10px 0;
            background: linear-gradient(90deg, #58a6ff, #a371f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .username {
            font-size: 1.5rem;
            color: #8b949e;
            margin: 0 0 15px 0;
            font-family: 'JetBrains Mono', monospace;
        }
        .bio {
            font-size: 1.2rem;
            color: #c9d1d9;
            margin: 0 0 15px 0;
            line-height: 1.5;
            max-width: 500px;
        }
        .location {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #8b949e;
            font-size: 1.1rem;
        }
        .join-date {
            color: #8b949e;
            font-size: 1.1rem;
            margin-top: 10px;
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
</head>
<body>
    <div class="profile-card">
        <img src="${profile.avatarUrl}" alt="${profile.login}" class="avatar">
        <div class="profile-info">
            <h1 class="name">${profile.name || profile.login}</h1>
            <div class="username">@${profile.login}</div>
            ${profile.bio ? `<p class="bio">${profile.bio}</p>` : ''}
            ${profile.location ? `
                <div class="location">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                        <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    </svg>
                    ${profile.location}
                </div>
            ` : ''}
            <div class="join-date">Joined GitHub • ${joinMonth} ${joinYear}</div>
        </div>
    </div>
</body>
</html>`;
}

function generateGitHubStats(stats) {
    const statsData = [
        { icon: '⭐', label: 'Total Stars', value: stats.totalStars },
        { icon: '📝', label: 'Commits (Last Year)', value: stats.commitsLastYear },
        { icon: '🔀', label: 'Pull Requests', value: stats.totalPRsCreated },
        { icon: '🐛', label: 'Issues Created', value: stats.totalIssuesCreated },
        { icon: '🤝', label: 'Repos Contributed', value: stats.contributedToLastYear },
        { icon: '👥', label: 'Followers', value: stats.followers },
        { icon: '📂', label: 'Public Repos', value: stats.totalRepositories }
    ];

    const statsHTML = statsData.map(stat => `
        <div class="stat-item">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-content">
                <div class="stat-value">${formatNumber(stat.value)}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 400px;
        }
        .title {
            color: #58a6ff;
            font-size: 2.5rem;
            margin-bottom: 40px;
            text-align: center;
            font-weight: 700;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            max-width: 1000px;
            width: 100%;
        }
        .stat-item {
            background: #21262d;
            border: 2px solid #30363d;
            border-radius: 16px;
            padding: 25px;
            display: flex;
            align-items: center;
            gap: 20px;
            transition: all 0.3s ease;
        }
        .stat-item:hover {
            transform: translateY(-5px);
            border-color: #58a6ff;
            box-shadow: 0 10px 30px rgba(88, 166, 255, 0.2);
        }
        .stat-icon {
            font-size: 2.5rem;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .stat-content {
            flex: 1;
        }
        .stat-value {
            font-size: 2.2rem;
            font-weight: 700;
            color: #f0f6fc;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 1rem;
            color: #8b949e;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <h1 class="title">📊 GitHub Statistics</h1>
    <div class="stats-grid">
        ${statsHTML}
    </div>
    <script>
        // Add pulse animation to stats
        setTimeout(() => {
            document.querySelectorAll('.stat-item').forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('pulse');
                    setTimeout(() => item.classList.remove('pulse'), 1000);
                }, index * 200);
            });
        }, 500);
    </script>
</body>
</html>`;
}

function generateLanguages(languages) {
    const languageEntries = Object.entries(languages || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const languageHTML = languageEntries.map(([language, percentage]) => {
        const color = getLanguageColor(language);
        return `
        <div class="language-item">
            <div class="language-header">
                <span class="language-name">${language}</span>
                <span class="language-percentage">${percentage}%</span>
            </div>
            <div class="language-bar-container">
                <div class="language-bar" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
        </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 400px;
        }
        .title {
            color: #58a6ff;
            font-size: 2.5rem;
            margin-bottom: 40px;
            text-align: center;
            font-weight: 700;
        }
        .languages-container {
            background: #21262d;
            border: 2px solid #30363d;
            border-radius: 16px;
            padding: 40px;
            max-width: 700px;
            width: 100%;
        }
        .language-item {
            margin-bottom: 25px;
        }
        .language-item:last-child {
            margin-bottom: 0;
        }
        .language-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        .language-name {
            color: #f0f6fc;
            font-weight: 500;
        }
        .language-percentage {
            color: #8b949e;
            font-family: 'JetBrains Mono', monospace;
        }
        .language-bar-container {
            height: 20px;
            background: #161b22;
            border-radius: 10px;
            overflow: hidden;
        }
        .language-bar {
            height: 100%;
            border-radius: 10px;
            transition: width 1s ease-out;
        }
        .animate-bar {
            animation: fillBar 1.5s ease-out;
        }
        @keyframes fillBar {
            from { width: 0%; }
            to { width: var(--target-width); }
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
</head>
<body>
    <h1 class="title">💻 Most Used Languages</h1>
    <div class="languages-container">
        ${languageHTML}
    </div>
    <script>
        // Animate language bars on load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                document.querySelectorAll('.language-bar').forEach((bar, index) => {
                    setTimeout(() => {
                        bar.classList.add('animate-bar');
                    }, index * 200);
                });
            }, 500);
        });
    </script>
</body>
</html>`;
}

// Main execution
(async () => {
    try {
        console.log('📖 Reading stats data...');
        const stats = readStatsData();

        // Create components directory
        if (!fs.existsSync(COMPONENTS_DIR)) {
            fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
        }

        // Generate separate components
        console.log('🎨 Generating profile header component...');
        const profileHTML = generateProfileHeader(stats.profile);
        fs.writeFileSync(path.join(COMPONENTS_DIR, 'profile-header.html'), profileHTML);

        console.log('📊 Generating GitHub stats component...');
        const statsHTML = generateGitHubStats(stats.stats);
        fs.writeFileSync(path.join(COMPONENTS_DIR, 'github-stats.html'), statsHTML);

        console.log('💻 Generating languages component...');
        const languagesHTML = generateLanguages(stats.languages);
        fs.writeFileSync(path.join(COMPONENTS_DIR, 'languages.html'), languagesHTML);

        console.log('✅ Components generated successfully!');
        console.log(`📁 Location: ${COMPONENTS_DIR}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();