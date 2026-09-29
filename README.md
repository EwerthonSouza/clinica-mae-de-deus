# Clínica Mãe de Deus — Site + Painel administrativo (PHP)

Site em **PHP + JavaScript**, sem Node.js, sem Docker e sem banco de dados —
funciona em qualquer hospedagem compartilhada comum (cPanel, Hostinger,
HostGator etc.) que tenha PHP 7.4+ (ideal 8.0+).

Não existe mais um "painel" separado: depois de entrar em `/admin`, você cai
no próprio site e edita clicando direto nos textos e fotos (botão **✏️ Editar
página** no canto da tela).

## Estrutura

```
index.html            → landing page (site público)
css/style.css         → visual do site
js/app.js             → páginas + motor de edição inline
img/                  → logo e imagens provisórias
admin/                → só a tela de login (/admin)
api/config.php        → usuário/senha inicial e limite de upload
api/*.php             → endpoints públicos (conteúdo, contato)
api/admin/*.php       → endpoints do modo administrador
data/default-content.json → conteúdo inicial (usado só no primeiríssimo acesso)
storage/               → dados reais do site (textos, usuários, mensagens) — protegida por .htaccess
uploads/                → fotos e vídeos enviados pelo painel — pasta pública
```

## 1. Configurar antes de subir

Abra [`api/config.php`](api/config.php) e defina:

- `ADMIN_USER` / `ADMIN_PASSWORD` — usuário e senha do primeiro acesso ao modo
  de edição (só valem até o primeiro login; depois disso a senha real fica
  salva com hash em `storage/users.json`, e pode ser trocada pelo botão 🔑 no
  próprio site).
- `COOKIE_SECURE` — `true` assim que o site tiver HTTPS ativo; `false` enquanto
  não tiver.

## 2. Subir para a hospedagem

Envie **todo o conteúdo** desta pasta para a pasta pública da hospedagem
(`public_html`, `www` ou `htdocs`, dependendo do painel), por FTP ou pelo
Gerenciador de Arquivos. `index.html` deve ficar direto dentro dela.

Garanta que `storage/` e `uploads/` tenham permissão de escrita (`755`, ou
`775` se o `755` não for suficiente) — configurável pelo Gerenciador de
Arquivos, clicando com o botão direito na pasta → "Permissões".

Acesse `https://seusite.com.br/admin`, entre com o usuário/senha do passo 1,
e a edição já acontece direto nas páginas do site.

## Testar no computador antes de subir

Com PHP instalado localmente:

```bash
php -S localhost:8000
```

E acesse `http://localhost:8000`. Sem PHP instalado, dá para testar com Docker
(só para desenvolvimento local, não precisa disso na hospedagem):

```bash
docker run --rm -p 8000:80 -v "$PWD":/var/www/html php:8.2-apache
```

## Limite de upload de fotos/vídeos

Controlado em dois lugares, que precisam bater:

1. `api/config.php` → `MAX_UPLOAD_MB` (hoje 100).
2. O PHP do servidor (`upload_max_filesize` e `post_max_size`) — o
   [`.htaccess`](.htaccess) já tenta configurar isso automaticamente
   (funciona em hospedagens com mod_php). Se a hospedagem usar PHP-FPM, o
   `.htaccess` não tem efeito; nesse caso, ajuste pelo painel em
   "Configurações do PHP" / "MultiPHP INI Editor", ou peça ao suporte.

## Backup

Basta copiar as pastas `storage/` e `uploads/` — é onde fica todo o conteúdo
real do site (textos, usuário/senha, mensagens recebidas, fotos e vídeos).
