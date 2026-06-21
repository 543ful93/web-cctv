package com.webcctv.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.net.ConnectivityManager
import android.os.AsyncTask
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var setupLayout: LinearLayout
    private lateinit var inputLocalIp: EditText
    private lateinit var inputCloudDomain: EditText
    private lateinit var btnSave: Button
    private lateinit var sharedPref: SharedPreferences

    private var localUrl = "http://192.168.1.18:3000"
    private var cloudUrl = "https://cctv.domainanda.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        sharedPref = getSharedPreferences("WebCctvPrefs", Context.MODE_PRIVATE)
        
        // Inisialisasi UI
        webView = findViewById(R.id.webView)
        setupLayout = findViewById(R.id.setupLayout)
        inputLocalIp = findViewById(R.id.inputLocalIp)
        inputCloudDomain = findViewById(R.id.inputCloudDomain)
        btnSave = findViewById(R.id.btnSave)

        // Muat alamat yang tersimpan
        localUrl = sharedPref.getString("localUrl", localUrl) ?: localUrl
        cloudUrl = sharedPref.getString("cloudUrl", cloudUrl) ?: cloudUrl

        inputLocalIp.setText(localUrl)
        inputCloudDomain.setText(cloudUrl)

        // Cek jika konfigurasi pertama kali diperlukan
        if (sharedPref.getBoolean("isFirstRun", true)) {
            showSetupScreen()
        } else {
            startNetworkCheck()
        }

        btnSave.setOnClickListener {
            val localInput = inputLocalIp.text.toString().trim()
            val cloudInput = inputCloudDomain.text.toString().trim()

            if (localInput.isNotEmpty() && cloudInput.isNotEmpty()) {
                sharedPref.edit().apply {
                    putString("localUrl", localInput)
                    putString("cloudUrl", cloudInput)
                    putBoolean("isFirstRun", false)
                    apply()
                }
                localUrl = localInput
                cloudUrl = cloudInput
                setupLayout.visibility = View.GONE
                webView.visibility = View.VISIBLE
                startNetworkCheck()
            } else {
                Toast.makeText(this, "Harap isi kedua kolom alamat!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showSetupScreen() {
        setupLayout.visibility = View.VISIBLE
        webView.visibility = View.GONE
    }

    private fun startNetworkCheck() {
        if (!isNetworkAvailable()) {
            Toast.makeText(this, "Tidak ada koneksi internet!", Toast.LENGTH_LONG).show()
            showSetupScreen()
            return
        }
        // Jalankan Ping Asinkron ke IP lokal untuk mendeteksi jaringan rumah
        PingTask { isLocalAvailable ->
            if (isLocalAvailable) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Terhubung via Jaringan Wi-Fi Lokal (Cepat & Hemat Kuota)", Toast.LENGTH_SHORT).show()
                    loadWebCctv(localUrl)
                }
            } else {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Luar Jangkauan Wi-Fi, Terhubung via Cloudflare Domain", Toast.LENGTH_SHORT).show()
                    loadWebCctv(cloudUrl)
                }
            }
        }.execute(localUrl + "/api/settings")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun loadWebCctv(targetUrl: String) {
        setupLayout.visibility = View.GONE
        webView.visibility = View.VISIBLE

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Pasang Client penanganan navigasi di dalam WebView saja
        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                Toast.makeText(this@MainActivity, "Gagal memuat alamat. Membuka opsi konfigurasi...", Toast.LENGTH_LONG).show()
                showSetupScreen()
            }
        }
        
        webView.webChromeClient = WebChromeClient() // Dukungan penuh HLS Player & Dialog
        webView.loadUrl(targetUrl)
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetworkInfo = connectivityManager.activeNetworkInfo
        return activeNetworkInfo != null && activeNetworkInfo.isConnected
    }

    // Ping Task Asinkron dengan Timeout 1.2 Detik untuk Respon Tercepat
    private class PingTask(val callback: (Boolean) -> Unit) : AsyncTask<String, Void, Boolean>() {
        override fun doInBackground(vararg params: String?): Boolean {
            val urlStr = params[0] ?: return false
            return try {
                val connection = URL(urlStr).openConnection() as HttpURLConnection
                connection.connectTimeout = 1200 // Timeout 1.2 detik
                connection.readTimeout = 1200
                connection.requestMethod = "GET"
                val responseCode = connection.responseCode
                responseCode == 200
            } catch (e: Exception) {
                false
            }
        }

        override fun onPostExecute(result: Boolean) {
            callback(result)
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack() // Berpindah ke riwayat halaman web UI di dalam WebView
        } else {
            super.onBackPressed()
        }
    }
}
