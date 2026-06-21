#!/bin/bash
# Web-CCTV HG680P v2 installer - Armbian / Debian
set -e
echo "=== Web-CCTV HG680P v2 Installer ==="
apt update
apt install -y nodejs npm ffmpeg build-essential python3

cd "$(dirname $0)"
npm install --omit=dev
node init-db.js

mkdir -p public/streams public/records
chmod -R 755 public

if [ ! -f .env ]; then
  cp .env.example .env
  echo ">> .env created, please edit JWT_SECRET"
fi

echo ""
echo "✅ Selesai!"
echo "Jalankan: node server.js"
echo "Login: admin / admin123"
echo "       publik / publik123"
echo "URL: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Auto-start systemd:"
echo "  sudo cp deploy/webcctv.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload && sudo systemctl enable --now webcctv"
