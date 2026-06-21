const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Web-CCTV HG680P - Database Recording Logs Sync Utility
// This script checks all recording logs in the database, verifies if their physical MP4 files
// exist on the newly mounted 500GB hard disk, and deletes any "ghost/invalid" entries that are missing.

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'cctv.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Error: Database tidak ditemukan di jalur: ${DB_PATH}`);
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log('================================================================');
console.log('🔄  Web-CCTV - Memulai Sinkronisasi Database Rekaman & Hardisk  ');
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

    // Check if the physical file exists on the newly mounted hard drive
    const fullPath = path.join(__dirname, 'public', rec.file_path);
    
    if (!fs.existsSync(fullPath)) {
      // Physical file is missing on the new drive, delete the ghost DB entry!
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
