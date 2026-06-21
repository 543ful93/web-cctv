const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'cctv_hg680p_secret_2025';
const HLS_DIR = path.join(__dirname, 'public', 'streams');

// Pastikan folder streams ada
if (!fs.existsSync(HLS_DIR)) {
  fs.mkdirSync(HLS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'webcctv',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Cek DB
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ MySQL connected');
    conn.release();
  } catch (e) {
    console.error('MySQL error:', e.message);
    console.log('⚠️  Jalankan database.sql dulu');
  }
})();

// Auth middleware
const auth = (role = null) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (role && decoded.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========= AUTH =========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username=?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'User tidak ditemukan' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Password salah' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, username: user.username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========= CAMERAS =========
app.get('/api/cameras', async (req, res) => {
  try {
    const publicOnly = !req.headers.authorization;
    let sql = `SELECT id, name, location, rtsp_url, nvr_dvr, channel, is_public, lat, lng, youtube_embed, is_active, codec FROM cameras`;
    if (publicOnly) sql += ` WHERE is_public=1 AND is_active=1`;
    sql += ` ORDER BY id DESC`;
    const [rows] = await db.query(sql);
    // sembunyikan rtsp_url untuk publik
    const data = rows.map(c => publicOnly ? {...c, rtsp_url: undefined} : c);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cameras', auth('admin'), async (req, res) => {
  const { name, location, rtsp_url, nvr_dvr, channel, is_public, lat, lng, youtube_embed } = req.body;
  try {
    await db.query(
      `INSERT INTO cameras (name, location, rtsp_url, nvr_dvr, channel, is_public, lat, lng, youtube_embed) VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, location, rtsp_url, nvr_dvr || 'ipcam', channel || 1, is_public?1:0, lat||null, lng||null, youtube_embed||null]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/cameras/:id', auth('admin'), async (req, res) => {
  const { name, location, rtsp_url, nvr_dvr, channel, is_public, lat, lng, youtube_embed, is_active } = req.body;
  try {
    await db.query(
      `UPDATE cameras SET name=?, location=?, rtsp_url=?, nvr_dvr=?, channel=?, is_public=?, lat=?, lng=?, youtube_embed=?, is_active=? WHERE id=?`,
      [name, location, rtsp_url, nvr_dvr, channel, is_public?1:0, lat, lng, youtube_embed, is_active?1:0, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cameras/:id', auth('admin'), async (req, res) => {
  try {
    stopStream(req.params.id);
    await db.query('DELETE FROM cameras WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ========= FFMPEG H.265 -> H.264 HLS =========
const activeStreams = new Map();

function getFFmpegArgs(input, outputPath) {
  // Optimized untuk HG680P Armbian - ringan CPU
  return [
    '-rtsp_transport', 'tcp',
    '-i', input,
    '-fflags', 'nobuffer',
    '-flags', 'low_delay',
    '-strict', 'experimental',
    // video: H.265 -> H.264 transcode, veryfast, low resolution biar ringan STB
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-pix_fmt', 'yuv420p',
    '-b:v', '800k',
    '-maxrate', '800k',
    '-bufsize', '1600k',
    '-s', '960x540', // 540p hemat CPU HG680P
    '-r', '15',
    '-g', '30',
    '-c:a', 'aac',
    '-b:a', '64k',
    '-ac', '1',
    '-ar', '44100',
    // HLS
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments+append_list+omit_endlist',
    '-hls_segment_filename', path.join(outputPath, 'seg_%03d.ts'),
    path.join(outputPath, 'index.m3u8')
  ];
}

function startStream(cameraId, rtspUrl) {
  if (activeStreams.has(cameraId)) return true;
  const outDir = path.join(HLS_DIR, String(cameraId));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // bersihkan segmen lama
  fs.readdirSync(outDir).forEach(f => { try { fs.unlinkSync(path.join(outDir,f)); } catch{} });

  const args = getFFmpegArgs(rtspUrl, outDir);
  console.log(`▶️ Starting stream ${cameraId}: ${rtspUrl}`);
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  
  ff.stderr.on('data', d => {
    const s = d.toString();
    if (s.includes('error') || s.includes('Error')) console.log(`[${cameraId}]`, s.substring(0,200));
  });
  ff.on('close', code => {
    console.log(`⏹ Stream ${cameraId} exit ${code}`);
    activeStreams.delete(cameraId);
  });
  activeStreams.set(cameraId, ff);
  return true;
}

function stopStream(cameraId) {
  const proc = activeStreams.get(String(cameraId)) || activeStreams.get(Number(cameraId));
  if (proc) {
    proc.kill('SIGTERM');
    activeStreams.delete(String(cameraId));
    activeStreams.delete(Number(cameraId));
    return true;
  }
  return false;
}

app.post('/api/stream/:id/start', auth(), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cameras WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Camera not found' });
    const cam = rows[0];
    startStream(cam.id, cam.rtsp_url);
    // tunggu 2 detik biar .m3u8 muncul
    setTimeout(() => res.json({ success: true, hls: `/streams/${cam.id}/index.m3u8` }), 1800);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/stream/:id/stop', auth('admin'), (req, res) => {
  const ok = stopStream(req.params.id);
  res.json({ success: ok });
});

app.get('/api/stream/:id/status', async (req, res) => {
  const running = activeStreams.has(req.params.id) || activeStreams.has(Number(req.params.id));
  const m3u8Path = path.join(HLS_DIR, req.params.id, 'index.m3u8');
  res.json({ running, ready: fs.existsSync(m3u8Path) });
});

// Auto-stop idle streams (hemat STB)
setInterval(() => {
  // biarkan jalan, user bisa manual stop via admin
}, 60000);

// Serve HLS with CORS correct
app.use('/streams', express.static(HLS_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=10');
    }
  }
}));

// Fallback SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({error:'not found'});
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Web-CCTV running http://0.0.0.0:${PORT}`);
  console.log(`📺 HLS dir: ${HLS_DIR}`);
  console.log(`🖥️  HG680P Optimized: 540p / 15fps / ultrafast`);
});
