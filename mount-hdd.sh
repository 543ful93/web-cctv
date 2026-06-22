#!/bin/bash

# Web-CCTV HG680P - 500GB USB Hard Disk Automatic Mount Script
# Features: Detect 500GB drive, format to ext4 (optional), stable UUID mount, /etc/fstab persistent entry with nofail protection, link records

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}    Web-CCTV HG680P - 500GB Hard Disk Auto-Mount Installer     ${NC}"
echo -e "${BLUE}================================================================${NC}"

# Check if root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Harap jalankan script ini sebagai root (sudo bash mount-hdd.sh)!${NC}"
  exit 1
fi

echo -e "${YELLOW}1. Memindai daftar hardisk/USB Drive yang tersambung...${NC}"
echo -e "----------------------------------------------------------------"
lsblk -o NAME,FSTYPE,SIZE,LABEL,MOUNTPOINT
echo -e "----------------------------------------------------------------"

# Try to automatically detect a USB drive of around 450GB - 500GB (typically sda, sdb, sdc)
# In Linux, a 500GB HDD displays as ~465.8G or 465G
HDD_DEV=$(lsblk -dno NAME,SIZE | grep -E '465G|465.8G|500G' | awk '{print $1}')

if [ -z "$HDD_DEV" ]; then
    echo -e "${YELLOW}Peringatan: Tidak dapat mendeteksi hardisk ukuran ~500GB secara otomatis.${NC}"
    read -p "Masukkan nama drive hardisk Anda secara manual (contoh: sda, sdb, sda1): " HDD_INPUT
    HDD_DEV=$HDD_INPUT
fi

if [ -z "$HDD_DEV" ]; then
    echo -e "${RED}Error: Tidak ada input drive. Proses dibatalkan.${NC}"
    exit 1
fi

# Fully resolve the device path (e.g., sda -> /dev/sda)
DEV_PATH="/dev/$HDD_DEV"
# If user typed /dev/sda, clean it up
DEV_PATH=$(echo "$DEV_PATH" | sed 's/\/dev\/\/dev\//\/dev\//')

if [ ! -b "$DEV_PATH" ]; then
    echo -e "${RED}Error: Perangkat $DEV_PATH tidak ditemukan atau bukan merupakan block device!${NC}"
    exit 1
fi

echo -e "${GREEN}Terdeteksi perangkat: $DEV_PATH${NC}"
echo -e "Informasi detil:"
file -s "$DEV_PATH" || true

# Ask user if they want to format the hard disk
echo ""
echo -e "⚠️  \x1B[31mPERINGATAN FORMAT HARDISK:\x1B[0m"
echo "Apakah Anda ingin mem-format hardisk ini ke sistem berkas Ext4 Linux (Sangat Direkomendasikan untuk Armbian STB)?"
echo "PILIH 'y' JIKA INGIN DI-FORMAT (SEMUA DATA LAMA AKAN HAPUS)."
echo "Pilih 'n' jika hardisk sudah memiliki data rekaman atau sudah berformat EXT4/NTFS yang ingin dipertahankan."
read -p "Format hardisk? (y/N): " format_confirm

if [[ "$format_confirm" == "Y" || "$format_confirm" == "y" ]]; then
    echo "⚙️ Memulai pemformatan hardisk $DEV_PATH ke ext4 (ini memakan waktu beberapa detik)..."
    # Unmount first if mounted
    umount "$DEV_PATH" 2>/dev/null || true
    # Corrected mkfs.ext4 arguments
    mkfs.ext4 -F "$DEV_PATH"
    if [ $? -eq 0 ]; then
        echo "✅ Format berhasil!"
    else
        echo -e "${RED}Format gagal. Mencoba melanjutkan menggunakan sistem berkas yang sudah ada.${NC}"
    fi
fi

# Define standard recordings mount directory
MOUNT_DIR="/var/lib/webcctv/records"
echo -e "\n${YELLOW}2. Mempersiapkan direktori mount di $MOUNT_DIR ...${NC}"
mkdir -p "$MOUNT_DIR"

# Ensure the drive is unmounted before UUID fetching
umount "$DEV_PATH" 2>/dev/null || true

# Fetch stable UUID
HDD_UUID=$(blkid -o value -s UUID "$DEV_PATH")

# If UUID is still empty, let's try partition check or regenerate UUID
if [ -z "$HDD_UUID" ]; then
    echo -e "${YELLOW}Mencoba membaca informasi filesystem untuk mendeteksi UUID...${NC}"
    HDD_UUID=$(blkid "$DEV_PATH" | grep -o -E 'UUID="[^"]+"' | cut -d'"' -f2)
fi

if [ -z "$HDD_UUID" ]; then
    echo -e "${RED}Error: Gagal mendeteksi UUID untuk $DEV_PATH.${NC}"
    echo -e "${YELLOW}Silakan ketik 'blkid $DEV_PATH' di terminal Anda untuk memeriksa apakah partisi sudah terdeteksi.${NC}"
    exit 1
