const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Web-CCTV HG680P - Database Recording Logs Sync Utility
// Features: Auto-detects active DB_PATH and strictly resolves file paths to the project root folder `public/records`.

let DB_PATH = process.env.DB_PATH;
if (!DB_PATH) {
  if (fs.existsSync('/var/lib/webcctv/cctv.db')) {
    DB_PATH = '/var/lib/webcctv/cctv.db';
    console.log('📂 Terdeteksi database aktif systemd di: /var/lib/webcctv/cctv.db');
  } else {
    DB_PATH = path.join(__dirname, 'cctv.db');
    console.log('📂 Menggunakan database lokal proyek di: ' + DB_PATH);
  }
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Error: Database tidak ditemukan di jalur: ${DB_PATH}`);
  process.exit(1);
}

// Dynamically locate the project directory
let projectDir = __dirname;
if (fs.existsSync('/opt/webcctv')) {
  projectDir = '/opt/webcctv';
} else if (fs.existsSync('/root/web-cctv')) {
  projectDir = '/root/web-cctv';
}

const db = new Database(DB_PATH);

console.log('================================================================');
console.log('🔄  Web-CCTV - Memulai Sinkronisasi Database Rekaman & Hardisk  ');
console.log('  - Lokasi Database: ' + DB_PATH);
console.log('  - Lokasi Berkas  : ' + path.join(projectDir, 'public/records'));
console.log('================================================================');

try {
  // Fetch all recording logs from database
  const records = db.prepare("SELECT * FROM records").all();
  
  let deletedCount = 0;
  let keepCount = 0;
  let activeRecordingCount = 0;

  records.forEach(rec => {
    // If the record is currently in-progress of recording, skip it
    if (rec.status === 'recording') {
      activeRecordingCount++;
      return;
    }

    if (!rec.file_path) {
      db.prepare("DELETE FROM records WHERE id=?").run(rec.id);
      deletedCount++;
      return;
    }

    // Always check physical file presence inside the project's public/records directory
    // This supports both local storage and 500GB HDD mounts (since it is symlinked to public/records!)
    const fullPath = path.join(projectDir, 'public', rec.file_path);
    
    if (!fs.existsSync(fullPath)) {
      // Physical file is missing, delete the ghost DB entry!
      db.prepare("DELETE FROM records WHERE id=?").run(rec.id);
      deletedCount++;
    } else {
      keepCount++;
    }
  });

  console.log('✅ Sinkronisasi Selesai!');
  console.log(`   - Rekaman Valid di Hardisk (Dipertahankan) : ${keepCount}`);
  console.log(`   - Rekaman Hantu / Berkas Hilang (Dihapus)   : ${deletedCount}`);
  console.log(`   - Perekaman Sedang Berjalan (Diabaikan)     : ${activeRecordingCount}`);
  console.log('================================================================');
  console.log('🎉 Riwayat tabel rekaman di web UI Anda kini sudah sinkron dan bersih!');
  
} catch (err) {
  console.error("❌ Gagal melakukan sinkronisasi:", err.message);
} finally {
  db.close();
}
