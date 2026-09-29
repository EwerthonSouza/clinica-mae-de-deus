<?php
/**
 * Funções auxiliares compartilhadas por todos os endpoints da API.
 */
require_once __DIR__ . '/config.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
header('Content-Type: application/json; charset=utf-8');

if (!is_dir(STORAGE_DIR)) mkdir(STORAGE_DIR, 0775, true);
if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0775, true);

session_set_cookie_params([
  'lifetime' => 8 * 60 * 60,
  'path' => '/',
  'httponly' => true,
  'samesite' => 'Strict',
  'secure' => COOKIE_SECURE,
]);
session_name('cmd_session');
session_start();

function read_json($file, $fallback = []) {
  if (!file_exists($file)) return $fallback;
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return $data === null ? $fallback : $data;
}

function write_json($file, $data) {
  $tmp = $file . '.' . getmypid() . '.tmp';
  file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
  rename($tmp, $file);
}

function new_id() {
  return bin2hex(random_bytes(6));
}

function json_body() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function send_json($data, $status = 200) {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function require_auth() {
  if (empty($_SESSION['user'])) {
    send_json(['error' => 'Não autenticado'], 401);
  }
}

function get_content() {
  return read_json(CONTENT_FILE, []);
}

// Cria o arquivo de conteúdo a partir do padrão, se ainda não existir
if (!file_exists(CONTENT_FILE)) {
  $default = read_json(DEFAULT_CONTENT_FILE, []);
  write_json(CONTENT_FILE, $default);
}
if (!file_exists(MESSAGES_FILE)) write_json(MESSAGES_FILE, []);

// Cria o primeiro administrador, se ainda não existir nenhum usuário
if (!file_exists(USERS_FILE)) {
  write_json(USERS_FILE, [[
    'username' => ADMIN_USER,
    'passwordHash' => password_hash(ADMIN_PASSWORD, PASSWORD_BCRYPT, ['cost' => 12]),
  ]]);
}

/**
 * Limite simples de tentativas por IP, usando um arquivo JSON.
 * $key identifica a ação (ex.: "login", "contact"); $max é o total de tentativas
 * permitidas dentro de $windowSeconds.
 */
function rate_limit($key, $max, $windowSeconds) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $hits = read_json(RATELIMIT_FILE, []);
  $now = time();
  $entryKey = $key . ':' . $ip;
  $entry = $hits[$entryKey] ?? ['count' => 0, 'reset' => $now + $windowSeconds];
  if ($now > $entry['reset']) {
    $entry = ['count' => 0, 'reset' => $now + $windowSeconds];
  }
  $entry['count'] += 1;
  $hits[$entryKey] = $entry;
  write_json(RATELIMIT_FILE, $hits);
  if ($entry['count'] > $max) {
    send_json(['error' => 'Muitas tentativas. Aguarde alguns minutos.'], 429);
  }
}
