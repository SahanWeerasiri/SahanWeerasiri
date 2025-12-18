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
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Kotlin': '#A97BFF',
        'Swift': '#ffac45'
    };
    return colors[language] || '#6e7681';
}

function generateProfileHeaderSVG(profile) {
    const joinDate = new Date(profile.createdAt);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.toLocaleString('default', { month: 'long' });

    // Handle long bio text
    let bioLines = [];
    if (profile.bio) {
        // Split bio into lines (max 60 chars per line)
        const words = profile.bio.split(' ');
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + ' ' + word).length > 60) {
                bioLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
        }
        if (currentLine) bioLines.push(currentLine);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="280" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="4" result="offsetblur"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Background with animation -->
    <rect width="800" height="280" fill="#0d1117" rx="20" ry="20">
        <animate attributeName="rx" values="20;25;20" dur="10s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="20;25;20" dur="10s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Animated border -->
    <rect width="796" height="276" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#gradient)" stroke-width="2" opacity="0.7">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="15s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Avatar with pulse animation -->
    <circle cx="100" cy="140" r="65" fill="url(#gradient)">
        <animate attributeName="r" values="65;68;65" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="100" cy="140" r="60" fill="#0d1117"/>
    <image href="${profile.avatarUrl}" x="40" y="80" width="120" height="120" preserveAspectRatio="xMidYMid slice">
        <animate attributeName="opacity" values="1;0.9;1" dur="4s" repeatCount="indefinite"/>
    </image>
    
    <!-- Profile Info -->
    <g filter="url(#shadow)">
        <text x="200" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="url(#gradient)">
            ${profile.name || profile.login}
        </text>
    </g>
    
    <text x="200" y="110" font-family="'Courier New', monospace" font-size="18" fill="#8b949e">
        @${profile.login}
    </text>
    
    <!-- Bio lines -->
    ${bioLines.map((line, index) => `
    <text x="200" y="${140 + index * 25}" font-family="Arial, sans-serif" font-size="14" fill="#c9d1d9">
        ${line}
    </text>
    `).join('')}
    
    ${profile.location ? `
    <!-- Location with animation -->
    <g transform="translate(200, ${bioLines.length > 0 ? 140 + bioLines.length * 25 : 140})">
        <circle cx="10" cy="10" r="8" fill="#58a6ff">
            <animate attributeName="fill" values="#58a6ff;#a371f7;#58a6ff" dur="4s" repeatCount="indefinite"/>
        </circle>
        <text x="25" y="15" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">${profile.location}</text>
    </g>
    ` : ''}
    
    <!-- Join Date with fade animation -->
    <text x="200" y="${bioLines.length > 0 ? 165 + bioLines.length * 25 : 165}" font-family="Arial, sans-serif" font-size="12" fill="#8b949e" opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
        Joined GitHub • ${joinMonth} ${joinYear}
    </text>
    
    <!-- Floating particles -->
    <circle cx="50" cy="50" r="2" fill="#58a6ff" opacity="0.6">
        <animate attributeName="cy" values="50;30;50" dur="7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="7s" repeatCount="indefinite"/>
    </circle>
    <circle cx="750" cy="100" r="3" fill="#a371f7" opacity="0.5">
        <animate attributeName="cx" values="750;730;750" dur="8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="700" cy="250" r="2" fill="#58a6ff" opacity="0.4">
        <animate attributeName="cy" values="250;230;250" dur="6s" repeatCount="indefinite"/>
    </circle>
