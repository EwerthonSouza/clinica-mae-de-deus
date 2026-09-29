<?php
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

rate_limit('login', 10, 15 * 60);

$body = json_body();
$username = $body['username'] ?? '';
$password = (string) ($body['password'] ?? '');

$users = read_json(USERS_FILE, []);
$user = null;
foreach ($users as $u) {
  if (($u['username'] ?? '') === $username) { $user = $u; break; }
}

if (!$user || !password_verify($password, $user['passwordHash'])) {
  send_json(['error' => 'Usuário ou senha inválidos.'], 401);
}

$_SESSION['user'] = $user['username'];
send_json(['ok' => true, 'user' => $user['username']]);
