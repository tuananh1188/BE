const fetch = require('node-fetch');

async function run() {
    try {
        const body = {
            message: "iphone",
            history: []
        };
        const res = await fetch('http://localhost:5003/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        console.log(res.status, data);
    } catch (e) {
        console.error('error:', e.message);
    }
}
run();
