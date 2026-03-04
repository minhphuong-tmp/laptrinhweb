const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Groq API helper (dùng fetch HTTP, không cần SDK)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log('Groq Config - API Key Loaded:', GROQ_API_KEY ? 'YES (...' + GROQ_API_KEY.slice(-6) + ')' : 'NO');

async function callGroq(systemPrompt, userPrompt, maxTokens = 512) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

// Giữ lại Gemini init để tương thích (không dùng nữa)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = null;


const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

let browser = null;

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/crawl-schedule', async (req, res) => {
    const { studentId, password } = req.body;
    if (!studentId || !password) {
        return res.status(400).json({ error: 'Missing studentId or password' });
    }

    console.log(`Starting Schedule Crawler for: ${studentId}`);

    try {
        browser = await puppeteer.launch({
            headless: 'new', // Headless mode (hidden)
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--window-size=1280,800',
                '--unsafely-treat-insecure-origin-as-secure=http://qldt.actvn.edu.vn'
            ],
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // Auto-accept all dialogs
        page.on('dialog', async dialog => {
            console.log(`Dialog detected: ${dialog.type()} - ${dialog.message()}`);
            await dialog.accept();
        });

        // 1. Navigate to QLDT
        console.log('Navigating to QLDT Login...');
        try {
            await page.goto('http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Login.aspx', {
                waitUntil: 'domcontentloaded', // Less strict than networkidle2
                timeout: 60000
            });

        } catch (e) {
            console.log('Navigation error:', e.message);
        }

        // --- SECURITY BYPASS LOGIC (Runs even if nav failed/timeout) ---
        try {
            const title = await page.title();
            console.log('Page Title (post-nav):', title);

            if (title.includes('Security') || title.includes('Bảo mật') || title.includes('Riêng tư') || title.includes('Privacy') || title.includes('Error')) {
                console.log('Security/Error warning detected, attempting bypass...');

                // Strategy A: "Advanced" -> "Proceed"
                const advanced = await page.$('#details-button');
                if (advanced) {
                    console.log('Clicked Advanced');
                    await advanced.click();
                    await sleep(500);
                    const proceed = await page.$('#proceed-link');
                    if (proceed) {
                        console.log('Clicked Proceed Link');
                        await proceed.click();
                        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                    }
                }

                // Strategy B: "Continue to site" (HTTP Warning)
                const proceedBtn = await page.$('#proceed-button');
                if (proceedBtn) {
                    console.log('Found Proceed Button, clicking...');
                    await proceedBtn.click();
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                }

                // Strategy C: Text-based filtering
                if (!advanced && !proceedBtn) {
                    console.log('Trying text-based button search...');
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button, a'));
                        const target = buttons.find(b => {
                            const text = b.innerText.toLowerCase();
                            return text.includes('continue') ||
                                text.includes('tiếp tục') ||
                                text.includes('proceed') ||
                                text.includes('unsafe');
                        });
                        if (target) target.click();
                    });
                    await sleep(3000);
                }
            }
        } catch (bypassErr) {
            console.log('Bypass check failed:', bypassErr.message);
        }

        // 2. Login
        console.log('Filling QLDT credentials...');
        console.log('Current URL:', page.url());
        console.log('Current Title:', await page.title());

        await sleep(1000);

        try {
            // Check if we are still on the warning page or an error page
            const currentContent = await page.content();
            if (currentContent.includes('privacy error') || currentContent.includes('Not Secure')) {
                console.log('STILL on security warning page after bypass attempt.');
            }

            // Wait for username input
            // Try ID selector first, it's usually more reliable
            const userSelector = '#txtUserName';
            await page.waitForSelector(userSelector, { timeout: 10000 });

            await page.type('input[name="txtUserName"]', studentId);
            await page.type('input[name="txtPassword"]', password);

            await Promise.all([
                page.click('#btnSubmit'),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
            ]);

            console.log('Login submitted. Checking success...');

            if (page.url().includes('Login.aspx')) {
                // Check for error message
                const errorMsg = await page.evaluate(() => {
                    const el = document.getElementById('lblErrorInfo');
                    return el ? el.innerText : '';
                });
                throw new Error('Login failed: ' + errorMsg);
            }

            console.log('Login successful!');

        } catch (e) {
            console.log('Login step failed:', e.message);
            await page.screenshot({ path: 'debug_qldt_login_error.png' });
            throw e;
        }

        // 3. Navigate to Study Register (Registered Courses List)
        // This page contains the detailed list: "Lớp học phần đã đăng ký"
        console.log('Navigating to StudyRegister page...');
        await page.goto('http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/StudyRegister/StudyRegister.aspx', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for the specific table content to load
        try {
            await page.waitForFunction(() => document.body.innerText.includes('Lớp học phần'), { timeout: 10000 });
        } catch (e) {
            console.log('Warning: Timeout waiting for "Lớp học phần" text.');
        }

        console.log('Extracting registered courses data...');

        const scheduleData = await page.evaluate(() => {
            const data = [];

            // 1. Find the specific "Danh sách lớp học phần đã đăng ký" container or just search all tables
            const tables = Array.from(document.querySelectorAll('table'));

            // Strategy: Find the *header row* first
            // The header row must contain "Lớp học phần" AND "Thời gian"
            let headerRow = null;
            let targetTable = null;

            for (const table of tables) {
                const rows = Array.from(table.querySelectorAll('tr'));
                for (const row of rows) {
                    const text = row.innerText.toLowerCase();
                    if (text.includes('lớp học phần') && text.includes('thời gian')) {
                        headerRow = row;
                        targetTable = table;
                        break;
                    }
                }
                if (headerRow) break;
            }

            if (!headerRow || !targetTable) {
                return [{ error: 'Could not find header row with "Lớp học phần" and "Thời gian"' }];
            }

            // 2. Map indices based on header cells
            const headerCells = Array.from(headerRow.querySelectorAll('td, th'));
            const indices = {
                courseName: -1,
                courseCode: -1,
                time: -1,
                location: -1,
                lecturer: -1,
                stt: -1
            };

            headerCells.forEach((cell, idx) => {
                const txt = cell.innerText.trim().toLowerCase();
                if (txt.includes('lớp học phần')) indices.courseName = idx;
                else if (txt.includes('học phần')) indices.courseCode = idx;
                else if (txt.includes('thời gian')) indices.time = idx;
                else if (txt.includes('địa điểm') || txt.includes('phòng')) indices.location = idx;
                else if (txt.includes('giảng viên')) indices.lecturer = idx;
                else if (txt.includes('stt')) indices.stt = idx;
            });

            // 3. Extract Data Rows with Advanced Heuristics
            console.log('Starting advanced heuristic scan...');

            const allTables = Array.from(document.querySelectorAll('table'));
            const dataRows = [];

            // Gather all rows from all tables
            allTables.forEach(t => {
                const rows = Array.from(t.querySelectorAll('tr'));
                rows.forEach(r => dataRows.push(r));
            });

            console.log(`Scanning ${dataRows.length} total rows/sub-rows...`);

            const clean = (txt) => txt ? txt.trim() : '';

            // --- ROWSPAN STATE ---
            let lastCourseName = '';
            let lastCourseCode = '';
            // ---------------------

            dataRows.forEach((row, rIdx) => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length < 5) {
                    // console.log(`Row ${rIdx} skipped: too few cells (${cells.length})`);
                    return;
                }

                // Heuristic: Find the "Time" column by looking for Date Range pattern
                // Pattern: dd/mm/yyyy
                let timeIndex = -1;
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i].innerText.match(/\d{2}\/\d{2}\/\d{4}/)) {
                        timeIndex = i;
                        break;
                    }
                }

                // Fallback: If no date found by regex, try standard QLDT positions (Index 5 or 6)
                if (timeIndex === -1) {
                    // Check index 5 (standard)
                    if (cells[5] && cells[5].innerText.length > 10) timeIndex = 5;
                    else if (cells[4] && cells[4].innerText.length > 10) timeIndex = 4;
                }

                if (timeIndex === -1) {
                    // console.log(`Row ${rIdx} skipped: No Date/Time found.`);
                    return;
                }

                // If Date is found at index T, usually:
                // Name is at T-2 (or T-1 if code is merged)
                // Code is at T-1
                // Location is at T+1
                // Lecturer is at T+2

                // Let's grab text relative to Time Index
                const timeRaw = clean(cells[timeIndex].innerText);

                // Heuristic for Name: Search backwards from Date cell (timeIndex)
                let courseName = '';
                let courseCode = '';

                const getCellText = (offset) => {
                    const idx = timeIndex + offset;
                    return (idx >= 0 && idx < cells.length) ? clean(cells[idx].innerText) : '';
                };

                // Candidate 1: T-2
                const t_minus_2 = getCellText(-2);
                // Candidate 2: T-3
                const t_minus_3 = getCellText(-3);
                // Candidate 3: T-4
                const t_minus_4 = getCellText(-4);

                // Check if T-2 is a long string (Name)
                if (t_minus_2.length > 5 && isNaN(parseInt(t_minus_2))) {
                    courseName = t_minus_2;
                    // Then Code is likely T-3
                    courseCode = t_minus_3;
                    // If T-3 is short numeric (Credits), try T-4
                    if (courseCode.length < 4 || !isNaN(parseInt(courseCode))) {
                        courseCode = t_minus_4;
                    }
                }
                // If T-2 is short/numeric, try T-3 as Name
                else if (t_minus_3.length > 5 && isNaN(parseInt(t_minus_3))) {
                    courseName = t_minus_3;
                    courseCode = t_minus_4; // Code usually before Name
                }

                // Fallback: Just grab T-3 (Common standard)
                if (!courseName) {
                    courseName = t_minus_3;
                    courseCode = t_minus_4;
                }

                // Clean up (remove "Học phần" header if somehow matched)
                if (courseName.includes("Học phần") || courseName.includes("STT")) return;

                // --- FILL-DOWN LOGIC (ROWSPAN) ---
                if ((!courseName || courseName === "0" || courseName.length < 2) && lastCourseName) {
                    // Current row has valid Time but empty/invalid Name.
                    // Assume it belongs to the previous course (rowspan case).
                    console.log(`Row ${rIdx}: Empty Name, filling down from ${lastCourseName}`);
                    courseName = lastCourseName;
                    courseCode = lastCourseCode;
                } else if (courseName && courseName !== "0" && courseName.length >= 2) {
                    // Valid new course found, update state
                    lastCourseName = courseName;
                    lastCourseCode = courseCode;
                } else {
                    // Invalid row and no lastCourse to fill from
                    console.log(`Row ${rIdx} skipping: Invalid Name '${courseName}' and no lastCourse.`);
                    return;
                }
                // ---------------------------------

                // Location: T+1
                const location = getCellText(1);
                // Lecturer: T+2
                const lecturer = getCellText(2);

                const stt = clean(cells[0]?.innerText); // STT is almost always first col

                // Validation: Filter out the "Filter Row" which copies headers
                if (courseName.includes('Học phần') || timeRaw.includes('Thời gian') || stt === 'Chọn') {
                    // console.log(`Skipping filter row at ${rIdx}`);
                    return;
                }

                // Double check it's not the header row itself
                if (timeRaw.toLowerCase().includes('thời gian')) return;

                if (courseName && timeRaw) {
                    console.log(`Row ${rIdx} MATCH: [${courseCode}] ${courseName} | ${timeRaw.substring(0, 20)}...`);
                    data.push({
                        stt,
                        course_name: courseName,
                        course_code: courseCode,
                        time_raw: timeRaw,
                        location,
                        lecturer
                    });
                }
            });

            // Deduplicate (in case nested tables cause double counting)
            const uniqueData = [];
            const seen = new Set();
            data.forEach(item => {
                // Key must include specific time string to distinguish different slots for same course
                const key = item.course_name + '_' + item.time_raw + '_' + item.location;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueData.push(item);
                }
            });

            return uniqueData;
        });

        console.log(`Extracted ${scheduleData.length} courses.`);
        if (scheduleData.length > 0) {
            console.log('Courses found:', scheduleData.map(c => c.course_name).join(', '));
            console.log('Sample Data:', JSON.stringify(scheduleData[0], null, 2));
        } else {
            console.log('⚠️ No courses found! Check debug screenshot.');
        }

        // Parse the "time_raw" on server side (better performance)
        const parsedData = scheduleData.map(item => {
            if (item.error) return item;

            const periods = [];
            const raw = item.time_raw;
            if (!raw) return { ...item, schedule: [] };

            // Regex to find blocks: "Từ dd/mm/yyyy đến dd/mm/yyyy: (n)"
            // And subsequent lines: "Thứ x tiết y,z (LT)"

            // 1. Split by "Từ" to get date ranges
            const ranges = raw.split('Từ ').filter(r => r.trim().length > 0);

            ranges.forEach(rangeStr => {
                // Format: "19/01/2026 đến 08/02/2026: (1)\n   Thứ 2 tiết 1,2,3,4 (LT)..."
                const lines = rangeStr.split('\n').map(l => l.trim()).filter(l => l);

                // Line 0: Date range
                const dateMatch = lines[0].match(/(\d{2}\/\d{2}\/\d{4})\s*đến\s*(\d{2}\/\d{2}\/\d{4})/);
                if (!dateMatch) return;

                const startDate = dateMatch[1];
                const endDate = dateMatch[2];

                // Process subsequent lines (Weekly schedule)
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    // "Thứ 2 tiết 1,2,3,4 (LT)"
                    const dayMatch = line.match(/Thứ\s*(\d+|CN)/i);
                    const periodMatch = line.match(/tiết\s*([\d,]+)/i);
                    const roomMatch = line.match(/\((.*?)\)$/); // (LT), (TH) or Room

                    if (dayMatch && periodMatch) {
                        let day = dayMatch[1];
                        if (day === 'CN') day = '8'; // Convert CN to 8 for consistency if needed

                        periods.push({
                            startDate,
                            endDate,
                            day: parseInt(day),
                            periods: periodMatch[1].split(',').map(p => parseInt(p)),
                            type: roomMatch ? roomMatch[1] : '' // LT/TH
                        });
                    }
                }
            });

            return {
                ...item,
                schedule: periods
            };
        });

        await browser.close();
        res.json({ success: true, data: parsedData });

    } catch (error) {
        console.error('Schedule Crawl Error:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/crawl-grades', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }

    console.log(`Starting crawler for: ${email}`);

    try {
        // Launch Browser - Clean Session (No userDataDir)
        browser = await puppeteer.launch({
            headless: "new",
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages.length > 0 ? pages[0] : await browser.newPage();

        // 1. Navigate to Login
        console.log('Navigating to Microsoft Login...');
        const loginUrl = "https://login.microsoftonline.com/0aa16d8a-a396-4e21-aa14-2a68a45786bc/oauth2/v2.0/authorize?response_type=code&client_id=fbad147e-ffd3-419f-989a-7aceae620f77&redirect_uri=https%3A%2F%2Fktdbcl.actvn.edu.vn%2Findex.php%2Faksociallogin_finishLogin%2Fmicrosoft.raw&scope=user.read&response_mode=query";

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

        // STEP C: KMSI (Force Click NO with Retry Loop)
        console.log('Waiting for "Stay signed in"...');
        try {
            // Wait quickly for any relevant element
            await page.waitForFunction(() => {
                return document.getElementById('idBtn_Back') || document.getElementById('idSIButton9') || document.querySelector('input[type="submit"]');
            }, { timeout: 8000 });

            // Retry Loop: Click up to 5 times if needed (solving the "2nd try" issue)
            for (let i = 0; i < 5; i++) {
                if (!page.url().includes('login.microsoft') && !page.url().includes('login.live')) break; // Already moved on

                console.log(`KMSI Click Attempt ${i + 1}...`);
                await page.evaluate(() => {
                    const btn = document.getElementById('idBtn_Back') || document.getElementById('idSIButton9') || document.querySelector('input[type="submit"]');
                    if (btn) btn.click();
                });
                await sleep(800); // Wait a bit for reaction
            }

        } catch (e) {
            console.log('KMSI screen skipped or not found.');
        }

        // 3. Wait for Redirect to School Domain
        console.log('Waiting for redirect to school domain...');
        try {
            await page.waitForFunction(
                () => window.location.href.includes('actvn'),
                { timeout: 30000 }
            );
            console.log('Returned to school domain.');
            // Removed strict sleep for speed - User requested max speed
        } catch (e) {
            console.log('Redirect check timeout. Forcing navigation anyway...');
        }

        // Always force navigation to the specific grades page
        console.log('Navigating to Grades page...');
        await page.goto('https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // 4. Extract Data with Pagination
        console.log('Extracting data (Multi-page)...');
        let grades = [];
        let hasNext = true;
        let pageNum = 1;

        try {
            await page.waitForSelector('table', { timeout: 15000 });
        } catch (e) {
            console.log('Table selector timeout! Dumping HTML...');
            const html = await page.content();
            // Assuming fs is required at top, if not I might break it. 
            // But valid code had fs.writeFileSync. 
            // Wait, I don't see fs required in the view_file of top lines.
            // I will assume it works or use logic that doesn't depend on it if not sure.
            // The previous code used fs.writeFileSync, so fs must be there.
            // Wait, previous code was: fs.writeFileSync('debug_grades.html', html);
            // I will keep using it.
            require('fs').writeFileSync('debug_grades.html', html);

            if (html.includes('alert-warning') || html.includes('alert-danger')) {
                throw new Error('Đăng nhập không thành công (Trang web báo lỗi / Yêu cầu đăng nhập lại).');
            }
            if (html.includes('Đăng nhập')) {
                throw new Error('Hệ thống chưa nhận diện phiên đăng nhập.');
            }
            throw new Error('Timeout: Không tìm thấy bảng điểm.');
        }

        // 3.5 Attempt to "Show All" rows to avoid pagination logic if possible
        try {
            console.log('Attempting to expand table view (Show All/Max)...');
            const expanded = await page.evaluate(() => {
                const selects = Array.from(document.querySelectorAll('select'));
                // Look for a select that likely controls page size (contains 10, 25, 50, or "records")
                // Heuristic: Select element near the table or with specific options
                const lengthSelect = selects.find(s => {
                    const txt = s.innerText || '';
                    if (txt.includes('10') && txt.includes('20') && txt.includes('50')) return true;
                    return (s.name && s.name.includes('length'));
                });

                if (lengthSelect) {
                    const options = Array.from(lengthSelect.options);
                    // Try to find -1 (All) or largest number
                    const allOpt = options.find(o => o.value === '-1' || o.text.toLowerCase().includes('tất cả') || o.text.toLowerCase().includes('all'));

                    if (allOpt) {
                        lengthSelect.value = allOpt.value;
                    } else {
                        // Pick largest numeric value
                        let maxVal = 0;
                        let maxOptVal = '';
                        options.forEach(opt => {
                            const val = parseInt(opt.value);
                            if (!isNaN(val) && val > maxVal) {
                                maxVal = val;
                                maxOptVal = opt.value;
                            }
                        });
                        if (maxOptVal) lengthSelect.value = maxOptVal;
                    }

                    lengthSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
                return false;
            });

            if (expanded) {
                console.log('Page size expansion triggered. Waiting for refresh...');
                await new Promise(r => setTimeout(r, 3000)); // Wait for table redraw
            }
        } catch (e) {
            console.log('Show All attempt failed/skipped:', e.message);
        }

        while (hasNext && pageNum <= 20) { // Safety limit 20 pages
            console.log(`Scraping Page ${pageNum}...`);

            // A. Extract Current Page
            const pageData = await page.evaluate(() => {
                let rows = document.querySelectorAll('#div-ket-qua-hoc-tap .table tr');
                if (rows.length === 0) rows = document.querySelectorAll('table tr');

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

            grades.push(...pageData);

            // B. Check & Click Next
            const nextClicked = await page.evaluate((currentPage) => {
                const nextPageNum = currentPage + 1;
                const nextPageStr = nextPageNum.toString();

                // 1. Kendo UI Specifics (Common in Education portals)
                // Kendo Next Arrow
                const kendoNext = document.querySelector('.k-pager-nav[title="Go to the next page"], .k-pager-nav .k-i-arrow-e, .k-i-arrow-60-right');
                if (kendoNext && !kendoNext.classList.contains('k-state-disabled')) {
                    kendoNext.click();
                    return true;
                }

                // Kendo Numeric Link (Find link with text "2")
                const kendoNum = Array.from(document.querySelectorAll('.k-pager-numbers a, .k-pager-numbers li')).find(el => el.innerText.trim() === nextPageStr);
                if (kendoNum) {
                    kendoNum.click();
                    return true;
                }

                // 2. Generic Numeric Link (Aggressive)
                // Look for ANY <a> or <li> or <button> that equals the number,
                // BUT exclude table data to avoid clicking grades.
                const allClickables = Array.from(document.querySelectorAll('ul.pagination li a, .pagination a, div.pager a, a, button'));
                const numLink = allClickables.find(el => {
                    const text = el.innerText.trim();
                    if (text !== nextPageStr) return false;

                    // Safety: Ensure it's not a grade in the table
                    if (el.closest('table') || el.closest('tr') || el.closest('td')) return false;

                    return true;
                });

                if (numLink) {
                    numLink.click();
                    return true;
                }

                return false;
            }, pageNum);

            if (nextClicked) {
                console.log(`Clicked Next/Page ${pageNum + 1}. Waiting for load...`);
                await new Promise(r => setTimeout(r, 4000)); // Increased wait for reliability
                pageNum++;
            } else {
                console.log(`No next page button (Arrow or "${pageNum + 1}") found. Stops at Page ${pageNum}.`);
                // Debug: Print available links to see what failed
                const debugLinks = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('ul.pagination a, .k-pager-numbers a')).map(a => a.innerText);
                });
                console.log('Visible Pagination Links:', debugLinks);
                hasNext = false;
            }
        }

        console.log(`Extracted ${grades.length} rows from School Site.`);

        // --- STEP 5: Crawl KMA Legend ---
        const studentId = email.split('@')[0];
        if (studentId) {
            console.log(`Navigating to KMA Legend for ID: ${studentId}...`);
            try {
                await page.goto('https://kma-legend.click/scores', { waitUntil: 'networkidle2', timeout: 30000 });

                // Wait for input
                const inputSelector = 'input[placeholder*="Nhập mã sinh viên"]';
                await page.waitForSelector(inputSelector, { timeout: 10000 });
                await page.type(inputSelector, studentId);

                // Click Search
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const searchBtn = buttons.find(b => b.innerText.includes('Tra cứu'));
                    if (searchBtn) searchBtn.click();
                });

                // Wait for table
                await page.waitForSelector('table', { timeout: 10000 });
                await sleep(2000); // Wait for rows to render

                // Extract and Map
                const legendGrades = await page.evaluate(() => {
                    const rows = document.querySelectorAll('table tbody tr');
                    const data = [];
                    // Legend Columns: 0:Môn, 1:Tín, 2:GK(TP1), 3:CC(TP2), 4:CK, 5:TK, 6:Chữ, 7:Kỳ
                    // Target Columns: 0:#, 1:Năm, 2:Kỳ, 3:Môn, 4:Lần, 5:TP1, 6:TP2, 7:ĐQT, 8:Điểm thi, 9:Điểm HP, 10:Điểm chữ

                    rows.forEach((row, index) => {
                        const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.trim());
                        if (cells.length >= 7) {
                            const tp1 = parseFloat(cells[2]) || 0;
                            const tp2 = parseFloat(cells[3]) || 0;
                            // Format to 1 decimal place
                            const dqt = (tp1 * 0.68 + tp2 * 0.32).toFixed(1);

                            // Parse Year and Semester from cells[7] (e.g. "2023_2024_1")
                            let year = '';
                            let semester = '';
                            const rawPeriod = cells[7] || '';
                            const parts = rawPeriod.split('_');
                            if (parts.length >= 3) {
                                year = `${parts[0]}-${parts[1]}`;
                                semester = parts[2];
                            }

                            const mappedRow = [
                                `L-${index + 1}`,   // 0: # (Prefix L for Legend)
                                year,               // 1: Năm học
                                semester,           // 2: Học kỳ
                                cells[0] || '',     // 3: Môn thi
                                '1',                // 4: Lần (Default 1)
                                cells[2] || '',     // 5: TP1 (GK)
                                cells[3] || '',     // 6: TP2 (CC)
                                dqt,                // 7: ĐQT (Calculated)
                                cells[4] || '',     // 8: Điểm thi (CK)
                                cells[5] || '',     // 9: Điểm HP (TK)
                                cells[6] || '',     // 10: Điểm chữ
                                cells[1] || '0'     // 11: Tín chỉ
                            ];
                            // Check if it's a valid row (has subject name)
                            if (mappedRow[3]) {
                                data.push(mappedRow);
                            }
                        }
                    });
                    return data;
                });

                console.log(`Extracted ${legendGrades.length} rows from KMA Legend.`);

                if (legendGrades.length > 0) {
                    // Add Legend grades 
                    grades.push(...legendGrades);
                }

            } catch (legendErr) {
                console.error('Error crawling KMA Legend (skipping):', legendErr.message);
                // Don't fail the whole request, just log
            }
        }

        // --- STEP 6: Sort Data (Chronological: Year Asc -> Semester Asc) ---
        // Assuming row[1] is Year (e.g., "2023-2024") and row[2] is Semester (e.g., "1")
        if (grades.length > 0) {
            grades.sort((a, b) => {
                const yearA = a[1] || '';
                const yearB = b[1] || '';

                if (yearA !== yearB) {
                    return yearA.localeCompare(yearB);
                }

                const semA = a[2] || '';
                const semB = b[2] || '';
                return semA.localeCompare(semB);
            });

            // Re-index columns (Optional, but nice for #)
            grades.forEach((row, idx) => {
                if (!row[0].startsWith('L-')) {
                    row[0] = (idx + 1).toString();
                }
            });
        }

        console.log(`Final processed count: ${grades.length} rows.`);
        res.json({ success: true, data: grades });

    } catch (error) {
        console.error('Crawler error:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: error.message });
        return;
    }

    if (browser) await browser.close();
});

