const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testVisuals() {
    const browser = await chromium.launch();
    const context = await browser.createContext({
        viewport: { width: 1280, height: 1024 }
    });
    
    const files = [
        '1pager-nabataeans.html',
        'postcard-avdat.html',
        'interactive-website.html'
    ];

    for (const file of files) {
        const filePath = path.join(__dirname, file);
        const url = `file://${filePath}`;
        
        console.log(`\n🔍 Testing: ${file}`);
        
        const page = await context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle' });
            
            // Take screenshot
            const screenshotPath = path.join(__dirname, `screenshot-${file.replace('.html', '.png')}`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`✅ Screenshot saved: ${screenshotPath}`);
            
            // Check for rendering issues
            const bodyHTML = await page.content();
            if (bodyHTML.includes('undefined') || bodyHTML.includes('null')) {
                console.log('⚠️  Found "undefined" or "null" in HTML');
            }
            
            // Check text overflow
            const elements = await page.$$('*');
            for (const el of elements) {
                const box = await el.boundingBox();
                const scrollWidth = await el.evaluate(el => el.scrollWidth);
                const clientWidth = await el.evaluate(el => el.clientWidth);
                
                if (scrollWidth > clientWidth + 5) {
                    const text = await el.textContent();
                    if (text && text.trim().length > 0) {
                        console.log(`⚠️  Text overflow detected: "${text.substring(0, 50)}..."`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        await page.close();
    }
    
    await context.close();
    await browser.close();
    console.log('\n✅ Visual testing complete');
}

testVisuals().catch(console.error);
