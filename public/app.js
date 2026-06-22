// Web-CCTV SPA JavaScript Application with ultimate fail-safes for loading & sandboxes
// Features: Multi-language (ID/EN) Toggle, HLS Live Stream with reconnect, leaflet map with direct live camera in map popups, CRUD, dashboard, settings, records

// ================= SAFE STORAGE UTILITY =================
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return this._fallback[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      this._fallback[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      delete this._fallback[key];
    }
  },
  _fallback: {}
};

// ================= I18N DICTIONARY =================
const i18n = {
  id: {
    // Navigation & Common
    menu_dashboard: "Dasbor",
    menu_live: "Live CCTV",
    menu_map: "Peta Lokasi",
    menu_records: "Rekaman",
    menu_cameras: "Kelola Kamera",
    menu_users: "Kelola User",
    menu_settings: "Pengaturan",
    menu_monitor: "Monitor Publik (Terpisah)",
    logout: "Keluar",
    login: "Masuk",
    username: "Nama Pengguna",
    password: "Kata Sandi",
    role: "Peran",
    admin: "Administrator",
    public: "Publik",
    status: "Status",
    online: "Online",
    offline: "Offline",
    unknown: "Tidak Diketahui",
    action: "Aksi",
    save: "Simpan",
    cancel: "Batal",
    edit: "Ubah",
    delete: "Hapus",
    loading: "Memuat data...",
    no_data: "Tidak ada data ditemukan",
    success: "Sukses!",
    error: "Terjadi kesalahan!",

    // Dashboard View
    dash_welcome: "Dasbor Pemantauan",
    dash_sub: "Statistik real-time sistem dan status koneksi kamera CCTV.",
    stat_total_cams: "Total Kamera",
    stat_online: "Online",
    stat_offline: "Offline",
    stat_streaming: "Transcode Aktif",
    stat_recording: "Perekaman Aktif",
    stat_records_size: "Penyimpanan Rekaman",
    stat_host: "Platform",
    stat_status: "Status Layanan",
    dash_quick_status: "Status Deteksi Koneksi Kamera",
    dash_sys_info: "Spesifikasi & Informasi",
    sys_db: "Database",
    sys_resolution: "Resolusi Default",
    dash_sys_hint: "Gunakan RTSP Transcode hanya untuk kamera aktif di browser. Gunakan HLS direct (.m3u8) atau YouTube Live Embed untuk menghemat beban CPU STB Anda secara dramatis.",

    // Live Grid View
    search_placeholder: "Cari nama kamera atau lokasi...",
    all_locations: "Semua Lokasi",
    live_in_grid: "Live di Grid",
    play_title: "Putar Aliran Live",
    snapshot_mode_tip: "Snapshot (diperbarui tiap 15s) • Klik untuk play live",
    live_mode_tip: "Streaming Live Aktif",

    // Map View
    map_title: "Peta Kamera",
    map_sub: "Menampilkan lokasi geografis kamera CCTV beserta status terbarunya.",
    view_live: "Lihat Live Stream",
    camera_list_title: "Daftar Kamera",
    search_placeholder_map: "Cari kamera...",

    // Recordings View
    records_title: "File Rekaman MP4",
    records_sub: "Unduh atau tonton rekaman terjadwal dan manual kamera CCTV.",
    all_cameras: "Semua Kamera",
    rec_start: "Waktu Mulai",
    rec_end: "Waktu Selesai",
    rec_duration: "Durasi",
    rec_size: "Ukuran",
    records_empty: "Tidak ada file rekaman ditemukan.",
    delete_all_records: "Hapus Semua",
    play_recording: "Putar Rekaman",

    // Cameras Admin View
    cameras_title: "Manajemen Kamera",
    cameras_sub_admin: "Tambahkan, ubah, atau hapus konfigurasi kamera CCTV dalam sistem.",
    add_camera: "Tambah Kamera",
    edit_camera: "Edit Kamera",
    camera_name: "Nama Kamera",
    camera_name_req: "Nama Kamera *",
    location: "Lokasi",
    stream_type: "Tipe Stream / DVR",
    stream_url_req: "RTSP URL / .m3u8 Stream *",
    channel: "Channel",
    youtube_embed: "YouTube Video ID",
    latitude: "Latitude (Peta)",
    longitude: "Longitude (Peta)",
    record_enabled: "Aktifkan Perekaman Otomatis Terjadwal",
    record_schedule: "Jadwal Cron Mini",
    record_duration: "Durasi Perekaman (Detik)",
    is_public: "Publik (Dilihat Tanpa Login Admin)",
    is_active: "Kamera Aktif / Diaktifkan",
    visibility: "Visibilitas",
    active: "Aktif",
    records: "Rekaman",

    // Users Admin View
    users_title: "Manajemen Pengguna",
    users_sub: "Kelola akun administrator dan publik untuk mengontrol akses CCTV.",
    add_user: "Tambah User",
    edit_user: "Edit User",
    username_req: "Username *",
    pwd_req: "Kata Sandi *",
    pwd_hint: "Kosongkan jika tidak ingin merubah password.",
    role_public: "Publik (Hanya Lihat)",
    role_admin: "Admin (Kontrol Penuh)",
    created_at: "Dibuat Pada",

    // Settings View
    settings_title: "Pengaturan Sistem",
    settings_sub: "Kustomisasi metadata aplikasi dan ganti kata sandi login Anda.",
    app_settings: "Pengaturan Tampilan Aplikasi",
    setting_name: "Nama Aplikasi",
    setting_sub: "Subtitle Aplikasi",
    setting_running: "Teks Berjalan Utama",
    setting_footer: "Kaki Halaman (Footer)",
    change_password: "Ganti Kata Sandi",
    pwd_old: "Kata Sandi Lama",
    pwd_new: "Kata Sandi Baru",
    pwd_new_confirm: "Konfirmasi Kata Sandi Baru",

    // Player Modal
    loading_stream: "Memulai streaming, silakan tunggu...",
    stream_stats: "Status Aliran Data",
    latency: "Metode",
    uptime: "Uptime Stream",
    reconnection: "Percobaan Reconnect",
    manual_recorder: "Perekam Manual",
    seconds: "detik",
    start_record: "Mulai Rekam",
    stop_record: "Hentikan Rekam",
    stop_ffmpeg_stream: "Matikan FFmpeg Stream",
    show_ffmpeg_log: "Lihat Log FFmpeg",
    hide_ffmpeg_log: "Sembunyikan Log FFmpeg",
    ffmpeg_log_tail: "Buntut Log Transcoder FFmpeg",
    recording: "Merekam...",
    login_desc: "Masukkan kredensial Anda untuk mengakses streaming CCTV."
  },
  en: {
    // Navigation & Common
    menu_dashboard: "Dashboard",
    menu_live: "Live CCTV",
    menu_map: "Location Map",
    menu_records: "Recordings",
    menu_cameras: "Manage Cameras",
    menu_users: "Manage Users",
    menu_settings: "Settings",
    menu_monitor: "Public Monitor (Separate)",
    logout: "Logout",
    login: "Login",
    username: "Username",
    password: "Password",
    role: "Role",
    admin: "Administrator",
    public: "Public",
    status: "Status",
    online: "Online",
    offline: "Offline",
    unknown: "Unknown",
    action: "Action",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading data...",
    no_data: "No data found",
    success: "Success!",
    error: "An error occurred!",

    // Dashboard View
    dash_welcome: "Monitoring Dashboard",
    dash_sub: "Real-time system statistics and CCTV camera connection statuses.",
    stat_total_cams: "Total Cameras",
    stat_online: "Online",
    stat_offline: "Offline",
    stat_streaming: "Active Transcodes",
    stat_recording: "Active Recordings",
    stat_records_size: "Recorded Storage",
    stat_host: "Platform",
    stat_status: "Service Status",
    dash_quick_status: "Camera Detection Status",
    dash_sys_info: "Specification & Information",
    sys_db: "Database",
    sys_resolution: "Default Resolution",
    dash_sys_hint: "Use RTSP Transcode only for cameras being viewed actively in the browser. Use HLS direct (.m3u8) or YouTube Live Embed to dramatically reduce STB CPU load.",

    // Live Grid View
    search_placeholder: "Search camera name or location...",
    all_locations: "All Locations",
    live_in_grid: "Live in Grid",
    play_title: "Play Live Stream",
    snapshot_mode_tip: "Snapshot (updated every 15s) • Click to play live",
    live_mode_tip: "Live Streaming Active",

    // Map View
    map_title: "Camera Map",
    map_sub: "Displays geographical location of CCTV cameras with their latest status.",
    view_live: "View Live Stream",
    camera_list_title: "Camera List",
    search_placeholder_map: "Search camera...",

    // Recordings View
    records_title: "MP4 Recording Files",
    records_sub: "Download or watch scheduled and manual recordings of CCTV cameras.",
    all_cameras: "All Cameras",
    rec_start: "Start Time",
    rec_end: "End Time",
    rec_duration: "Duration",
    rec_size: "Size",
    records_empty: "No recording files found.",
    delete_all_records: "Delete All",
    play_recording: "Play Recording",

    // Cameras Admin View
    cameras_title: "Cameras Management",
    cameras_sub_admin: "Add, edit, or delete CCTV camera configurations in the system.",
    add_camera: "Add Camera",
    edit_camera: "Edit Camera",
    camera_name: "Camera Name",
    camera_name_req: "Camera Name *",
    location: "Location",
    stream_type: "Stream / DVR Type",
    stream_url_req: "RTSP URL / .m3u8 Stream *",
    channel: "Channel",
    youtube_embed: "YouTube Video ID",
    latitude: "Latitude (Map)",
    longitude: "Longitude (Map)",
    record_enabled: "Enable Automatic Scheduled Recording",
    record_schedule: "Cron Schedule",
    record_duration: "Record Duration (Sec)",
    is_public: "Public (Visible Without Admin Login)",
    is_active: "Active / Enabled Camera",
    visibility: "Visibility",
    active: "Active",
    records: "Recordings",

    // Users Admin View
    users_title: "Users Management",
    users_sub: "Manage administrator and public accounts to control CCTV access.",
    add_user: "Add User",
    edit_user: "Edit User",
    username_req: "Username *",
    pwd_req: "Password *",
    pwd_hint: "Leave blank if you do not want to change password.",
    role_public: "Public (View Only)",
    role_admin: "Admin (Full Control)",
    created_at: "Created At",

    // Settings View
    settings_title: "System Settings",
    settings_sub: "Customize application metadata and change your login password.",
    app_settings: "App Appearance Settings",
    setting_name: "Application Name",
    setting_sub: "Application Subtitle",
    setting_running: "Main Running Text",
    setting_footer: "Site Footer",
    change_password: "Change Password",
    pwd_old: "Old Password",
    pwd_new: "New Password",
    pwd_new_confirm: "Confirm New Password",

    // Player Modal
    loading_stream: "Starting stream, please wait...",
    stream_stats: "Stream Stream Stats",
    latency: "Method",
    uptime: "Stream Uptime",
    reconnection: "Reconnect Attempt",
    manual_recorder: "Manual Recorder",
    seconds: "seconds",
    start_record: "Start Recording",
    stop_record: "Stop Recording",
    stop_ffmpeg_stream: "Kill FFmpeg Stream",
    show_ffmpeg_log: "View FFmpeg Log",
    hide_ffmpeg_log: "Hide FFmpeg Log",
    ffmpeg_log_tail: "FFmpeg Transcoder Log Tail",
    recording: "Recording...",
    login_desc: "Enter your credentials to access CCTV streams."
  }
};