// --- NEW: AI Roadmap Suggestion Endpoint (Groq) ---
app.post('/api/suggest-roadmap', async (req, res) => {
    const { grades, major, curriculum } = req.body;

    if (!grades || !major) {
        return res.status(400).json({ error: 'Missing grades or major data' });
    }

    try {
        // Format Grades
        const gradesText = grades.map(g => `- ${g[3]}: ${g[10]} (${g[9]})`).join('\n');

        // Format Curriculum
        let curriculumText = "Chưa có thông tin chi tiết.";
        if (curriculum && curriculum.roadmap) {
            curriculumText = JSON.stringify(curriculum.roadmap, null, 2).slice(0, 3000); // giới hạn token
        }

        const systemPrompt = `Bạn là cố vấn học tập AI cho sinh viên Học viện Kỹ thuật Mật mã. Trả lời bằng Markdown, ngắn gọn, súc tích, giọng điệu khích lệ.`;

        const userPrompt = `
**Thông tin sinh viên:**
- Ngành học: ${major}
- Bảng điểm:
${gradesText}

**Chương trình đào tạo (tham khảo):**
${curriculumText}

**Yêu cầu:** Đưa ra lộ trình học kỳ tiếp theo:
1. Phân tích ngắn tình hình học tập (môn thấp/trượt, môn tốt)
2. Đề xuất môn nên đăng ký kỳ tới (ưu tiên học lại nếu trượt)
3. Lời khuyên cụ thể để cải thiện điểm
`;

        console.log('Calling Groq for roadmap suggestion...');
        const suggestion = await callGroq(systemPrompt, userPrompt, 1024);
        console.log('✅ Roadmap suggestion OK (Groq)');
        return res.json({ success: true, suggestion });

    } catch (err) {
        console.error('Suggest-roadmap error:', err.message);
        res.status(500).json({
            error: 'AI model failed. Please check GROQ_API_KEY.',
            details: err.message
        });
    }

});


