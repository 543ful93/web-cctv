const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cctv_hg680p_secret_2025';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'cctv.db');
const HLS_DIR = path.join(__dirname, 'public', 'streams');
const RECORD_DIR = process.env.RECORD_DIR || path.join(__dirname, 'public', 'records');
const SNAP_DIR = path.join(__dirname, 'public', 'snapshots');
const LOG_DIR = path.join(__dirname, 'logs');

[HLS_DIR, RECORD_DIR, SNAP_DIR, LOG_DIR].forEach(d => { if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); });

app.use(cors({origin:true, credentials:true}));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// --- tables ---
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
  record_schedule TEXT DEFAULT '0 * * * *',
  record_duration INTEGER DEFAULT 300,
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
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// seed users
try{
  const ucount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if(ucount===0){
    db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)')
      .run('admin', bcrypt.hashSync('admin123',10), 'admin');
    db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)')
      .run('publik', bcrypt.hashSync('publik123',10), 'public');
    console.log('➕ seeded default users: admin/admin123 , publik/publik123');
  }
}catch(e){ console.log('seed users:', e.message); }

// seed settings
const defaultSettings = {
  app_name: 'Web-CCTV',
  app_sub: 'HG680P',
  running_text: 'Selamat datang di Web-CCTV Live Streaming • H.265 → H.264 Transcode • Optimized STB Armbian HG680P • serangkota.go.id • CCTV Online 24 Jam',
  site_footer: 'Web-CCTV HG680P v2.7'
};
const getSetting = db.prepare('SELECT value FROM settings WHERE key=?');
const setSetting = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
for(const [k,v] of Object.entries(defaultSettings)){
  if(!getSetting.get(k)) setSetting.run(k,v);
}

console.log('✓ SQLite:', DB_PATH);

// auth
const auth = (role=null) => (req,res,next)=>{
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error:'Unauthorized'});
  try{
    const d = jwt.verify(token, JWT_SECRET);
    req.user = d;
    if(role && d.role!==role) return res.status(403).json({error:'Forbidden'});
    next();
  }catch{ res.status(401).json({error:'Invalid token'}) }
};
const authOptional = (req,res,next)=>{
  const token = req.headers.authorization?.split(' ')[1];
  if(token){ try{ req.user = jwt.verify(token, JWT_SECRET); }catch{} }
  next();
};

// ===== SETTINGS =====
app.get('/api/settings', (req,res)=>{
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const o = {}; rows.forEach(r=> o[r.key]=r.value);
  res.json(o);
});
app.put('/api/settings', auth('admin'), (req,res)=>{
  const data = req.body || {};
  const allowed = ['app_name','app_sub','running_text','site_footer'];
  const stmt = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const tx = db.transaction((obj)=>{
    for(const k of allowed){
      if(obj[k] !== undefined) stmt.run(k, String(obj[k]).slice(0,500));
    }
  });
  tx(data);
  res.json({success:true});
});

// ===== AUTH =====
app.post('/api/login', (req,res)=>{
  const {username,password} = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!user) return res.status(401).json({error:'User tidak ditemukan'});
  if(!bcrypt.compareSync(password, user.password)) return res.status(401).json({error:'Password salah'});
  const token = jwt.sign({id:user.id, username:user.username, role:user.role}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, role:user.role, username:user.username});
});

// ===== PROFILE & SETTINGS FOR USERS =====
app.get('/api/profile', auth(), (req, res) => {
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id=?').get(req.user.id);
  if(!user) return res.status(404).json({error: 'User tidak ditemukan'});
  res.json(user);
});

