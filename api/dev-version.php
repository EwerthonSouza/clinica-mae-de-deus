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
  '/js/app.js',
  '/admin/admin.js',
  '/storage/content.json',
];
$app = 0;
foreach ($appWatch as $rel) {
  $app = max($app, $mtime($rel));
}

$imgDir = $root . '/img';
if (is_dir($imgDir)) {
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($imgDir, FilesystemIterator::SKIP_DOTS));
  foreach ($it as $file) {
    $app = max($app, $file->getMTime());
  }
}

echo json_encode(['css' => max($css, $adminCss), 'app' => $app]);
