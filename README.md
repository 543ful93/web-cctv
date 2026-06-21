# Web-CCTV HG680P v2.7 (Release Stabil & Responsif Mobile)

Web CCTV modern, ringan, responsif mobile – khusus **STB Armbian HG680P (Amlogic S905X)**, PC, atau VPS.

Sistem Web-CCTV v2.7 ini menyajikan pemantauan langsung HLS & YouTube, perekaman terjadwal/manual, sinkronisasi hardisk, status penyimpanan riil, dan dukungan multi-bahasa (ID/EN) yang ramah pengguna di berbagai perangkat.

---

## ✨ Fitur Baru & Peningkatan v2.7:

- **Sistem Multi-Bahasa (ID / EN) Toggle**: Tombol cepat pergantian bahasa langsung di pojok atas panel login dan sidebar navigasi.
- **Tampilan Mobile Drawer**: Menu geser responsif (*slide-out menu*) berkelas tinggi yang sangat hemat ruang layar HP.
- **Peta Lokasi CCTV Interaktif (Leaflet + OpenStreetMap)**: Menampilkan lokasi CCTV, mewarnai status penanda (Hijau = Online, Merah = Offline), dan memutar video live langsung di dalam gelembung penanda peta (*map popup live stream*).
- **Penggantian Cron String ke Dropdown**: Menu jadwal rekam sangat mudah dipahami (Pilihan 24 jam penuh, interval menit/jam, atau kustom).
- **Perekaman 24 Jam Non-Stop**: Perekaman berantai back-to-back yang otomatis terpecah-pecah menjadi berkas sequential tanpa terputus.
- **Circular Auto-Cleanup (Pembersih Disk Otomatis)**: Jika disk terpakai melebihi **90%**, sistem otomatis menghapus rekaman `.mp4` terlama secara bertahap hingga kapasitas longgar di bawah **80%** (STB dijamin tidak akan pernah hang/penuh!).
- **Status Disk Terpakai Secara Riil**: Menampilkan gigabyte terpakai, sisa ruang kosong, dan ukuran direktori rekaman langsung di bagian atas halaman Rekaman.
- **Dukungan APK Android Hybrid**: Aplikasi Android cerdas yang mendeteksi jaringan Wi-Fi rumah secara asinkron untuk memuat jaringan lokal, atau otomatis berpindah menggunakan domain secure tunnel Cloudflare saat di luar rumah.

---

## 💾 1. Cara Menghubungkan & Mengaitkan Hardisk 500GB USB (Auto-Mount)

STB HG680P memiliki memori internal yang terbatas (8GB/16GB). Sangat disarankan untuk menghubungkan hardisk eksternal 500GB melalui USB sebagai lokasi penyimpanan rekaman.

Untuk memudahkan Anda, gunakan script otomatisasi `mount-hdd.sh` yang telah disediakan di dalam folder proyek ini:

```bash
# 1. Masuk ke folder proyek Web-CCTV Anda
cd /opt/webcctv

# 2. Berikan hak akses eksekusi script mount
chmod +x mount-hdd.sh

# 3. Jalankan script sebagai ROOT (Sangat Penting!)
sudo ./mount-hdd.sh
```

**Fungsi Script Ini:**
- Memindai USB drive, mendeteksi hardisk 500GB (`/dev/sda`).
- Menawarkan pemformatan aman ke sistem berkas **Linux Ext4** (Ketik **`y`** jika hardisk baru/kosong).
- Mengambil kode UUID stabil hardisk dan mendaftarkannya secara permanen ke `/etc/fstab` dengan proteksi **`nofail`** (STB dijamin aman booting jika hardisk tidak sengaja tercabut).
- Mengaitkan (*mount*) ke folder `/var/lib/webcctv/records` dan memperbarui symlink `public/records` proyek secara otomatis.

### 🔄 Sinkronisasi Basis Data & Menghapus "Rekaman Hantu" (Ghost Logs)

Setelah hardisk baru dipasang, rekaman lama yang terhapus mungkin masih tampil di Web UI Anda. Jalankan skrip pembersih logs database ini untuk menyelaraskannya:

```bash
node sync-db-records.js
```
*Skrip ini akan memindai SQLite, membandingkan berkas fisik di hardisk baru Anda, dan membersihkan logs rekaman lama yang berkasnya sudah tidak ditemukan.*

---

## 🌐 2. Membuka Akses Online Menggunakan Cloudflare Tunnel (HTTPS Gratis)

Cloudflare Tunnel memungkinkan Anda mengakses Web-CCTV dari internet luar tanpa memerlukan IP Publik statis, tanpa VPN, dan tanpa perlu melakukan *port forwarding* di router rumah Anda.

### Langkah 1: Instalasi `cloudflared` di STB HG680P
```bash
# Untuk Armbian 64-bit (aarch64)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
```

### Langkah 2: Login & Otorisasi Domain
```bash
cloudflared tunnel login
```
Salin tautan yang muncul di terminal, tempelkan ke browser Anda, lalu otorisasi domain kustom Anda (misalnya: `domainanda.com`).

### Langkah 3: Buat Tunnel Baru
```bash
cloudflared tunnel create cctv-tunnel
```
*Simpan Tunnel ID (UUID panjang) yang dihasilkan dari perintah ini.*

