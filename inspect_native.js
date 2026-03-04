const http = require('http');

const url = 'http://qldt.actvn.edu.vn/CMCSoft.IU.Web.info/Login.aspx';

http.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            console.log('HTML Length:', rawData.length);
            const inputs = rawData.match(/<input[^>]*id="([^"]*)"[^>]*>/g);
            if (inputs) {
                console.log('Inputs found:');
                inputs.forEach(i => console.log(i));
            } else {
                console.log('No inputs found via regex.');
            }
        } catch (e) {
            console.error(e.message);
        }
    });

}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
