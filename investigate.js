const https = require('https');

const url = 'https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html';

console.log(`Fetching ${url}...`);

https.get(url, { rejectUnauthorized: false }, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Body length: ${data.length}`);

        // Find forms
        const formRegex = /<form[\s\S]*?<\/form>/gi;
        const forms = data.match(formRegex);

        if (!forms) {
            console.log('No forms found. Searching for specific inputs like "Ma sinh vien"...');
            // Sometimes forms are implicit or handled by JS, let's look for inputs
            const inputRegex = /<input[^>]*>/gi;
            const inputs = data.match(inputRegex);
            if (inputs) {
                inputs.forEach(inp => console.log('Input:', inp));
            }
        } else {
            console.log(`Found ${forms.length} forms.`);
            forms.forEach((form, i) => {
                console.log(`\n--- Form ${i + 1} ---`);
                const action = form.match(/action=["'](.*?)["']/i);
                console.log(`Action: ${action ? action[1] : 'None'}`);

                const inputs = form.match(/<input[^>]*>/gi);
                if (inputs) {
                    inputs.forEach(inp => {
                        const name = inp.match(/name=["'](.*?)["']/i);
                        const id = inp.match(/id=["'](.*?)["']/i);
                        console.log(`  Input: ${name ? name[1] : 'None'} (ID: ${id ? id[1] : 'None'})`);
                    });
                }
            });
        }

    });

}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
