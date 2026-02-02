const puppeteer = require('puppeteer');
const fs = require('fs');

async function runCrawler() {
    console.log('Khởi động trình duyệt...');
    // Bạn có thể đổi headless: false để xem trình duyệt chạy
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // URL cần crawl
    const url = 'https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html';
    console.log(`Đang truy cập: ${url}`);

    try {
        // Đợi trang tải xong (networkidle2: không còn kết nối mạng trong 500ms)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (error) {
        console.log('Lỗi hoặc timeout khi tải trang (có thể bỏ qua):', error.message);
    }

    // Chụp ảnh màn hình để kiểm tra
    await page.screenshot({ path: 'ket_qua_crawl.png', fullPage: true });
    console.log('Đã lưu ảnh chụp màn hình vào ket_qua_crawl.png');

    // Kiểm tra xem có thông báo lỗi không
    const errorAlert = await page.$('.alert.alert-danger');
    if (errorAlert) {
        const errorText = await page.evaluate(el => el.textContent, errorAlert);
        console.log('CẢNH BÁO TỪ TRANG WEB:', errorText.trim());
        console.log('-> Trang web yêu cầu đăng nhập hoặc tham số đặc biệt.');
    }

    // Tìm kiếm form nhập liệu (nếu có)
    const inputs = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('input').forEach(input => {
            // Bỏ qua các input hidden hệ thống
            if (input.type !== 'hidden') {
                results.push({
                    id: input.id,
                    name: input.name,
                    placeholder: input.placeholder
                });
            }
        });
        return results;
    });

    if (inputs.length > 0) {
        console.log('Tìm thấy các ô nhập liệu:', inputs);
        // TODO: Nếu tìm thấy ô nhập mã sinh viên, bạn có thể uncomment code dưới đây để điền:
        /*
        await page.type('#id_cua_o_nhap', 'MA_SINH_VIEN_CUA_BAN');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        */
    } else {
        console.log('Không tìm thấy ô nhập liệu nào trên trang này.');
    }

    // Lưu nội dung HTML
    const html = await page.content();
    fs.writeFileSync('ket_qua.html', html);
    console.log('Đã lưu html vào ket_qua.html');

    await browser.close();
    console.log('Hoàn tất.');
}

runCrawler();
