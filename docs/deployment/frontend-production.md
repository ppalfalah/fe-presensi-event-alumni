# Frontend Production Deployment

Project ini adalah Next.js App Router dan dideploy ke VPS sebagai standalone Node server di belakang Nginx. Cloudflare tetap dipakai sebagai DNS/CDN.

## Hasil Inspeksi

- Framework: Next.js `16.1.6` dengan React `19.2.3`.
- Package manager: npm, karena ada `package-lock.json`.
- Build command: `npm run build`.
- Start command di server: `node server.js` dari output standalone.
- Output build: `.next/standalone`, `.next/static`, dan `public`.
- Environment frontend yang dibutuhkan: `NEXT_PUBLIC_API_URL=https://api.ppalfalah.id/api`.
- Environment backend/rewrite yang disarankan: `BACKEND_URL=https://api.ppalfalah.id`.

## GitHub Secrets

Buat di GitHub repo: `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`.

| Secret | Contoh nilai | Keterangan |
| --- | --- | --- |
| `VPS_HOST` | `IP_VPS_ANDA` | IP VPS. |
| `VPS_PORT` | `22` | Port SSH. |
| `VPS_USER` | `deploy` | User deploy khusus, bukan root. |
| `VPS_SSH_KEY` | isi private key | Private key SSH untuk user deploy. |
| `DEPLOY_PATH` | `/var/www/fe-presensi-event-alumni` | Folder aplikasi frontend. |
| `SERVICE_NAME` | `fe-presensi-event-alumni` | Nama service systemd. |
| `NEXT_PUBLIC_API_URL` | `https://api.ppalfalah.id/api` | Base URL API yang dipakai browser. |
| `BACKEND_URL` | `https://api.ppalfalah.id` | Host backend untuk rewrite/fallback server. |

Jangan masukkan password VPS atau file `.env.production` ke repository.

## Setup VPS Pertama Kali

Login ke VPS secara manual, lalu buat user deploy:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Buat folder deploy:

```bash
mkdir -p /var/www/fe-presensi-event-alumni/releases
chown -R deploy:deploy /var/www/fe-presensi-event-alumni
```

Install Node.js 22, Nginx, dan siapkan systemd:

```bash
apt update
apt install -y nginx curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

Buat service:

```ini
# /etc/systemd/system/fe-presensi-event-alumni.service
[Unit]
Description=PP Al Falah Alumni Frontend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/fe-presensi-event-alumni/current
EnvironmentFile=/var/www/fe-presensi-event-alumni/current/.env.production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Aktifkan:

```bash
systemctl daemon-reload
systemctl enable fe-presensi-event-alumni
```

Izinkan deploy restart service tanpa password:

```bash
visudo
```

Tambahkan:

```text
deploy ALL=NOPASSWD: /bin/systemctl restart fe-presensi-event-alumni, /bin/systemctl is-active fe-presensi-event-alumni
```

## Nginx

Gunakan root domain untuk frontend, misalnya `ppalfalah.id` dan `www.ppalfalah.id`.

```nginx
server {
    listen 80;
    server_name ppalfalah.id www.ppalfalah.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Aktifkan:

```bash
ln -s /etc/nginx/sites-available/fe-presensi-event-alumni /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Cloudflare DNS/CDN

Di Cloudflare DNS:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `@` | `IP_VPS_ANDA` | Proxied |
| CNAME | `www` | `ppalfalah.id` | Proxied |
| A | `api` | `IP_VPS_ANDA` | Proxied atau DNS only |

SSL/TLS: gunakan `Full (strict)` jika origin sudah punya sertifikat valid. Jika belum, buat Cloudflare Origin Certificate atau pasang Let's Encrypt di VPS.

## CORS Laravel

Karena frontend dan backend beda origin, backend perlu mengizinkan origin frontend.

Di `.env` backend:

```env
APP_URL=https://api.ppalfalah.id
FRONTEND_URL=https://ppalfalah.id
```

Di `config/cors.php`, gunakan origin spesifik:

```php
'paths' => ['api/*', 'storage/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['https://ppalfalah.id', 'https://www.ppalfalah.id'],
'allowed_headers' => ['*'],
'supports_credentials' => false,
```

Setelah ubah env/config:

```bash
php artisan config:clear
php artisan cache:clear
```

## Cara Deploy Otomatis

Push ke branch `main`:

```bash
git push origin main
```

GitHub Actions akan menjalankan lint, build, upload release, mengubah symlink `current`, lalu restart service.

## Cara Cek Log

GitHub Actions:

```text
GitHub repo -> Actions -> Deploy Frontend -> pilih run terbaru
```

VPS:

```bash
journalctl -u fe-presensi-event-alumni -f
systemctl status fe-presensi-event-alumni
nginx -t
tail -f /var/log/nginx/error.log
```

## Rollback

Lihat release yang tersedia:

```bash
ls -lt /var/www/fe-presensi-event-alumni/releases
```

Rollback ke release tertentu:

```bash
ln -sfn /var/www/fe-presensi-event-alumni/releases/RELEASE_ID /var/www/fe-presensi-event-alumni/current
systemctl restart fe-presensi-event-alumni
systemctl status fe-presensi-event-alumni
```

Workflow menyimpan 5 release terakhir.

## Jika Deploy Gagal

- Gagal lint/build: buka log GitHub Actions, perbaiki error TypeScript/ESLint, lalu push lagi.
- Gagal SSH: cek `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, dan `authorized_keys`.
- Service gagal restart: cek `journalctl -u fe-presensi-event-alumni -n 100`.
- Web 502: cek apakah service aktif dan Nginx proxy ke `127.0.0.1:3000`.
- CORS error: cek `allowed_origins` Laravel dan pastikan `NEXT_PUBLIC_API_URL` adalah `https://api.ppalfalah.id/api`.

## Update Environment Variable

Ubah GitHub Secrets, lalu jalankan ulang workflow dari tab Actions atau push commit baru. Untuk perubahan `NEXT_PUBLIC_*`, aplikasi harus build ulang karena nilainya masuk ke bundle browser.

## Checklist Setelah Deploy

- Buka `https://ppalfalah.id`.
- Login admin dan alumni.
- Cek request browser menuju `https://api.ppalfalah.id/api`.
- Cek gambar/storage tampil dari `https://api.ppalfalah.id/storage`.
- Test halaman detail event dan refresh browser di halaman tersebut.
- Pastikan `journalctl` tidak menunjukkan error berulang.
