# Web-CCTV HG680P v2.7 (Release Produksi Stabil & Hemat Daya)

Web-CCTV modern, ultra-ringan, hemat CPU, dan responsif mobile – dirancang khusus untuk perangkat **STB Armbian HG680P / B860H (Amlogic S905X)** dengan performa maksimal 24 jam non-stop.

Sistem Web-CCTV v2.7 ini menyajikan pemantauan langsung HLS & YouTube, perekaman terjadwal/manual, sinkronisasi hardisk, status penyimpanan riil, pembersihan otomatis (auto-cleanup), dan dukungan multi-bahasa (ID/EN) yang ramah pengguna.

---

## 🛠️ Kebutuhan Sistem & Spesifikasi STB
* **Sistem Operasi**: Armbian (Debian/Ubuntu) berbasis kernel Linux stable.
* **Arsitektur CPU**: ARMv8 Cortex-A53 (Amlogic S905X, S905W, atau sejenisnya).
* **Alokasi RAM**: Minimal 1 GB (sangat bersahabat dengan RAM STB yang terbatas).
* **Perangkat Lunak**: 
  - Node.js (v16 atau v18+)
  - FFmpeg (dengan decoder/encoder H.264 & AAC)
  - SQLite3 (database lokal yang super cepat & bebas overhead)
* **Penyimpanan**: USB Harddisk Eksternal 500GB (sangat disarankan untuk mengamankan SD Card dari kerusakan penulisan terus-menerus).

---

## 🏗️ Mengapa Sistem v2.7 Sangat Ringan di STB HG680P?

Untuk menjaga CPU STB tetap dingin (**di bawah 30% pemakaian CPU**), sistem v2.7 mengimplementasikan **Formula Emas Transcode Video** yang berjalan di backend `server.js` kita:

1. **Preset Ultrafast (`-preset ultrafast`)**: Memotong beban encoding CPU hingga lebih dari 75% dibandingkan preset bawaan FFmpeg.
2. **Optimalisasi Resolusi & Frame Rate (`960x540 @15fps`)**: Menurunkan resolusi ke 540p dan FPS ke 15 (standar CCTV keamanan). Ini memangkas piksel yang harus dihitung sebanyak 4x lipat dibanding Full HD 1080p, sekaligus sangat menghemat ruang penyimpanan.
3. **Kompatibilitas Mutlak H.264 Baseline**: Banyak kamera IP menggunakan format HEVC (H.265). Karena peramban web (Chrome, Safari, Edge, Firefox) **tidak mendukung H.265 secara native**, rekaman langsung akan menghasilkan **blank hitam** di pemutar web. Sistem v2.7 otomatis men-transcode video ke H.264 Baseline Profile agar **100% kompatibel dan langsung bisa diputar di web/HP Android**.
4. **Perekaman Tanpa Audio (`-an`)**: IP camera murah umumnya mengirim audio berkode PCM G.711 (PCMA/PCMU). Jika dipaksa disalin ke wadah MP4, FFmpeg akan langsung crash dalam 2 detik. Kami menonaktifkan audio (`-an`) untuk menjamin stabilitas perekaman tanpa crash.

---

## 📥 1. Petunjuk Instalasi Lengkap (Mulai Dari Awal)

### Langkah 1: Persiapan Folder Proyek
Tempatkan file proyek ini di direktori aktif STB Anda. Folder standar yang direkomendasikan adalah `/root/web-cctv` atau `/opt/webcctv`.

```bash
# Masuk ke folder proyek Anda
cd /root/web-cctv
```

### Langkah 2: Menjalankan Script Autostart Systemd (Otomatis Sekali Klik)
Kami telah menyediakan script instalasi otomatis `install-autostart.sh` yang akan mengonfigurasi semua kebutuhan dependensi, database SQLite, file `.env`, dan layanan systemd:

```bash
# Berikan izin eksekusi pada installer
chmod +x install-autostart.sh

# Jalankan installer dengan hak akses ROOT (sudo)
sudo ./install-autostart.sh
```

**Apa yang dilakukan oleh script ini?**
1. Memperbarui indeks repositori dan mengunduh dependensi (`nodejs`, `npm`, `ffmpeg`, `sqlite3`, `rsync`).
2. Melakukan instalasi dependensi produksi Node.js menggunakan `npm install --omit=dev`.
3. Membuat database SQLite dan menjalankan skrip inisialisasi awal (`init-db.js`).
4. Menyiapkan konfigurasi file `.env` yang optimal.
5. Memasang unit layanan systemd `/etc/systemd/system/webcctv.service` agar **aplikasi otomatis berjalan saat STB menyala (setelah mati lampu atau reboot)**.

### Langkah 3: Mengendalikan Layanan Web-CCTV
Anda dapat memantau dan mengendalikan layanan CCTV menggunakan perintah systemd berikut:

```bash
# Memeriksa status berjalan layanan Web-CCTV
sudo systemctl status webcctv

# Menghentikan layanan sementara
sudo systemctl stop webcctv

# Memulai ulang (restart) layanan
sudo systemctl restart webcctv

# Memantau log aktivitas server secara live (real-time)
sudo journalctl -u webcctv -f
```