### Langkah 4: Konfigurasi Berkas `config.yml`
```bash
nano /root/.cloudflared/config.yml
```
Masukkan konfigurasi berikut (ganti `<TUNNEL_ID>` dengan ID tunnel Anda, dan ganti domain dengan domain Anda):
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: cctv.domainanda.com
    service: http://localhost:3000
  - service: http_status:404
```

### Langkah 5: Hubungkan DNS & Daftarkan sebagai Autostart Service
```bash
# 1. Daftarkan DNS CNAME di panel Cloudflare Anda
cloudflared tunnel route dns cctv-tunnel cctv.domainanda.com

# 2. Daftarkan cloudflared sebagai service systemd agar menyala otomatis saat booting
cloudflared service install
sudo systemctl enable --now cloudflared
```
Aplikasi Anda kini sudah sepenuhnya online melalui protokol HTTPS terenkripsi di: **`https://cctv.domainanda.com`**

---

## 📱 3. Membangun (Build) APK Android Cerdas (Offline & Online Hybrid)

Untuk kenyamanan akses, proyek ini menyertakan kode sumber untuk aplikasi Android berbasis Kotlin WebView yang dilengkapi dengan **Deteksi Jaringan Cerdas (Smart Network Detection)**.

### Cara Kerja APK Hybrid:
* **Mode Wi-Fi Rumah (Lokal)**: Saat tersambung ke Wi-Fi rumah, aplikasi mendeteksi ping sukses ke IP lokal STB (`http://192.168.1.18:3000`), lalu langsung memuat halaman lokal. **Visual video HLS terasa instan, nol buffering, dan menghemat kuota internet Anda!**
* **Mode Cloud (Luar Rumah)**: Saat Anda berada di luar rumah (menggunakan data seluler), ping lokal akan gagal. Aplikasi otomatis memuat domain Cloudflare Anda (`https://cctv.domainanda.com`).

### Langkah Build APK di Android Studio:
1. Buka **Android Studio**, pilih **New Project** -> **Empty Activity**.
2. Berikan Package Name: `com.webcctv.app`.
3. Salin berkas-berkas proyek Android yang ada di dalam folder `android-app` hasil unduhan zip ini ke proyek Android Studio Anda:
   - File Manifest: `app/src/main/AndroidManifest.xml` (mengatur izin internet & *usesCleartextTraffic* untuk membolehkan HTTP lokal).
   - File Layout: `app/src/main/res/layout/activity_main.xml` (mengatur WebView dan formulir setup).
   - File Kotlin: `app/src/main/java/com/webcctv/app/MainActivity.kt` (menangani logika ping asinkron 1.2 detik dan penyimpanan persisten SharedPreferences).
4. Klik **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. Berkas APK siap diinstal di HP Android Anda! Pada pembukaan pertama kali, masukkan Alamat Lokal STB dan Domain Cloudflare Anda di halaman setup, lalu nikmati pemantauan CCTV yang cerdas dan lancar!

---

## 🚀 4. Cara Menjalankan Web-CCTV di STB

### Jalankan secara Manual (Pengujian):
```bash
# 1. Masuk ke folder proyek
cd /opt/webcctv

# 2. Instal dependensi
npm install --omit=dev

# 3. Jalankan database initializer
node init-db.js

# 4. Boot server Express
node server.js
```

### Jalankan secara Permanen (Mati Lampu Menyala Otomatis):
Gunakan script autostart otomatis yang ramah systemd:
```bash
chmod +x install-autostart.sh
sudo bash install-autostart.sh
```

**Perintah Pengendalian Layanan:**
```bash
systemctl status webcctv        # Cek status berjalan
systemctl restart webcctv       # Restart layanan
journalctl -u webcctv -f        # Memantau log live server
```

---
## 📝 Ringkasan Panduan Pengeditan Logo & Favicon (Kutipan dari 
README.md
 Baru)
Untuk melakukan kustomisasi merek (branding) Anda sendiri di kemudian hari, ikuti langkah mudah berikut tanpa perlu mengubah baris kode HTML apa pun:

Aset Tampilan	Nama Berkas	Jalur Folder Proyek	Keterangan & Ukuran Ideal
Favicon Tab Browser	favicon.png	/opt/webcctv/public/favicon.png	Format PNG transparan, ukuran ideal 32x32 atau 64x64 piksel.
Logo Aplikasi Utama	logo.png	/opt/webcctv/public/logo.png	Format PNG transparan, ukuran ideal 512x512 piksel (rasio kotak 1:1).
Bagaimana cara kerjanya?: Cukup unggah berkas gambar Anda menggunakan nama dan folder di atas. Aplikasi Web-CCTV v2.7 akan secara dinamis mendeteksi, memuat, dan mengganti logo & favicon lama Anda secara instan setelah halaman dimuat ulang!

## 🛠️ Verifikasi Hasil Akhir Pengujian
Semua berkas diuji menggunakan fungsionalitas pengetesan kompiler Node:

Analisis Sintaksis (node -c public/app.js): LULUS (Nol Error!).
Integrasi HTML (
index.html
): HTML terbaru seberat 65.4KB terverifikasi utuh dengan kode logo dinamis dan favicon ganda.
Express Server: Menyala stabil pada Port 3000 dan melayani respons HTTP/1.1 200 OK dengan sempurna.


## 📝 Lisensi
MIT – Modifikasi bebas untuk kebutuhan personal, perkantoran, perkotaan, dan desa.
Web-CCTV HG680P v2.7 (Multi-lang ID/EN & Smart Mobile Responsive).
