#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const USERNAME = process.env.GITHUB_USERNAME || 'SahanWeerasiri';
const TOKEN = process.env.TOKEN || process.env.GITHUB_TOKEN;
const OUTPUT_FILE = path.join(__dirname, '../terminal.svg');

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function fetchAPI(url) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Terminal-Updater'
    };
    if (TOKEN) {
        headers['Authorization'] = `Bearer ${TOKEN}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} (${url})`);
    return res.json();
}

async function fetchGraphQL(query, variables) {
    if (!TOKEN) return null;
    const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'GitHub-Terminal-Updater'
        },
        body: JSON.stringify({ query, variables })
    });
    const data = await res.json();
    if (data.errors) throw new Error(JSON.stringify(data.errors));
    return data.data;
}

function getLanguageColor(language) {
    const colors = {
        'Python': '#3572A5',
        'Java': '#b07219',
        'Tcl': '#e4cc98',
        'C++': '#f34b7d',
        'C': '#64748b',
        'JavaScript': '#f1e05a',
        'VHDL': '#498b7a',
        'CMake': '#064f8c',
        'Jupyter Notebook': '#DA5B0B',
        'Notebook': '#DA5B0B',
        'Shell': '#89e051',
        'TypeScript': '#3178c6',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Dart': '#00B4AB',
        'Kotlin': '#A97BFF',
        'Rust': '#dea584',
        'Go': '#00ADD8'
    };
    return colors[language] || '#6e7681';
}

