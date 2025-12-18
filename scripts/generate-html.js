#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_FILE = path.join(__dirname, '../data/github-stats.json');
const OUTPUT_FILE = path.join(__dirname, '../data/index.html');

// Read the JSON data
function readStatsData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading data file: ${error.message}`);
        process.exit(1);
    }
}

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get color for language
function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C#': '#178600',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Swift': '#ffac45',
        'Kotlin': '#A97BFF',
        'Dart': '#00B4AB',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Jupyter Notebook': '#DA5B0B',
        'Shell': '#89e051',
        'Vue': '#41b883',
        'React': '#61dafb',
        'Angular': '#dd0031',
        'Svelte': '#ff3e00'
    };
    return colors[language] || '#6e7681';
}

// Generate contribution calendar HTML
function generateContributionCalendar(weeks) {
    let calendarHTML = '';

    // Create a simple calendar representation
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    calendarHTML += '<div class="calendar-container">';
    calendarHTML += '<div class="calendar-header">';
    days.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    calendarHTML += '</div>';

    calendarHTML += '<div class="calendar-grid">';

    weeks.forEach(week => {
        week.contributionDays.forEach(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();

            let intensity = 'level-0';
            if (day.contributionCount > 0) intensity = 'level-1';
            if (day.contributionCount > 5) intensity = 'level-2';
            if (day.contributionCount > 10) intensity = 'level-3';
            if (day.contributionCount > 20) intensity = 'level-4';

            calendarHTML += `<div class="calendar-day ${intensity}" 
        title="${formatDate(day.date)}: ${day.contributionCount} contributions"
        style="grid-column: ${dayOfWeek + 1}"></div>`;
        });
    });

    calendarHTML += '</div>';

    // Legend
    calendarHTML += '<div class="calendar-legend">';
    calendarHTML += '<span>Less</span>';
    calendarHTML += '<div class="legend-level level-0"></div>';
    calendarHTML += '<div class="legend-level level-1"></div>';
    calendarHTML += '<div class="legend-level level-2"></div>';
    calendarHTML += '<div class="legend-level level-3"></div>';
    calendarHTML += '<div class="legend-level level-4"></div>';
    calendarHTML += '<span>More</span>';
    calendarHTML += '</div>';

    calendarHTML += '</div>';

    return calendarHTML;
}

// Generate language bars HTML
function generateLanguageBars(languages) {
    let barsHTML = '';

    // Check if languages is an object
    if (!languages || typeof languages !== 'object') {
        console.warn('❌ Languages data is not available or not an object');
        return '<p class="no-languages">Language data not available</p>';
    }

    try {
        // Convert languages object to array and sort by percentage
        const languagesArray = Object.entries(languages)
            .map(([name, data]) => ({
                name: name,
                percentage: typeof data === 'object' ? parseFloat(data.percentage || data) : parseFloat(data)
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5); // Take top 5

        languagesArray.forEach(langData => {
            const { name: language, percentage } = langData;
            const color = getLanguageColor(language);

            barsHTML += `
          <div class="language-item">
            <div class="language-info">
              <span class="language-name">${language}</span>
              <span class="language-percentage">${percentage.toFixed(2)}%</span>
            </div>
            <div class="language-bar">
              <div class="language-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
          </div>
        `;
        });

        return barsHTML;

    } catch (error) {
        console.error('Error processing languages:', error);
        return '<p class="error">Error displaying languages</p>';
    }
}

// Generate repository cards HTML
function generateRepoCards(repositories) {
    let cardsHTML = '';

    repositories.sample.forEach(repo => {
        const updatedDate = new Date(repo.updatedAt);
        const now = new Date();
        const daysAgo = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));

        cardsHTML += `
      <div class="repo-card">
        <div class="repo-header">
          <h3 class="repo-name">
            <svg class="repo-icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
              <path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"></path>
            </svg>
            ${repo.name}
          </h3>
          <span class="repo-updated">${daysAgo} days ago</span>
        </div>
        ${repo.description ? `<p class="repo-description">${repo.description}</p>` : ''}
        <div class="repo-stats">
          <span class="repo-stat">
            <svg class="stat-icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
              <path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"></path>
            </svg>
            ${formatNumber(repo.stars)}
          </span>
          <span class="repo-stat">
            <svg class="stat-icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
              <path fill="currentColor" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"></path>
            </svg>
            ${formatNumber(repo.forks)}
          </span>
          ${repo.language ? `
            <span class="repo-stat">
              <span class="language-dot" style="background-color: ${getLanguageColor(repo.language)}"></span>
              ${repo.language}
            </span>
          ` : ''}
        </div>
      </div>
    `;
    });

    return cardsHTML;
}

// Generate the complete HTML
function generateHTML(stats) {
    const {
        metadata,
        profile,
        stats: statsData,
        languages,
        repositories,
        contributionCalendar
    } = stats;

    const lastUpdated = formatDate(metadata.fetchedAt);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.name || profile.login}'s GitHub Stats</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-card: #21262d;
            --border-color: #30363d;
            --text-primary: #f0f6fc;
            --text-secondary: #8b949e;
            --text-muted: #6e7681;
            --accent: #58a6ff;
            --accent-hover: #79c0ff;
            --success: #238636;
            --warning: #daaa3f;
            --danger: #f85149;
            --radius: 12px;
            --shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            --transition: all 0.3s ease;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, #0a0d12 100%);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header Styles */
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 1px solid var(--border-color);
        }

        .profile-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 25px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid var(--accent);
            box-shadow: var(--shadow);
            transition: var(--transition);
        }

        .avatar:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(88, 166, 255, 0.2);
        }

        .profile-info h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(90deg, var(--accent), #a371f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .profile-info .username {
            font-size: 1.2rem;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
            margin-bottom: 12px;
        }

        .bio {
            max-width: 600px;
            margin: 0 auto 20px;
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .profile-details {
            display: flex;
            justify-content: center;
            gap: 25px;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .detail-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
        }

        .detail-item i {
            color: var(--accent);
        }

        /* Stats Grid */
        .stats-section {
            margin-bottom: 40px;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 25px;
            color: var(--text-primary);
        }

        .section-title i {
            color: var(--accent);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 25px;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            border-color: var(--accent);
            box-shadow: var(--shadow);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent), #a371f7);
        }

        .stat-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background: rgba(88, 166, 255, 0.1);
            border-radius: 12px;
            margin-bottom: 15px;
        }

        .stat-icon-container i {
            font-size: 1.5rem;
            color: var(--accent);
        }

        .stat-value {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        .stat-label {
            font-size: 0.95rem;
            color: var(--text-secondary);
        }

        /* Languages Section */
        .languages-container {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 30px;
            margin-bottom: 40px;
        }

        .language-item {
            margin-bottom: 20px;
        }

        .language-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        .language-name {
            color: var(--text-primary);
            font-weight: 500;
        }

        .language-percentage {
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
        }

        .language-bar {
            height: 12px;
            background: var(--bg-secondary);
            border-radius: 6px;
            overflow: hidden;
        }

        .language-bar-fill {
            height: 100%;
            border-radius: 6px;
            transition: width 1s ease-in-out;
        }

        /* Repositories Section */
        .repos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .repo-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 25px;
            transition: var(--transition);
        }

        .repo-card:hover {
            transform: translateY(-5px);
            border-color: var(--accent);
            box-shadow: var(--shadow);
        }

        .repo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .repo-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--accent);
        }

        .repo-icon {
            color: var(--text-secondary);
        }

        .repo-updated {
            font-size: 0.85rem;
            color: var(--text-muted);
            background: var(--bg-secondary);
            padding: 4px 10px;
            border-radius: 20px;
        }

        .repo-description {
            color: var(--text-secondary);
            margin-bottom: 20px;
            font-size: 0.95rem;
            line-height: 1.5;
        }

        .repo-stats {
            display: flex;
            gap: 20px;
        }

        .repo-stat {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .stat-icon {
            color: var(--text-muted);
        }

        .language-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }

        /* Contribution Calendar */
        .calendar-container {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 30px;
            margin-bottom: 40px;
        }

        .calendar-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin-bottom: 15px;
        }

        .calendar-day-header {
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-auto-rows: 1fr;
            gap: 5px;
            margin-bottom: 20px;
        }

        .calendar-day {
            aspect-ratio: 1;
            border-radius: 4px;
            cursor: pointer;
            transition: var(--transition);
        }

        .calendar-day:hover {
            transform: scale(1.1);
            box-shadow: 0 0 0 2px var(--accent);
        }

        .level-0 { background-color: #161b22; }
        .level-1 { background-color: #0e4429; }
        .level-2 { background-color: #006d32; }
        .level-3 { background-color: #26a641; }
        .level-4 { background-color: #39d353; }

        .calendar-legend {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
        }

        .calendar-legend span {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .legend-level {
            width: 15px;
            height: 15px;
            border-radius: 3px;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding: 30px 0;
            border-top: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .update-time {
            background: var(--bg-secondary);
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
            font-family: 'JetBrains Mono', monospace;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .profile-header {
                flex-direction: column;
                text-align: center;
            }

            .profile-info h1 {
                font-size: 2rem;
            }

            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }

            .repos-grid {
                grid-template-columns: 1fr;
            }

            .calendar-grid {
                gap: 3px;
            }

            .calendar-day-header {
                font-size: 0.75rem;
            }
        }

        @media (max-width: 480px) {
            .profile-details {
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .repo-stats {
                flex-direction: column;
                gap: 10px;
            }
        }

        /* Animations */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
        }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
        .delay-5 { animation-delay: 0.5s; opacity: 0; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <header class="header fade-in">
            <div class="profile-header">
                <img src="${profile.avatarUrl}" alt="${profile.login}" class="avatar">
                <div class="profile-info">
                    <h1>${profile.name || profile.login}</h1>
                    <div class="username">@${profile.login}</div>
                    ${profile.bio ? `<p class="bio">${profile.bio}</p>` : ''}
                </div>
            </div>
            <div class="profile-details">
                ${profile.location ? `
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${profile.location}</span>
                    </div>
                ` : ''}
                ${profile.company ? `
                    <div class="detail-item">
                        <i class="fas fa-building"></i>
                        <span>${profile.company}</span>
                    </div>
                ` : ''}
                ${profile.websiteUrl ? `
                    <div class="detail-item">
                        <i class="fas fa-link"></i>
                        <a href="${profile.websiteUrl}" target="_blank" style="color: var(--accent); text-decoration: none;">
                            Website
                        </a>
                    </div>
                ` : ''}
                ${profile.twitterUsername ? `
                    <div class="detail-item">
                        <i class="fab fa-twitter"></i>
                        <a href="https://twitter.com/${profile.twitterUsername}" target="_blank" style="color: var(--accent); text-decoration: none;">
                            @${profile.twitterUsername}
                        </a>
                    </div>
                ` : ''}
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Joined ${new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
            </div>
        </header>

        <!-- Main Stats Grid -->
        <section class="stats-section fade-in delay-1">
            <h2 class="section-title">
                <i class="fas fa-chart-line"></i>
                GitHub Statistics
            </h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.totalStars)}</div>
                    <div class="stat-label">Total Stars Earned</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-code-commit"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.commitsLastYear)}</div>
                    <div class="stat-label">Commits (Last Year)</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-code-pull-request"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.totalPRsCreated)}</div>
                    <div class="stat-label">Pull Requests Created</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-bug"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.totalIssuesCreated)}</div>
                    <div class="stat-label">Issues Created</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-hands-helping"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.contributedToLastYear)}</div>
                    <div class="stat-label">Repositories Contributed To</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.followers)}</div>
                    <div class="stat-label">Followers</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.following)}</div>
                    <div class="stat-label">Following</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon-container">
                        <i class="fas fa-code-branch"></i>
                    </div>
                    <div class="stat-value">${formatNumber(statsData.totalRepositories)}</div>
                    <div class="stat-label">Public Repositories</div>
                </div>
            </div>
        </section>

        <!-- Languages Section -->
        <section class="stats-section fade-in delay-2">
            <h2 class="section-title">
                <i class="fas fa-code"></i>
                Most Used Languages
            </h2>
            <div class="languages-container">
                ${generateLanguageBars(languages)}
            </div>
        </section>

        <!-- Top Repositories -->
        <section class="stats-section fade-in delay-3">
            <h2 class="section-title">
                <i class="fas fa-book"></i>
                Top Repositories
            </h2>
            <div class="repos-grid">
                ${generateRepoCards(repositories)}
            </div>
        </section>

        <!-- Contribution Calendar -->
        <section class="stats-section fade-in delay-4">
            <h2 class="section-title">
                <i class="fas fa-calendar-alt"></i>
                Contribution Activity
            </h2>
            <div class="calendar-container">
                <div class="contribution-summary">
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">
                        <strong>${formatNumber(contributionCalendar.totalContributions)} contributions</strong> in the last year
                    </p>
                </div>
                ${generateContributionCalendar(contributionCalendar.weeks)}
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer fade-in delay-5">
            <p>
                <i class="fas fa-sync-alt"></i> 
                Stats are updated automatically
                <br>
                <span class="update-time">Last updated: ${lastUpdated}</span>
            </p>
            <p style="margin-top: 15px;">
                <i class="fas fa-code"></i> 
                Generated with GitHub Actions • 
                <a href="https://github.com/${profile.login}" target="_blank" 
                   style="color: var(--accent); text-decoration: none;">
                    View GitHub Profile
                </a>
            </p>
        </footer>
    </div>

    <script>
        // Add hover effects and tooltips
        document.addEventListener('DOMContentLoaded', function() {
            // Animate stat cards on scroll
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                    }
                });
            }, observerOptions);

            // Observe all stat cards
            document.querySelectorAll('.stat-card').forEach(card => {
                observer.observe(card);
            });

            // Add click handlers for calendar days
            document.querySelectorAll('.calendar-day').forEach(day => {
                day.addEventListener('click', function() {
                    const title = this.getAttribute('title');
                    if (title) {
                        alert(title);
                    }
                });
            });

            // Update relative time for repos
            function updateRelativeTimes() {
                document.querySelectorAll('.repo-updated').forEach(element => {
                    const text = element.textContent;
                    if (text.includes('days ago')) {
                        const days = parseInt(text);
                        if (days === 0) element.textContent = 'Today';
                        else if (days === 1) element.textContent = 'Yesterday';
                        else if (days < 7) element.textContent = days + ' days ago';
                        else if (days < 30) {
                            const weeks = Math.floor(days / 7);
                            element.textContent = weeks + ' week' + (weeks > 1 ? 's' : '') + ' ago';
                        }
                    }
                });
            }

            updateRelativeTimes();
        });

        // Simple count-up animation for stats
        function animateValue(element, start, end, duration) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const value = Math.floor(progress * (end - start) + start);
                element.textContent = formatNumber(value);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        function formatNumber(num) {
            return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
        }

        // Animate stats when they come into view
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const valueElement = entry.target.querySelector('.stat-value');
                    const currentValue = parseInt(valueElement.textContent.replace(/,/g, ''));
                    const finalValue = currentValue;
                    const startValue = Math.floor(finalValue * 0.7);
                    
                    // Reset and animate
                    valueElement.textContent = formatNumber(startValue);
                    animateValue(valueElement, startValue, finalValue, 1500);
                    
                    // Stop observing after animation
                    statObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        // Start observing all stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            statObserver.observe(card);
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

        console.log('🎨 Generating HTML...');
        const html = generateHTML(stats);

        // Ensure data directory exists
        const dataDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write HTML file
        fs.writeFileSync(OUTPUT_FILE, html);
        console.log(`✅ HTML generated successfully: ${OUTPUT_FILE}`);

        // Also create a simple stats summary
        console.log('\n📊 Generated Page Includes:');
        console.log(`   👤 Profile: ${stats.profile.name || stats.profile.login}`);
        console.log(`   ⭐ Stars: ${formatNumber(stats.stats.totalStars)}`);
        console.log(`   📝 Commits: ${formatNumber(stats.stats.commitsLastYear)}`);
        console.log(`   🔀 PRs: ${formatNumber(stats.stats.totalPRsCreated)}`);
        console.log(`   🐛 Issues: ${formatNumber(stats.stats.totalIssuesCreated)}`);
        console.log(`   🤝 Contributed to: ${formatNumber(stats.stats.contributedToLastYear)} repos`);
        console.log(`   💻 Top Language: ${Object.keys(stats.languages)[0] || 'None'}`);

    } catch (error) {
        console.error('❌ Error generating HTML:', error);
        process.exit(1);
    }
})();