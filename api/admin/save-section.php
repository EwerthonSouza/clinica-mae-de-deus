<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

$EDITABLE_SECTIONS = ['settings', 'home', 'about', 'specialties', 'specialists', 'insurance', 'blog', 'contact', 'privacy'];

$section = $_GET['section'] ?? '';
if (!in_array($section, $EDITABLE_SECTIONS, true)) {
  send_json(['error' => 'Seção inválida.'], 400);
}

$body = json_body();
$content = get_content();
$content[$section] = $body;
write_json(CONTENT_FILE, $content);

send_json(['ok' => true]);