// State Management & Safe Session Load
let currentLanguage = safeStorage.getItem("lang") || "id";
let currentUser = null;
try {
  const storedUser = safeStorage.getItem("user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
} catch {
  safeStorage.removeItem("user");
}

let currentView = "dashboard";
let camerasList = [];
let recordsList = [];
let mapInstance = null;
let mapMarkers = [];
let mapStatusesList = []; // Local cache of map statuses
let activePlayerHls = null;
let activePopupHls = null; // direct map popup player instance
let hlsInGridInstances = new Map(); // keep track of grid HLS instances
let liveGridInterval = null;
let snapshotInterval = null;
let dashboardClockInterval = null;
let playerUptimeInterval = null;
let activeLogInterval = null;

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Setup clock
    startDashboardClock();
    
    // Apply language on load
    setLanguage(currentLanguage);

    // Authenticate user session
    checkAuthSession();

    // Attach nav event listeners
    document.querySelectorAll("#nav-menu button").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetView = btn.getAttribute("data-view");
        navigateToView(targetView);
      });
    });
  } catch (err) {
    console.error("Critical initialization failure:", err);
  } finally {
    // ALWAYS hide the global loading screen once initialization is done!
    hideLoader();
  }
});

// ================= AUTHENTICATION =================
function checkAuthSession() {
  const token = safeStorage.getItem("token");
  
  if (token && currentUser) {
    // Session is valid
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");
    if (loginContainer) loginContainer.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");

    // Set User Profile UI info
    const userNameEl = document.getElementById("user-display-name");
    const userRoleEl = document.getElementById("user-display-role");
    const pwdUsernameEl = document.getElementById("pwd-username");
    if (userNameEl) userNameEl.innerText = currentUser.username;
    if (pwdUsernameEl) pwdUsernameEl.value = currentUser.username;
    if (userRoleEl) {
      userRoleEl.innerText = currentUser.role === 'admin' ? 
        (currentLanguage === 'id' ? "Administrator" : "Administrator") : 
        (currentLanguage === 'id' ? "Publik (Hanya Lihat)" : "Public (View Only)");
    }

    // Toggle Admin menus
    if (currentUser.role === "admin") {
      document.querySelectorAll(".admin-only").forEach(el => el.classList.remove("hidden"));
    } else {
      document.querySelectorAll(".admin-only").forEach(el => el.classList.add("hidden"));
    }

    // Load initial configurations (Settings, ticker, etc.)
    loadAppConfigs();
    navigateToView(currentView);
  } else {
    // Show login page
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");
    if (loginContainer) loginContainer.classList.remove("hidden");
    if (appContainer) appContainer.classList.add("hidden");
  }
  
  hideLoader();
}

async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("login-username").value;
  const p = document.getElementById("login-password").value;
  
  showLoader(currentLanguage === 'id' ? "Mencoba masuk..." : "Logging in...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login Gagal");

    safeStorage.setItem("token", data.token);
    safeStorage.setItem("user", JSON.stringify({ username: data.username, role: data.role }));
    currentUser = { username: data.username, role: data.role };

    showToast(currentLanguage === 'id' ? "Login Berhasil!" : "Login Successful!", "success");
    checkAuthSession();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoader();
  }
}

function handleLogout() {
  safeStorage.removeItem("token");
  safeStorage.removeItem("user");
  currentUser = null;
  // Cleanup intervals
  clearInterval(liveGridInterval);
  clearInterval(snapshotInterval);
  cleanupAllHlsInGrid();
  if (activePlayerHls) {
    activePlayerHls.destroy();
    activePlayerHls = null;
  }
  if (activePopupHls) {
    activePopupHls.destroy();
    activePopupHls = null;
  }
  
  checkAuthSession();
}

// ================= LANGUAGE HANDLING =================
function setLanguage(lang) {
  currentLanguage = lang;
  safeStorage.setItem("lang", lang);

  // Toggle buttons highlight
  const applyBtnClass = (elId, isActive, darkBg = "bg-slate-700") => {
    const el = document.getElementById(elId);
    if (el) {
      el.className = isActive ? 
        `px-2 py-0.5 rounded transition font-medium text-blue-400 ${darkBg}` :
        "px-2 py-0.5 rounded transition font-medium text-slate-400 hover:text-slate-200";
    }
  };

  const isId = lang === "id";
  applyBtnClass("lang-id-btn", isId, "bg-slate-700");
  applyBtnClass("lang-en-btn", !isId, "bg-slate-700");
  applyBtnClass("mobile-lang-id-btn", isId, "bg-slate-800");
  applyBtnClass("mobile-lang-en-btn", !isId, "bg-slate-800");
  applyBtnClass("login-lang-id-btn", isId, "bg-slate-800");
  applyBtnClass("login-lang-en-btn", !isId, "bg-slate-800");

  // Update DOM translated keys
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[lang] && i18n[lang][key]) {
      el.innerText = i18n[lang][key];
    }
  });

  // Update Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (i18n[lang] && i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  // Reload current view to update content translation dynamically
  if (currentUser) {
    updateDynamicTranslations();
  }
}

function updateDynamicTranslations() {
  // Update User role text based on lang
  const userRoleEl = document.getElementById("user-display-role");
  if (userRoleEl) {
    userRoleEl.innerText = currentUser.role === 'admin' ? 
      (currentLanguage === 'id' ? "Administrator" : "Administrator") : 
      (currentLanguage === 'id' ? "Publik (Hanya Lihat)" : "Public (View Only)");
  }

  // Re-render components with translated dynamic variables
  if (currentView === "dashboard") {
    loadDashboardStats();
  } else if (currentView === "live") {
    renderLiveCamerasGrid();
  } else if (currentView === "records") {
    loadRecords();
  } else if (currentView === "cameras") {
    loadAdminCameras();
  } else if (currentView === "users") {
    loadAdminUsers();
  }
}

