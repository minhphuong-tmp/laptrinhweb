const http = require('http');

const url = 'http://qldt.actvn.edu.vn/CMCSoft.IU.Web.info/Login.aspx';

http.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            console.log('HTML Length:', rawData.length);

            // Log text inputs
            const textInputs = rawData.match(/<input[^>]*type="text"[^>]*>/g);
            if (textInputs) {
                console.log('--- Text Inputs ---');
                textInputs.forEach(i => console.log(i));
            }

            // Log password inputs
            const passInputs = rawData.match(/<input[^>]*type="password"[^>]*>/g);
            if (passInputs) {
                console.log('--- Password Inputs ---');
                passInputs.forEach(i => console.log(i));
            }

            // Log submit/buttons
            const submits = rawData.match(/<input[^>]*type="submit"[^>]*>/g);
            if (submits) {
                console.log('--- Submit Inputs ---');
                submits.forEach(i => console.log(i));
            }

        } catch (e) {
            console.error(e.message);
        }
    });

}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