// --- SOCKET.IO SETUP ---
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Socket Connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        console.log(`User ${userId} joined room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected from room ${roomId}`);
            socket.to(roomId).emit('user-disconnected', userId);
        });

        socket.on('send-message', (message, userName) => {
            io.to(roomId).emit('create-message', message, userName);
        });
    });
});

// === CHATBOT API cho Study Room ===
app.post('/api/chatbot', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Cấu hình prompt cho vai trò trợ lý học tập
        let promptText = `Bạn là "Trợ lý ảo KMA AI", một AI nhiệt tình giúp đỡ sinh viên Đại học trong các môn học như Toán, Lập trình, Vật lý, v.v. \n`;
        if (context) {
            promptText += `Ngữ cảnh phòng học: Môn học hiện tại có thể là ${context}.\n`;
        }
        promptText += `Câu hỏi của sinh viên: "${message}"\n`;
        promptText += `Hãy trả lời ngắn gọn, súc tích (dưới 150 chữ) và dễ hiểu, xưng hô là "mình" và "bạn". Không dùng markdown phức tạp.`;

        // Gọi Groq API
        const systemPrompt = 'Bạn là "Trợ lý ảo KMA AI", một AI nhiệt tình giúp đỡ sinh viên Đại học trong các môn học như Toán, Lập trình, Vật lý, v.v. Luôn xưng hô là "mình" và "bạn". Trả lời ngắn gọn dưới 150 chữ, không dùng markdown phức tạp.';
        const replyText = await callGroq(systemPrompt, promptText, 300);
        console.log('✅ Chatbot (Groq) response OK');
        res.json({ reply: replyText });
    } catch (error) {
        console.error('❌ Error in /api/chatbot:', error);
        res.status(500).json({ error: 'Failed to communicate with AI model', details: error.message });
    }
});

server.listen(PORT, () => {
    console.log(`Crawler Backend running on http://localhost:${PORT}`);
    console.log(`Socket.io running on http://localhost:${PORT}`);
});
