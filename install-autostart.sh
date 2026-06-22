#!/bin/bash
# Web-CCTV HG680P – Auto start installer
# Untuk Armbian / Debian / Ubuntu
# Jalankan sebagai root
set -e
if [ "$EUID" -ne 0 ]; then echo "Jalankan: sudo bash $0"; exit 1; fi

APP_SRC="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/opt/webcctv"
DATA_DIR="/var/lib/webcctv"

echo "=== Web-CCTV Autostart Installer ==="
echo "Source: $APP_SRC"
echo "App   : $APP_DIR"
echo "Data  : $DATA_DIR"
echo

# 1. dep
echo "[1/7] Install dependencies..."
apt-get update -y
apt-get install -y nodejs npm ffmpeg sqlite3 rsync

# 2. copy app
echo "[2/7] Copy aplikasi ke $APP_DIR ..."
mkdir -p "$APP_DIR" "$DATA_DIR" "$DATA_DIR/records" "$DATA_DIR/logs"
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude data \
  --exclude cctv.db \
  --exclude records \
  --exclude streams \
  --exclude public/records \
  --exclude public/streams \
  --exclude public/snapshots \
  --exclude logs \
  --exclude ".debbuild" \
  --exclude "*.deb" \
  "$APP_SRC"/ "$APP_DIR"/

cd "$APP_DIR"
# 3. npm
echo "[3/7] npm install (bisa 3-10 menit di HG680P)..."
if [ ! -d node_modules ]; then
  npm install --omit=dev --no-audit --no-fund
else
  echo "node_modules sudah ada, skip. Hapus manual kalau mau fresh."
fi

# 4. data dir & symlink
echo "[4/7] Setup data dir..."
mkdir -p "$DATA_DIR/records" "$DATA_DIR/logs" "$APP_DIR/public/streams" "$APP_DIR/public/snapshots"
chown -R root:root "$APP_DIR" "$DATA_DIR"
chmod -R 755 "$APP_DIR" "$DATA_DIR"
# symlink records ke data dir
rm -rf "$APP_DIR/public/records"
ln -sfn "$DATA_DIR/records" "$APP_DIR/public/records"

# 5. .env
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'EOF'
PORT=3000
JWT_SECRET=cctv_hg680p_secret_ganti_ini_please
DB_PATH=/var/lib/webcctv/cctv.db
RECORD_DIR=/var/lib/webcctv/records
VIDEO_SIZE=960x540
VIDEO_FPS=15
VIDEO_BITRATE=800k
REC_SIZE=1280x720
VIDEO_AUDIO=0
EOF
  echo ">> .env dibuat di $APP_DIR/.env  (silakan edit JWT_SECRET)"
fi

# 6. init db
echo "[5/7] Init database..."
DB_PATH="$DATA_DIR/cctv.db" NODE_PATH="$APP_DIR/node_modules" node "$APP_DIR/init-db.js" || true

# 7. systemd
echo "[6/7] Install systemd service..."
cp -f "$APP_DIR/deploy/webcctv.service" /etc/systemd/system/webcctv.service
systemctl daemon-reload
systemctl enable webcctv
systemctl restart webcctv
sleep 2
systemctl --no-pager status webcctv || true

# firewall info
if command -v ufw >/dev/null 2>&1; then
  ufw allow 3000/tcp || true
fi

IP=$(hostname -I | awk '{print $1}')
echo
echo "[7/7] Selesai ✅"
echo "----------------------------------------"
echo "Service : systemctl status webcctv"
echo "Logs    : journalctl -u webcctv -f"
echo "Restart : systemctl restart webcctv"
echo "Stop    : systemctl stop webcctv"
echo "URL     : http://$IP:3000"
echo "Login   : admin / admin123"
echo "         publik / publik123"
echo
echo "Auto-start AKTIF – setelah mati lampu / reboot, aplikasi otomatis jalan."
echo "DB      : $DATA_DIR/cctv.db"
echo "Records : $DATA_DIR/records"
echo "Logs    : $APP_DIR/logs  +  journalctl -u webcctv"
echo "----------------------------------------"
