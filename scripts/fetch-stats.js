#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || 'SahanWeerasiri';
const OUTPUT_FILE = path.join(__dirname, '../data/github-stats.json');

if (!TOKEN) {
    console.error('❌ TOKEN is required');
    process.exit(1);
}

async function fetchAPI(url) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (!response.ok) throw new Error(`API failed: ${response.status}`);
    return response.json();
}

async function fetchGraphQLStats() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const query = `
    query($username: String!, $fromDate: DateTime!) {
      user(login: $username) {
        name
        login
        avatarUrl
        bio
        location
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

    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { username: USERNAME, fromDate: oneYearAgo.toISOString() }
        })
    });

    const data = await response.json();
    if (data.errors) throw new Error('GraphQL query failed');
    return data.data.user;
}

async function fetchPRAndIssueCounts() {
    const [prs, issues] = await Promise.all([
        fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr`),
        fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:issue`)
    ]);
    return { totalPRs: prs.total_count, totalIssues: issues.total_count };
}

async function calculateLanguageStats() {
    const repos = await fetchAPI(`https://api.github.com/users/${USERNAME}/repos?per_page=20`);
    const languageBytes = {};
    let totalBytes = 0;

    for (const repo of repos) {
        try {
            const languages = await fetchAPI(repo.languages_url);
            Object.entries(languages).forEach(([lang, bytes]) => {
                languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
                totalBytes += bytes;
            });
        } catch (error) {
            // Skip if languages fail
        }
    }

    const languages = {};
    Object.entries(languageBytes).forEach(([lang, bytes]) => {
        languages[lang] = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(2) : '0.00';
    });

    return languages;
}

async function fetchAllStats() {
    console.log('🚀 Fetching GitHub stats...');

    const [graphqlData, prIssueCounts, languages] = await Promise.all([
        fetchGraphQLStats(),
        fetchPRAndIssueCounts(),
        calculateLanguageStats()
    ]);

    const allStats = {
        metadata: { fetchedAt: new Date().toISOString(), username: USERNAME },
        profile: {
            name: graphqlData.name,
            login: graphqlData.login,
            avatarUrl: graphqlData.avatarUrl,
            bio: graphqlData.bio,
            location: graphqlData.location,
            createdAt: graphqlData.createdAt
        },
        stats: {
            totalStars: graphqlData.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0),
            totalRepositories: graphqlData.repositories.totalCount,
            commitsLastYear: graphqlData.contributionsCollection.totalCommitContributions,
            prsLastYear: graphqlData.contributionsCollection.totalPullRequestContributions,
            contributedToLastYear: graphqlData.contributionsCollection.totalRepositoryContributions,
            totalPRsCreated: prIssueCounts.totalPRs,
            totalIssuesCreated: prIssueCounts.totalIssues,
            followers: graphqlData.followers.totalCount
        },
        languages: languages
    };

    console.log('✅ Data fetched!');
    return allStats;
}

// Run script
(async () => {
    try {
        const stats = await fetchAllStats();
        const dataDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2));
        console.log(`💾 Saved to: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('Failed:', error);
        process.exit(1);
    }
})();