function generateTerminalSVG(stats) {
    const p = stats.profile;
    const s = stats.stats;
    const langs = stats.languages;

    // Split top 10 languages into two columns
    const topLangs = Object.entries(langs)
        .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a))
        .slice(0, 10);

    const col1 = topLangs.slice(0, 5);
    const col2 = topLangs.slice(5, 10);

    const renderLangRow = (lang, pct, y) => {
        const pctNum = parseFloat(pct);
        const barWidth = Math.max(8, Math.min(160, Math.round((pctNum / 32) * 160)));
        const color = getLanguageColor(lang);
        const displayName = lang === 'Jupyter Notebook' ? 'Notebook' : lang;

        return `
      <g transform="translate(0, ${y})">
        <text x="0" y="10" font-family="'Courier New', Courier, monospace" font-size="11.5" fill="#e2e8f0">${displayName}</text>
        <rect x="110" y="1" width="160" height="8" rx="4" fill="#1f2937"/>
        <rect x="110" y="1" width="${barWidth}" height="8" rx="4" fill="${color}"/>
        <text x="285" y="10" font-family="'Courier New', Courier, monospace" font-size="11" fill="#94a3b8">${pct}%</text>
      </g>`;
    };

    const col1SVG = col1.map(([l, p], i) => renderLangRow(l, p, 10 + i * 22)).join('');
    const col2SVG = col2.map(([l, p], i) => renderLangRow(l, p, 10 + i * 22)).join('');

    return `<svg width="820" height="670" viewBox="0 0 820 670" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="820" y2="670" gradientUnits="userSpaceOnUse">
      <stop stop-color="#080b11"/>
      <stop offset="1" stop-color="#0f141c"/>
    </linearGradient>
  </defs>

  <!-- Terminal Window Background -->
  <rect width="820" height="670" rx="10" fill="url(#cardGrad)"/>
  <rect x="0.5" y="0.5" width="819" height="669" rx="9.5" stroke="#1e293b"/>

  <!-- Window Control Buttons -->
  <circle cx="25" cy="20" r="6" fill="#ff5f56"/>
  <circle cx="45" cy="20" r="6" fill="#ffbd2e"/>
  <circle cx="65" cy="20" r="6" fill="#27c93f"/>

  <!-- Window Header Title -->
  <text x="410" y="24" text-anchor="middle" font-family="'Courier New', Courier, monospace" font-size="12" fill="#64748b">sahan@kali-terminal: ~</text>
  <line x1="0" y1="38" x2="820" y2="38" stroke="#1e293b" stroke-width="1"/>

  <!-- ==================== COMMAND 1: WHOAMI ==================== -->
  <g transform="translate(25, 65)">
    <text font-family="'Courier New', Courier, monospace" font-size="13">
      <tspan fill="#00f5d4" font-weight="bold">sahan@sec-ops:~$</tspan>
      <tspan fill="#f8fafc"> whoami --verbose</tspan>
    </text>

    <!-- Vertical Accent Line -->
    <line x1="4" y1="14" x2="4" y2="100" stroke="#00f5d4" stroke-width="2" opacity="0.7"/>

    <g transform="translate(18, 0)">
      <text y="30" font-family="'Courier New', Courier, monospace" font-size="12.5">
        <tspan fill="#38bdf8" font-weight="bold">Identity       :</tspan>
        <tspan fill="#f1f5f9"> ${p.name || 'Sahan Weerasiri'} </tspan>
        <tspan fill="#94a3b8">(@${p.login || 'SahanWeerasiri'})</tspan>
      </text>

      <text y="52" font-family="'Courier New', Courier, monospace" font-size="12.5">
        <tspan fill="#38bdf8" font-weight="bold">Education      :</tspan>
        <tspan fill="#f1f5f9"> Undergraduate in Computer Science &amp; Engineering</tspan>
      </text>

      <text y="74" font-family="'Courier New', Courier, monospace" font-size="12.5">
        <tspan fill="#38bdf8" font-weight="bold">Specialization :</tspan>
        <tspan fill="#f1f5f9"> Cyber Security</tspan>
      </text>

      <text y="96" font-family="'Courier New', Courier, monospace" font-size="12.5">
        <tspan fill="#38bdf8" font-weight="bold">Account Tenure :</tspan>
        <tspan fill="#f1f5f9"> Member Since ${p.joinMonthYear || 'April 27, 2023'} </tspan>
        <tspan fill="#94a3b8">(${p.yearsActive || '3'}+ years active)</tspan>
      </text>
    </g>
  </g>

  <!-- ==================== COMMAND 2: GITHUB STATS ==================== -->
  <g transform="translate(25, 195)">
    <text font-family="'Courier New', Courier, monospace" font-size="13">
      <tspan fill="#00f5d4" font-weight="bold">sahan@sec-ops:~$</tspan>
      <tspan fill="#f8fafc"> cat ~/.github_stats</tspan>
    </text>

    <!-- Row 1 Cards -->
    <g transform="translate(0, 16)">
      <!-- Repos -->
      <rect x="0" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="12" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">REPOSITORIES</text>
      <text x="12" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#38bdf8">${formatNumber(s.totalRepositories)} Total</text>

      <!-- Stars -->
      <rect x="196" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="208" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">STARS EARNED</text>
      <text x="208" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#facc15">${formatNumber(s.totalStars)} ⭐</text>

      <!-- Commits -->
      <rect x="392" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="404" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">COMMITS (YEAR)</text>
      <text x="404" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#00f5d4">${formatNumber(s.commitsLastYear)}</text>

      <!-- PRs -->
      <rect x="588" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="600" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">PULL REQUESTS</text>
      <text x="600" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#22c55e">${formatNumber(s.totalPRsCreated)} Created</text>
    </g>

    <!-- Row 2 Cards -->
    <g transform="translate(0, 68)">
      <!-- Issues -->
      <rect x="0" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="12" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">ISSUES CREATED</text>
      <text x="12" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#f87171">${formatNumber(s.totalIssuesCreated)}</text>

      <!-- Contributed -->
      <rect x="196" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="208" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">CONTRIBUTED TO</text>
      <text x="208" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#c084fc">${formatNumber(s.contributedToLastYear)} Repos</text>

      <!-- Followers -->
      <rect x="392" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="404" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">COMMUNITY</text>
      <text x="404" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#f472b6">${formatNumber(s.followers)} Followers</text>

      <!-- Joined -->
      <rect x="588" y="0" width="182" height="44" rx="6" fill="#111827" stroke="#1f2937"/>
      <text x="600" y="18" font-family="'Courier New', Courier, monospace" font-size="10" fill="#94a3b8">OPERATIONAL SINCE</text>
      <text x="600" y="34" font-family="'Courier New', Courier, monospace" font-size="13" font-weight="bold" fill="#e2e8f0">${p.joinShort || 'April 2023'}</text>
    </g>
  </g>

  <!-- ==================== COMMAND 3: LANGUAGES ==================== -->
  <g transform="translate(25, 345)">
    <text font-family="'Courier New', Courier, monospace" font-size="13">
      <tspan fill="#00f5d4" font-weight="bold">sahan@sec-ops:~$</tspan>
      <tspan fill="#f8fafc"> cat ~/.languages</tspan>
    </text>

    <!-- Column 1 -->
    <g transform="translate(0, 18)">
      ${col1SVG}
    </g>

    <!-- Column 2 -->
    <g transform="translate(400, 18)">
      ${col2SVG}
    </g>
  </g>

  <!-- ==================== COMMAND 4: PING CONTACT ==================== -->
  <g transform="translate(25, 510)">
    <text font-family="'Courier New', Courier, monospace" font-size="13">
      <tspan fill="#00f5d4" font-weight="bold">sahan@sec-ops:~$</tspan>
      <tspan fill="#f8fafc"> ping -c 3 contact.sahan</tspan>
    </text>

    <text y="24" font-family="'Courier New', Courier, monospace" font-size="11.5" fill="#64748b">PING contact.sahan (127.0.0.1): 56 data bytes</text>

    <g transform="translate(0, 32)">
      <text y="12" font-family="'Courier New', Courier, monospace" font-size="12">
        <tspan fill="#94a3b8">64 bytes from 127.0.0.1: seq=1 time=0.031ms -&gt; </tspan>
        <tspan fill="#38bdf8" font-weight="bold">[LinkedIn]</tspan>
        <tspan fill="#e2e8f0"> linkedin.com/in/sahan-weerasiri-1524482b0</tspan>
      </text>

      <text y="30" font-family="'Courier New', Courier, monospace" font-size="12">
        <tspan fill="#94a3b8">64 bytes from 127.0.0.1: seq=2 time=0.029ms -&gt; </tspan>
        <tspan fill="#00f5d4" font-weight="bold">[GitHub]  </tspan>
        <tspan fill="#e2e8f0"> github.com/SahanWeerasiri</tspan>
      </text>

      <text y="48" font-family="'Courier New', Courier, monospace" font-size="12">
        <tspan fill="#94a3b8">64 bytes from 127.0.0.1: seq=3 time=0.034ms -&gt; </tspan>
        <tspan fill="#f87171" font-weight="bold">[Email]   </tspan>
        <tspan fill="#e2e8f0"> smudunlahiru@gmail.com</tspan>
      </text>

      <text y="68" font-family="'Courier New', Courier, monospace" font-size="11" fill="#22c55e">--- contact.sahan ping statistics: 3 packets transmitted, 3 received, 0.0% loss ---</text>
    </g>
  </g>
</svg>`;
}

