#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TOKEN = process.env.TOKEN || process.env.PERSONAL_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || 'SahanWeerasiri';
const OUTPUT_FILE = path.join(__dirname, '../data/github-stats.json');

if (!TOKEN) {
    console.error('❌ TOKEN is required');
    process.exit(1);
}

// Helper function for API requests
async function fetchAPI(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Stats-Fetcher',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// FIXED GraphQL query without totalContributions field
async function fetchGraphQLStats() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDate = oneYearAgo.toISOString();

    const query = `
    query($username: String!, $fromDate: DateTime!) {
      user(login: $username) {
        # Basic info
        name
        login
        avatarUrl
        bio
        company
        location
        websiteUrl
        twitterUsername
        createdAt
        
        # Repository stats
        repositories(
          ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
          isFork: false
          first: 100
          orderBy: {field: UPDATED_AT, direction: DESC}
        ) {
          totalCount
          totalDiskUsage
          nodes {
            name
            description
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
            isPrivate
            updatedAt
            languages(first: 10) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
        
        # FIXED: Contribution stats for last year (removed totalContributions)
        contributionsCollection(from: $fromDate) {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          totalRepositoryContributions
          
          # Contribution calendar
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
        
        # Follower stats
        followers {
          totalCount
        }
        following {
          totalCount
        }
        
        # Gists
        gists {
          totalCount
        }
      }
    }
  `;

    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { username: USERNAME, fromDate }
        })
    });

    const data = await response.json();

    if (data.errors) {
        console.error('GraphQL Errors:', data.errors);
        throw new Error('GraphQL query failed');
    }

    return data.data.user;
}

// Fetch all repositories with pagination
async function fetchAllRepos() {
    let repos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const url = `https://api.github.com/users/${USERNAME}/repos?per_page=${perPage}&page=${page}&sort=updated`;
        const pageRepos = await fetchAPI(url);

        if (pageRepos.length === 0) break;

        repos.push(...pageRepos);

        if (pageRepos.length < perPage) break;

        page++;
    }

    return repos;
}

// Get PR and Issue counts via search API
async function fetchPRAndIssueCounts() {
    const [prResponse, issueResponse] = await Promise.all([
        fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:pr`),
        fetchAPI(`https://api.github.com/search/issues?q=author:${USERNAME}+type:issue`)
    ]);

    return {
        totalPRs: prResponse.total_count,
        totalIssues: issueResponse.total_count
    };
}

// Calculate language statistics from all repositories
async function calculateLanguageStats(repos) {
    const languageBytes = {};
    let totalBytes = 0;

    // Process first 20 repos for performance
    const reposToProcess = repos.slice(0, 20);

    for (const repo of reposToProcess) {
        try {
            const languages = await fetchAPI(repo.languages_url);

            Object.entries(languages).forEach(([lang, bytes]) => {
                languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
                totalBytes += bytes;
            });

            // Avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.warn(`Failed to fetch languages for ${repo.name}: ${error.message}`);
        }
    }

    // Calculate percentages
    const languages = {};
    Object.entries(languageBytes).forEach(([lang, bytes]) => {
        languages[lang] = {
            bytes: bytes,
            percentage: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(2) : '0.00'
        };
    });

    // Sort by percentage (highest first)
    const sortedLanguages = Object.entries(languages)
        .sort(([, a], [, b]) => b.percentage - a.percentage)
        .reduce((acc, [lang, data]) => {
            acc[lang] = data;
            return acc;
        }, {});

    return {
        totalBytes,
        languages: sortedLanguages
    };
}

// Calculate total stats
function calculateStats(repos) {
    return {
        totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
        publicRepos: repos.filter(r => !r.private).length,
        privateRepos: repos.filter(r => r.private).length
    };
}

// Main function to fetch all data
async function fetchAllStats() {
    console.log('🚀 Starting GitHub stats fetch...');
    console.log(`👤 Fetching data for: ${USERNAME}`);

    try {
        // Fetch data in parallel
        const [graphqlData, repos, prIssueCounts] = await Promise.all([
            fetchGraphQLStats(),
            fetchAllRepos(),
            fetchPRAndIssueCounts()
        ]);

        console.log(`📊 Found ${repos.length} repositories`);

        const languageStats = await calculateLanguageStats(repos);
        const repoStats = calculateStats(repos);

        // Compile all data
        const allStats = {
            metadata: {
                fetchedAt: new Date().toISOString(),
                username: USERNAME,
                dataVersion: '1.1'
            },
            profile: {
                name: graphqlData.name,
                login: graphqlData.login,
                avatarUrl: graphqlData.avatarUrl,
                bio: graphqlData.bio,
                company: graphqlData.company,
                location: graphqlData.location,
                websiteUrl: graphqlData.websiteUrl,
                twitterUsername: graphqlData.twitterUsername,
                createdAt: graphqlData.createdAt,
                accountAgeDays: Math.floor((new Date() - new Date(graphqlData.createdAt)) / (1000 * 60 * 60 * 24))
            },
            stats: {
                // Repository stats
                totalRepositories: graphqlData.repositories.totalCount,
                totalStars: repoStats.totalStars,
                totalForks: repoStats.totalForks,
                publicRepos: repoStats.publicRepos,
                privateRepos: repoStats.privateRepos,

                // Contribution stats (last year)
                commitsLastYear: graphqlData.contributionsCollection.totalCommitContributions,
                prsLastYear: graphqlData.contributionsCollection.totalPullRequestContributions,
                prReviewsLastYear: graphqlData.contributionsCollection.totalPullRequestReviewContributions,
                issuesLastYear: graphqlData.contributionsCollection.totalIssueContributions,
                contributedToLastYear: graphqlData.contributionsCollection.totalRepositoryContributions,

                // All-time counts
                totalPRsCreated: prIssueCounts.totalPRs,
                totalIssuesCreated: prIssueCounts.totalIssues,

                // Social stats
                followers: graphqlData.followers.totalCount,
                following: graphqlData.following.totalCount,
                gists: graphqlData.gists.totalCount
            },
            languages: languageStats.languages,
            repositories: {
                count: repos.length,
                lastUpdated: repos[0]?.updatedAt,
                sample: repos.slice(0, 6).map(repo => ({
                    name: repo.name,
                    description: repo.description,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language,
                    updatedAt: repo.updatedAt
                }))
            },
            contributionCalendar: {
                totalContributions: graphqlData.contributionsCollection.contributionCalendar.totalContributions,
                weeks: graphqlData.contributionsCollection.contributionCalendar.weeks.map(week => ({
                    startDate: week.contributionDays[0]?.date,
                    days: week.contributionDays.map(day => ({
                        date: day.date,
                        count: day.contributionCount,
                        color: day.color
                    }))
                }))
            }
        };

        console.log('✅ Data fetched successfully!');
        console.log('📝 Summary:');
        console.log(`   Stars: ${allStats.stats.totalStars}`);
        console.log(`   Commits (last year): ${allStats.stats.commitsLastYear}`);
        console.log(`   PRs Created: ${allStats.stats.totalPRsCreated}`);
        console.log(`   Issues Created: ${allStats.stats.totalIssuesCreated}`);
        console.log(`   Contributed to: ${allStats.stats.contributedToLastYear}`);

        return allStats;

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        throw error;
    }
}

// Run the script
(async () => {
    try {
        const stats = await fetchAllStats();

        // Ensure data directory exists
        const dataDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2));
        console.log(`💾 Data saved to: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Failed to fetch GitHub stats:', error);
        process.exit(1);
    }
})();