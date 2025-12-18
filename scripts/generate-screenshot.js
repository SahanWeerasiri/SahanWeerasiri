#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
    console.log('📸 Generating screenshots...');

    const htmlFile = path.join(__dirname, '../data/index.html');
    const screenshotDir = path.join(__dirname, '../data/screenshots');

    // Create screenshots directory
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Load HTML file
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Wait a bit for animations
        await page.waitForTimeout(3000);

        // 1. Full page screenshot for documentation
        console.log('   Generating full page screenshot...');
        await page.screenshot({
            path: path.join(screenshotDir, 'stats-full.png'),
            fullPage: true,
            type: 'png',
            quality: 90
        });

        // 2. Optimized screenshot for social media (Twitter/Facebook)
        console.log('   Generating social media preview...');
        await page.setViewport({ width: 1200, height: 630 });
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(screenshotDir, 'stats-social.png'),
            type: 'png',
            quality: 90
        });

        // 3. Screenshot for GitHub README (optimized width)
        console.log('   Generating README screenshot...');
        await page.setViewport({ width: 1280, height: 720 });
        await page.waitForTimeout(500);
        await page.screenshot({
            path: path.join(screenshotDir, 'stats-readme.png'),
            type: 'png',
            quality: 90
        });

        console.log('✅ Screenshots generated successfully!');
        console.log(`📁 Location: ${screenshotDir}`);

    } catch (error) {
        console.error('❌ Error generating screenshots:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    generateScreenshots().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = generateScreenshots;