</svg>`;
}

function generateGitHubStatsSVG(stats) {
    const statsData = [
        { icon: '⭐', label: 'Total Stars', value: stats.totalStars, color: '#f1e05a' },
        { icon: '📝', label: 'Commits', value: stats.commitsLastYear, color: '#58a6ff' },
        { icon: '🔀', label: 'Pull Requests', value: stats.totalPRsCreated, color: '#238636' },
        { icon: '🐛', label: 'Issues Created', value: stats.totalIssuesCreated, color: '#f85149' },
        { icon: '🤝', label: 'Repos Contributed', value: stats.contributedToLastYear, color: '#a371f7' },
        { icon: '👥', label: 'Followers', value: stats.followers, color: '#db61a2' },
        { icon: '📂', label: 'Public Repos', value: stats.totalRepositories, color: '#8b949e' }
    ];

    const statsElements = statsData.map((stat, index) => {
        const x = (index % 4) * 200;
        const y = Math.floor(index / 4) * 120 + 80;

        return `
        <g transform="translate(${x}, ${y})">
            <!-- Card background with hover effect -->
            <rect width="180" height="100" rx="15" ry="15" fill="#21262d" stroke="${stat.color}" stroke-width="2">
                <animate attributeName="stroke-width" values="2;3;2" dur="2s" begin="${index * 0.5}s" repeatCount="indefinite"/>
                <animate attributeName="fill" values="#21262d;#30363d;#21262d" dur="4s" begin="${index * 0.3}s" repeatCount="indefinite"/>
            </rect>
            
            <!-- Icon with bounce animation -->
            <text x="90" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="${stat.color}">
                <animate attributeName="y" values="40;35;40" dur="1.5s" begin="${index * 0.4}s" repeatCount="indefinite"/>
                ${stat.icon}
            </text>
            
            <!-- Value with counting animation -->
            <text x="90" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stat.value)}
                <animate attributeName="opacity" values="1;0.8;1" dur="2s" begin="${index * 0.2}s" repeatCount="indefinite"/>
            </text>
            
            <!-- Label with subtle animation -->
            <text x="90" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
                ${stat.label}
                <animate attributeName="fill" values="#8b949e;#c9d1d9;#8b949e" dur="3s" begin="${index * 0.6}s" repeatCount="indefinite"/>
            </text>
        </g>
        `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#a371f7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#58a6ff;stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Animated background -->
    <rect width="800" height="400" fill="#0d1117" rx="20" ry="20">
        <animate attributeName="fill" values="#0d1117;#161b22;#0d1117" dur="20s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Title with moving gradient -->
    <text x="400" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" filter="url(#glow)">
        <tspan fill="url(#titleGradient)">
            <animate attributeName="x" values="400;410;400" dur="10s" repeatCount="indefinite"/>
            📊 GitHub Statistics
        </tspan>
    </text>
    
    <!-- Moving gradient in title -->
    <animate xlink:href="#titleGradient" attributeName="x1" values="0%;100%;0%" dur="15s" repeatCount="indefinite"/>
    <animate xlink:href="#titleGradient" attributeName="x2" values="100%;0%;100%" dur="15s" repeatCount="indefinite"/>
    
    <!-- Stats Grid -->
    ${statsElements}
    
    <!-- Animated border -->
    <rect width="796" height="396" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#titleGradient)" stroke-width="2" opacity="0.8">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="12s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Floating particles -->
    ${Array.from({ length: 8 }).map((_, i) => {
        const size = 1 + Math.random() * 2;
        const x = 20 + Math.random() * 760;
        const y = 60 + Math.random() * 320;
        const duration = 5 + Math.random() * 10;
        const delay = Math.random() * 5;
        return `
        <circle cx="${x}" cy="${y}" r="${size}" fill="#58a6ff" opacity="0.3">
            <animate attributeName="cy" values="${y};${y - 50};${y}" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>
        `;
    }).join('')}
</svg>`;
}