async function run() {
    console.log(`📡 Fetching live stats for ${USERNAME}...`);

    let stats = {
        profile: {
            name: 'Sahan Weerasiri',
            login: 'SahanWeerasiri',
            joinMonthYear: 'April 27, 2023',
            joinShort: 'April 2023',
            yearsActive: 3
        },
        stats: {
            totalRepositories: 132,
            totalStars: 37,
            commitsLastYear: 455,
            totalPRsCreated: 299,
            totalIssuesCreated: 248,
            contributedToLastYear: 31,
            followers: 11
        },
        languages: {
            'Python': '27.06',
            'Java': '13.48',
            'Tcl': '9.68',
            'C++': '7.36',
            'C': '6.95',
            'JavaScript': '6.36',
            'VHDL': '6.28',
            'CMake': '5.39',
            'Jupyter Notebook': '3.31',
            'Shell': '2.88'
        }
    };

    try {
        if (TOKEN) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const query = `
            query($username: String!, $fromDate: DateTime!) {
              user(login: $username) {
                name
                login
                createdAt
                repositories(first: 100, isFork: false) {
                  totalCount
                  nodes {
                    stargazerCount
                    languages(first: 10) {
                      edges {
                        size
                        node { name }
                      }
                    }
                  }
                }
                contributionsCollection(from: $fromDate) {
                  totalCommitContributions
                  totalPullRequestContributions
                  totalRepositoryContributions
                }
                followers { totalCount }
              }
            }`;

            const data = await fetchGraphQL(query, { username: USERNAME, fromDate: oneYearAgo.toISOString() });
            if (data && data.user) {
                const u = data.user;
                const created = new Date(u.createdAt);
                const years = Math.max(1, Math.floor((new Date() - created) / (365.25 * 24 * 60 * 60 * 1000)));

                stats.profile.name = 'Sahan Weerasiri';
                stats.profile.login = u.login;
                stats.profile.joinMonthYear = created.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                stats.profile.joinShort = created.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                stats.profile.yearsActive = years;

                stats.stats.totalRepositories = u.repositories.totalCount;
                stats.stats.totalStars = u.repositories.nodes.reduce((acc, r) => acc + r.stargazerCount, 0);
                stats.stats.commitsLastYear = u.contributionsCollection.totalCommitContributions;
                stats.stats.contributedToLastYear = u.contributionsCollection.totalRepositoryContributions;
                stats.stats.followers = u.followers.totalCount;

                // Languages
                const langBytes = {};
                let totalBytes = 0;
                u.repositories.nodes.forEach(r => {
                    r.languages.edges.forEach(e => {
                        langBytes[e.node.name] = (langBytes[e.node.name] || 0) + e.size;
                        totalBytes += e.size;
                    });
                });
                if (totalBytes > 0) {
                    const lCalc = {};
                    Object.entries(langBytes).forEach(([k, v]) => {
                        lCalc[k] = ((v / totalBytes) * 100).toFixed(2);
                    });
                    stats.languages = lCalc;
                }
            }

            // PR & Issue search
            try {
                const [prs, issues] = await Promise.all([
                    fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr`),
                    fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:issue`)
                ]);
                if (prs && prs.total_count !== undefined) stats.stats.totalPRsCreated = prs.total_count;
                if (issues && issues.total_count !== undefined) stats.stats.totalIssuesCreated = issues.total_count;
            } catch (e) {
                console.warn('⚠️ Search API warning:', e.message);
            }
        }
    } catch (err) {
        console.warn('⚠️ API fetch fallback:', err.message);
    }

    const svgOutput = generateTerminalSVG(stats);
    fs.writeFileSync(OUTPUT_FILE, svgOutput, 'utf8');
    console.log(`✅ Updated ${OUTPUT_FILE} (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB)`);
}

run();
