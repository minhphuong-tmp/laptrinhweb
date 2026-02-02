const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

let browser = null;

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/crawl-grades', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    console.log(`Starting crawler for: ${email}`);

    try {
        // Launch Browser - Clean Session (No userDataDir)
        browser = await puppeteer.launch({
            headless: false,
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // 1. Navigate to Login
        console.log('Navigating to Microsoft Login...');
        const loginUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&client_id=fbad147e-ffd3-419f-989a-7aceae620f77&redirect_uri=https%3A%2F%2Fktdbcl.actvn.edu.vn%2Findex.php%2Faksociallogin_finishLogin%2Fmicrosoft.raw&scope=user.read&response_mode=query&sso_reload=true";

        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 2. Sequential Login Flow

        // STEP A: Email
        console.log('Waiting for Email input...');
        try {
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.type('input[type="email"]', email);
            await page.keyboard.press('Enter');
            // Wait for password field to slide in
            await sleep(2000);
        } catch (e) {
            console.log('Email input lookup failed (or skipped). proceeding...');
        }

        // STEP B: Password
        console.log('Waiting for Password input...');
        await page.waitForSelector('input[type="password"]', { timeout: 10000 });
        await page.type('input[type="password"]', password);
        await page.keyboard.press('Enter');

        // STEP C: KMSI (Force Click NO/YES via DOM)
        console.log('Waiting for "Stay signed in"...');
        try {
            // Wait for ANY indicator of KMSI
            await page.waitForFunction(() => {
                return document.getElementById('idBtn_Back') || document.getElementById('idSIButton9');
            }, { timeout: 10000 });

            await sleep(500); // stable wait

            console.log('KMSI detected. Force clicking "No" via DOM...');
            await page.evaluate(() => {
                // Prioritize NO, then YES
                const btn = document.getElementById('idBtn_Back') || document.getElementById('idSIButton9');
                if (btn) btn.click();
            });

        } catch (e) {
            console.log('KMSI screen skipped or not found (or ID changed).');
        }

        // 3. Wait for Redirect to School Domain
        console.log('Waiting for redirect to school domain...');
        try {
            // Wait for URL to contain 'actvn' (meaning we are back at school)
            await page.waitForFunction(
                () => window.location.href.includes('actvn'),
                { timeout: 30000 }
            );
            console.log('Returned to school domain. Letting session settle (3s)...');
            await sleep(3000); // CRITICAL: Wait for cookies/session to save before navigating
        } catch (e) {
            console.log('Redirect check timeout. Forcing navigation anyway...');
        }

        // Always force navigation to the specific grades page
        console.log('Navigating to Grades page...');
        await page.goto('https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // 4. Extract Data
        console.log('Extracting data...');
        // Wait for table to appear
        try {
            // Try specific selector first
            await page.waitForSelector('#div-ket-qua-hoc-tap .table', { timeout: 10000 });
        } catch (e) {
            console.log('Specific selector timeout. Checking for ANY table...');
            try {
                // Fallback: Check for generic table
                await page.waitForSelector('table', { timeout: 10000 });
                console.log('Found generic table, proceeding...');
            } catch (ex) {
                console.log('No generic table found. Dumping HTML for debug...');

                const fs = require('fs');
                const html = await page.content();
                fs.writeFileSync('debug_grades.html', html);
                console.log('Saved debug_grades.html');

                if (html.includes('alert-warning') || html.includes('alert-danger')) {
                    throw new Error('Đăng nhập không thành công (Trang web báo lỗi / Yêu cầu đăng nhập lại).');
                }
                if (html.includes('Đăng nhập')) {
                    throw new Error('Hệ thống chưa nhận diện phiên đăng nhập. (Vui lòng thử lại).');
                }

                throw new Error('Timeout: Không tìm thấy bảng điểm. Đã lưu file debug_grades.html.');
            }
        }

        const grades = await page.evaluate(() => {
            // Try specific, then generic
            let rows = document.querySelectorAll('#div-ket-qua-hoc-tap .table tr');
            if (rows.length === 0) {
                console.log('Using generic table selector...');
                rows = document.querySelectorAll('table tr');
            }

            const data = [];
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.trim());
                if (cells.length > 0) {
                    if (cells.length > 1) cells.splice(1, 1);
                    data.push(cells);
                }
            });
            return data;
        });

        console.log(`Extracted ${grades.length} rows.`);
        res.json({ success: true, data: grades });

    } catch (error) {
        console.error('Crawler error:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
        return;
    }

    if (browser) await browser.close();
});

app.listen(PORT, () => {
    console.log(`Crawler Backend running on http://localhost:${PORT}`);
});