function generateLanguagesSVG(languages) {
    const languageEntries = Object.entries(languages || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const maxPercentage = Math.max(...languageEntries.map(([, p]) => parseFloat(p)), 0);

    const languageElements = languageEntries.map(([language, percentage], index) => {
        const y = index * 70 + 100;
        const barWidth = (parseFloat(percentage) / maxPercentage) * 500;
        const color = getLanguageColor(language);

        return `
        <g transform="translate(100, ${y})">
            <!-- Language name with slide-in animation -->
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc" opacity="0">
                <animate attributeName="x" values="-100;0" dur="0.8s" begin="${index * 0.3}s" fill="freeze"/>
                <animate attributeName="opacity" values="0;1" dur="0.8s" begin="${index * 0.3}s" fill="freeze"/>
                ${language}
            </text>
            
            <!-- Percentage with fade-in animation -->
            <text x="650" y="20" text-anchor="end" font-family="'Courier New', monospace" font-size="16" fill="#8b949e" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="1s" begin="${index * 0.5}s" fill="freeze"/>
                ${percentage}%
            </text>
            
            <!-- Background bar -->
            <rect x="0" y="30" width="500" height="25" rx="12.5" ry="12.5" fill="#161b22">
                <animate attributeName="width" values="0;500" dur="0.5s" begin="${index * 0.2}s" fill="freeze"/>
            </rect>
            
            <!-- Animated progress bar -->
            <rect x="0" y="30" width="0" height="25" rx="12.5" ry="12.5" fill="${color}">
                <animate attributeName="width" values="0;${barWidth}" dur="1.5s" begin="${index * 0.5}s" fill="freeze"/>
                <animate attributeName="fill" values="${color};${color}88;${color}" dur="3s" begin="${index * 2}s" repeatCount="indefinite"/>
            </rect>
            
            <!-- Bar percentage text -->
            <text x="${barWidth - 10}" y="48" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" font-weight="bold" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${index * 1.8}s" fill="freeze"/>
                ${percentage}%
            </text>
        </g>
        `;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="${Math.max(400, 150 + languageEntries.length * 70)}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#0d1117;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#161b22;stop-opacity:1"/>
        </radialGradient>
    </defs>
    
    <!-- Background with subtle pulse -->
    <rect width="700" height="${Math.max(400, 150 + languageEntries.length * 70)}" fill="url(#bgGradient)" rx="20" ry="20">
        <animate attributeName="rx" values="20;22;20" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="20;22;20" dur="8s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Border -->
    <rect width="696" height="${Math.max(396, 146 + languageEntries.length * 70)}" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#titleGradient)" stroke-width="2" opacity="0.6">
        <animate attributeName="stroke-dasharray" values="0,700;700,0;0,700" dur="10s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Animated title -->
    <text x="350" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="url(#titleGradient)">
        <animate attributeName="font-size" values="28;30;28" dur="3s" repeatCount="indefinite"/>
        💻 Most Used Languages
    </text>
    
    <text x="350" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
        Based on code usage across repositories
        <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite"/>
    </text>
    
    <!-- Moving gradient -->
    <animate xlink:href="#titleGradient" attributeName="x1" values="0%;100%;0%" dur="10s" repeatCount="indefinite"/>
    <animate xlink:href="#titleGradient" attributeName="x2" values="100%;0%;100%" dur="10s" repeatCount="indefinite"/>
    
    <!-- Languages with sequential animation -->
    ${languageElements}
    
    <!-- Legend -->
    <g transform="translate(100, ${130 + languageEntries.length * 70})">
        <text x="0" y="20" font-family="Arial, sans-serif" font-size="12" fill="#8b949e" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="2s" begin="3s" fill="freeze"/>
            * Updates daily via GitHub Actions
        </text>
    </g>
    
    <!-- Floating code brackets -->
    <text x="50" y="150" font-family="Arial, sans-serif" font-size="20" fill="#58a6ff" opacity="0.3">
        <animate attributeName="y" values="150;140;150" dur="5s" repeatCount="indefinite"/>
        &lt;/&gt;
    </text>
    <text x="650" y="250" font-family="Arial, sans-serif" font-size="20" fill="#a371f7" opacity="0.3">
        <animate attributeName="y" values="250;240;250" dur="6s" repeatCount="indefinite"/>
        { }
    </text>
</svg>`;
}

function generateAllSVGs() {
    console.log('🎨 Generating SVGs with animations...');

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

        console.log(`✅ Animated SVGs generated successfully!`);
        console.log(`📁 Location: ${SVGS_DIR}`);

    } catch (error) {
        console.error('❌ Error generating SVGs:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    generateAllSVGs();
}

module.exports = { generateAllSVGs };