Aplikasi Web-CCTV Anda kini sudah dapat diakses secara lokal di: **`http://<IP_STB_ANDA>:3000`**
* **Username Admin**: `admin` | **Password**: `admin123`
* **Username Publik**: `publik` | **Password**: `publik123`

---

## 💾 2. Kustomisasi & Pemindahan Penyimpanan ke Hardisk USB 500GB

Sangat dilarang menyimpan hasil rekaman video terus-menerus di dalam **SD Card (MicroSD)** STB karena proses tulis-baca (*write endurance*) yang tinggi akan merusak SD Card Anda dalam hitungan bulan. Gunakan USB Harddisk Eksternal berkapasitas 500GB!

### A. Konfigurasi Auto-Mount Hardisk Permanen
Gunakan script otomatisasi aman `mount-hdd.sh` untuk melakukan format, mounting permanen di fstab, dan pengaturan symlink:

```bash
# Berikan izin eksekusi pada script mount
chmod +x mount-hdd.sh

# Jalankan sebagai ROOT
sudo ./mount-hdd.sh
```

**Fitur Hebat Script Mount Ini:**
* **Deteksi Otomatis**: Mengenali hardisk USB berukuran ~500GB (terbaca ~465G di Linux).
* **Format Aman Ext4**: Memformat hardisk ke sistem berkas Ext4 Linux untuk kecepatan transfer data terbaik dan nol fragmentasi file video.
* **Proteksi Fstab (`nofail`)**: Menambahkan UUID hardisk secara permanen di `/etc/fstab` dengan opsi `nofail`. Jika hardisk tidak sengaja dicabut, STB **tidak akan crash/hang** dan tetap booting secara normal.
* **Fitur Ganda Double-Protection v2.7 (SANGAT PENTING)**:
  Sebelumnya, penyimpanan hanya mengandalkan symlink Linux `public/records` yang sangat rapuh (mudah tertimpa/terhapus saat deployment ulang proyek). 
  Di versi **v2.7**, kami memperkenalkan variabel lingkungan `RECORD_DIR` di berkas `.env`:
  ```text
  RECORD_DIR=/var/lib/webcctv/records
  ```
  Script `mount-hdd.sh` secara otomatis menyuntikkan konfigurasi ini ke dalam `.env` proyek Anda. Walaupun symlink terhapus atau folder ter-overtulis, server **akan tetap menulis data langsung ke Hardisk 500GB secara aman!**

### B. Cara Migrasi Rekaman Lama dari SD Card ke Hardisk 500GB
Jika Anda terlanjur merekam ke dalam SD Card dan ingin memindahkannya ke Hardisk yang baru dipasang, jalankan perintah ini di terminal STB Anda:

```bash
# 1. Hentikan server CCTV
sudo systemctl stop webcctv

# 2. Pindahkan file video secara aman menggunakan rsync
if [ -d "/root/web-cctv/public/records" ]; then
  sudo mkdir -p /var/lib/webcctv/records
  sudo rsync -av --remove-source-files /root/web-cctv/public/records/ /var/lib/webcctv/records/
  sudo rm -rf /root/web-cctv/public/records
fi

# 3. Buat symlink fallback
sudo ln -sf /var/lib/webcctv/records /root/web-cctv/public/records

# 4. Atur izin kepemilikan folder di hardisk agar server bisa menulis berkas
sudo chown -R root:root /var/lib/webcctv/records
sudo chmod -R 777 /var/lib/webcctv/records

# 5. Jalankan kembali server
sudo systemctl start webcctv
```

---

## 🔄 3. Sinkronisasi Basis Data (`sync-db-records.js`)

Jika Anda menghapus berkas video rekaman secara fisik langsung dari Hardisk (baik melalui terminal atau pengelola file), database SQLite akan menyimpan riwayat rekaman kosong tersebut (menjadi "Ghost Records" / rekaman hantu).

Kami telah menyediakan skrip **`sync-db-records.js`** yang secara cerdas:
1. Memindai database aktif (otomatis mendeteksi database aktif systemd `/var/lib/webcctv/cctv.db` atau folder lokal).
2. Memeriksa ketersediaan file fisik di hardisk eksternal.
3. Menghapus log-log yang file fisiknya sudah tiada agar tampilan Web UI Anda bersih dan akurat.

Jalankan perintah ini untuk melakukan sinkronisasi secara manual:
```bash
node sync-db-records.js
```

### ⏰ Penjadwalan Otomatis Via Cron Job (Sangat Direkomendasikan!)
Jadwalkan skrip sinkronisasi ini berjalan otomatis setiap pukul 02:00 pagi:
```bash
# Buka editor cron job
sudo crontab -e

# Tempelkan baris berikut di bagian paling bawah
0 2 * * * /usr/bin/node /root/web-cctv/sync-db-records.js >> /var/log/webcctv_sync.log 2>&1
```

---

## 🌐 4. Meng-online-kan Akses via Cloudflare Tunnel (HTTPS Gratis)

