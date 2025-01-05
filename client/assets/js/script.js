// Elements
const errorElm = document.getElementById('error');
const execBtn = document.getElementById("execute");
const outputElm = document.getElementById('output');
const dbFileElm = document.getElementById('dbfile');
const savedbElm = document.getElementById('savedb');
const commandsElm = document.getElementById('commands');
const tablesListElm = document.getElementById('tables-list');
const editorContainerElm = document.getElementById('editor-container');

// Variables
let tictime;

// Pre-load
if (!window.performance || !performance.now) {
    window.performance = { now: Date.now };
}

// Const variables
const INITIAL_SQL_QUERY = "SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';";
const editor = CodeMirror.fromTextArea(commandsElm, {
    mode: 'text/x-mysql',
    viewportMargin: Infinity,
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets: true,
    autofocus: true,
    extraKeys: {
        "Ctrl-Enter": execEditorContents,
        "Ctrl-S": savedb,
    }
});
const tableCreate = function () {
    function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        var open = '<' + tagName + '>', close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
    }

    return function (columns, values) {
        var tbl = document.createElement('table');
        var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        var rows = values.map(function (v) { return valconcat(v, 'td'); });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        tbl.innerHTML = html;
        return tbl;
    };
}();

// Functions
function tic() {
    tictime = performance.now();
}

function toc(msg) {
    const dt = performance.now() - tictime;

    console.log((msg || 'toc') + ": " + dt + "ms");
}

function print(text) {
    outputElm.innerHTML = text.replace(/\n/g, '<br>');
}

function error(e) {
    console.log(e);
    errorElm.style.display = 'block';
    errorElm.textContent = e.message;
}

function noerror() {
    errorElm.style.display = 'none';
}

function execute(commands) {
    console.log("execute: ", commands);
    tic();
    worker.onmessage = function (event) {
        var results = event.data.results;
        console.log("onmessage in execute: ", commands, results);
        toc("Executing SQL");
        if (!results) {
            error({ message: event.data.error });
            return;
        }

        tic();
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");

        if (commands === INITIAL_SQL_QUERY) {
            populateTableList(results[0].values);
        }
    };
    worker.postMessage({ action: 'exec', sql: commands });
    outputElm.textContent = "Fetching results...";
}

function execEditorContents() {
    noerror();
    const editorValue = editor.getValue().trimEnd();
    
    if (editorValue === '') {
        alert("No SQL query to execute");
        return;
    }

    execute(editorValue.endsWith(';') ? editorValue : editorValue + ';');
}

function populateTableList(tables) {
    tablesListElm.innerHTML = '';
    console.log("tables:", tables);
    tables.forEach(function (table) {
        var li = document.createElement('li');
        li.textContent = table[0];
        li.addEventListener('click', function() {
            console.log('Table clicked: ' + table[0]);
            editor.setValue('SELECT * FROM ' + table[0] + ' LIMIT 100;');
            execEditorContents();
        });
        tablesListElm.appendChild(li);
    });
}
function savedb() {
    worker.onmessage = function (event) {
        toc("Exporting the database");
        const arraybuff = event.data.buffer;

        if (arraybuff.byteLength === 0) {
            alert("Database is empty, not saving");
            return;
        }

        const blob = new Blob([arraybuff]);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = window.URL.createObjectURL(blob);
        a.download = "sql.db";
        a.onclick = function () {
            setTimeout(function () {
                window.URL.revokeObjectURL(a.href);
            }, 1500);
        };

        a.click();
    };

    tic();

    worker.postMessage({ action: 'export' });
}

// Events
execBtn.addEventListener("click", execEditorContents, true);

dbFileElm.onchange = function () {
    var f = dbFileElm.files[0];

    if (f) {
        const r = new FileReader();
        r.onload = function () {
            console.log('File loaded:', f.name);
            worker.onmessage = function (e) {
                console.log('Worker response:', e.data); 

                editorContainerElm.classList.remove('hidden');
                execBtn.classList.remove('hidden');
                savedbElm.classList.remove('hidden');

                toc("Loading database from file");
                editor.setValue(INITIAL_SQL_QUERY);
                execEditorContents();
            };

            tic();

            try {
                worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
            } catch (exception) {
                worker.postMessage({ action: 'open', buffer: r.result });
            }
        };

        r.readAsArrayBuffer(f);
    } else {
        error({ message: "No file selected" });
    }
};

savedbElm.addEventListener("click", savedb, true);


// Worker
const worker = new Worker("assets/js/worker.sql-wasm.js");
worker.onerror = error;
worker.postMessage({ action: 'open' });
worker.onmessage = function (event) {
    console.log("worker onmessage");
    var data = event.data;
    console.log(data, data.sql);
    if (data.action === 'exec' && data.sql === "SELECT name FROM sqlite_master WHERE type='table';") {
        console.log('Table names:', data.results);
        populateTableList(data.results);
    }
    if (data.error) {
        error({ message: data.error });
    }
};
