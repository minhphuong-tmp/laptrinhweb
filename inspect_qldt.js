const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
        await page.goto('http://qldt.actvn.edu.vn/CMCSoft.IU.Web.info/Login.aspx', { waitUntil: 'domcontentloaded', timeout: 30000 });

        const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(i => ({
                id: i.id,
                name: i.name,
                placeholder: i.placeholder,
                type: i.type
            }));
        });

        console.log('Inputs found:', JSON.stringify(inputs, null, 2));

        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
                id: b.id,
                name: b.name,
                value: b.value,
                text: b.innerText
            }));
        });
        console.log('Buttons found:', JSON.stringify(buttons, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
