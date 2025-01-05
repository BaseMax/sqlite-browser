import sqlite3InitModule from 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.46.1-build4/sqlite-wasm/jswasm/sqlite3.mjs';

let db;

onmessage = async function(event) {
    if (event.data.type === 'init') {
        const sqlite3 = await sqlite3InitModule();
        db = new sqlite3.oo1.DB(new Uint8Array(event.data.fileBuffer));
        postMessage({ type: 'ready' });
    }

    if (event.data.type === 'query') {
        const query = event.data.query;
        try {
            const result = db.selectObjects(query);
            postMessage({ type: 'result', result });
        } catch (err) {
            postMessage({ type: 'error', message: err.message });
        }
    }
};
