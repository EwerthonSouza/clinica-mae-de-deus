<?php
/**
 * Configuração do site — Clínica Mãe de Deus (versão PHP)
 *
 * IMPORTANTE: troque o usuário/senha abaixo antes de colocar o site no ar,
 * e troque a senha de verdade depois, pelo próprio site (botão 🔑 no modo admin).
 * ADMIN_PASSWORD só é usada na primeira vez que o site roda (para criar o usuário).
 */

// Usuário e senha do primeiro administrador (usados só no primeiro acesso)
define('ADMIN_USER', 'admin');
define('ADMIN_PASSWORD', 'troque-esta-senha');

// Tamanho máximo de upload, em MB (fotos e vídeos)
define('MAX_UPLOAD_MB', 100);

// Coloque true quando o site estiver atrás de HTTPS
define('COOKIE_SECURE', false);

// Pastas de dados (fora da pasta pública seria ideal; aqui ficam dentro de /storage e /data,
// protegidas por .htaccess para não serem acessadas diretamente pelo navegador)
define('STORAGE_DIR', __DIR__ . '/../storage');
// Pasta pública de uploads (precisa ficar fora de /storage para ser acessível pelo navegador
// sem depender de mod_rewrite — funciona em qualquer hospedagem PHP).
define('UPLOAD_DIR', __DIR__ . '/../uploads');
define('DATA_DIR', __DIR__ . '/../data');
define('CONTENT_FILE', STORAGE_DIR . '/content.json');
define('USERS_FILE', STORAGE_DIR . '/users.json');
define('MESSAGES_FILE', STORAGE_DIR . '/messages.json');
define('RATELIMIT_FILE', STORAGE_DIR . '/ratelimit.json');
define('DEFAULT_CONTENT_FILE', DATA_DIR . '/default-content.json');
