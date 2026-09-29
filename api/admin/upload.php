<?php
require_once __DIR__ . '/../helpers.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') send_json(['error' => 'Método não permitido.'], 405);

$ALLOWED_TYPES = [
  'image/jpeg' => '.jpg',
  'image/png' => '.png',
  'image/webp' => '.webp',
  'image/gif' => '.gif',
  'video/mp4' => '.mp4',
  'video/webm' => '.webm',
  'video/quicktime' => '.mov',
];

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
  $err = $_FILES['file']['error'] ?? null;
  if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
    send_json(['error' => 'Arquivo maior que ' . MAX_UPLOAD_MB . ' MB.'], 400);
  }
  send_json(['error' => 'Nenhum arquivo enviado.'], 400);
}

$file = $_FILES['file'];

if ($file['size'] > MAX_UPLOAD_MB * 1024 * 1024) {
  send_json(['error' => 'Arquivo maior que ' . MAX_UPLOAD_MB . ' MB.'], 400);
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($ALLOWED_TYPES[$mime])) {
  send_json(['error' => 'Formato não suportado. Use JPG, PNG, WEBP, GIF, MP4, WEBM ou MOV.'], 400);
}

$ext = $ALLOWED_TYPES[$mime];
$filename = time() . '-' . new_id() . $ext;
$dest = UPLOAD_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
  send_json(['error' => 'Falha ao salvar o arquivo.'], 500);
}

$item = [
  'id' => new_id(),
  'url' => '/uploads/' . $filename,
  'type' => strpos($mime, 'video/') === 0 ? 'video' : 'image',
  'name' => mb_substr($file['name'], 0, 200),
  'caption' => mb_substr($_POST['caption'] ?? '', 0, 300),
  'size' => $file['size'],
  'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
];

$content = get_content();
$media = $content['media'] ?? [];
array_unshift($media, $item);
$content['media'] = $media;
write_json(CONTENT_FILE, $content);

send_json($item);
