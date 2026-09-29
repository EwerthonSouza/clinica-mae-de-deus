<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

send_json(get_content());
