const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 4848;

const server = http.createServer((req, res) => {
    let requestedPath = req.url === '/' ? 'sqlite_browser_ui.html' : req.url;

    const filePath = path.join(__dirname, "client", requestedPath);

    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.join(__dirname, "client"))) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden</h1>', 'utf8');
        return;
    }

    const extname = path.extname(normalizedPath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.wasm': 'application/wasm',
        '.ico': 'image/x-icon',
    }[extname] || 'application/octet-stream';

    fs.readFile(normalizedPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf8');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Server Error</h1>', 'utf8');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            });
            res.end(content, 'utf8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
