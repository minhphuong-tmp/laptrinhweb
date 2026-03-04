const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    console.log('Navigating to SuperKMA...');
    await page.goto('https://schedule.superkma.com/auth', {
        waitUntil: 'networkidle2'
    });

    console.log('Waiting 5 seconds for Vue...');
    await new Promise(r => setTimeout(r, 5000));

    await page.screenshot({ path: 'test_1_loaded.png' });

    console.log('Clicking third tab...');
    const clicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.v-tab'));
        console.log('Found tabs:', tabs.length);
        tabs.forEach((t, i) => console.log(`Tab ${i}: ${t.textContent.trim()}`));

        if (tabs.length >= 3) {
            tabs[2].click();
            return true;
        }
        return false;
    });

    console.log('Tab clicked:', clicked);
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'test_2_after_click.png' });

    console.log('Done! Check screenshots.');
    await browser.close();
})();
