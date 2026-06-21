-- Web CCTV HG680P
-- MySQL / MariaDB
CREATE DATABASE IF NOT EXISTS webcctv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE webcctv;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','public') NOT NULL DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login default:
-- admin / admin123
-- publik / publik123
INSERT INTO users (username, password, role) VALUES
('admin', '$2a$10$VimbPKsC7jabGFtWcf19a.gNLtYmvbBXS/SCuwR6UJEAZkjaNBvZW', 'admin'),
('publik', '$2a$10$iYWd99NSvowJR8HCcolLe.fbbm9RRcpUrqavWEEhcUpkTPLdFdB/6', 'public')
ON DUPLICATE KEY UPDATE username=username;

CREATE TABLE cameras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  rtsp_url VARCHAR(500) NOT NULL,
  nvr_dvr ENUM('ipcam','nvr','dvr','youtube') DEFAULT 'ipcam',
  channel INT DEFAULT 1,
  codec ENUM('h264','h265','auto') DEFAULT 'auto',
  is_public TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  lat DECIMAL(10,7) DEFAULT NULL,
  lng DECIMAL(10,7) DEFAULT NULL,
  youtube_embed VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- contoh kamera
INSERT INTO cameras (name, location, rtsp_url, nvr_dvr, channel, is_public, lat, lng) VALUES
('Gerbang Utama', 'Pos 1', 'rtsp://admin:12345@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0', 'nvr', 1, 1, -6.2088000, 106.8456000),
('Parkir', 'Basement', 'rtsp://admin:12345@192.168.1.101:554/Streaming/Channels/101', 'dvr', 1, 1, -6.2092000, 106.8460000),
('Lobby H.265', 'Lobby', 'rtsp://admin:12345@192.168.1.64:554/h265/ch1/main/av_stream', 'ipcam', 1, 1, -6.2085000, 106.8450000);

-- record log (optional)
CREATE TABLE records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  camera_id INT,
  start_time DATETIME,
  end_time DATETIME,
  file_path VARCHAR(255),
  FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);
