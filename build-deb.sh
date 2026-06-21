#!/bin/bash
set -e
PKG=webcctv
VER=2.0.0
ARCH=$(dpkg --print-architecture 2>/dev/null || echo "arm64")

rm -rf .debbuild
mkdir -p .debbuild/opt/webcctv
mkdir -p .debbuild/var/lib/webcctv/records
mkdir -p .debbuild/etc/systemd/system
mkdir -p .debbuild/DEBIAN

# copy app
rsync -a --exclude node_modules --exclude '.debbuild' --exclude 'data' --exclude 'records' --exclude 'streams' --exclude 'cctv.db' --exclude '.git' ./ .debbuild/opt/webcctv/

cat > .debbuild/DEBIAN/control <<EOF
Package: webcctv
Version: ${VER}
Section: net
Priority: optional
Architecture: ${ARCH}
Maintainer: WebCCTV <cctv@local>
Depends: nodejs (>= 16), ffmpeg
Description: Web-CCTV HG680P - H.265 to H.264 HLS Transcode + Recorder
 Modern CCTV web UI for Armbian STB HG680P.
 Includes RTSP to HLS, recording scheduler, OSM map, role login.
EOF

cat > .debbuild/DEBIAN/postinst <<'EOF'
#!/bin/bash
set -e
cd /opt/webcctv
# install node deps if missing
if [ ! -d "node_modules" ]; then
  npm install --omit=dev --silent || true
fi
# init db
node init-db.js || true
# systemd
systemctl daemon-reload || true
systemctl enable webcctv || true
echo "Start with: systemctl start webcctv"
echo "Open http://$(hostname -I | awk '{print $1}'):3000  login admin/admin123"
exit 0
EOF
chmod 755 .debbuild/DEBIAN/postinst

cat > .debbuild/DEBIAN/prerm <<'EOF'
#!/bin/bash
systemctl stop webcctv || true
exit 0
EOF
chmod 755 .debbuild/DEBIAN/prerm

# systemd service
mkdir -p .debbuild/etc/systemd/system
cat > .debbuild/etc/systemd/system/webcctv.service <<'EOF'
[Unit]
Description=Web CCTV HG680P
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/webcctv
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DB_PATH=/var/lib/webcctv/cctv.db
ExecStartPre=/usr/bin/node /opt/webcctv/init-db.js
ExecStart=/usr/bin/node /opt/webcctv/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# default env
cat > .debbuild/opt/webcctv/.env <<'EOF'
PORT=3000
JWT_SECRET=cctv_hg680p_secret_ganti_ini
DB_PATH=/var/lib/webcctv/cctv.db
VIDEO_SIZE=960x540
VIDEO_FPS=15
VIDEO_BITRATE=800k
REC_SIZE=1280x720
EOF

# symlink records folder
rm -rf .debbuild/opt/webcctv/public/records
ln -s /var/lib/webcctv/records .debbuild/opt/webcctv/public/records

dpkg-deb --build .debbuild ${PKG}_${VER}_${ARCH}.deb
echo "Built: ${PKG}_${VER}_${ARCH}.deb"
rm -rf .debbuild
