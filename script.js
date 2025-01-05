import sqlite3InitModule from 'https://cdn.jsdelivr.net/npm/@sqlite.org/sqlite-wasm@3.46.1-build4/sqlite-wasm/jswasm/sqlite3.mjs';

let db;

document.getElementById('dbFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error
    });

    db = new sqlite3.oo1.DB(new Uint8Array(arrayBuffer));
    loadTables();
});

async function loadTables() {
    if (!db) return;

    try {
        const tables = db.selectObjects(`
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%';
        `);

        const tableList = document.getElementById('tableList');
        tableList.innerHTML = '';

        tables.forEach((table) => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action';
            li.textContent = table.name;
            li.addEventListener('click', () => browseTable(table.name));
            tableList.appendChild(li);
        });
    } catch (err) {
        alert(`Error loading tables: ${err.message}`);
    }
}

async function browseTable(tableName) {
    if (!db) return;

    const query = `SELECT * FROM ${tableName};`;
    executeSQL(query);
}

document.getElementById('executeQuery').addEventListener('click', () => {
    const query = document.getElementById('query').value;
    executeSQL(query);
});

function executeSQL(query) {
    if (!db) return;

    try {
        const results = db.selectObjects(query);
        displayResults(results);
    } catch (err) {
        document.getElementById('queryResult').innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
}

function displayResults(results) {
    const resultDiv = document.getElementById('queryResult');
    if (results.length === 0) {
        resultDiv.innerHTML = '<div class="alert alert-info">No results found.</div>';
        return;
    }

    let columns = Object.keys(results[0]);
    let tableHtml = '<table class="table table-striped">';
    tableHtml += '<thead><tr>';

    columns.forEach((column) => {
        tableHtml += `<th>${column}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    results.forEach((row) => {
        tableHtml += '<tr>';
        columns.forEach((column) => {
            tableHtml += `<td>${row[column]}</td>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    resultDiv.innerHTML = tableHtml;
}
