<?php
/**
 * Endpoint só para desenvolvimento: informa quando os arquivos do site
 * mudaram pela última vez, para o preview ao vivo (?dev=1) saber quando
 * recarregar a página sozinho. CSS é reportado separado, para poder ser
 * trocado sem piscar a tela (sem recarregar a página inteira).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$root = __DIR__ . '/..';
$mtime = function ($rel) use ($root) {
  $path = $root . $rel;
  return file_exists($path) ? filemtime($path) : 0;
};

$css = $mtime('/css/style.css');
$adminCss = $mtime('/admin/admin.css');

$appWatch = [
  '/index.html',
  '/js/app.js',
  '/admin/index.html',
  '/admin/admin.js',
];
$app = 0;
foreach ($appWatch as $rel) {
  $app = max($app, $mtime($rel));
}

echo json_encode(['css' => max($css, $adminCss), 'app' => $app]);
