<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

send_json(read_json(MESSAGES_FILE, []));
