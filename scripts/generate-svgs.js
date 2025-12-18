#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/github-stats.json');
const SVGS_DIR = path.join(__dirname, '../data/svgs');

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
        'Dart': '#00B4AB',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Go': '#00ADD8'
    };
    return colors[language] || '#6e7681';
}

function generateProfileHeaderSVG(profile) {
    const joinDate = new Date(profile.createdAt);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.toLocaleString('default', { month: 'long' });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
        <clipPath id="avatarClip">
            <circle cx="125" cy="150" r="70"/>
        </clipPath>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="300" fill="#0d1117" rx="20" ry="20"/>
    
    <!-- Avatar -->
    <circle cx="125" cy="150" r="75" fill="url(#gradient)"/>
    <image href="${profile.avatarUrl}" x="50" y="80" width="150" height="150" clip-path="url(#avatarClip)"/>
    
    <!-- Profile Info -->
    <text x="250" y="110" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="url(#gradient)">
        ${profile.name || profile.login}
    </text>
    
    <text x="250" y="150" font-family="'Courier New', monospace" font-size="20" fill="#8b949e">
        @${profile.login}
    </text>
    
    ${profile.bio ? `
    <text x="250" y="190" font-family="Arial, sans-serif" font-size="16" fill="#c9d1d9" width="500">
        ${profile.bio}
    </text>
    ` : ''}
    
    ${profile.location ? `
    <g transform="translate(250, 230)">
        <path d="M0,0 L12,0 L12,12 L6,18 L0,12 Z" fill="#8b949e"/>
        <text x="20" y="10" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">${profile.location}</text>
    </g>
    ` : ''}
    
    <!-- Join Date -->
    <text x="250" y="260" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">
        Joined GitHub • ${joinMonth} ${joinYear}
    </text>
</svg>`;
}

function generateGitHubStatsSVG(stats) {
    const statsData = [
        { icon: '⭐', label: 'Total Stars', value: stats.totalStars },
        { icon: '📝', label: 'Commits (Last Year)', value: stats.commitsLastYear },
        { icon: '🔀', label: 'Pull Requests', value: stats.totalPRsCreated },
        { icon: '🐛', label: 'Issues Created', value: stats.totalIssuesCreated },
        { icon: '🤝', label: 'Repos Contributed', value: stats.contributedToLastYear },
        { icon: '👥', label: 'Followers', value: stats.followers },
        { icon: '📂', label: 'Public Repos', value: stats.totalRepositories }
    ];

    const statsElements = statsData.map((stat, index) => {
        const x = (index % 4) * 200;
        const y = Math.floor(index / 4) * 120 + 80;

        return `
        <g transform="translate(${x}, ${y})">
            <rect width="180" height="100" rx="15" ry="15" fill="#21262d" stroke="#30363d" stroke-width="2"/>
            <text x="90" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="32">${stat.icon}</text>
            <text x="90" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stat.value)}
            </text>
            <text x="90" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
                ${stat.label}
            </text>
        </g>
        `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="400" fill="#0d1117" rx="20" ry="20"/>
    
    <!-- Title -->
    <text x="400" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="url(#titleGradient)">
        📊 GitHub Statistics
    </text>
    
    <!-- Stats Grid -->
    ${statsElements}
    
    <!-- Animated border effect -->
    <rect width="796" height="396" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#titleGradient)" stroke-width="2">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="10s" repeatCount="indefinite"/>
    </rect>
</svg>`;
}