Cloudflare Tunnel (`cloudflared`) memungkinkan Anda mengakses CCTV dari jaringan internet luar secara aman (HTTPS) tanpa harus berlangganan IP Public statis dan tanpa membuka port modem (Bypass CGNAT ISP).

1. **Instalasi `cloudflared` di STB**:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
   sudo dpkg -i cloudflared-linux-arm64.deb
   ```
2. **Login Otentikasi**:
   ```bash
   cloudflared tunnel login
   ```
   *Buka tautan yang muncul, lalu pilih domain Anda (misal: `domainanda.com`).*
3. **Buat Tunnel**:
   ```bash
   cloudflared tunnel create webcctv-tunnel
   ```
   *Catat kode UUID Tunnel panjang yang tampil di layar terminal.*
4. **Buat File Konfigurasi**:
   Tulis file `/etc/cloudflared/config.yml`:
   ```yaml
   tunnel: KODE_UUID_TUNNEL_ANDA
   credentials-file: /etc/cloudflared/KODE_UUID_TUNNEL_ANDA.json

   ingress:
     - hostname: cctv.domainanda.com
       service: http://localhost:3000
     - service: http_status:404
   ```
5. **Daftarkan DNS & Aktifkan Autostart**:
   ```bash
   # Daftarkan DNS CNAME otomatis di Cloudflare
   cloudflared tunnel route dns webcctv-tunnel cctv.domainanda.com

   # Pasang sebagai layanan otomatis
   sudo cloudflared service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```
Kini Web-CCTV Anda dapat diakses di mana saja melalui: **`https://cctv.domainanda.com`**

---

## 📱 5. Kompilasi APK Android Studio Hybrid (Smart Auto-Ping)

Untuk akses instan lewat ponsel Android, kami menyediakan proyek kode sumber lengkap di direktori `android-app/` dan file kompresi `web-cctv-hg680p-v2.7-android.zip`.

### Fitur Unggulan Kotlin WebView (`MainActivity.kt`):
* **Auto-Ping Switcher**: Saat aplikasi dibuka, Kotlin akan melakukan ping ringan ke alamat lokal (`http://192.168.1.18:3000/api/settings`) dengan timeout cepat **1.2 detik**.
* **Jaringan Rumah (Lokal)**: Jika ping sukses, aplikasi akan langsung memuat versi lokal. **Buffer video HLS menjadi instan, hemat bandwidth, dan nol lag!**
* **Luar Jangkauan (Cloud)**: Jika ping gagal (Anda sedang di luar rumah), aplikasi otomatis beralih memuat alamat Cloudflare Tunnel HTTPS Anda (`https://cctv.domainanda.com`).
* **Penyimpanan Persisten**: Alamat lokal & domain awan Anda disimpan di `SharedPreferences` sehingga Anda hanya perlu memasukkannya sekali saja pada saat instalasi pertama kali.

### Cara Build APK di Android Studio:
1. Buka **Android Studio** di komputer Anda, lalu klik **Open an Existing Project** dan arahkan ke folder `android-app/` di proyek ini.
2. Pastikan file `build.gradle` sinkron dan dependensi AndroidX terunduh sempurna.
3. Klik menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
4. Salin file `.apk` hasil kompilasi ke HP Android Anda, jalankan instalasi, dan konfigurasikan alamat IP lokal serta alamat Cloudflare Tunnel Anda.

---

## 🧹 6. Pemeliharaan Jangka Panjang & Troubleshooting

### A. Penyebab "Layar Hitam / Blank Hitam" pada Hasil Rekaman
* **Penyebab**: Format masukan kamera adalah H.265 (HEVC), sedangkan peramban web hanya menduduki H.264. Jika Anda mematikan proses transcoding, file MP4 akan disalin mentah (tetap H.265) yang tidak bisa dirender browser.
* **Solusi**: Pastikan setelan perekaman di `server.js` Anda menggunakan formula `-c:v libx264` dengan preset `ultrafast` (sudah terkonfigurasi secara default di rilis v2.7 ini).

### B. Cara Mengubah Parameter Kualitas Video Rekaman
Anda dapat menyesuaikan resolusi gambar, fps, dan bitrate di berkas `.env` Anda tanpa harus menyentuh kode program:
```ini
# Edit file .env Anda
VIDEO_SIZE=960x540      # Resolusi (Ganti ke 640x360 jika ingin CPU STB lebih dingin lagi!)
VIDEO_FPS=15            # Frame rate optimal CCTV
VIDEO_BITRATE=800k      # Kepadatan data video
```
Simpan perubahan dan restart server dengan perintah `sudo systemctl restart webcctv`.

### C. Pembersihan Log Server Otomatis
Layanan `webcctv.service` mencatat semua aktivitas FFmpeg ke journald. Untuk membatasi ukuran berkas log logrotate agar memori internal STB tetap lega:
```bash
sudo journalctl --vacuum-size=50M
```

---

*Dikembangkan dengan penuh dedikasi untuk komunitas STB Armbian Indonesia.*
**Web-CCTV HG680P v2.7 (Multi-Language & Smart Mobile Hybrid Edition)**
