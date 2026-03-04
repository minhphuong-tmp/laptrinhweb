const fetch = require('node-fetch'); // Needs to be installed, or use built-in fetch in Node 18+

async function run() {
    try {
        const resp = await fetch('http://qldt.actvn.edu.vn/CMCSoft.IU.Web.info/Login.aspx');
        const text = await resp.text();
        console.log('HTML Length:', text.length);

        // Regex to find inputs
        const inputs = text.match(/<input[^>]*id="([^"]*)"[^>]*>/g);
        if (inputs) {
            console.log('Inputs found:');
            inputs.forEach(i => console.log(i));
        } else {
            console.log('No inputs found via regex.');
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

run();
