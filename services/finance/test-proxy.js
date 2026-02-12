const http = require('http');
const { URL } = require('url');

const targets = [
    'https://admin.salvemundi.nl',
    'https://www.google.com'
];

async function testUrl(target) {
    console.log(`Testing ${target}...`);
    const targetUrl = new URL(target);
    const options = {
        host: 'secure-proxy',
        port: 3128,
        method: 'CONNECT',
        path: `${targetUrl.hostname}:443`,
        timeout: 5000 // 5s timeout
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options);
        req.end();

        req.on('connect', (res, socket, head) => {
            console.log(`  [SUCCESS] Proxy established tunnel (Status ${res.statusCode}) for ${target}`);
            socket.destroy();
            resolve(true);
        });

        req.on('response', (res) => {
            console.log(`  [FAIL] Proxy refused tunnel (Status ${res.statusCode}) for ${target}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`  [ERROR] Connection timed out for ${target}`);
            req.destroy();
            resolve(false);
        });

        req.on('error', (err) => {
            console.log(`  [ERROR] Connection failed: ${err.message}`);
            resolve(false);
        });
    });
}

(async () => {
    for (const t of targets) {
        await testUrl(t);
    }
})();
