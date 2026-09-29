<?php
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

rate_limit('contact', 5, 15 * 60);

$body = json_body();
$clean = function ($v, $max) {
  $v = trim((string) ($v ?? ''));
  return mb_substr($v, 0, $max);
};

$msg = [
  'id' => new_id(),
  'name' => $clean($body['name'] ?? '', 120),
  'whatsapp' => $clean($body['whatsapp'] ?? '', 30),
  'message' => $clean($body['message'] ?? '', 2000),
  'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
  'read' => false,
];

if ($msg['name'] === '' || $msg['whatsapp'] === '') {
  send_json(['error' => 'Informe nome e WhatsApp.'], 400);
}

$messages = read_json(MESSAGES_FILE, []);
array_unshift($messages, $msg);
write_json(MESSAGES_FILE, $messages);

send_json(['ok' => true]);