// ================= CONFIGURATION / SETTINGS =================
let appConfigs = {};
async function loadAppConfigs() {
  try {
    const res = await fetch("/api/settings");
    appConfigs = await res.json();
    
    // Apply Settings to UI
    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setInner("app-title-name", appConfigs.app_name || "Web-CCTV");
    setInner("app-title-sub", appConfigs.app_sub || "HG680P");
    setInner("mobile-app-title", appConfigs.app_name || "Web-CCTV");
    setInner("mobile-app-sub", appConfigs.app_sub || "HG680P");
    setInner("login-app-name", appConfigs.app_name || "Web-CCTV");
    setInner("app-footer-text", appConfigs.site_footer || "Web-CCTV HG680P");
    setInner("ticker-text", appConfigs.running_text || "Web-CCTV Live Stream Transcoder Active");
    
    // Populate Setting Inputs
    setVal("setting-app-name", appConfigs.app_name || "");
    setVal("setting-app-sub", appConfigs.app_sub || "");
    setVal("setting-running-text", appConfigs.running_text || "");
    setVal("setting-site-footer", appConfigs.site_footer || "");

  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

// ================= VIEW NAVIGATION =================
function navigateToView(viewId) {
  currentView = viewId;

  // Cleanup periodic intervals
  clearInterval(liveGridInterval);
  clearInterval(snapshotInterval);
  cleanupAllHlsInGrid();
  if (activePopupHls) {
    activePopupHls.destroy();
    activePopupHls = null;
  }

  // On mobile, close sidebar after clicking link
  const sidebar = document.getElementById("sidebar");
  if (sidebar && !sidebar.classList.contains("-translate-x-full") && window.innerWidth < 768) {
    toggleMobileSidebar();
  }

  // Highlight active nav item
  document.querySelectorAll("#nav-menu button").forEach(btn => {
    if (btn.getAttribute("data-view") === viewId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Toggle View panels
  document.querySelectorAll(".view-section").forEach(sec => {
    if (sec.id === `view-view-${viewId}` || sec.id === `view-${viewId}`) {
      sec.classList.remove("hidden");
    } else {
      sec.classList.add("hidden");
    }
  });

  // Trigger View actions
  if (viewId === "dashboard") {
    loadDashboardStats();
  } else if (viewId === "live") {
    loadLiveCamsGrid();
  } else if (viewId === "map") {
    initLeafletMap();
  } else if (viewId === "records") {
    loadRecordsAndCamerasFilter();
    loadActiveRecordings();
    loadStorageStatus();
    // Poll active recordings, storage space, and files list every 5 seconds for full real-time updates!
    liveGridInterval = setInterval(() => {
      loadActiveRecordings();
      loadStorageStatus();
      loadRecords();
    }, 5000);
  } else if (viewId === "cameras") {
    loadAdminCameras();
  } else if (viewId === "users") {
    loadAdminUsers();
  }
}

// ================= MOBILE NAVIGATION DRAWER =================
function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar || !backdrop) return;

  if (sidebar.classList.contains("-translate-x-full")) {
    // Open Drawer
    sidebar.classList.remove("-translate-x-full");
    backdrop.classList.remove("hidden");
    backdrop.classList.remove("pointer-events-none");
    setTimeout(() => {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");
    }, 50);
  } else {
    // Close Drawer
    sidebar.classList.add("-translate-x-full");
    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0");
    backdrop.classList.add("pointer-events-none");
    setTimeout(() => {
      backdrop.classList.add("hidden");
    }, 300);
  }
}

// ================= CLOCK =================
function startDashboardClock() {
  if (dashboardClockInterval) clearInterval(dashboardClockInterval);
  dashboardClockInterval = setInterval(() => {
    const clockEl = document.getElementById("dash-clock");
    if (clockEl) {
      const now = new Date();
      clockEl.querySelector("span").innerText = now.toLocaleString(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    }
  }, 1000);
}

// ================= VIEW: DASHBOARD =================
async function loadDashboardStats() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/dashboard", { headers });
    const stats = await res.json();

    const setInner = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setInner("stat-total-cams", stats.totalCam);
    setInner("stat-online-cams", stats.online);
    setInner("stat-offline-cams", stats.offline);
    setInner("stat-streaming-now", stats.streamingNow);
    setInner("stat-recording-now", stats.recordingNow);
    setInner("stat-records-size", stats.recordsSizeMb + " MB");

    // Load CPU, RAM, and Temperature dynamically!
    try {
      const resSpecs = await fetch("/api/system/specs", { headers });
      const specs = await resSpecs.json();
      
      const cpuEl = document.getElementById("sys-cpu");
      const tempEl = document.getElementById("sys-temp");
      const ramEl = document.getElementById("sys-ram");

      if (cpuEl) cpuEl.innerText = `${specs.cpu}%`;
      if (tempEl) {
        if (specs.temp) {
          tempEl.innerText = `${specs.temp} °C`;
          const t = parseFloat(specs.temp);
          if (t >= 75) {
            tempEl.className = "font-mono font-bold text-red-500 animate-pulse";
          } else if (t >= 60) {
            tempEl.className = "font-mono font-bold text-amber-500";
          } else {
            tempEl.className = "font-mono font-bold text-emerald-500";
          }
        } else {
          tempEl.innerText = "N/A";
          tempEl.className = "font-mono font-semibold text-slate-500";
        }
      }
      if (ramEl) {
        ramEl.innerText = `${specs.ram_used} / ${specs.ram_total} GB (${specs.ram_percent}%)`;
      }
    } catch (e) {
      console.error("Gagal memuat system specs:", e.message);
    }

    // Load Camera Connection Status list
    const resCams = await fetch("/api/cameras/status", { headers });
    const camStatus = await resCams.json();
    
    const listEl = document.getElementById("dash-cams-status-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    
    if (camStatus.length === 0) {
      listEl.innerHTML = `<div class="text-slate-500 text-xs py-4 text-center">${currentLanguage === 'id' ? "Belum ada kamera yang didaftarkan" : "No cameras registered yet"}</div>`;
      return;
    }

    camStatus.forEach(cam => {
      const isOnline = cam.online;
      const iconColor = isOnline ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10";
      const statusBadge = isOnline ? 
        `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">ONLINE</span>` :
        `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400">OFFLINE</span>`;

      let detailMsg = cam.msg || "";
      if (detailMsg === 'streaming') detailMsg = currentLanguage === 'id' ? 'Sedang streaming' : 'Active stream';
      else if (detailMsg === 'snapshot ok') detailMsg = currentLanguage === 'id' ? 'Deteksi snapshot berhasil' : 'Snapshot detection ok';
      else if (detailMsg === 'http/hls') detailMsg = currentLanguage === 'id' ? 'HLS eksternal' : 'External HLS';
      else if (detailMsg === 'probe ok') detailMsg = currentLanguage === 'id' ? 'Deteksi probe berhasil' : 'Probe detection ok';

      const ageText = cam.snapAge !== null ? 
        (currentLanguage === 'id' ? `Snapshot ${cam.snapAge}s lalu` : `Snapshot ${cam.snapAge}s ago`) : "";

      const div = document.createElement("div");
      div.className = "flex items-center justify-between py-2 text-xs md:text-sm";
      div.innerHTML = `
        <div class="flex items-center space-x-2 md:space-x-3 overflow-hidden">
          <div class="p-1.5 md:p-2 rounded ${iconColor} flex-shrink-0">
            <i class="fa-solid fa-camera"></i>
          </div>
          <div class="overflow-hidden">
            <span class="font-semibold text-slate-200 block truncate max-w-[120px] sm:max-w-xs">${cam.name}</span>
            <span class="text-[10px] text-slate-400 truncate block">${detailMsg} ${ageText ? '• ' + ageText : ''}</span>
          </div>
        </div>
        <div class="flex-shrink-0">
          ${statusBadge}
        </div>
      `;
      listEl.appendChild(div);
    });

  } catch (err) {
    console.error("Dashboard failed to load:", err);
  }
}

// ================= VIEW: LIVE CCTV GRID =================
async function loadLiveCamsGrid() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/cameras", { headers });
    camerasList = await res.json();
    
    // Populate locations list
    const locations = [...new Set(camerasList.map(c => c.location).filter(Boolean))];
    const locFilter = document.getElementById("live-filter-location");
    if (locFilter) {
      locFilter.innerHTML = `<option value="">${currentLanguage === 'id' ? "Semua Lokasi" : "All Locations"}</option>`;
      locations.forEach(loc => {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.innerText = loc;
        locFilter.appendChild(opt);
      });
    }

    // Handle searching & filtering
    const searchEl = document.getElementById("live-search");
    if (searchEl) searchEl.oninput = renderLiveCamerasGrid;
    if (locFilter) locFilter.onchange = renderLiveCamerasGrid;

    // Initial render
    renderLiveCamerasGrid();

    // Set snapshot refresh timer if Grid Live is off
    startSnapshotRefreshTimer();

  } catch (err) {
    console.error("Failed to load cameras grid:", err);
  }
}

function renderLiveCamerasGrid() {
  cleanupAllHlsInGrid();

  const searchEl = document.getElementById("live-search");
  const locFilter = document.getElementById("live-filter-location");
  const gridToggle = document.getElementById("live-grid-toggle");

  const searchQuery = searchEl ? searchEl.value.toLowerCase() : "";
  const locationFilter = locFilter ? locFilter.value : "";
  const liveGridOn = gridToggle ? gridToggle.checked : false;

  const filtered = camerasList.filter(cam => {
    const matchSearch = cam.name.toLowerCase().includes(searchQuery) || (cam.location && cam.location.toLowerCase().includes(searchQuery));
    const matchLocation = !locationFilter || cam.location === locationFilter;
    return matchSearch && matchLocation;
  });

  const gridEl = document.getElementById("live-cameras-grid");
  if (!gridEl) return;
  gridEl.innerHTML = "";

  if (filtered.length === 0) {
    gridEl.innerHTML = `<div class="col-span-full text-slate-500 py-12 text-center" data-i18n="no_data">${currentLanguage === 'id' ? "Tidak ada kamera ditemukan" : "No cameras found"}</div>`;
    return;
  }

  filtered.forEach(cam => {
    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition duration-300 flex flex-col group relative shadow-lg cursor-pointer";
    card.setAttribute("onclick", `openPlayerModal(${cam.id})`);

    const hasYoutube = cam.youtube_embed || cam.nvr_dvr === 'youtube';
    const hasHls = cam.rtsp_url.includes(".m3u8") || cam.nvr_dvr === 'hls';
    const streamTypeBadge = hasYoutube ? 
      `<span class="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold flex-shrink-0">YouTube</span>` :
      (hasHls ? `<span class="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold flex-shrink-0">HLS Live</span>` : 
                `<span class="bg-purple-600 text-white px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold flex-shrink-0">RTSP Cam</span>`);

    let displayScreenHTML = "";
    if (liveGridOn) {
      // Direct Live Play Mode in card
      displayScreenHTML = `
        <div class="aspect-video bg-black flex items-center justify-center relative overflow-hidden" id="grid-player-container-${cam.id}">
          <video id="grid-video-${cam.id}" class="w-full h-full object-cover" muted playsinline autoplay></video>
          <iframe id="grid-iframe-${cam.id}" class="w-full h-full object-cover hidden" frameborder="0"></iframe>
          <div id="grid-loader-${cam.id}" class="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center space-y-1">
            <i class="fa-solid fa-spinner animate-spin text-blue-500 text-sm"></i>
            <span class="text-[9px] text-slate-400">Connecting...</span>
          </div>
        </div>
      `;
    } else {
      // Snapshot Mode (loads JPG snapshots)
      const snapUrl = `/api/snapshot/${cam.id}?t=${Date.now()}`;
      displayScreenHTML = `
        <div class="aspect-video bg-slate-950 overflow-hidden relative flex items-center justify-center">
          <img src="${snapUrl}" data-cam-id="${cam.id}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${cam.name}" onerror="this.src='/snapshot-placeholder.svg?text='+encodeURIComponent('${cam.name}')">
          <div class="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition duration-300"></div>
          <div class="absolute bottom-2 right-2 bg-slate-950/80 text-slate-300 p-1.5 rounded-lg text-xs hover:bg-slate-950 transition opacity-0 group-hover:opacity-100 duration-300">
            <i class="fa-solid fa-expand"></i>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      ${displayScreenHTML}
      <div class="p-3.5 flex flex-col justify-between flex-1 space-y-2">
        <div class="flex items-start justify-between space-x-2">
          <div class="overflow-hidden flex-1">
            <h3 class="font-bold text-slate-100 group-hover:text-blue-400 transition truncate text-xs md:text-sm" title="${cam.name}">${cam.name}</h3>
            <span class="text-[10px] md:text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
              <i class="fa-solid fa-location-dot text-[9px] flex-shrink-0"></i>
              <span class="truncate">${cam.location || "--"}</span>
            </span>
          </div>
          ${streamTypeBadge}
        </div>
      </div>
    `;

    gridEl.appendChild(card);

    // If live grid is ON, initialize stream immediately on render
    if (liveGridOn) {
      setTimeout(() => initGridLiveStream(cam), 100);
    }
  });
}

function startSnapshotRefreshTimer() {
  if (snapshotInterval) clearInterval(snapshotInterval);
  snapshotInterval = setInterval(() => {
    const gridToggle = document.getElementById("live-grid-toggle");
    const liveGridOn = gridToggle ? gridToggle.checked : false;
    if (!liveGridOn && currentView === "live") {
      document.querySelectorAll("#live-cameras-grid img").forEach(img => {
        const id = img.getAttribute("data-cam-id");
        if (id) {
          img.src = `/api/snapshot/${id}?t=${Date.now()}`;
        }
      });
    }
  }, 15000); // refresh snapshots every 15 seconds
}

function toggleLiveInGrid(toggle) {
  renderLiveCamerasGrid();
  if (!toggle.checked) {
    startSnapshotRefreshTimer();
  } else {
    clearInterval(snapshotInterval);
  }
}

// Play real-time streams directly in CCTV grid cards
async function initGridLiveStream(cam) {
  const container = document.getElementById(`grid-player-container-${cam.id}`);
  const video = document.getElementById(`grid-video-${cam.id}`);
  const iframe = document.getElementById(`grid-iframe-${cam.id}`);
  const loader = document.getElementById(`grid-loader-${cam.id}`);

  if (!container || !video || !iframe) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/stream/${cam.id}/start`, { method: "POST", headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    if (data.youtube) {
      // Play YouTube in iframe
      iframe.src = `https://www.youtube.com/embed/${data.youtube}?autoplay=1&mute=1&controls=0&rel=0`;
      iframe.classList.remove("hidden");
      video.classList.add("hidden");
      if (loader) loader.classList.add("hidden");
    } else if (data.hls) {
      // HLS play
      let hlsUrl = data.hls;
      if (Hls.isSupported()) {
        const hls = new Hls({ maxMaxBufferLength: 5, enableWorker: true });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          if (loader) loader.classList.add("hidden");
        });
        hlsInGridInstances.set(String(cam.id), hls);
        
        // Error handling fallback CORS Proxy
        hls.on(Hls.Events.ERROR, (evt, errData) => {
          if (errData.fatal) {
            console.log(`Grid stream error cam ${cam.id}, attempting CORS proxy fallback...`);
            if (hlsUrl && !hlsUrl.includes("/api/hls-proxy")) {
              hlsUrl = `/api/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;
              hls.loadSource(hlsUrl);
              hls.startLoad();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
          if (loader) loader.classList.add("hidden");
        });
      }
    }
  } catch (err) {
    console.error(`Grid play failed for cam ${cam.id}:`, err.message);
    if (loader) {
      loader.querySelector("span").innerText = "Fail";
      loader.querySelector("i").className = "fa-solid fa-triangle-exclamation text-red-500";
    }
  }
}

function cleanupAllHlsInGrid() {
  hlsInGridInstances.forEach(hls => {
    try { hls.destroy(); } catch{}
  });
  hlsInGridInstances.clear();
}

// ================= VIEW: MAP VIEW =================
async function initLeafletMap() {
  if (mapInstance) {
    try { mapInstance.remove(); } catch{}
    mapInstance = null;
  }

  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  try {
    // 1. Fetch camera configurations FIRST to ensure coordinates exist!
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/cameras", { headers });
    camerasList = await res.json();
    
    // 2. Fetch connection statuses
    const resCams = await fetch("/api/cameras/status", { headers });
    mapStatusesList = await resCams.json();

    // 3. Render the sidebar list of cameras right next to map
    renderMapCamerasList();

    // Find center of coordinates or fallback to default Jakarta
    let centerLat = -6.2088;
    let centerLng = 106.8456;
    const camsWithCoords = camerasList.filter(c => c.lat !== null && c.lng !== null && !isNaN(c.lat) && !isNaN(c.lng));
    
    if (camsWithCoords.length > 0) {
      centerLat = camsWithCoords.reduce((sum, c) => sum + parseFloat(c.lat), 0) / camsWithCoords.length;
      centerLng = camsWithCoords.reduce((sum, c) => sum + parseFloat(c.lng), 0) / camsWithCoords.length;
    }

    // Initialize Map
    mapInstance = L.map('map').setView([centerLat, centerLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    // Call invalidateSize after short delay once container is fully visible to avoid broken map layouts!
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 200);

    // Clear existing markers
    mapMarkers = [];

    // Draw camera location markers on map
    camerasList.forEach(cam => {
      if (cam.lat === null || cam.lng === null || isNaN(cam.lat) || isNaN(cam.lng)) return;
      
      const statusObj = mapStatusesList.find(s => s.id === cam.id) || { online: null };
      const isOnline = statusObj.online;
      
      const markerColor = isOnline === true ? "#10b981" : (isOnline === false ? "#ef4444" : "#64748b");
      
      const marker = L.circleMarker([parseFloat(cam.lat), parseFloat(cam.lng)], {
        radius: 10,
        fillColor: markerColor,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(mapInstance);

      // Create Popup HTML containing a nested fully functional video player inside the marker bubble!
      const popupVideoId = `map-popup-video-${cam.id}`;
      const popupIframeId = `map-popup-iframe-${cam.id}`;
      const popupSplashId = `map-popup-splash-${cam.id}`;
      const popupMethodId = `map-popup-method-${cam.id}`;

      const popupHTML = `
        <div class="w-[240px] md:w-[270px] flex flex-col space-y-2 p-1 text-slate-100 select-text">
          <div class="border-b border-slate-800 pb-1 flex justify-between items-center space-x-2">
            <span class="font-bold text-slate-200 block truncate leading-tight" style="max-width:140px" title="${cam.name}">${cam.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${isOnline === true ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}">
              ${isOnline === true ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <!-- Video Container -->
          <div class="aspect-video bg-black rounded-lg overflow-hidden relative border border-slate-800 flex items-center justify-center">
            <video id="${popupVideoId}" class="w-full h-full object-contain hidden" playsinline muted autoplay></video>
            <iframe id="${popupIframeId}" class="w-full h-full object-contain hidden" frameborder="0" allowfullscreen></iframe>
            
            <!-- Splash loading state inside bubble -->
            <div id="${popupSplashId}" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-3 space-y-1">
              <i class="fa-solid fa-spinner animate-spin text-blue-500 text-lg"></i>
              <p class="text-[9px] text-slate-400">Loading stream...</p>
            </div>
          </div>

          <!-- Footer controls inside map bubble -->
          <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <div class="overflow-hidden flex-1 mr-2 leading-tight">
              <span class="truncate block">Loc: ${cam.location || '--'}</span>
              <span id="${popupMethodId}" class="text-[8px] text-slate-500 block mt-0.5">Stream: --</span>
            </div>
            <button onclick="openPlayerModal(${cam.id})" class="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 border-0 bg-transparent flex-shrink-0 cursor-pointer">
              <i class="fa-solid fa-expand text-[9px]"></i>
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHTML, {
        maxWidth: 290,
        className: 'custom-map-popup'
      });

      // When Leaflet popup opens: automatically start the live feed inside the popup bubble!
      marker.on('popupopen', async () => {
        if (activePopupHls) {
          activePopupHls.destroy();
          activePopupHls = null;
        }

        const video = document.getElementById(popupVideoId);
        const iframe = document.getElementById(popupIframeId);
        const splash = document.getElementById(popupSplashId);
        const methodEl = document.getElementById(popupMethodId);

        try {
          const reqToken = safeStorage.getItem("token");
          const reqHeaders = { "Authorization": `Bearer ${reqToken}` };
          const reqRes = await fetch(`/api/stream/${cam.id}/start`, { method: "POST", headers: reqHeaders });
          const data = await reqRes.json();

          if (!reqRes.ok) throw new Error(data.error || "Fail");

          if (data.youtube) {
            if (iframe) {
              iframe.src = `https://www.youtube.com/embed/${data.youtube}?autoplay=1&mute=1&controls=1&rel=0`;
              iframe.classList.remove("hidden");
            }
            if (splash) splash.classList.add("hidden");
            if (methodEl) methodEl.innerText = "Stream: YouTube";
          } else if (data.hls) {
            if (methodEl) methodEl.innerText = data.direct ? "Stream: HLS Direct" : "Stream: RTSP Transcode";
            playHlsInMapPopup(data.hls, video, splash);
          }
        } catch (err) {
          console.error("Popup stream fail:", err);
          const splashText = splash ? splash.querySelector("p") : null;
          const splashIcon = splash ? splash.querySelector("i") : null;
          if (splashText) splashText.innerText = "Offline / Connection fail";
          if (splashIcon) {
            splashIcon.className = "fa-solid fa-triangle-exclamation text-red-500 text-base";
            splashIcon.classList.remove("animate-spin");
          }
        }
      });

      // When Leaflet popup closes: immediately destroy the Hls instance to save server CPU resource!
      marker.on('popupclose', () => {
        if (activePopupHls) {
          activePopupHls.destroy();
          activePopupHls = null;
        }
        const video = document.getElementById(popupVideoId);
        if (video) video.src = "";
        const iframe = document.getElementById(popupIframeId);
        if (iframe) iframe.src = "";
      });

      mapMarkers.push(marker);
    });

  } catch (err) {
    console.error("Failed to initialize map pins:", err);
  }
}

// Play Hls inside map popup bubble
function playHlsInMapPopup(hlsUrl, video, splash) {
  if (activePopupHls) {
    activePopupHls.destroy();
    activePopupHls = null;
  }

  if (!video) return;

  if (Hls.isSupported()) {
    const hls = new Hls({ maxMaxBufferLength: 4, enableWorker: true });
    activePopupHls = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.classList.remove("hidden");
      if (splash) splash.classList.add("hidden");
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.ERROR, (evt, errData) => {
      if (errData.fatal) {
        if (hlsUrl && !hlsUrl.includes("/api/hls-proxy")) {
          const proxiedUrl = `/api/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;
          hls.loadSource(proxiedUrl);
          hls.startLoad();
        } else {
          if (splash) {
            splash.querySelector("p").innerText = "Connection lost";
            splash.querySelector("i").className = "fa-solid fa-circle-exclamation text-red-500 text-base";
            splash.querySelector("i").classList.remove("animate-spin");
          }
        }
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = hlsUrl;
    video.classList.remove("hidden");
    if (splash) splash.classList.add("hidden");
    video.play().catch(() => {});
  }
}

// Render Sidebar List of Cameras inside the Map view
function renderMapCamerasList() {
  const searchEl = document.getElementById("map-search");
  const query = searchEl ? searchEl.value.toLowerCase() : "";

  const listEl = document.getElementById("map-cameras-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const filtered = camerasList.filter(cam => {
    return cam.name.toLowerCase().includes(query) || (cam.location && cam.location.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="text-slate-500 text-xs py-4 text-center" data-i18n="no_data">Tidak ada kamera ditemukan</div>`;
    return;
  }

  filtered.forEach(cam => {
    const statusObj = mapStatusesList ? mapStatusesList.find(s => s.id === cam.id) : null;
    const isOnline = statusObj ? statusObj.online : null;
    const badgeColor = isOnline === true ? "bg-emerald-500/15 text-emerald-400" : (isOnline === false ? "bg-red-500/15 text-red-400" : "bg-slate-700 text-slate-400");
    const badgeText = isOnline === true ? "ONLINE" : (isOnline === false ? "OFFLINE" : "UNKNOWN");

    const hasCoords = cam.lat !== null && cam.lng !== null && !isNaN(cam.lat) && !isNaN(cam.lng);
    const coordsIcon = hasCoords ? 
      `<i class="fa-solid fa-map-pin text-blue-500 text-[10px]" title="Has map coordinates"></i>` :
      `<i class="fa-solid fa-circle-exclamation text-slate-600 text-[10px]" title="No map coordinates"></i>`;

    const btn = document.createElement("button");
    btn.className = "w-full text-left bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-lg hover:bg-slate-800/40 transition flex items-center justify-between space-x-2 text-xs cursor-pointer focus:outline-none";
    btn.setAttribute("onclick", `focusCameraOnMap(${cam.id})`);
    
    btn.innerHTML = `
      <div class="overflow-hidden flex-1">
        <div class="flex items-center space-x-1.5 mb-1">
          ${coordsIcon}
          <span class="font-bold text-slate-200 truncate block max-w-[120px]">${cam.name}</span>
        </div>
        <span class="text-[10px] text-slate-400 truncate block">${cam.location || "--"}</span>
      </div>
      <div class="flex-shrink-0">
        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${badgeColor}">${badgeText}</span>
      </div>
    `;

    listEl.appendChild(btn);
  });
}

// Centers the map coordinates, zooms in, and AUTOMATICALLY opens the live camera popup bubble directly above the pin!
function focusCameraOnMap(camId) {
  const cam = camerasList.find(c => c.id === camId);
  if (!cam) return;

  const hasCoords = cam.lat !== null && cam.lng !== null && !isNaN(cam.lat) && !isNaN(cam.lng);
  if (!hasCoords) {
    showToast(currentLanguage === 'id' ? "Kamera ini tidak memiliki koordinat peta!" : "This camera has no map coordinates!", "error");
    return;
  }

  if (mapInstance) {
    // 1. Center and zoom map smoothly
    mapInstance.setView([parseFloat(cam.lat), parseFloat(cam.lng)], 14);

    // 2. Find the marker we drew and programmatically trigger opening its popup!
    const targetMarker = mapMarkers.find(m => {
      const latLng = m.getLatLng();
      return Math.abs(latLng.lat - parseFloat(cam.lat)) < 0.0001 && Math.abs(latLng.lng - parseFloat(cam.lng)) < 0.0001;
    });

    if (targetMarker) {
      setTimeout(() => {
        targetMarker.openPopup();
      }, 150);
    }
  }
}

// ================= VIEW: RECORDINGS & ACTIVE MANAGEMENT =================
async function loadRecordsAndCamerasFilter() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/cameras", { headers });
    camerasList = await res.json();
    
    // Populate cameras drop-down filter
    const rFilter = document.getElementById("records-filter-camera");
    if (rFilter) {
      rFilter.innerHTML = `<option value="">${currentLanguage === 'id' ? "Semua Kamera" : "All Cameras"}</option>`;
      camerasList.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.innerText = c.name;
        rFilter.appendChild(opt);
      });
    }

    // Populate manual record dropdown selection list
    const rPageSelect = document.getElementById("rec-page-cam-select");
    if (rPageSelect) {
      rPageSelect.innerHTML = "";
      camerasList.forEach(c => {
        // Exclude YouTube streams from recording since it needs yt-dlp
        if (c.nvr_dvr !== 'youtube' && !c.youtube_embed) {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.innerText = c.name;
          rPageSelect.appendChild(opt);
        }
      });
    }

    loadRecords();
  } catch (err) {
    console.error("Failed to load cameras filters in records:", err);
  }
}

async function loadRecords() {
  const filterEl = document.getElementById("records-filter-camera");
  const selectedCam = filterEl ? filterEl.value : "";
  let url = "/api/records";
  if (selectedCam) url += `?camera_id=${selectedCam}`;

  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(url, { headers });
    const rawList = await res.json();

    // Fetch dynamic date & time search values
    const dateVal = document.getElementById("records-filter-date").value; // e.g. "2026-06-21"
    const timeVal = document.getElementById("records-filter-time").value; // e.g. "14:30"

    // Filter recordings dynamically on client-side
    recordsList = rawList.filter(rec => {
      // 1. Check Date Match
      if (dateVal) {
        if (!rec.start_time || !rec.start_time.startsWith(dateVal)) return false;
      }
      // 2. Check Time/Hour Match (starts with "HH:MM")
      if (timeVal) {
        if (!rec.start_time) return false;
        const timePart = rec.start_time.split(' ')[1]; // extract "HH:MM:SS"
        if (!timePart || !timePart.startsWith(timeVal)) return false;
      }
      return true;
    });

    const tbody = document.getElementById("records-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const emptyEl = document.getElementById("records-empty");

    if (recordsList.length === 0) {
      if (emptyEl) emptyEl.classList.remove("hidden");
      return;
    }
    if (emptyEl) emptyEl.classList.add("hidden");

    recordsList.forEach(rec => {
      const isCompleted = rec.status === "completed";
      const statusBadge = rec.status === "completed" ? 
        `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 capitalize">Completed</span>` :
        (rec.status === "recording" ? 
          `<span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 animate-pulse capitalize">Recording</span>` :
          `<span class="px-2 py-0.5 rounded bg-red-500/10 text-red-400 capitalize">Failed</span>`);

      const durStr = rec.duration_sec ? `${rec.duration_sec}s` : "--";
      const sizeStr = rec.size_mb ? `${rec.size_mb} MB` : "--";

      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-800/40 transition duration-150 text-xs";

      let actionButtons = "";
      if (isCompleted && rec.file_path) {
        actionButtons = `
          <button onclick="playPlaybackVideo('/${rec.file_path}', '${rec.camera_name}')" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded transition inline-flex items-center text-xs border-0 cursor-pointer" title="${currentLanguage === 'id' ? 'Putar Rekaman' : 'Play Recording'}">
            <i class="fa-solid fa-play"></i>
          </button>
          <a href="/${rec.file_path}" download class="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-1.5 rounded transition inline-flex items-center text-xs" title="Download">
            <i class="fa-solid fa-download"></i>
          </a>
        `;
      }
      if (currentUser && currentUser.role === "admin") {
        actionButtons += `
          <button onclick="handleDeleteRecord(${rec.id})" class="text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded transition inline-flex items-center text-xs border-0 cursor-pointer" title="${currentLanguage === 'id' ? 'Hapus' : 'Delete'}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
      }

      tr.innerHTML = `
        <td class="p-3 md:p-4 font-bold text-slate-200">${rec.camera_name || "Unknown Cam"}</td>
        <td class="p-3 md:p-4 font-mono text-[10px] md:text-xs text-slate-400">${rec.start_time || "--"}</td>
        <td class="p-3 md:p-4 font-mono text-[10px] md:text-xs text-slate-400 hidden sm:table-cell">${rec.end_time || "--"}</td>
        <td class="p-3 md:p-4 text-slate-300">${durStr}</td>
        <td class="p-3 md:p-4 text-slate-300 hidden sm:table-cell">${sizeStr}</td>
        <td class="p-3 md:p-4 text-center">${statusBadge}</td>
        <td class="p-3 md:p-4 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            ${actionButtons}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Failed to load records:", err);
  }
}

async function handleDeleteRecord(id) {
  const askMsg = currentLanguage === 'id' ? "Apakah Anda yakin ingin menghapus file rekaman ini?" : "Are you sure you want to delete this recording file?";
  if (!confirm(askMsg)) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/records/${id}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error("Gagal hapus rekaman");
    
    showToast(currentLanguage === 'id' ? "Rekaman berhasil dihapus" : "Recording deleted successfully", "success");
    loadRecords();
    loadStorageStatus(); // reload storage mb
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ================= MODAL PLAYBACK =================
function playPlaybackVideo(filePath, camName) {
  const modal = document.getElementById("modal-playback");
  const video = document.getElementById("playback-video");
  
  const title = document.getElementById("playback-title");
  const subtitle = document.getElementById("playback-subtitle");
  if (title) title.innerText = camName;
  if (subtitle) subtitle.innerText = filePath.split('/').pop();
  if (video) video.src = filePath;
  
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  if (video) video.play().catch(() => {});
}

function closePlaybackModal() {
  const modal = document.getElementById("modal-playback");
  const video = document.getElementById("playback-video");
  
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  if (video) {
    video.pause();
    video.src = "";
  }
}

// ================= MODAL PLAYER & STREAMING =================
async function openPlayerModal(cameraId) {
  playerCamId = cameraId;
  playerRetryCount = 0;
  
  const token = safeStorage.getItem("token");
  const headers = { "Authorization": `Bearer ${token}` };
  const res = await fetch("/api/cameras", { headers });
  const cams = await res.json();
  const cam = cams.find(c => c.id === cameraId);
  if (!cam) return;

  // Render modal titles
  document.getElementById("player-title").innerText = cam.name;
  document.getElementById("player-subtitle").innerText = cam.location || "--";
  
  // Open player modal
  const modal = document.getElementById("modal-player");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  // Show splash loading
  const splash = document.getElementById("player-splash");
  const splashMsg = document.getElementById("player-splash-msg");
  const splashIcon = document.getElementById("player-splash-icon");
  if (splash) splash.classList.remove("hidden");
  if (splashMsg) splashMsg.innerText = currentLanguage === 'id' ? "Memulai streaming, silakan tunggu..." : "Starting stream, please wait...";
  if (splashIcon) {
    splashIcon.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i>`;
    splashIcon.className = "text-blue-500 text-2xl md:text-3xl animate-spin";
  }

  const video = document.getElementById("cctv-video");
  const iframe = document.getElementById("cctv-iframe");
  if (video) video.classList.add("hidden");
  if (iframe) iframe.classList.add("hidden");

  // Set defaults for admin-only displays inside player modal
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById("player-rec-panel").classList.remove("hidden");
    document.getElementById("player-admin-stream-ctrl").classList.remove("hidden");
  } else {
    document.getElementById("player-rec-panel").classList.add("hidden");
    document.getElementById("player-admin-stream-ctrl").classList.add("hidden");
  }

  // Fetch status of recording
  checkPlayerRecordingStatus(cameraId);

  // Trigger stream start
  startPlayerCctvStream(cam);
}

function closePlayerModal() {
  const modal = document.getElementById("modal-player");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // Destroy HLS instances
  if (activePlayerHls) {
    activePlayerHls.destroy();
    activePlayerHls = null;
  }
  const video = document.getElementById("cctv-video");
  if (video) video.src = "";
  const iframe = document.getElementById("cctv-iframe");
  if (iframe) iframe.src = "";

  // Stop Log & Uptime timers
  clearInterval(playerUptimeInterval);
  clearInterval(activeLogInterval);
  
  // Close log drawer
  const drawer = document.getElementById("player-log-drawer");
  const btn = document.getElementById("ff-log-btn-text");
  if (drawer) drawer.classList.add("hidden");
  if (btn) btn.innerText = currentLanguage === 'id' ? "Lihat Log FFmpeg" : "View FFmpeg Log";

  playerCamId = null;
}

async function startPlayerCctvStream(cam) {
  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/stream/${cam.id}/start`, { method: "POST", headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Gagal inisialisasi live");

    // Live state clocks & uptime starts
    initPlayerStats(cam.id);

    const video = document.getElementById("cctv-video");
    const iframe = document.getElementById("cctv-iframe");
    const splash = document.getElementById("player-splash");

    if (data.youtube) {
      // YouTube Embed
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${data.youtube}?autoplay=1&mute=1&controls=1&rel=0`;
        iframe.classList.remove("hidden");
      }
      if (splash) splash.classList.add("hidden");
      
      document.getElementById("player-status-badge").innerText = "ONLINE";
      document.getElementById("player-status-badge").className = "font-semibold text-emerald-500";
      document.getElementById("player-method-val").innerText = "YouTube Live";
    } else if (data.hls) {
      // play HLS
      document.getElementById("player-method-val").innerText = data.direct ? "HLS Direct" : "RTSP Transcode";
      playHlsWithReconnect(data.hls);
    }
  } catch (err) {
    showPlayerErrorSplash(err.message);
  }
}

function playHlsWithReconnect(hlsUrl) {
  const video = document.getElementById("cctv-video");
  const splash = document.getElementById("player-splash");
  const badge = document.getElementById("player-status-badge");
  const retryRow = document.getElementById("player-retry-row");
  const retryVal = document.getElementById("player-retry-val");

  if (activePlayerHls) {
    activePlayerHls.destroy();
    activePlayerHls = null;
  }

  const loadStream = (url) => {
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 8,
        enableWorker: true,
        manifestLoadingMaxRetry: 10,
        levelLoadingMaxRetry: 10
      });
      activePlayerHls = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (video) video.classList.remove("hidden");
        if (splash) splash.classList.add("hidden");
        if (video) video.play().catch(() => {});
        if (badge) {
          badge.innerText = "LIVE";
          badge.className = "font-semibold text-emerald-500";
        }
        if (retryRow) retryRow.classList.add("hidden");
        playerRetryCount = 0;
      });

      // Error/Stall Handling with Reconnect
      hls.on(Hls.Events.ERROR, (evt, errData) => {
        console.error("HLS Player Event Error:", errData);
        
        if (errData.fatal) {
          if (playerRetryCount < 10) {
            playerRetryCount++;
            if (retryRow) retryRow.classList.remove("hidden");
            if (retryVal) retryVal.innerText = `${playerRetryCount} / 10`;
            if (badge) {
              badge.innerText = "RECONNECTING...";
              badge.className = "font-semibold text-amber-500";
            }

            const backoff = Math.min(3 + playerRetryCount * 2, 15);
            console.log(`HLS fatal error. Retrying HLS stream in ${backoff}s (attempt ${playerRetryCount}/10)...`);
            
            // Try CORS proxy fallback if it fails on direct attempt
            let targetUrl = url;
            if (playerRetryCount >= 2 && !url.includes("/api/hls-proxy")) {
              targetUrl = `/api/hls-proxy?url=${encodeURIComponent(url)}`;
              console.log("Switching to CORS HLS proxy...");
            }

            setTimeout(() => {
              hls.loadSource(targetUrl);
              hls.startLoad();
            }, backoff * 1000);
          } else {
            showPlayerErrorSplash(currentLanguage === 'id' ? "Gagal tersambung ke aliran kamera CCTV (Maksimal percobaan)." : "Failed to connect to CCTV stream (Max retries).");
          }
        }
      });
    } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.classList.remove("hidden");
      if (splash) splash.classList.add("hidden");
      video.play().catch(() => {});
      if (badge) {
        badge.innerText = "LIVE";
        badge.className = "font-semibold text-emerald-500";
      }
    }
  };

  loadStream(hlsUrl);
}

function showPlayerErrorSplash(msg) {
  const splash = document.getElementById("player-splash");
  const splashMsg = document.getElementById("player-splash-msg");
  const splashIcon = document.getElementById("player-splash-icon");
  const badge = document.getElementById("player-status-badge");

  if (splash) splash.classList.remove("hidden");
  if (splashMsg) splashMsg.innerText = msg;
  if (splashIcon) {
    splashIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
    splashIcon.className = "text-red-500 text-3xl";
  }

  const video = document.getElementById("cctv-video");
  const iframe = document.getElementById("cctv-iframe");
  if (video) video.classList.add("hidden");
  if (iframe) iframe.classList.add("hidden");
  
  if (badge) {
    badge.innerText = "OFFLINE";
    badge.className = "font-semibold text-red-500";
  }
}

function initPlayerStats(cameraId) {
  clearInterval(playerUptimeInterval);
  playerUptimeSec = 0;
  
  const uptimeVal = document.getElementById("player-uptime-val");
  if (uptimeVal) uptimeVal.innerText = "0s";

  playerUptimeInterval = setInterval(() => {
    playerUptimeSec++;
    const m = Math.floor(playerUptimeSec / 60);
    const s = playerUptimeSec % 60;
    if (uptimeVal) {
      uptimeVal.innerText = m > 0 ? `${m}m ${s}s` : `${s}s`;
    }
  }, 1000);

  if (currentUser && currentUser.role === 'admin') {
    fetchFfLog(cameraId);
    clearInterval(activeLogInterval);
    activeLogInterval = setInterval(() => fetchFfLog(cameraId), 4000);
  }
}

async function fetchFfLog(cameraId) {
  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/stream/${cameraId}/log`, { headers });
    if (res.ok) {
      const logText = await res.text();
      const el = document.getElementById("player-log-content");
      if (el) el.textContent = logText || "No logs yet.";
    }
  } catch (err) {
    console.error("FFmpeg log fail:", err);
  }
}

function toggleFfLog() {
  const drawer = document.getElementById("player-log-drawer");
  const btn = document.getElementById("ff-log-btn-text");
  if (!drawer || !btn) return;
  
  if (drawer.classList.contains("hidden")) {
    drawer.classList.remove("hidden");
    btn.innerText = currentLanguage === 'id' ? "Sembunyikan Log FFmpeg" : "Hide FFmpeg Log";
  } else {
    drawer.classList.add("hidden");
    btn.innerText = currentLanguage === 'id' ? "Lihat Log FFmpeg" : "View FFmpeg Log";
  }
}

async function handleForceStopStream() {
  if (!playerCamId) return;
  const askMsg = currentLanguage === 'id' ? "Paksa matikan stream FFmpeg untuk kamera ini?" : "Force kill FFmpeg stream for this camera?";
  if (!confirm(askMsg)) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/stream/${playerCamId}/stop`, { method: "POST", headers });
    if (!res.ok) throw new Error("Gagal mematikan stream");
    showToast(currentLanguage === 'id' ? "Stream dihentikan" : "Stream killed", "success");
    closePlayerModal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function checkPlayerRecordingStatus(cameraId) {
  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/dashboard", { headers });
    const stats = await res.json();
    
    const resRecs = await fetch("/api/records", { headers });
    const recs = await resRecs.json();
    const activeThisCam = recs.find(r => r.camera_id === cameraId && r.status === 'recording');

    if (activeThisCam) {
      setRecordingStateActive(true);
    } else {
      setRecordingStateActive(false);
    }
  } catch (err) {
    console.error("Recording status check error:", err);
  }
}

function setRecordingStateActive(active) {
  isRecordingActive = active;
  clearInterval(recordTimerInterval);

  const nonAct = document.getElementById("rec-not-active");
  const act = document.getElementById("rec-active");

  if (active) {
    if (nonAct) nonAct.classList.add("hidden");
    if (act) act.classList.remove("hidden");
    
    recordTimerSec = 0;
    recordTimerInterval = setInterval(() => {
      recordTimerSec++;
      const m = String(Math.floor(recordTimerSec / 60)).padStart(2,'0');
      const s = String(recordTimerSec % 60).padStart(2,'0');
      const timerEl = document.getElementById("rec-active-timer");
      if (timerEl) timerEl.innerText = `${m}:${s}`;
    }, 1000);
  } else {
    if (nonAct) nonAct.classList.remove("hidden");
    if (act) act.classList.add("hidden");
  }
}

async function handleStartRecordingInPlayer() {
  if (!playerCamId) return;
  const dur = document.getElementById("rec-duration-sec").value;

  try {
    const token = safeStorage.getItem("token");
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const res = await fetch(`/api/record/${playerCamId}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({ duration: dur })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(currentLanguage === 'id' ? "Perekaman berhasil dimulai!" : "Recording started successfully!", "success");
    setRecordingStateActive(true);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleStopRecordingInPlayer() {
  if (!playerCamId) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/record/${playerCamId}/stop`, { method: "POST", headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(currentLanguage === 'id' ? "Perekaman dihentikan" : "Recording stopped", "success");
    setRecordingStateActive(false);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Toggle manual recording dropdown selection box
function toggleManualRecordForm() {
  const panel = document.getElementById("manual-record-form-panel");
  if (!panel) return;
  
  if (panel.classList.contains("hidden")) {
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

// Trigger manual recording from the Recordings view form
async function handleStartManualRecordFromPage(e) {
  e.preventDefault();

  const selectEl = document.getElementById("rec-page-cam-select");
  const durationEl = document.getElementById("rec-page-duration");
  if (!selectEl || !durationEl) return;

  const camId = selectEl.value;
  const dur = parseInt(durationEl.value) || 120;

  try {
    const token = safeStorage.getItem("token");
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    const res = await fetch(`/api/record/${camId}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({ duration: dur })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memulai perekaman");

    showToast(currentLanguage === 'id' ? "Perekaman berhasil dimulai!" : "Manual recording successfully started!", "success");
    
    // Hide panel and refresh status
    document.getElementById("manual-record-form-panel").classList.add("hidden");
    loadActiveRecordings();
    loadRecords();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Fetches and displays active recordings list with quick-kill controls
async function loadActiveRecordings() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/record/active", { headers });
    const list = await res.json();

    const panel = document.getElementById("active-recordings-panel");
    const listEl = document.getElementById("active-recordings-list");
    const recBadge = document.getElementById("sheet-status-badge-container");

    if (!panel || !listEl) return;

    if (!list || !Array.isArray(list) || list.length === 0) {
      panel.classList.add("hidden");
      if (recBadge) recBadge.classList.add("hidden");
      return;
    }

    panel.classList.remove("hidden");
    if (recBadge) recBadge.classList.remove("hidden");
    listEl.innerHTML = "";

    list.forEach(item => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between py-2 text-xs border-b border-slate-800 last:border-0";
      row.innerHTML = `
        <div class="flex items-center space-x-2 overflow-hidden">
          <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
          <span class="font-bold text-slate-200 truncate block max-w-[150px]">${item.camera_name}</span>
          <span class="text-slate-400 text-[10px] hidden sm:inline">(ID: ${item.camera_id})</span>
        </div>
        <button onclick="stopRecordingFromPage(${item.camera_id})" class="bg-red-600 hover:bg-red-700 text-white font-semibold px-2.5 py-1 rounded text-[10px] transition border-0 cursor-pointer shadow flex-shrink-0">
          Stop Rec
        </button>
      `;
      listEl.appendChild(row);
    });

  } catch (err) {
    console.error("Failed to load active recordings:", err);
  }
}

// Stop recording directly from the Active List on the Recordings view
async function stopRecordingFromPage(camId) {
  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/record/${camId}/stop`, { method: "POST", headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(currentLanguage === 'id' ? "Perekaman berhasil dihentikan!" : "Recording successfully stopped!", "success");
    
    // Refresh records tables and status lists
    setTimeout(() => {
      loadActiveRecordings();
      loadRecords();
      loadStorageStatus();
    }, 500);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Bulk delete all completed recording files and database logs
async function handleDeleteAllRecords() {
  const askMsg = currentLanguage === 'id' ? 
    "⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA berkas rekaman di hardisk? Tindakan ini tidak bisa dibatalkan!" : 
    "⚠️ WARNING: Are you sure you want to DELETE ALL recording files from the hard drive? This action cannot be undone!";
  if (!confirm(askMsg)) return;

  showLoader(currentLanguage === 'id' ? "Menghapus semua rekaman..." : "Deleting all recordings...");

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/records", { method: "DELETE", headers });
    if (!res.ok) throw new Error("Gagal menghapus semua rekaman");

    showToast(currentLanguage === 'id' ? "Semua rekaman berhasil dibersihkan!" : "All recordings successfully deleted!", "success");
    loadRecords();
    loadStorageStatus();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoader();
  }
}

// Loads hard drive total space, remaining free space, and the size of recording directory
async function loadStorageStatus() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/system/storage", { headers });
    const data = await res.json();

    const usedText = document.getElementById("storage-used-text");
    const bar = document.getElementById("storage-progress-bar");
    const warnBadge = document.getElementById("storage-warning-badge");

    if (usedText) {
      if (currentLanguage === 'id') {
        usedText.innerHTML = `Berkas: <b class="text-white">${data.records_size_mb} MB</b> • Terpakai: <b class="text-white">${data.used_gb} GB</b> / ${data.total_gb} GB disk • Sisa: <b class="text-emerald-400">${data.free_gb} GB Kosong</b> (<span class="font-mono text-blue-400">${data.used_percent}%</span>)`;
      } else {
        usedText.innerHTML = `Files: <b class="text-white">${data.records_size_mb} MB</b> • Used: <b class="text-white">${data.used_gb} GB</b> / ${data.total_gb} GB disk • Free: <b class="text-emerald-400">${data.free_gb} GB Left</b> (<span class="font-mono text-blue-400">${data.used_percent}%</span>)`;
      }
    }

    if (bar) {
      bar.style.width = `${data.used_percent}%`;
      if (data.used_percent >= 85) {
        bar.className = "bg-red-600 h-2 rounded-full transition-all duration-500 animate-pulse";
        if (warnBadge) warnBadge.classList.remove("hidden");
      } else if (data.used_percent >= 70) {
        bar.className = "bg-amber-500 h-2 rounded-full transition-all duration-500";
        if (warnBadge) warnBadge.classList.add("hidden");
      } else {
        bar.className = "bg-blue-600 h-2 rounded-full transition-all duration-500";
        if (warnBadge) warnBadge.classList.add("hidden");
      }
    }
  } catch (err) {
    console.error("Failed to load storage status:", err);
  }
}

// Resets date and time filters on the recordings table
function resetRecordsFilters() {
  const camFilter = document.getElementById("records-filter-camera");
  const dateFilter = document.getElementById("records-filter-date");
  const timeFilter = document.getElementById("records-filter-time");

  if (camFilter) camFilter.value = "";
  if (dateFilter) dateFilter.value = "";
  if (timeFilter) timeFilter.value = "";

  loadRecords();
}

// Convert actual recorded cron string into selectable Preset options
function getPresetFromSchedule(sched) {
  if (!sched) return "24h";
  sched = sched.trim();
  if (sched === "24h" || sched === "* * * * *") return "24h";
  if (sched === "*/1 * * * *" || sched === "*/1") return "*/1";
  if (sched === "*/5 * * * *" || sched === "*/5") return "*/5";
  if (sched === "*/15 * * * *" || sched === "*/15") return "*/15";
  if (sched === "*/30 * * * *" || sched === "*/30") return "*/30";
  if (sched === "0 * * * *" || sched === "0") return "0";
  return "custom";
}

// Handles preset dropdown change and toggles custom cron text input
function handleRecSchedulePresetChange(val) {
  const customDiv = document.getElementById("custom-cron-div");
  const schedInput = document.getElementById("cam-rec-schedule");
  const customInput = document.getElementById("cam-rec-schedule-custom-val");
  
  if (!customDiv || !schedInput || !customInput) return;

  if (val === "custom") {
    customDiv.classList.remove("hidden");
    schedInput.value = customInput.value;
  } else {
    customDiv.classList.add("hidden");
    schedInput.value = val;
  }
}

// ================= VIEW: CAMERAS CRUD =================
async function loadAdminCameras() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/cameras", { headers });
    camerasList = await res.json();

    const tbody = document.getElementById("cameras-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    camerasList.forEach(cam => {
      const typeLabel = cam.nvr_dvr === 'youtube' ? "YouTube" : 
                        (cam.nvr_dvr === 'hls' ? "HLS (.m3u8)" : `IP Cam (RTSP)`);
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-800/40 transition duration-150 text-xs";
      
      const pubBadge = cam.is_public ? 
        `<span class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">Public</span>` :
        `<span class="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">Admin</span>`;

      const activeBadge = cam.is_active ? 
        `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>` :
        `<span class="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>`;

      // Visual helper for continuous recording schedule
      const isContinuous = cam.record_schedule === '24h' || cam.record_schedule === '* * * * *';
      const scheduleLabel = isContinuous ? 
        (currentLanguage === 'id' ? '24 Jam Non-stop' : '24h Continuous') : cam.record_schedule;

      const recBadge = cam.record_enabled ? 
        `<span class="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono block mb-1 truncate" style="max-width:130px">Dur: ${cam.record_duration}s</span><span class="text-[9px] text-slate-400 font-mono block truncate" style="max-width:130px" title="${scheduleLabel}">${scheduleLabel}</span>` :
        `<span class="text-slate-500 text-xs">-</span>`;

      tr.innerHTML = `
        <td class="p-3 md:p-4 font-bold text-slate-200">${cam.name}</td>
        <td class="p-3 md:p-4 text-slate-300 text-xs">${cam.location || "--"}</td>
        <td class="p-3 md:p-4 text-slate-300 text-xs font-semibold hidden sm:table-cell">${typeLabel}</td>
        <td class="p-3 md:p-4 text-slate-300 text-xs hidden md:table-cell">${cam.channel || 1}</td>
        <td class="p-3 md:p-4">${pubBadge}</td>
        <td class="p-3 md:p-4 text-center">${activeBadge}</td>
        <td class="p-3 md:p-4 hidden lg:table-cell">${recBadge}</td>
        <td class="p-3 md:p-4 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            <button onclick="pingCameraDirect(${cam.id})" class="text-slate-300 hover:text-white bg-slate-800 p-1.5 rounded transition inline-flex items-center text-xs border-0 cursor-pointer" title="Test Connection">
              <i class="fa-solid fa-plug-circle-bolt"></i>
            </button>
            <button onclick="openCameraFormModal(${cam.id})" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded transition inline-flex items-center border-0 cursor-pointer" title="${currentLanguage === 'id' ? 'Edit' : 'Edit'}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="handleDeleteCamera(${cam.id})" class="text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded transition inline-flex items-center border-0 cursor-pointer" title="${currentLanguage === 'id' ? 'Hapus' : 'Delete'}">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Cameras admin failed to load:", err);
  }
}

async function pingCameraDirect(id) {
  showToast(currentLanguage === 'id' ? "Memeriksa kamera..." : "Checking camera...", "info");
  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/cameras/${id}/ping`, { method: "POST", headers });
    const data = await res.json();
    if (data.online) {
      showToast(currentLanguage === 'id' ? "Koneksi Kamera ONLINE!" : "Camera connection ONLINE!", "success");
    } else {
      showToast((currentLanguage === 'id' ? "Koneksi Kamera OFFLINE: " : "Camera connection OFFLINE: ") + (data.msg || "Error"), "error");
    }
    loadAdminCameras();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function openCameraFormModal(camId = null) {
  const modal = document.getElementById("modal-camera-form");
  if (!modal) return;
  const form = modal.querySelector("form");
  if (form) form.reset();
  
  // Set default scheduled record state
  toggleFormRecordSettings(false);

  // Set default schedule preset to 24h
  const presetEl = document.getElementById("cam-rec-schedule-preset");
  const schedEl = document.getElementById("cam-rec-schedule");
  const customDiv = document.getElementById("custom-cron-div");
  const customVal = document.getElementById("cam-rec-schedule-custom-val");

  if (presetEl) presetEl.value = "24h";
  if (schedEl) schedEl.value = "24h";
  if (customDiv) customDiv.classList.add("hidden");

  if (camId) {
    document.getElementById("camera-form-title").innerText = currentLanguage === 'id' ? "Edit Kamera" : "Edit Camera";
    
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/cameras", { headers });
    const cams = await res.json();
    const cam = cams.find(c => c.id === camId);
    if (!cam) return;

    document.getElementById("cam-id").value = cam.id;
    document.getElementById("cam-name").value = cam.name;
    document.getElementById("cam-location").value = cam.location || "";
    document.getElementById("cam-rtsp").value = cam.rtsp_url;
    document.getElementById("cam-type").value = cam.nvr_dvr || "ipcam";
    document.getElementById("cam-channel").value = cam.channel || 1;
    document.getElementById("cam-yt").value = cam.youtube_embed || "";
    document.getElementById("cam-lat").value = cam.lat !== null ? cam.lat : "";
    document.getElementById("cam-lng").value = cam.lng !== null ? cam.lng : "";
    
    const recEnabled = cam.record_enabled === 1;
    document.getElementById("cam-rec-enabled").checked = recEnabled;
    toggleFormRecordSettings(recEnabled);

    // Populate preset or custom cron schedule
    const preset = getPresetFromSchedule(cam.record_schedule);
    if (presetEl) presetEl.value = preset;
    if (schedEl) schedEl.value = cam.record_schedule || "24h";
    
    if (preset === "custom") {
      if (customDiv) customDiv.classList.remove("hidden");
      if (customVal) customVal.value = cam.record_schedule || "0 * * * *";
    } else {
      if (customDiv) customDiv.classList.add("hidden");
    }

    document.getElementById("cam-rec-duration").value = cam.record_duration || 300;
    document.getElementById("cam-is-public").checked = cam.is_public === 1;
    document.getElementById("cam-is-active").checked = cam.is_active === 1;

  } else {
    document.getElementById("camera-form-title").innerText = currentLanguage === 'id' ? "Tambah Kamera" : "Add Camera";
    document.getElementById("cam-id").value = "";
    document.getElementById("cam-rec-duration").value = 300;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCameraFormModal() {
  const modal = document.getElementById("modal-camera-form");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function toggleFormRecordSettings(checked) {
  const div = document.getElementById("cam-rec-settings-div");
  if (div) {
    if (checked) div.classList.remove("hidden");
    else div.classList.add("hidden");
  }
}

async function handleSaveCamera(e) {
  e.preventDefault();
  
  // Resolve schedule value
  const preset = document.getElementById("cam-rec-schedule-preset").value;
  let scheduleVal = preset;
  if (preset === "custom") {
    scheduleVal = document.getElementById("cam-rec-schedule-custom-val").value.trim() || "0 * * * *";
  }

  const id = document.getElementById("cam-id").value;
  const body = {
    name: document.getElementById("cam-name").value,
    location: document.getElementById("cam-location").value,
    rtsp_url: document.getElementById("cam-rtsp").value,
    nvr_dvr: document.getElementById("cam-type").value,
    channel: parseInt(document.getElementById("cam-channel").value) || 1,
    youtube_embed: document.getElementById("cam-yt").value,
    lat: parseFloat(document.getElementById("cam-lat").value) || null,
    lng: parseFloat(document.getElementById("cam-lng").value) || null,
    record_enabled: document.getElementById("cam-rec-enabled").checked,
    record_schedule: scheduleVal,
    record_duration: parseInt(document.getElementById("cam-rec-duration").value) || 300,
    is_public: document.getElementById("cam-is-public").checked,
    is_active: document.getElementById("cam-is-active").checked,
  };

  const token = safeStorage.getItem("token");
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/cameras/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch("/api/cameras", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Gagal menyimpan data kamera");
    }

    showToast(currentLanguage === 'id' ? "Data Kamera disimpan!" : "Camera details saved!", "success");
    closeCameraFormModal();
    loadAdminCameras();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeleteCamera(id) {
  const askMsg = currentLanguage === 'id' ? "Yakin ingin menghapus kamera ini? Semua history file akan tetap tersimpan tetapi data link akan dibersihkan." : "Are you sure you want to delete this camera? Streaming connections will be broken and config will be deleted.";
  if (!confirm(askMsg)) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/cameras/${id}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error("Gagal menghapus kamera");

    showToast(currentLanguage === 'id' ? "Kamera dihapus" : "Camera deleted", "success");
    loadAdminCameras();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ================= VIEW: USERS CRUD =================
async function loadAdminUsers() {
  try {
    const token = safeStorage.getItem("token");
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/users", { headers });
    const users = await res.json();

    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    users.forEach(usr => {
      const isSelf = currentUser && usr.username === currentUser.username;
      const roleLabel = usr.role === 'admin' ? 
        (currentLanguage === 'id' ? "Administrator" : "Admin") : 
        (currentLanguage === 'id' ? "Publik (Hanya Lihat)" : "Public (View Only)");

      const roleBadge = usr.role === 'admin' ? 
        `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400">${roleLabel}</span>` :
        `<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">${roleLabel}</span>`;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-800/40 transition duration-150 text-xs";

      let actions = `
        <button onclick="openUserFormModal(${usr.id})" class="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded transition inline-flex items-center border-0 text-xs cursor-pointer" title="${currentLanguage === 'id' ? 'Edit' : 'Edit'}">
          <i class="fa-solid fa-user-pen"></i>
        </button>
      `;
      if (!isSelf) {
        actions += `
          <button onclick="handleDeleteUser(${usr.id})" class="text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded transition inline-flex items-center border-0 text-xs cursor-pointer" title="${currentLanguage === 'id' ? 'Hapus' : 'Delete'}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
      }

      tr.innerHTML = `
        <td class="p-3 md:p-4 font-bold text-slate-200">${usr.username} ${isSelf ? '<span class="text-[10px] text-blue-400 font-mono ml-2">(Anda)</span>' : ''}</td>
        <td class="p-3 md:p-4">${roleBadge}</td>
        <td class="p-3 md:p-4 text-slate-400 text-xs font-mono hidden sm:table-cell">${usr.created_at || "--"}</td>
        <td class="p-3 md:p-4 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            ${actions}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Users admin failed to load:", err);
  }
}

async function openUserFormModal(userId = null) {
  const modal = document.getElementById("modal-user-form");
  if (!modal) return;
  const form = modal.querySelector("form");
  if (form) form.reset();

  const pwdLabel = document.getElementById("usr-password-label");
  const pwdHint = document.getElementById("usr-pwd-hint");
  const pwdInput = document.getElementById("usr-password");

  if (userId) {
    document.getElementById("user-form-title").innerText = currentLanguage === 'id' ? "Edit User" : "Edit User";
    if (pwdLabel) pwdLabel.innerText = currentLanguage === 'id' ? "Ubah Sandi" : "Change Password";
    if (pwdHint) pwdHint.classList.remove("hidden");
    if (pwdInput) pwdInput.required = false;

    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch("/api/users", { headers });
    const users = await res.json();
    const usr = users.find(u => u.id === userId);
    if (!usr) return;

    document.getElementById("usr-id").value = usr.id;
    document.getElementById("usr-username").value = usr.username;
    document.getElementById("usr-role").value = usr.role;

  } else {
    document.getElementById("user-form-title").innerText = currentLanguage === 'id' ? "Tambah User" : "Add User";
    if (pwdLabel) pwdLabel.innerText = currentLanguage === 'id' ? "Kata Sandi *" : "Password *";
    if (pwdHint) pwdHint.classList.add("hidden");
    if (pwdInput) pwdInput.required = true;
    document.getElementById("usr-id").value = "";
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeUserFormModal() {
  const modal = document.getElementById("modal-user-form");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

async function handleSaveUser(e) {
  e.preventDefault();

  const id = document.getElementById("usr-id").value;
  const body = {
    username: document.getElementById("usr-username").value,
    password: document.getElementById("usr-password").value,
    role: document.getElementById("usr-role").value,
  };

  const token = safeStorage.getItem("token");
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
    }

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Gagal menyimpan user");
    }

    showToast(currentLanguage === 'id' ? "Akun berhasil disimpan!" : "User account saved successfully!", "success");
    closeUserFormModal();
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleDeleteUser(id) {
  const askMsg = currentLanguage === 'id' ? "Yakin ingin menghapus user ini?" : "Are you sure you want to delete this user?";
  if (!confirm(askMsg)) return;

  try {
    const token = safeStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", headers });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error);
    }

    showToast(currentLanguage === 'id' ? "User berhasil dihapus" : "User successfully deleted", "success");
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ================= VIEW: SETTINGS SUBMISSIONS =================
async function handleSaveAppSettings(e) {
  e.preventDefault();

  const body = {
    app_name: document.getElementById("setting-app-name").value,
    app_sub: document.getElementById("setting-app-sub").value,
    running_text: document.getElementById("setting-running-text").value,
    site_footer: document.getElementById("setting-site-footer").value,
  };

  const token = safeStorage.getItem("token");
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Gagal menyimpan setting");

    showToast(currentLanguage === 'id' ? "Pengaturan Aplikasi berhasil diperbarui!" : "App settings updated successfully!", "success");
    loadAppConfigs(); // Reload config titles
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  
  const updatedUsername = document.getElementById("pwd-username").value.trim();
  const oldPw = document.getElementById("pwd-old").value;
  const newPw = document.getElementById("pwd-new").value;
  const confirmPw = document.getElementById("pwd-new-confirm").value;

  if (newPw && newPw !== confirmPw) {
    showToast(currentLanguage === 'id' ? "Konfirmasi sandi baru tidak cocok!" : "New password confirmations do not match!", "error");
    return;
  }

  const token = safeStorage.getItem("token");
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        username: updatedUsername, 
        old_password: oldPw, 
        new_password: newPw 
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

    // Simpan token & user baru jika berhasil mengubah username
    safeStorage.setItem("token", data.token);
    safeStorage.setItem("user", JSON.stringify({ username: data.username, role: currentUser.role }));
    currentUser.username = data.username;

    // Perbarui nama di sidebar & header
    const userNameEl = document.getElementById("user-display-name");
    if (userNameEl) userNameEl.innerText = data.username;

    showToast(currentLanguage === 'id' ? "Profil berhasil diperbarui!" : "Profile successfully updated!", "success");
    
    // Kosongkan kolom password setelah berhasil
    document.getElementById("pwd-old").value = "";
    document.getElementById("pwd-new").value = "";
    document.getElementById("pwd-new-confirm").value = "";
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ================= GLOBAL HELPER COMPONENT UI =================
function showLoader(msg) {
  const el = document.getElementById("loader-msg");
  const loader = document.getElementById("global-loader");
  if (el) el.innerText = msg;
  if (loader) {
    loader.classList.remove("hidden");
    loader.classList.remove("opacity-0");
    loader.classList.remove("pointer-events-none");
  }
}

// Hides loader animation safely and IMMEDIATELY prevents it from blocking pointer/clicks!
function hideLoader() {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.classList.add("opacity-0");
    loader.classList.add("pointer-events-none"); // Instant click release!
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 300);
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const icon = document.getElementById("toast-icon");
  const text = document.getElementById("toast-message");

  if (!toast || !icon || !text) return;

  text.innerText = message;

  if (type === "success") {
    icon.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>`;
    toast.className = "fixed bottom-4 right-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[9999] max-w-sm pointer-events-none transform translate-y-0 opacity-100 transition-all duration-300 border-l-4 border-l-emerald-500";
  } else if (type === "error") {
    icon.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-500 text-lg"></i>`;
    toast.className = "fixed bottom-4 right-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[9999] max-w-sm pointer-events-none transform translate-y-0 opacity-100 transition-all duration-300 border-l-4 border-l-red-500";
  } else {
    icon.innerHTML = `<i class="fa-solid fa-circle-info text-blue-500 text-lg"></i>`;
    toast.className = "fixed bottom-4 right-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[9999] max-w-sm pointer-events-none transform translate-y-0 opacity-100 transition-all duration-300 border-l-4 border-l-blue-500";
  }

  // Hide toast after 4.5s
  setTimeout(() => {
    toast.className = "fixed bottom-4 right-4 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[9999] max-w-sm pointer-events-none transform translate-y-20 opacity-0 transition-all duration-300";
  }, 4500);
}