function generateLanguagesSVG(languages) {
    const languageEntries = Object.entries(languages || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const maxPercentage = Math.max(...languageEntries.map(([, p]) => parseFloat(p)), 0);

    const languageElements = languageEntries.map(([language, percentage], index) => {
        const y = index * 60 + 80;
        const barWidth = (parseFloat(percentage) / maxPercentage) * 500;
        const color = getLanguageColor(language);

        return `
        <g transform="translate(100, ${y})">
            <text x="0" y="15" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${language}
            </text>
            <text x="650" y="15" text-anchor="end" font-family="'Courier New', monospace" font-size="14" fill="#8b949e">
                ${percentage}%
            </text>
            <rect x="0" y="25" width="500" height="20" rx="10" ry="10" fill="#161b22"/>
            <rect x="0" y="25" width="${barWidth}" height="20" rx="10" ry="10" fill="${color}">
                <animate attributeName="width" from="0" to="${barWidth}" dur="1s" fill="freeze" begin="${index * 0.2}s"/>
            </rect>
        </g>
        `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="${Math.max(400, 100 + languageEntries.length * 60)}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="700" height="${Math.max(400, 100 + languageEntries.length * 60)}" fill="#21262d" rx="20" ry="20" stroke="#30363d" stroke-width="2"/>
    
    <!-- Title -->
    <text x="350" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="url(#titleGradient)">
        💻 Most Used Languages
    </text>
    
    <!-- Languages -->
    ${languageElements}
    
    <!-- Legend -->
    <g transform="translate(100, ${100 + languageEntries.length * 60 + 20})">
        <text x="0" y="15" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
            * Based on code usage across public repositories
        </text>
    </g>
</svg>`;
}

function generateAllSVGs() {
    console.log('🎨 Generating SVGs...');

    const stats = readStatsData();

    // Create SVGs directory
    if (!fs.existsSync(SVGS_DIR)) {
        fs.mkdirSync(SVGS_DIR, { recursive: true });
    }

    try {
        // Generate profile header SVG
        console.log('   Generating profile header SVG...');
        const profileSVG = generateProfileHeaderSVG(stats.profile);
        fs.writeFileSync(path.join(SVGS_DIR, 'profile-header.svg'), profileSVG);

        // Generate GitHub stats SVG
        console.log('   Generating GitHub stats SVG...');
        const statsSVG = generateGitHubStatsSVG(stats.stats);
        fs.writeFileSync(path.join(SVGS_DIR, 'github-stats.svg'), statsSVG);

        // Generate languages SVG
        console.log('   Generating languages SVG...');
        const languagesSVG = generateLanguagesSVG(stats.languages);
        fs.writeFileSync(path.join(SVGS_DIR, 'languages.svg'), languagesSVG);

        // Generate a combined SVG for README
        console.log('   Generating combined README SVG...');
        const combinedSVG = generateCombinedSVG(stats);
        fs.writeFileSync(path.join(SVGS_DIR, 'readme-combined.svg'), combinedSVG);

        console.log(`✅ SVGs generated successfully!`);
        console.log(`📁 Location: ${SVGS_DIR}`);

        // Show file sizes
        const files = ['profile-header.svg', 'github-stats.svg', 'languages.svg', 'readme-combined.svg'];
        files.forEach(file => {
            const filePath = path.join(SVGS_DIR, file);
            if (fs.existsSync(filePath)) {
                const size = fs.statSync(filePath).size;
                console.log(`   ${file}: ${(size / 1024).toFixed(2)} KB`);
            }
        });

    } catch (error) {
        console.error('❌ Error generating SVGs:', error);
        process.exit(1);
    }
}

function generateCombinedSVG(stats) {
    // Create a compact version for README
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="700" height="400" fill="#0d1117" rx="20" ry="20"/>
    
    <!-- Title -->
    <text x="350" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#gradient)">
        ${stats.profile.name || stats.profile.login}'s GitHub Stats
    </text>
    
    <!-- Key Stats -->
    <g transform="translate(50, 80)">
        <!-- Stars -->
        <g>
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">⭐ Stars</text>
            <text x="150" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalStars)}
            </text>
        </g>
        
        <!-- Commits -->
        <g transform="translate(0, 40)">
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">📝 Commits</text>
            <text x="150" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.commitsLastYear)}
            </text>
        </g>
        
        <!-- PRs -->
        <g transform="translate(0, 80)">
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">🔀 PRs</text>
            <text x="150" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalPRsCreated)}
            </text>
        </g>
        
        <!-- Issues -->
        <g transform="translate(0, 120)">
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">🐛 Issues</text>
            <text x="150" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalIssuesCreated)}
            </text>
        </g>
    </g>
    
    <!-- Languages (Right side) -->
    <g transform="translate(350, 80)">
        <text x="0" y="-10" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#58a6ff">
            Top Languages
        </text>
        
        ${Object.entries(stats.languages || {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([lang, percent], index) => `
            <g transform="translate(0, ${index * 40})">
                <circle cx="10" cy="20" r="6" fill="${getLanguageColor(lang)}"/>
                <text x="25" y="25" font-family="Arial, sans-serif" font-size="14" fill="#f0f6fc">${lang}</text>
                <text x="180" y="25" text-anchor="end" font-family="'Courier New', monospace" font-size="12" fill="#8b949e">
                    ${percent}%
                </text>
            </g>
            `).join('')}
    </g>
    
    <!-- Footer -->
    <text x="350" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
        Updated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </text>
    
    <!-- Border -->
    <rect width="696" height="396" x="2" y="2" rx="18" ry="18" fill="none" stroke="#30363d" stroke-width="2"/>
</svg>`;
}

// Run the script
if (require.main === module) {
    generateAllSVGs();
}

module.exports = { generateAllSVGs };