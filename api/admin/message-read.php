<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

$id = $_GET['id'] ?? '';
$body = json_body();
$messages = read_json(MESSAGES_FILE, []);
$found = false;
foreach ($messages as &$m) {
  if (($m['id'] ?? '') === $id) {
    $m['read'] = (bool) ($body['read'] ?? false);
    $found = true;
    break;
  }
}
unset($m);

if (!$found) send_json(['error' => 'Mensagem não encontrada.'], 404);

write_json(MESSAGES_FILE, $messages);
send_json(['ok' => true]);
