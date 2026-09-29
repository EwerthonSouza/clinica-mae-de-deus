<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

$id = $_GET['id'] ?? '';
$messages = read_json(MESSAGES_FILE, []);
$next = array_values(array_filter($messages, fn($m) => ($m['id'] ?? '') !== $id));
write_json(MESSAGES_FILE, $next);
send_json(['ok' => true]);
