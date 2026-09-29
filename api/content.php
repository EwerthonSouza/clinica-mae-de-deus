<?php
require_once __DIR__ . '/helpers.php';

$content = get_content();
unset($content['media']); // biblioteca de mídia é só do painel
$content['maxUploadMB'] = MAX_UPLOAD_MB;
header('Cache-Control: no-cache');
send_json($content);
