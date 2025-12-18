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

function generateInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function generateProfileHeaderSVG(profile) {
    const joinDate = new Date(profile.createdAt);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.toLocaleString('default', { month: 'long' });
    const initials = generateInitials(profile.name || profile.login);

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

    // Calculate bio height
    const bioHeight = bioLines.length * 25;
    const locationHeight = profile.location ? 30 : 0;
    const totalHeight = 180 + bioHeight + locationHeight;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="avatarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:0.7"/>
        </radialGradient>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="${totalHeight}" fill="#0d1117" rx="20" ry="20"/>
    
    <!-- Animated border -->
    <rect width="796" height="${totalHeight - 4}" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#gradient)" stroke-width="2" opacity="0.7">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="15s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Avatar circle with animation -->
    <circle cx="100" cy="100" r="65" fill="url(#avatarGradient)">
        <animate attributeName="r" values="65;68;65" dur="3s" repeatCount="indefinite"/>
    </circle>
    
    <!-- Avatar initials -->
    <text x="100" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">
        ${initials}
        <animate attributeName="font-size" values="36;38;36" dur="4s" repeatCount="indefinite"/>
    </text>
    
    <!-- Profile Info -->
    <text x="200" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="url(#gradient)">
        ${profile.name || profile.login}
    </text>
    
    <text x="200" y="90" font-family="'Courier New', monospace" font-size="18" fill="#8b949e">
        @${profile.login}
    </text>
    
    <!-- Bio lines -->
    ${bioLines.map((line, index) => `
    <text x="200" y="${120 + index * 25}" font-family="Arial, sans-serif" font-size="14" fill="#c9d1d9">
        ${line}
    </text>
    `).join('')}
    
    ${profile.location ? `
    <!-- Location -->
    <g transform="translate(200, ${120 + bioHeight})">
        <circle cx="10" cy="10" r="8" fill="#58a6ff">
            <animate attributeName="fill" values="#58a6ff;#a371f7;#58a6ff" dur="4s" repeatCount="indefinite"/>
        </circle>
        <text x="25" y="15" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">${profile.location}</text>
    </g>
    ` : ''}
    
    <!-- Join Date -->
    <text x="200" y="${150 + bioHeight + locationHeight}" font-family="Arial, sans-serif" font-size="12" fill="#8b949e" opacity="0.8">
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
    <circle cx="700" cy="${totalHeight - 30}" r="2" fill="#58a6ff" opacity="0.4">
        <animate attributeName="cy" values="${totalHeight - 30};${totalHeight - 50};${totalHeight - 30}" dur="6s" repeatCount="indefinite"/>
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

    // Simple grid layout
    const statsElements = statsData.map((stat, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 50 + col * 190;
        const y = 80 + row * 120;

        return `
        <g transform="translate(${x}, ${y})">
            <!-- Card background -->
            <rect width="170" height="100" rx="15" ry="15" fill="#21262d" stroke="${stat.color}" stroke-width="2">
                <animate attributeName="stroke-width" values="2;3;2" dur="2s" begin="${index * 0.5}s" repeatCount="indefinite"/>
            </rect>
            
            <!-- Icon -->
            <text x="85" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="${stat.color}">
                ${stat.icon}
            </text>
            
            <!-- Value -->
            <text x="85" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stat.value)}
            </text>
            
            <!-- Label -->
            <text x="85" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
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
    
    <!-- Animated border -->
    <rect width="796" height="396" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#titleGradient)" stroke-width="2">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="12s" repeatCount="indefinite"/>
    </rect>
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
            <!-- Language name -->
            <text x="0" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f0f6fc">
                ${language}
            </text>
            
            <!-- Percentage -->
            <text x="650" y="20" text-anchor="end" font-family="'Courier New', monospace" font-size="16" fill="#8b949e">
                ${percentage}%
            </text>
            
            <!-- Background bar -->
            <rect x="0" y="30" width="500" height="25" rx="12.5" ry="12.5" fill="#161b22"/>
            
            <!-- Animated progress bar with fill → fade → refill cycle -->
            <rect x="0" y="30" width="0" height="25" rx="12.5" ry="12.5" fill="${color}">
                <!-- First fill animation -->
                <animate id="fill${index}" attributeName="width" values="0;${barWidth}" dur="1s" begin="0s;refill${index}.end" fill="freeze"/>
                
                <!-- Wait for 2 seconds -->
                <animate id="wait${index}" attributeName="width" values="${barWidth};${barWidth}" dur="2s" begin="fill${index}.end" fill="freeze"/>
                
                <!-- Fade out -->
                <animate id="fade${index}" attributeName="width" values="${barWidth};${barWidth}" dur="1s" begin="wait${index}.end" fill="freeze"/>
                <animate attributeName="opacity" values="1;0.2" dur="1s" begin="wait${index}.end" fill="freeze"/>
                
                <!-- Refill -->
                <animate id="refill${index}" attributeName="width" values="${barWidth};${barWidth}" dur="1s" begin="fade${index}.end" fill="freeze"/>
                <animate attributeName="opacity" values="0.2;1" dur="1s" begin="fade${index}.end" fill="freeze"/>
            </rect>
            
            <!-- Percentage text inside bar -->
            <text x="${barWidth - 10}" y="48" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" font-weight="bold" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="fill${index}.end" fill="freeze"/>
                <animate attributeName="opacity" values="1;0" dur="0.5s" begin="fade${index}.begin" fill="freeze"/>
                ${percentage}%
            </text>
        </g>
        `;
    }).join('');

    const height = Math.max(400, 150 + languageEntries.length * 70);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a371f7;stop-opacity:1" />
        </linearGradient>
        
        <!-- Define gradient animation without xlink:href -->
        <animate href="#titleGradient" attributeName="x1" values="0%;100%;0%" dur="10s" repeatCount="indefinite"/>
        <animate href="#titleGradient" attributeName="x2" values="100%;0%;100%" dur="10s" repeatCount="indefinite"/>
    </defs>
    
    <!-- Background -->
    <rect width="700" height="${height}" fill="#21262d" rx="20" ry="20" stroke="#30363d" stroke-width="2"/>
    
    <!-- Title -->
    <text x="350" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="url(#titleGradient)">
        💻 Most Used Languages
    </text>
    
    <text x="350" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">
        Based on code usage across repositories
    </text>
    
    <!-- Languages with animation -->
    ${languageElements}
    
    <!-- Cycle info -->
    <text x="350" y="${height - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" opacity="0.7">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite"/>
        Animation cycle: Fill → Pause → Fade → Refill
    </text>
</svg>`;
}

function generateCombinedSVG(stats) {
    // Calculate account age
    const joinDate = new Date(stats.profile.createdAt);
    const now = new Date();
    const accountAgeYears = Math.floor((now - joinDate) / (365 * 24 * 60 * 60 * 1000));

    // Get top 3 languages
    const topLanguages = Object.entries(stats.languages || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#a371f7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#58a6ff;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0d1117;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#161b22;stop-opacity:1" />
        </linearGradient>
        <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#58a6ff;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#58a6ff;stop-opacity:0" />
        </radialGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Animated background -->
    <rect width="800" height="400" fill="url(#bgGradient)" rx="20" ry="20">
        <animate attributeName="rx" values="20;22;20" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="20;22;20" dur="8s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Main title with glow effect -->
    <text x="400" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="url(#mainGradient)" filter="url(#glow)">
        <animate attributeName="font-size" values="28;30;28" dur="3s" repeatCount="indefinite"/>
        🚀 GitHub Stats Overview
    </text>
    
    <!-- Moving gradient animation -->
    <animate href="#mainGradient" attributeName="x1" values="0%;100%;0%" dur="10s" repeatCount="indefinite"/>
    <animate href="#mainGradient" attributeName="x2" values="100%;0%;100%" dur="10s" repeatCount="indefinite"/>
    
    <!-- Profile section -->
    <g transform="translate(50, 80)">
        <!-- Profile card -->
        <rect width="300" height="120" rx="15" ry="15" fill="#21262d" stroke="#58a6ff" stroke-width="2">
            <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
        </rect>
        
        <!-- Profile info -->
        <text x="150" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f0f6fc">
            ${stats.profile.name || stats.profile.login}
        </text>
        
        <text x="150" y="65" text-anchor="middle" font-family="'Courier New', monospace" font-size="14" fill="#8b949e">
            @${stats.profile.login}
        </text>
        
        <text x="150" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#58a6ff">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            ${accountAgeYears}+ years on GitHub
        </text>
    </g>
    
    <!-- Key Stats - Left column -->
    <g transform="translate(380, 80)">
        <!-- Stars -->
        <g>
            <circle cx="20" cy="20" r="15" fill="#f1e05a">
                <animate attributeName="r" values="15;17;15" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">⭐</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalStars)}
                <animate attributeName="x" values="45;47;45" dur="1s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Stars</text>
        </g>
        
        <!-- Commits -->
        <g transform="translate(0, 40)">
            <circle cx="20" cy="20" r="15" fill="#58a6ff">
                <animate attributeName="r" values="15;17;15" dur="1.5s" begin="0.3s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">📝</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.commitsLastYear)}
                <animate attributeName="x" values="45;47;45" dur="1s" begin="0.3s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Commits</text>
        </g>
        
        <!-- PRs -->
        <g transform="translate(0, 80)">
            <circle cx="20" cy="20" r="15" fill="#238636">
                <animate attributeName="r" values="15;17;15" dur="1.5s" begin="0.6s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">🔀</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalPRsCreated)}
                <animate attributeName="x" values="45;47;45" dur="1s" begin="0.6s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Pull Requests</text>
        </g>
    </g>
    
    <!-- Key Stats - Right column -->
    <g transform="translate(580, 80)">
        <!-- Issues -->
        <g>
            <circle cx="20" cy="20" r="15" fill="#f85149">
                <animate attributeName="r" values="15;17;15" dur="1.5s" begin="0.9s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">🐛</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalIssuesCreated)}
                <animate attributeName="x" values="45;47;45" dur="1s" begin="0.9s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Issues</text>
        </g>
        
        <!-- Followers -->
        <g transform="translate(0, 40)">
            <circle cx="20" cy="20" r="15" fill="#db61a2">
                <animate attributeName="r" values="15;17;15" dur="1.5s" begin="1.2s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">👥</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.followers)}
                <animate attributeName="x" values="45;47;45" dur="1s" begin="1.2s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Followers</text>
        </g>
        
        <!-- Repos -->
        <g transform="translate(0, 80)">
            <circle cx="20" cy="20" r="15" fill="#8b949e">
                <animate attributeName="r" values="15;17;15" dur="1.5s" begin="1.5s" repeatCount="indefinite"/>
            </circle>
            <text x="20" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#0d1117" font-weight="bold">📂</text>
            <text x="45" y="25" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f0f6fc">
                ${formatNumber(stats.stats.totalRepositories)}
                <animate attributeName="x" values="45;47;45" dur="1s" begin="1.5s" repeatCount="indefinite"/>
            </text>
            <text x="120" y="25" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Repositories</text>
        </g>
    </g>
    
    <!-- Languages Section -->
    <g transform="translate(50, 220)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#58a6ff">
            💻 Top Languages
        </text>
        
        ${topLanguages.map(([lang, percent], index) => {
        const color = getLanguageColor(lang);
        const barWidth = (parseFloat(percent) / 100) * 200;

        return `
            <g transform="translate(0, ${30 + index * 40})">
                <!-- Language dot -->
                <circle cx="10" cy="15" r="6" fill="${color}">
                    <animate attributeName="r" values="6;8;6" dur="2s" begin="${index * 0.5}s" repeatCount="indefinite"/>
                </circle>
                
                <!-- Language name -->
                <text x="25" y="20" font-family="Arial, sans-serif" font-size="14" fill="#f0f6fc">
                    ${lang}
                </text>
                
                <!-- Percentage -->
                <text x="180" y="20" text-anchor="end" font-family="'Courier New', monospace" font-size="12" fill="#8b949e">
                    ${percent}%
                </text>
                
                <!-- Mini progress bar -->
                <rect x="200" y="10" width="150" height="10" rx="5" ry="5" fill="#161b22"/>
                <rect x="200" y="10" width="0" height="10" rx="5" ry="5" fill="${color}">
                    <animate attributeName="width" values="0;${barWidth}" dur="1s" begin="${index * 0.3}s" fill="freeze"/>
                    <animate attributeName="width" values="${barWidth};${barWidth}" dur="2s" begin="1s" fill="freeze"/>
                    <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="3s" repeatCount="indefinite"/>
                </rect>
            </g>
            `;
    }).join('')}
    </g>
    
    <!-- Contributed repos -->
    <g transform="translate(400, 220)">
        <rect width="350" height="120" rx="15" ry="15" fill="#21262d" stroke="#a371f7" stroke-width="2">
            <animate attributeName="stroke-width" values="2;3;2" dur="2s" begin="1s" repeatCount="indefinite"/>
        </rect>
        
        <text x="175" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#a371f7">
            🤝
        </text>
        
        <text x="175" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#f0f6fc">
            ${formatNumber(stats.stats.contributedToLastYear)}
            <animate attributeName="font-size" values="32;34;32" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
        </text>
        
        <text x="175" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">
            Repositories Contributed
        </text>
    </g>
    
    <!-- Animated border -->
    <rect width="796" height="396" x="2" y="2" rx="18" ry="18" fill="none" stroke="url(#mainGradient)" stroke-width="3" opacity="0.8">
        <animate attributeName="stroke-dasharray" values="0,800;800,0;0,800" dur="15s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite"/>
    </rect>
    
    <!-- Floating particles -->
    ${Array.from({ length: 12 }).map((_, i) => {
        const size = 1 + Math.random() * 2;
        const x = Math.random() * 800;
        const y = Math.random() * 400;
        const duration = 6 + Math.random() * 8;
        const delay = Math.random() * 3;
        return `
        <circle cx="${x}" cy="${y}" r="${size}" fill="#58a6ff" opacity="0.3">
            <animate attributeName="cy" values="${y};${y - 40};${y}" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.1;0.4;0.1" dur="${duration}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>
        `;
    }).join('')}
    
    <!-- Footer -->
    <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#8b949e" opacity="0.8">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
        Updated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        • Auto-refreshes daily
    </text>
    
    <!-- Pulsing center circle -->
    <circle cx="400" cy="200" r="0" fill="url(#pulseGradient)">
        <animate attributeName="r" values="0;100;0" dur="6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.5;0" dur="6s" repeatCount="indefinite"/>
    </circle>
</svg>`;
}


function generateAllSVGs() {
    console.log('🎨 Generating simple SVGs...');

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

        // Generate combined SVG
        console.log('   Generating combined SVG...');
        const combinedSVG = generateCombinedSVG(stats);
        fs.writeFileSync(path.join(SVGS_DIR, 'combined-stats.svg'), combinedSVG);

        console.log(`✅ SVGs generated successfully!`);
        console.log(`📁 Location: ${SVGS_DIR}`);

        // Show file sizes
        const files = ['profile-header.svg', 'github-stats.svg', 'languages.svg', 'combined-stats.svg'];
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

// Run the script
if (require.main === module) {
    generateAllSVGs();
}