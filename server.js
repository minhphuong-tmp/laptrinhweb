const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
console.log('Gemini Config - API Key Loaded:', apiKey ? 'YES' : 'NO');
if (!apiKey) console.warn('Warning: GEMINI_API_KEY is missing in .env file');
const genAI = new GoogleGenerativeAI(apiKey || 'YOUR_API_KEY_HERE');


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
            headless: "new",
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

// --- NEW: AI Roadmap Suggestion Endpoint ---
app.post('/api/suggest-roadmap', async (req, res) => {
    const { grades, major, curriculum } = req.body;

    if (!grades || !major) {
        return res.status(400).json({ error: 'Missing grades or major data' });
    }

    // Dynamic Model Discovery
    let activeModelName = null;
    try {
        // Fetch list of models available to this API Key
        // We use the REST API key directly to be sure, as SDK listModels might vary in implementation
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        if (listData.models) {
            // Find the best available model (prefer 1.5-flash, then pro, then any gemini)
            const availableNames = listData.models.map(m => m.name.replace('models/', ''));
            console.log('Available Models for Key:', availableNames);

            const preferences = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

            // 1. Check exact matches from preference list
            for (const pref of preferences) {
                if (availableNames.includes(pref)) {
                    activeModelName = pref;
                    break;
                }
            }

            // 2. If no exact preference found, pick the first "gemini" model
            if (!activeModelName) {
                const anyGemini = listData.models.find(m => m.name.includes('gemini'));
                if (anyGemini) {
                    activeModelName = anyGemini.name.replace('models/', '');
                }
            }
        }
    } catch (e) {
        console.warn('Model auto-discovery failed, falling back to static list.', e.message);
    }

    // Fallback list if discovery failed or returned nothing
    const modelsToTry = activeModelName ? [activeModelName] : ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let errorLog = [];

    for (const modelName of modelsToTry) {

        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Construct a prompt context
            // 1. Format Grades
            const gradesText = grades.map(g => {
                // g format from crawler: [?, Year, Sem, Subject, ?, TP1, TP2, DQT, Exam, HP, Letter, Credit]
                // We mainly care about Subject, Letter Grade, and maybe HP (Final Score)
                return `- ${g[3]}: ${g[10]} (${g[9]})`;
            }).join('\n');

            // 2. Format Curriculum (Focus on Roadmap and Subject Info)
            // We assume frontend sends the relevant major's roadmap
            let curriculumText = "Chưa có thông tin chi tiết.";
            if (curriculum && curriculum.roadmap) {
                curriculumText = JSON.stringify(curriculum.roadmap, null, 2);
            }

            const prompt = `
Bạn là một cố vấn học tập AI cho sinh viên Đại học (Học viện Kỹ thuật Mật mã).
Nhiệm vụ của bạn là xem xét bảng điểm hiện tại của sinh viên và chương trình đào tạo chuẩn để đưa ra gợi ý lộ trình học tập tiếp theo.

**Thông tin sinh viên:**
- Ngành học: ${major}
- Bảng điểm đã học:
${gradesText}

**Chương trình đào tạo chuẩn (tham khảo):**
${curriculumText}

**Yêu cầu đầu ra:**
Hãy đưa ra một lộ trình gợi ý cho học kỳ tiếp theo (và các kỳ tới nếu cần).
1. Phân tích ngắn gọn tình hình học tập hiện tại (Môn nào điểm thấp/trượt cần học lại, môn nào tốt).
2. Đề xuất danh sách các môn nên đăng ký trong kỳ tới. Ưu tiên các môn học lại (nếu trượt) và các môn theo lộ trình chuẩn.
3. Đưa ra lời khuyên cụ thể để cải thiện kết quả học tập dựa trên dữ liệu điểm (Ví dụ: nếu thấy các môn lập trình thấp, hãy khuyên cách học lập trình).

Hãy trả lời bằng định dạng Markdown, ngắn gọn, súc tích, giọng điệu khích lệ.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`Success with model: ${modelName}`);
            return res.json({ success: true, suggestion: text });

        } catch (err) {
            console.warn(`Model ${modelName} failed:`, err.message);
            errorLog.push(`${modelName}: ${err.message}`);
            // Continue to next model
        }
    }

    // If all failed
    console.error('All Gemini models failed.');
    res.status(500).json({
        error: 'All AI models failed. Please check your API Key and enable "Generative Language API" in Google Cloud Console.',
        details: errorLog
    });

});

app.listen(PORT, () => {
    console.log(`Crawler Backend running on http://localhost:${PORT}`);
});