app.post('/api/profile/update', auth(), (req, res) => {
  const { username, old_password, new_password } = req.body;
  if(!username || username.trim() === '') return res.status(400).json({error: 'Username wajib diisi'});

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if(!user) return res.status(404).json({error: 'User tidak ditemukan'});

  // Check username uniqueness if changed
  if(username !== user.username) {
    const exists = db.prepare('SELECT COUNT(*) as c FROM users WHERE username=?').get(username).c;
    if(exists > 0) return res.status(400).json({error: 'Username sudah digunakan oleh akun lain'});
  }

  let hash = user.password;
  if(new_password && new_password.trim() !== '') {
    if(!old_password) return res.status(400).json({error: 'Kata sandi lama wajib diisi untuk mengubah kata sandi'});
    if(!bcrypt.compareSync(old_password, user.password)) return res.status(400).json({error: 'Kata sandi lama salah'});
    if(new_password.length < 4) return res.status(400).json({error: 'Kata sandi baru minimal 4 karakter'});
    hash = bcrypt.hashSync(new_password, 10);
  }

  try {
    db.prepare('UPDATE users SET username=?, password=? WHERE id=?').run(username, hash, req.user.id);
    const token = jwt.sign({id: user.id, username: username, role: user.role}, JWT_SECRET, {expiresIn: '7d'});
    res.json({success: true, token, username});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
});

// change own password (compatibility fallback)
app.post('/api/profile/password', auth(), (req,res)=>{
  const {old_password, new_password} = req.body;
  if(!new_password || new_password.length < 4) return res.status(400).json({error:'Password baru minimal 4 karakter'});
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if(!user) return res.status(404).json({error:'User tidak ditemukan'});
  if(!bcrypt.compareSync(old_password||'', user.password)) return res.status(400).json({error:'Password lama salah'});
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  res.json({success:true});
});

app.get('/api/profile', auth(), (req,res)=>{
  const u = db.prepare('SELECT id, username, role, created_at FROM users WHERE id=?').get(req.user.id);
  res.json(u);
});

// ===== USERS CRUD =====
app.get('/api/users', auth('admin'), (req,res)=>{
  const rows = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id DESC').all();
  res.json(rows);
});
app.post('/api/users', auth('admin'), (req,res)=>{
  const {username,password,role} = req.body;
  if(!username || !password) return res.status(400).json({error:'username & password wajib'});
  if(password.length < 4) return res.status(400).json({error:'Password minimal 4 karakter'});
  try{
    const hash = bcrypt.hashSync(password,10);
    const r = db.prepare('INSERT INTO users (username,password,role) VALUES (?,?,?)').run(username, hash, role||'public');
    res.json({success:true, id:r.lastInsertRowid});
  }catch(e){ res.status(400).json({error: e.message.includes('UNIQUE') ? 'Username sudah ada' : e.message }); }
});
app.put('/api/users/:id', auth('admin'), (req,res)=>{
  const {username, password, role} = req.body;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if(!u) return res.status(404).json({error:'not found'});
  let sql = 'UPDATE users SET username=?, role=?';
  let params = [username || u.username, role || u.role];
  if(password && password.trim()){
    if(password.length < 4) return res.status(400).json({error:'Password minimal 4 karakter'});
    sql += ', password=?';
    params.push(bcrypt.hashSync(password,10));
  }
  sql += ' WHERE id=?';
  params.push(req.params.id);
  try{
    db.prepare(sql).run(...params);
    res.json({success:true});
  }catch(e){
    res.status(400).json({error: e.message.includes('UNIQUE') ? 'Username sudah ada' : e.message});
  }
});
app.delete('/api/users/:id', auth('admin'), (req,res)=>{
  const countAdmin = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get().c;
  const target = db.prepare('SELECT role FROM users WHERE id=?').get(req.params.id);
  if(target && target.role==='admin' && countAdmin <= 1){
    return res.status(400).json({error:'Tidak bisa hapus admin terakhir'});
  }
  if(String(req.params.id) === String(req.user.id)){
    return res.status(400).json({error:'Tidak bisa hapus akun sendiri'});
  }
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({success:true});
});

// ===== URL helpers =====
function cleanStreamUrl(u){
  if(!u) return u;
  u = u.trim();
  u = u.replace(/\?(token=undefined&subscriberId=undefined&subscriberCode=undefined)+/gi, '');
  u = u.replace(/([?&])(token|subscriberId|subscriberCode)=undefined/gi, '');
  u = u.replace(/\?&/, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
  u = u.replace(/(\.m3u8)\?.*?(\?token=undefined.*)$/i, '$1');
  if(/^https?:\/\//i.test(u)){
    try{
      const url = new URL(u);
      ['token','subscriberId','subscriberCode'].forEach(k=>{
        if(url.searchParams.get(k) === 'undefined'){ url.searchParams.delete(k); }
      });
      u = url.toString();
    }catch{}
  }
  return u;
}
function isHttpStream(url){ return url && /^https?:\/\//i.test(url); }
function isHlsUrl(url){ return isHttpStream(url) && /\.m3u8/i.test(url); }
function extractYoutubeId(input){
  if(!input) return '';
  input = String(input).trim();
  if(/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try{
    const url = new URL(input.includes('://') ? input : 'https://youtube.com/watch?v='+input);
    if(url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('?')[0];
    if(url.searchParams.get('v')) return url.searchParams.get('v');
    const m = url.pathname.match(/\/(embed|live|shorts)\/([a-zA-Z0-9_-]{11})/);
    if(m) return m[2];
  }catch{}
  const m = input.match(/[a-zA-Z0-9_-]{11}/);
  return m ? m[0] : input;
}

// ===== CAMERAS =====
app.get('/api/cameras', authOptional, (req,res)=>{
  const isAdmin = req.user && req.user.role === 'admin';
  let rows;
  if(isAdmin){
    // Administrator mendapat hak akses penuh untuk melihat seluruh kamera (termasuk yang privat)
    rows = db.prepare('SELECT * FROM cameras ORDER BY id DESC').all();
  } else {
    // Publik / User Baru hanya diizinkan melihat kamera aktif yang ditandai Publik (is_public = 1)
    rows = db.prepare('SELECT id,name,location,nvr_dvr,channel,is_public,lat,lng,youtube_embed,is_active,codec,rtsp_url FROM cameras WHERE is_public=1 AND is_active=1 ORDER BY id DESC').all();
    rows = rows.map(c=>{
      // Sensor kredensial RTSP mentah untuk publik demi keamanan data
      if(!/^https?:\/\//i.test(c.rtsp_url) && !c.youtube_embed){
        return {...c, rtsp_url: ''};
      }
      return c;
    });
  }
  res.json(rows);
});

app.post('/api/cameras', auth('admin'), (req,res)=>{
  const c = req.body;
  let rtsp = cleanStreamUrl((c.rtsp_url||'').trim());
  const ytId = extractYoutubeId(c.youtube_embed||'');
  const stmt = db.prepare(`INSERT INTO cameras (name,location,rtsp_url,nvr_dvr,channel,is_public,lat,lng,youtube_embed,record_enabled,record_schedule,record_duration,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const r = stmt.run(
    c.name, c.location||'', rtsp, c.nvr_dvr||'ipcam', c.channel||1, c.is_public?1:0,
    c.lat||null, c.lng||null, ytId||null,
    c.record_enabled?1:0, c.record_schedule||'0 * * * *', c.record_duration||300,
    c.is_active!==false?1:0
  );
  res.json({success:true, id:r.lastInsertRowid});
});

app.put('/api/cameras/:id', auth('admin'), (req,res)=>{
  const c = req.body;
  let rtsp = cleanStreamUrl(c.rtsp_url||'');
  const ytId = extractYoutubeId(c.youtube_embed||'');
  db.prepare(`UPDATE cameras SET name=?,location=?,rtsp_url=?,nvr_dvr=?,channel=?,is_public=?,lat=?,lng=?,youtube_embed=?,record_enabled=?,record_schedule=?,record_duration=?,is_active=? WHERE id=?`).run(
    c.name, c.location, rtsp, c.nvr_dvr, c.channel, c.is_public?1:0,
    c.lat, c.lng, ytId, c.record_enabled?1:0, c.record_schedule, c.record_duration, c.is_active?1:0,
    req.params.id
  );
  res.json({success:true});
});

app.delete('/api/cameras/:id', auth('admin'), (req,res)=>{
  stopStream(req.params.id);
  db.prepare('DELETE FROM cameras WHERE id=?').run(req.params.id);
  try{ fs.unlinkSync(path.join(SNAP_DIR, req.params.id + '.jpg')); }catch{}
  res.json({success:true});
});

// ===== STREAM HLS =====
const activeStreams = new Map();
let HAVE_AAC = true;
try {
  const { execSync } = require('child_process');
  const enc = execSync('ffmpeg -encoders 2>/dev/null | grep aac', {encoding:'utf8'});
  HAVE_AAC = enc.includes('aac');
} catch { HAVE_AAC = false; }
console.log('FFmpeg AAC encoder:', HAVE_AAC ? 'yes':'no');

function ffmpegLiveArgs(input, outDir){
  const enableAudio = (process.env.VIDEO_AUDIO === '1') && HAVE_AAC;
  const args = [
    '-rtsp_transport','tcp',
    '-i', input,
    '-fflags','nobuffer',
    '-flags','low_delay',
    '-c:v','libx264','-preset','ultrafast','-tune','zerolatency',
    '-profile:v','baseline','-level','3.0',
    '-pix_fmt','yuv420p',
    '-s', process.env.VIDEO_SIZE || '960x540',
    '-r', process.env.VIDEO_FPS || '15',
    '-b:v', process.env.VIDEO_BITRATE || '800k',
    '-maxrate','800k','-bufsize','1600k',
    '-g','30',
  ];
  if(enableAudio){ args.push('-c:a','aac','-b:a','64k','-ac','1','-ar','44100'); } else { args.push('-an'); }
  args.push(
    '-f','hls','-hls_time','2','-hls_list_size','6',
    '-hls_flags','delete_segments+append_list',
    '-hls_segment_filename', path.join(outDir,'seg_%03d.ts'),
    path.join(outDir,'index.m3u8')
  );
  return args;
}

function startStream(cameraId, rtspUrl){
  const id = String(cameraId);
  if(activeStreams.has(id)) return {running:true};
  const outDir = path.join(HLS_DIR, id);
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
  try{ fs.readdirSync(outDir).forEach(f=>fs.unlinkSync(path.join(outDir,f))); }catch{}
  const logFile = path.join(LOG_DIR, `ff_${id}.log`);
  const logStream = fs.createWriteStream(logFile, {flags:'w'});
  const args = ffmpegLiveArgs(rtspUrl, outDir);
  logStream.write(`ffmpeg ${args.join(' ')}\n\n`);
  console.log(`▶ stream ${id}: ${rtspUrl}`);
  const ff = spawn('ffmpeg', args);
  let lastErr = '';
  ff.stderr.on('data', d=>{ const s = d.toString(); logStream.write(s); lastErr = s.slice(-300); });
  ff.on('close', code=>{ logStream.end(`\nexit ${code}\n`); activeStreams.delete(id); console.log(`⏹ stream ${id} exit ${code}`); });
  activeStreams.set(id, {proc:ff, start:Date.now(), logFile, lastErr: ()=>lastErr});
  return {running:true};
}
function stopStream(cameraId){
  const id = String(cameraId);
  const s = activeStreams.get(id);
  if(s){ s.proc.kill('SIGTERM'); activeStreams.delete(id); return true; }
  return false;
}

app.post('/api/stream/:id/start', authOptional, async (req,res)=>{
  const cam = db.prepare('SELECT * FROM cameras WHERE id=?').get(req.params.id);
  if(!cam) return res.status(404).json({error:'Camera not found'});

  // Pengamanan Tambahan: Hanya Administrator yang boleh memutar streaming kamera privat
  const isAdmin = req.user && req.user.role === 'admin';
  if(cam.is_public !== 1 && !isAdmin){
    return res.status(403).json({error: 'Akses Ditolak. Kamera ini bersifat privat.'});
  }

  const ytId = extractYoutubeId(cam.youtube_embed||'');
  if((cam.nvr_dvr === 'youtube' || ytId) && ytId){
    return res.json({success:true, youtube: ytId});
  }
  const streamUrl = cleanStreamUrl(cam.rtsp_url);
  if(isHlsUrl(streamUrl) || (isHttpStream(streamUrl) && ['hls','youtube'].includes(cam.nvr_dvr))){
    return res.json({success:true, hls: streamUrl, direct:true});
  }
  if(isHttpStream(streamUrl) && /\.(mp4|m3u8)/i.test(streamUrl)){
    return res.json({success:true, hls: streamUrl, direct:true});
  }
  startStream(cam.id, streamUrl);
  const outM3u8 = path.join(HLS_DIR, String(cam.id), 'index.m3u8');
  for(let i=0;i<16;i++){
    await new Promise(r=>setTimeout(r,500));
    if(fs.existsSync(outM3u8)) return res.json({success:true, hls:`/streams/${cam.id}/index.m3u8`});
    const s = activeStreams.get(String(cam.id));
    if(!s) break;
  }
  const s = activeStreams.get(String(cam.id));
  const logTail = s?.lastErr ? s.lastErr() : 'no proc';
  stopStream(cam.id);
  res.status(500).json({error:'FFmpeg gagal start stream.', log: logTail.slice(-400)});
});
app.post('/api/stream/:id/stop', auth('admin'), (req,res)=>{ res.json({success: stopStream(req.params.id)}); });
app.get('/api/stream/:id/status', (req,res)=>{
  const id=String(req.params.id);
  const s = activeStreams.get(id);
  const ready = fs.existsSync(path.join(HLS_DIR,id,'index.m3u8'));
  res.json({running:!!s, ready, uptime: s? Math.floor((Date.now()-s.start)/1000):0});
});
app.get('/api/stream/:id/log', auth('admin'), (req,res)=>{
  const logFile = path.join(LOG_DIR, `ff_${req.params.id}.log`);
  if(!fs.existsSync(logFile)) return res.status(404).send('no log');
  res.type('text/plain').send(fs.readFileSync(logFile,'utf8').slice(-8000));
});

// HLS CORS proxy
app.get('/api/hls-proxy', authOptional, (req,res)=>{
  const target = req.query.url;
  if(!target || !/^https?:\/\//i.test(target)) return res.status(400).send('bad url');
  if(!/\.(m3u8|ts)(\?|$)/i.test(target)) return res.status(400).send('only hls allowed');
  const client = target.startsWith('https') ? https : http;
  const headers = {'User-Agent':'Mozilla/5.0'};
  if(req.headers.range) headers.Range = req.headers.range;
  const proxyReq = client.get(target, {headers}, proxyRes=>{
    res.status(proxyRes.statusCode);
    res.setHeader('Access-Control-Allow-Origin','*');
    const ct = proxyRes.headers['content-type']||'';
    if(target.includes('.m3u8')) res.setHeader('Content-Type','application/vnd.apple.mpegurl');
    else if(ct) res.setHeader('Content-Type', ct);
    if(target.includes('.m3u8')){
      let body=''; proxyRes.setEncoding('utf8');
      proxyRes.on('data', c=> body+=c);
      proxyRes.on('end', ()=>{
        const base = target.substring(0, target.lastIndexOf('/')+1);
        body = body.replace(/^(?!#)(.+\.ts.*)$/gm, (m)=>{
          const abs = m.startsWith('http') ? m : base + m;
          return `/api/hls-proxy?url=${encodeURIComponent(abs)}`;
        });
        res.send(body);
      });
    } else { proxyRes.pipe(res); }
  });
  proxyReq.on('error', e=> res.status(502).send('proxy error '+e.message));
  proxyReq.setTimeout(8000, ()=>{ proxyReq.destroy(); res.status(504).end(); });
});

// ===== SNAPSHOT =====
const snapRunning = new Set();
app.get('/api/snapshot/:id', async (req,res)=>{
  const cam = db.prepare('SELECT * FROM cameras WHERE id=?').get(req.params.id);
  if(!cam) return res.status(404).end();
  const ytId = extractYoutubeId(cam.youtube_embed||'');
  if((cam.nvr_dvr === 'youtube' || ytId) && ytId){
    return res.redirect(`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`);
  }
  const streamUrl = cleanStreamUrl(cam.rtsp_url);
  if(isHlsUrl(streamUrl)){
    return res.redirect('/snapshot-placeholder.svg?text='+encodeURIComponent(cam.name));
  }
  const snapPath = path.join(SNAP_DIR, cam.id + '.jpg');
  try{
    const st = fs.statSync(snapPath);
    if(Date.now() - st.mtimeMs < 20000){
      res.setHeader('Cache-Control','public, max-age=5');
      return res.sendFile(snapPath);
    }
  }catch{}
  if(!/^rtsp:/i.test(streamUrl)){
    return res.redirect('/snapshot-placeholder.svg?text='+encodeURIComponent(cam.name));
  }
  if(snapRunning.has(cam.id)){
    for(let i=0;i<8;i++){ await new Promise(r=>setTimeout(r,500)); if(fs.existsSync(snapPath)) return res.sendFile(snapPath); }
    return res.status(202).end();
  }
  snapRunning.add(cam.id);
  const args = ['-rtsp_transport','tcp','-i', streamUrl, '-frames:v','1', '-s','480x270', '-q:v','5', '-an', '-y', snapPath];
  const ff = spawn('ffmpeg', args);
  let log = '';
  ff.stderr.on('data', d=> log += d.toString());
  const killTimer = setTimeout(()=>{ try{ ff.kill('SIGKILL') }catch{} }, 7000);
  ff.on('close', code=>{
    clearTimeout(killTimer); snapRunning.delete(cam.id);
    if(code===0 && fs.existsSync(snapPath)){
      res.setHeader('Cache-Control','public, max-age=5');
      return res.sendFile(snapPath);
    } else {
      fs.writeFileSync(path.join(LOG_DIR, `ff_snap_${cam.id}.log`), log.slice(-4000));
      if(fs.existsSync(snapPath)) return res.sendFile(snapPath);
      res.redirect('/snapshot-placeholder.svg?text='+encodeURIComponent(cam.name));
    }
  });
  ff.on('error', ()=>{ snapRunning.delete(cam.id); res.redirect('/snapshot-placeholder.svg?text='+encodeURIComponent(cam.name)); });
});

// camera status
// camera status (Ultra-Lightweight TCP/HTTP Connection Detection)
const net = require('net');
const http = require('http');
const https = require('https');

function pingTcpPort(urlStr, defaultPort = 554) {
  return new Promise((resolve) => {
    try {
      const cleanUrl = urlStr.replace(/^(rtsp|http|https):\/\//i, '');
      const hostPortPart = cleanUrl.split('/')[0];
      const hostPort = hostPortPart.split('@').pop();
      
      let host = hostPort;
      let port = defaultPort;
      
      if (hostPort.includes(':')) {
        const parts = hostPort.split(':');
        host = parts[0];
        port = parseInt(parts[1]) || defaultPort;
      }
      
      const socket = new net.Socket();
      let done = false;
      
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(false);
        }
      }, 1500); // 1.5s timeout is perfect for fast local/public checks
      
      socket.connect(port, host, () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(true);
        }
      });
      
      socket.on('error', () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
      });
    } catch (err) {
      resolve(false);
    }
  });
}

const camStatus = new Map();
async function pingCamera(cam){
  const id = cam.id;
  const streamUrl = cleanStreamUrl(cam.rtsp_url);
  const ytId = extractYoutubeId(cam.youtube_embed||'');

  // 1. YouTube Live Embed (Always online if active & internet is up)
  if(cam.nvr_dvr === 'youtube' || ytId) {
    camStatus.set(id, {online: cam.is_active ? true : false, lastCheck: Date.now(), msg: 'youtube cdn'});
    return cam.is_active ? true : false;
  }

  // 2. HTTP/HLS External Streams
  if(isHlsUrl(streamUrl) || isHttpStream(streamUrl)) {
    try {
      const url = new URL(streamUrl);
      const client = url.protocol === 'https:' ? https : http;
      const online = await new Promise(resolve => {
        const req = client.get(streamUrl, { timeout: 1500 }, (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
      });
      camStatus.set(id, {online, lastCheck: Date.now(), msg: online ? 'http ok' : 'http offline'});
      return online;
    } catch {
      camStatus.set(id, {online: false, lastCheck: Date.now(), msg: 'invalid URL'});
      return false;
    }
  }

  // 3. Standard RTSP IP Cameras (Ultra-Lightweight TCP Connection Check)
  if (streamUrl.startsWith('rtsp:')) {
    const online = await pingTcpPort(streamUrl, 554);
    camStatus.set(id, {
      online,
      lastCheck: Date.now(),
      msg: online ? 'tcp connect ok' : 'tcp connection failed (offline)'
    });
    return online;
  }

  // Fallback for other formats
  camStatus.set(id, {online: false, lastCheck: Date.now(), msg: 'unknown format'});
  return false;
}

// Background Ping: check ALL active cameras simultaneously every 15 seconds (0% CPU spawned overhead)
setInterval(async () => {
  try {
    const cams = db.prepare('SELECT * FROM cameras WHERE is_active=1').all();
    for (const cam of cams) {
      pingCamera(cam).catch(() => {});
    }
  } catch (err) {
    console.error("Gagal melakukan berkala camera ping:", err.message);
  }
}, 15000);

app.get('/api/cameras/status', authOptional, (req,res)=>{
  const isAdmin = req.user && req.user.role === 'admin';
  let cams;
  if(isAdmin){
    cams = db.prepare('SELECT id, name FROM cameras').all();
  } else {
    cams = db.prepare('SELECT id, name FROM cameras WHERE is_public=1 AND is_active=1').all();
  }
  const out = cams.map(c=>{
    const st = camStatus.get(c.id) || {online:null, lastCheck:0, msg:'unknown'};
    const snapPath = path.join(SNAP_DIR, String(c.id)+'.jpg');
    let snapAge = null;
    try{ snapAge = Math.floor((Date.now()-fs.statSync(snapPath).mtimeMs)/1000); }catch{}
    return {id:c.id, name:c.name, ...st, snapAge};
  });
  res.json(out);
});
app.post('/api/cameras/:id/ping', auth('admin'), async (req,res)=>{
  const cam = db.prepare('SELECT * FROM cameras WHERE id=?').get(req.params.id);
  if(!cam) return res.status(404).json({error:'not found'});
  const online = await pingCamera(cam);
  res.json(camStatus.get(cam.id) || {online});
});

// ===== RECORDING =====
const activeRecords = new Map();
function recordArgs(input, outputMp4, durationSec){
  const args = [];
  if (input.startsWith('rtsp:')) {
    args.push('-rtsp_transport', 'tcp');
  }
  args.push('-i', input, '-t', String(durationSec));

  // Mengubah HEVC (H.265) menjadi H.264 Baseline secara sangat ringan (Ultrafast)
  // Ini mutlak diperlukan agar hasil rekaman bisa diputar langsung di semua Web Browser / HP (H.265 tidak didukung browser).
  // Menggunakan skala 540p dan 15fps untuk menjaga CPU STB HG680P tetap dingin (<30% CPU).
  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',      // Preset tercepat, beban CPU terendah pada STB
    '-tune', 'zerolatency',
    '-profile:v', 'baseline', '-level', '3.0', // Kompatibilitas 100% pada HP/Browser
    '-pix_fmt', 'yuv420p',
    '-s', process.env.VIDEO_SIZE || '960x540', // Downscale ke 540p untuk menghemat pixel encoding & disk hdd
    '-r', '15',                  // Frame rate 15fps (standar CCTV) menghemat 50% daya CPU
    '-b:v', '800k',              // Bitrate optimal untuk kualitas jernih dan hemat penyimpanan
    '-movflags', '+faststart',
    '-an',                       // Nonaktifkan audio untuk menghindari crash wadah MP4 akibat PCM G.711 IP Cam
    '-y', outputMp4
  );
  return args;
}
function startRecord(camera){
  if(activeRecords.has(String(camera.id))) return {error:'already recording'};

  // PENGAMAN MANDIRI: Deteksi jika hardisk lepas (unmounted) demi mengamankan SD Card dari kepenuhan
  if (RECORD_DIR.includes('/var/lib/webcctv/records')) {
    const guardFile = path.join(RECORD_DIR, '.cctv_hdd_active');
    if (!fs.existsSync(guardFile)) {
      console.warn("⚠️ PERINGATAN: Berkas pengaman .cctv_hdd_active tidak ditemukan! Mencoba melakukan mount ulang...");
      try {
        const { execSync } = require('child_process');
        execSync('mount -a', { stdio: 'ignore' });
      } catch (e) {
        console.error("❌ Gagal me-mount ulang hardisk otomatis:", e.message);
      }
      
      if (!fs.existsSync(guardFile)) {
        console.error("❌ EROR FATAL: Hardisk 500GB terputus (unmounted)! Perekaman DIBATALKAN demi mengamankan SD Card.");
        return { error: 'Penyimpanan Hardisk Terputus (Unmounted)! Harap periksa koneksi kabel USB atau adaptor daya STB.' };
      }
    }
  }

  const camDir = path.join(RECORD_DIR, String(camera.id));
  if(!fs.existsSync(camDir)) fs.mkdirSync(camDir,{recursive:true});
  const ts = new Date();
  const fname = `${ts.toISOString().replace(/[:.]/g,'-').slice(0,19)}.mp4`;
  const outPath = path.join(camDir, fname);
  const duration = camera.record_duration || 300;
  const start_time = new Date().toISOString().slice(0,19).replace('T',' ');
  const ins = db.prepare('INSERT INTO records (camera_id,start_time,status,file_path) VALUES (?,?,?,?)').run(camera.id, start_time, 'recording', `records/${camera.id}/${fname}`);
  const recordRowId = ins.lastInsertRowid;
  const streamUrl = cleanStreamUrl(camera.rtsp_url);
  
  // Create a log file for recording to debug any failures!
  const logFile = path.join(LOG_DIR, `rec_${camera.id}.log`);
  const logStream = fs.createWriteStream(logFile, {flags:'w'});

  const args = recordArgs(streamUrl, outPath, duration);
  logStream.write(`ffmpeg ${args.join(' ')}\n\n`);

  const ff = spawn('ffmpeg', args);
  activeRecords.set(String(camera.id), {proc:ff, recordRowId});
  
  ff.stderr.on('data', d => {
    logStream.write(d.toString());
  });

  ff.on('error', err => {
    console.error(`❌ FFmpeg spawn error for recording cam ${camera.id}:`, err.message);
    logStream.write(`\n❌ SPAWN ERROR: ${err.message}\n`);
    logStream.end();
    activeRecords.delete(String(camera.id));
    db.prepare("UPDATE records SET status='failed', end_time=? WHERE id=?")
      .run(new Date().toISOString().slice(0,19).replace('T',' '), recordRowId);
  });

  ff.on('close', code=>{
    logStream.end(`\nexit ${code}\n`);
    activeRecords.delete(String(camera.id));
    const end_time = new Date().toISOString().slice(0,19).replace('T',' ');
    let size_mb = 0;
    try{ size_mb = +(fs.statSync(outPath).size /1024/1024).toFixed(2); }catch{}
    db.prepare('UPDATE records SET end_time=?, size_mb=?, duration_sec=?, status=? WHERE id=?')
      .run(end_time, size_mb, duration, code===0 ? 'completed':'failed', recordRowId);
    console.log(`■ record cam ${camera.id} done ${code} ${size_mb}MB`);
    autoCleanupDisk(); // Run automatic circular cleanup!
  });
  return {success:true, file:`/records/${camera.id}/${fname}`, record_id: recordRowId};
}
app.post('/api/record/:id/start', auth('admin'), (req,res)=>{
  const cam = db.prepare('SELECT * FROM cameras WHERE id=?').get(req.params.id);
  if(!cam) return res.status(404).json({error:'not found'});
  const duration = parseInt(req.body.duration) || cam.record_duration || 300;
  cam.record_duration = duration;
  const r = startRecord(cam);
  if(r.error) return res.status(409).json(r);
  res.json(r);
});
app.post('/api/record/:id/stop', auth('admin'), (req,res)=>{
  const rec = activeRecords.get(String(req.params.id));
  if(rec){ rec.proc.kill('SIGINT'); return res.json({success:true}); }
  res.json({success:false});
});
app.get('/api/record/active', authOptional, (req, res) => {
  const activeList = [];
  activeRecords.forEach((val, key) => {
    try {
      const cam = db.prepare('SELECT name FROM cameras WHERE id=?').get(key);
      activeList.push({
        camera_id: parseInt(key),
        camera_name: cam ? cam.name : `Camera ${key}`,
        recordRowId: val.recordRowId
      });
    } catch (e) {
      console.error(e);
    }
  });
  res.json(activeList);
});

// automatic physical file scanning and database indexing
function scanAndImportPhysicalRecords() {
  try {
    if (!fs.existsSync(RECORD_DIR)) return;
    const camDirs = fs.readdirSync(RECORD_DIR);
    camDirs.forEach(camDir => {
      const cameraId = parseInt(camDir);
      if (isNaN(cameraId)) return;
      const camDirPath = path.join(RECORD_DIR, camDir);
      const stat = fs.statSync(camDirPath);
      if (!stat.isDirectory()) return;

      const files = fs.readdirSync(camDirPath);
      files.forEach(file => {
        if (!file.endsWith('.mp4')) return;
        const relativePath = `records/${cameraId}/${file}`;
        const exists = db.prepare("SELECT COUNT(*) as c FROM records WHERE file_path=?").get(relativePath).c;
        if (exists === 0) {
          const fullPath = path.join(camDirPath, file);
          let sizeMb = 0;
          try { sizeMb = +(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2); } catch {}
          let startTimeStr = '';
          try {
            const baseName = file.replace('.mp4', '');
            const parts = baseName.split('T');
            if (parts.length === 2) {
              startTimeStr = `${parts[0]} ${parts[1].replace(/-/g, ':')}`;
            } else {
              startTimeStr = fs.statSync(fullPath).mtime.toISOString().slice(0, 19).replace('T', ' ');
            }
          } catch {
            startTimeStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
          }
          try {
            db.prepare('INSERT INTO records (camera_id, start_time, end_time, file_path, size_mb, duration_sec, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .run(cameraId, startTimeStr, startTimeStr, relativePath, sizeMb, 0, 'completed');
            console.log(`📥 Auto-indexed physical recording to SQLite: ${relativePath}`);
          } catch (dbErr) {
            console.error(`Auto-index DB insert fail for ${relativePath}:`, dbErr.message);
          }
        }
      });
    });
  } catch (err) {
    console.error("Auto scan and import records failure:", err.message);
  }
}

app.get('/api/records', auth(), (req,res)=>{
  scanAndImportPhysicalRecords(); // Auto-scan and register physical files!
  const cam = req.query.camera_id;
  let rows;
  if(cam) rows = db.prepare('SELECT r.*, c.name as camera_name FROM records r LEFT JOIN cameras c ON c.id=r.camera_id WHERE r.camera_id=? ORDER BY r.start_time DESC LIMIT 200').all(cam);
  else rows = db.prepare('SELECT r.*, c.name as camera_name FROM records r LEFT JOIN cameras c ON c.id=r.camera_id ORDER BY r.start_time DESC LIMIT 200').all();
  res.json(rows);
});
app.delete('/api/records/:id', auth('admin'), (req,res)=>{
  const rec = db.prepare('SELECT * FROM records WHERE id=?').get(req.params.id);
  if(rec && rec.file_path){
    const fp = path.join(__dirname, 'public', rec.file_path);
    try{ fs.unlinkSync(fp); }catch{}
  }
  db.prepare('DELETE FROM records WHERE id=?').run(req.params.id);
  res.json({success:true});
});
app.delete('/api/records', auth('admin'), (req,res)=>{
  try {
    const records = db.prepare("SELECT * FROM records").all();
    records.forEach(rec => {
      if (rec.file_path) {
        const fp = path.join(__dirname, 'public', rec.file_path);
        try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch(e) {}
      }
    });
    db.prepare("DELETE FROM records").run();
    res.json({success:true});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// disk space helper
function getDiskSpace() {
  return new Promise((resolve) => {
    const fallback = { total_gb: '16.0', used_gb: '8.0', free_gb: '8.0', used_percent: 50 };
    if (process.platform === 'win32') {
      return resolve(fallback);
    }
    const { exec } = require('child_process');
    exec(`df -m "${RECORD_DIR}"`, (err, stdout) => {
      if (err || !stdout) return resolve(fallback);
      try {
        const lines = stdout.trim().split('\n');
        if (lines.length < 2) return resolve(fallback);
        // Parse columns: Filesystem, 1M-blocks, Used, Available, Use%, Mounted on
        const parts = lines[1].replace(/\s+/g, ' ').split(' ');
        const totalMb = parseInt(parts[1]);
        const usedMb = parseInt(parts[2]);
        const freeMb = parseInt(parts[3]);
        const percent = parseInt(parts[4].replace('%', ''));
        resolve({
          total_gb: (totalMb / 1024).toFixed(1),
          used_gb: (usedMb / 1024).toFixed(1),
          free_gb: (freeMb / 1024).toFixed(1),
          used_percent: percent
        });
      } catch {
        resolve(fallback);
      }
    });
  });
}

app.get('/api/system/storage', authOptional, async (req, res) => {
  const disk = await getDiskSpace();
  let recordsSizeMb = 0;
  try {
    const walk = (dir) => {
      let s = 0;
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) s += walk(p);
          else try { s += fs.statSync(p).size; } catch {}
        });
      }
      return s;
    };
    recordsSizeMb = +(walk(RECORD_DIR) / 1024 / 1024).toFixed(1);
  } catch {}
  res.json({
    ...disk,
    records_size_mb: recordsSizeMb
  });
});

app.get('/api/system/specs', authOptional, (req, res) => {
  const os = require('os');
  
  // 1. Memory Usage (RAM)
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const ramPercent = Math.round((usedMem / totalMem) * 100);
  
  const totalMemGb = (totalMem / 1024 / 1024 / 1024).toFixed(1);
  const usedMemGb = (usedMem / 1024 / 1024 / 1024).toFixed(1);

  // 2. CPU Load Usage (Approximate loadavg calculated)
  const loadAvg = os.loadavg();
  const numCpus = os.cpus().length || 1;
  const cpuPercent = Math.round((loadAvg[0] / numCpus) * 100) || 12; // fallback to 12% if idle

  // 3. Suhu CPU (Thermal System in Armbian)
  let temp = null;
  const thermalPaths = [
    '/sys/class/thermal/thermal_zone0/temp',
    '/sys/class/thermal/thermal_zone1/temp',
    '/sys/devices/virtual/thermal/thermal_zone0/temp'
  ];
  for (const tp of thermalPaths) {
    try {
      if (fs.existsSync(tp)) {
        const raw = fs.readFileSync(tp, 'utf8');
        temp = parseFloat(raw.trim()) / 1000;
        break;
      }
    } catch (e) {}
  }

  res.json({
    cpu: cpuPercent > 100 ? 100 : cpuPercent,
    ram_total: totalMemGb,
    ram_used: usedMemGb,
    ram_percent: ramPercent,
    temp: temp ? temp.toFixed(1) : null,
    uptime: Math.round(os.uptime())
  });
});

// automatic circular recording cleanup
async function autoCleanupDisk() {
  try {
    let disk = await getDiskSpace();
    if (disk.used_percent < 90) return; // space is safe!

    console.log(`⚠️ Disk is almost full (${disk.used_percent}% used). Starting auto-cleanup of oldest recordings...`);
    
    // Fetch completed records ordered by start_time ascending (oldest first)
    const oldestRecords = db.prepare("SELECT * FROM records WHERE status='completed' ORDER BY start_time ASC LIMIT 50").all();
    
    for (const rec of oldestRecords) {
      if (rec.file_path) {
        const fp = path.join(__dirname, 'public', rec.file_path);
        try {
          if (fs.existsSync(fp)) {
            fs.unlinkSync(fp);
            console.log(`🗑️ Auto-deleted oldest physical recording file: ${fp} (${rec.size_mb} MB)`);
          }
        } catch (e) {
          console.error(`Failed to delete physical file ${fp}:`, e.message);
        }
      }
      
      // Delete from db
      db.prepare('DELETE FROM records WHERE id=?').run(rec.id);
      
      // Recheck
      disk = await getDiskSpace();
      console.log(`Rechecking disk space: ${disk.used_percent}% used`);
      
      if (disk.used_percent < 80) {
        console.log(`✅ Auto-cleanup complete. Disk space reclaimed, currently at ${disk.used_percent}% used.`);
        break;
      }
    }
  } catch (err) {
    console.error("Auto disk cleanup failure:", err);
  }
}

// dashboard
app.get('/api/dashboard', authOptional, (req,res)=>{
  const totalCam = db.prepare('SELECT COUNT(*) as c FROM cameras').get().c;
  const activeCam = db.prepare('SELECT COUNT(*) as c FROM cameras WHERE is_active=1').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalRecords = db.prepare('SELECT COUNT(*) as c FROM records').get().c;
  let recordsSizeMb = 0;
  try{
    const walk = (dir)=>{
      let s=0;
      fs.readdirSync(dir,{withFileTypes:true}).forEach(e=>{
        const p = path.join(dir, e.name);
        if(e.isDirectory()) s+=walk(p);
        else try{ s+=fs.statSync(p).size }catch{}
      });
      return s;
    };
    recordsSizeMb = +(walk(RECORD_DIR)/1024/1024).toFixed(1);
  }catch{}
  const streamingNow = activeStreams.size;
  const recordingNow = activeRecords.size;
  let online = 0, offline = 0, unknown = 0;
  db.prepare('SELECT id FROM cameras WHERE is_active=1').all().forEach(c=>{
    const st = camStatus.get(c.id);
    if(!st) unknown++;
    else if(st.online) online++;
    else offline++;
  });
  res.json({ totalCam, activeCam, totalUsers, totalRecords, recordsSizeMb, streamingNow, recordingNow, online, offline, unknown });
});

// cron record
function matchCron(cronStr, date){
  try{
    const [m,h] = cronStr.trim().split(' ');
    const mm = date.getMinutes(); const hh = date.getHours();
    const mOk = m === '*' || m === String(mm) || (m.startsWith('*/') && mm % parseInt(m.slice(2))===0);
    const hOk = !h || h === '*' || h === String(hh);
    return mOk && hOk;
  }catch{ return false }
}
setInterval(()=>{
  const now = new Date();
  const cams = db.prepare('SELECT * FROM cameras WHERE record_enabled=1 AND is_active=1').all();
  autoCleanupDisk(); // Run automatic circular cleanup check before starting new files!
  cams.forEach(cam=>{
    const sched = cam.record_schedule || '0 * * * *';
    const isContinuous = (sched === '24h' || sched === '* * * * *');
    if (isContinuous || matchCron(sched, now)) {
      if(!activeRecords.has(String(cam.id))){
        console.log(`⏺ auto record cam ${cam.id} ${cam.name} (Sched: ${sched})`);
        startRecord(cam);
      }
    }
  });
}, 60*1000);

// static
app.use('/streams', express.static(HLS_DIR, {
  setHeaders: (res,p)=>{
    if(p.endsWith('.m3u8')){ res.setHeader('Content-Type','application/vnd.apple.mpegurl'); res.setHeader('Cache-Control','no-cache');}
    else if(p.endsWith('.ts')){ res.setHeader('Content-Type','video/mp2t'); }
  }
}));
app.use('/records', express.static(RECORD_DIR));
app.use('/snapshots', express.static(SNAP_DIR, { maxAge: '5s' }));
app.get('/snapshot-placeholder.svg', (req,res)=>{
  const text = (req.query.text||'No Snapshot').substring(0,30).replace(/</g,'');
  res.type('image/svg+xml').setHeader('Cache-Control','public, max-age=60').send(
`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
<rect width="480" height="270" fill="#0b1117"/>
<g fill="#2a3a4a" transform="translate(208,105)"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" transform="scale(2.5)"/></g>
<text x="240" y="200" text-anchor="middle" fill="#3a5066" font-family="sans-serif" font-size="14">${text}</text>
<text x="240" y="220" text-anchor="middle" fill="#2a3a4a" font-family="sans-serif" font-size="11">HLS / YouTube – klik untuk play</text>
</svg>`);
});

// spa
app.get('*', (req,res)=>{
  if(req.path.startsWith('/api')) return res.status(404).json({error:'not found'});
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.listen(PORT,'0.0.0.0', ()=>{
  console.log(`🚀 Web-CCTV v2.7 http://0.0.0.0:${PORT}`);
});
