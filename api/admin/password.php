<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

$body = json_body();
$current = (string) ($body['current'] ?? '');
$next = (string) ($body['next'] ?? '');

$users = read_json(USERS_FILE, []);
$idx = null;
foreach ($users as $i => $u) {
  if (($u['username'] ?? '') === $_SESSION['user']) { $idx = $i; break; }
}

if ($idx === null || !password_verify($current, $users[$idx]['passwordHash'])) {
  send_json(['error' => 'Senha atual incorreta.'], 400);
}
if (mb_strlen($next) < 8) {
  send_json(['error' => 'A nova senha precisa ter ao menos 8 caracteres.'], 400);
}

$users[$idx]['passwordHash'] = password_hash($next, PASSWORD_BCRYPT, ['cost' => 12]);
write_json(USERS_FILE, $users);
send_json(['ok' => true]);
