<?php
/**
 * Endpoint só para desenvolvimento: informa quando os arquivos do site
 * mudaram pela última vez, para o preview ao vivo (?dev=1) saber quando
 * recarregar a página sozinho.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$root = __DIR__ . '/..';
$watch = [
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/admin/index.html',
  '/admin/admin.css',
  '/admin/admin.js',
];

$latest = 0;
foreach ($watch as $rel) {
  $path = $root . $rel;
  if (file_exists($path)) {
    $latest = max($latest, filemtime($path));
  }
}

echo json_encode(['v' => $latest]);
