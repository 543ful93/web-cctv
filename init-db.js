const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'cctv.db');
const db = new Database(DB_PATH);

// users
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','public')) NOT NULL DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  rtsp_url TEXT NOT NULL,
  nvr_dvr TEXT DEFAULT 'ipcam',
  channel INTEGER DEFAULT 1,
  codec TEXT DEFAULT 'auto',
  is_public INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  lat REAL,
  lng REAL,
  youtube_embed TEXT,
  record_enabled INTEGER DEFAULT 0,
  record_schedule TEXT DEFAULT '0 0 * * *',
  record_duration INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_id INTEGER,
  start_time DATETIME,
  end_time DATETIME,
  file_path TEXT,
  size_mb REAL,
  duration_sec INTEGER,
  status TEXT DEFAULT 'completed',
  FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_records_cam ON records(camera_id, start_time DESC);
`);

const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  const ins = db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)');
  ins.run('admin', bcrypt.hashSync('admin123',10), 'admin');
  ins.run('publik', bcrypt.hashSync('publik123',10), 'public');
  console.log('✅ users created: admin/admin123  publik/publik123');
}

// seed cameras if empty
const camCount = db.prepare('SELECT COUNT(*) as c FROM cameras').get().c;
if (camCount === 0) {
  const ic = db.prepare(`INSERT INTO cameras (name,location,rtsp_url,nvr_dvr,channel,is_public,lat,lng) VALUES (?,?,?,?,?,?,?,?)`);
  ic.run('Gerbang Utama','Pos 1','rtsp://admin:12345@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0','nvr',1,1,-6.2088,106.8456);
  ic.run('Parkir','Basement','rtsp://admin:12345@192.168.1.101:554/Streaming/Channels/101','dvr',1,1,-6.2092,106.846);
  ic.run('Lobby H.265','Lobby','rtsp://admin:12345@192.168.1.64:554/h265/ch1/main/av_stream','ipcam',1,1,-6.2085,106.845);
  console.log('✅ 3 sample cameras inserted');
}

console.log('DB ready:', DB_PATH);
db.close();