fi

echo -e "${GREEN}UUID Hardisk Terdeteksi: $HDD_UUID${NC}"

# Check if already mounted in fstab
if grep -q "$HDD_UUID" /etc/fstab; then
    echo -e "${YELLOW}UUID ini sudah terdaftar di /etc/fstab. Melewati proses penulisan fstab.${NC}"
else
    echo -e "${YELLOW}3. Menambahkan entri mount otomatis permanen di /etc/fstab ...${NC}"
    # Detect filesystem type of the device
    FS_TYPE=$(blkid -o value -s TYPE "$DEV_PATH")
    if [ -z "$FS_TYPE" ]; then
        FS_TYPE="ext4" # default fallback
    fi
    
    # We use 'nofail' option so that if the harddisk is unplugged, the STB will still boot successfully without crashing!
    FSTAB_ENTRY="UUID=$HDD_UUID $MOUNT_DIR $FS_TYPE defaults,noatime,nofail 0 2"
    echo "$FSTAB_ENTRY" >> /etc/fstab
    echo -e "${GREEN}Berhasil menambahkan entri ke /etc/fstab:${NC}"
    echo "  $FSTAB_ENTRY"
fi

# Mount the hard disk
echo -e "\n${YELLOW}4. Melakukan pengaitan (mount) hardisk...${NC}"
mount -a
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hardisk 500GB Berhasil Terkait (Mounted) di $MOUNT_DIR!${NC}"
else
    echo -e "${RED}Gagal mount otomatis via /etc/fstab. Mencoba mount langsung...${NC}"
    mount "$DEV_PATH" "$MOUNT_DIR"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Berhasil mount langsung di $MOUNT_DIR!${NC}"
    else
        echo -e "${RED}Error: Gagal mengaitkan hardisk. Harap cek format partisi Anda!${NC}"
        exit 1
    fi
fi

# Set permissions so Node.js can write to the HDD
chown -R root:root "$MOUNT_DIR" 2>/dev/null || true
chmod -R 777 "$MOUNT_DIR"

# Ensure Web-CCTV folder exists
mkdir -p "$MOUNT_DIR"

# Membuat berkas pengaman detektor status mount (Mata-Mata Hardisk untuk server)
touch "$MOUNT_DIR/.cctv_hdd_active"
chmod 777 "$MOUNT_DIR/.cctv_hdd_active"

# Update/Verify symlink inside Web-CCTV folder
# If Web-CCTV is installed at /opt/webcctv or /root/web-cctv, update the symlink public/records
PROJECT_DIR="/opt/webcctv"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/root/web-cctv"
fi

if [ -d "$PROJECT_DIR" ]; then
    echo -e "\n${YELLOW}5. Memperbarui symlink folder rekaman di project Web-CCTV...${NC}"
    rm -rf "$PROJECT_DIR/public/records"
    ln -sf "$MOUNT_DIR" "$PROJECT_DIR/public/records"
    echo -e "${GREEN}Symlink dibuat: $PROJECT_DIR/public/records -> $MOUNT_DIR${NC}"
    
    # Perbarui file .env agar server selalu menulis langsung ke Hardisk tanpa tergantung symlink (Double-Protection!)
    if [ -f "$PROJECT_DIR/.env" ]; then
        if grep -q "RECORD_DIR=" "$PROJECT_DIR/.env"; then
            sed -i "s|RECORD_DIR=.*|RECORD_DIR=$MOUNT_DIR|g" "$PROJECT_DIR/.env"
        else
            echo "RECORD_DIR=$MOUNT_DIR" >> "$PROJECT_DIR/.env"
        fi
        echo -e "${GREEN}Konfigurasi .env diperbarui: RECORD_DIR=$MOUNT_DIR${NC}"
    fi
    
    # Restart the service to apply everything cleanly
    echo -e "${YELLOW}6. Memulai ulang layanan Web-CCTV...${NC}"
    systemctl restart webcctv 2>/dev/null || pm2 restart server 2>/dev/null || node "$PROJECT_DIR/server.js" &
    echo -e "${GREEN}✅ Selesai! Layanan di-restart.${NC}"
else
    echo -e "\n${YELLOW}Peringatan: Direktori Web-CCTV tidak ditemukan di /opt/webcctv maupun /root/web-cctv.${NC}"
    echo "Harap pastikan Anda membuat symlink secara manual dari folder 'public/records' aplikasi Anda ke '$MOUNT_DIR'!"
    echo "  Command: ln -sf $MOUNT_DIR /jalur/ke/web-cctv/public/records"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}      PROSES AUTO-MOUNT PERMANEN HARDISK 500GB BERHASIL!        ${NC}"
echo -e "  - Lokasi Penyimpanan: $MOUNT_DIR"
echo -e "  - Status Mount Otomatis: Aktif permanen di /etc/fstab (Aman Booting)"
echo -e "  - Kapasitas Terdeteksi:"
df -h "$MOUNT_DIR"
echo -e "${GREEN}================================================================${NC}"
