const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const url = 'https://kma-legend.click/scores';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Page loaded. Taking screenshot...');
    await page.screenshot({ path: 'legend_debug.png' });

    console.log('Extracting inputs and buttons...');
    const details = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
            tag: el.tagName,
            id: el.id,
            class: el.className,
            placeholder: el.placeholder,
            name: el.name
        }));
        const buttons = Array.from(document.querySelectorAll('button')).map(el => ({
            tag: el.tagName,
            text: el.innerText,
            id: el.id,
            class: el.className
        }));
        return { inputs, buttons };
    });

    console.log('Details:', JSON.stringify(details, null, 2));

    await browser.close();
})();
