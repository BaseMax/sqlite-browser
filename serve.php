<?php
header("Cross-Origin-Opener-Policy: same-origin");
header("Cross-Origin-Embedder-Policy: require-corp");

readfile('sqlite_browser_ui.html');
