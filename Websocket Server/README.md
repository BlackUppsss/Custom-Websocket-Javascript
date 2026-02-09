# 🌐 Custom WebSocket Server - Implementasi RFC 6455 dengan HTTPS

Aplikasi ini adalah implementasi WebSocket server dari scratch (tanpa library eksternal) yang mengikuti spesifikasi **RFC 6455** dan menggunakan **HTTPS/WSS (WebSocket Secure)** untuk koneksi yang aman.

## 📚 Tentang Protokol WebSocket (RFC 6455)

WebSocket adalah protokol komunikasi dua arah (full-duplex) yang memungkinkan koneksi persisten antara client dan server. Protokol ini dijelaskan secara lengkap dalam **[RFC 6455](https://tools.ietf.org/html/rfc6455)**.

### 🔑 Konsep Utama WebSocket:

1. **Handshake HTTP Upgrade**
   - Koneksi dimulai sebagai request HTTP biasa
   - Header `Upgrade: websocket` mengubah protokol ke WebSocket
   - Server mengirim respon dengan status `101 Switching Protocols`

2. **Frame-based Messaging**
   - Data dikirim dalam bentuk frame (bukan stream seperti HTTP)
   - Setiap frame memiliki: FIN, RSV, Opcode, Masking, Payload Length, dan Payload
   - Mendukung fragmentation (mengirim data dalam beberapa frame)

3. **Opcodes (Operation Codes)**
   - `0x0` - Continuation Frame
   - `0x1` - Text Frame
   - `0x2` - Binary Frame
   - `0x8` - Close Frame
   - `0x9` - Ping Frame
   - `0xA` - Pong Frame

4. **Masking (Keamanan)**
   - Data dari client harus di-mask dengan XOR menggunakan masking key
   - Data dari server tidak perlu di-mask
   - Mencegah cache poisoning attacks

5. **WebSocket Secure (WSS)**
   - Menggunakan TLS/SSL untuk enkripsi
   - Sama seperti HTTPS tapi untuk WebSocket
   - Membutuhkan SSL certificate

## 🏗️ Struktur Project

```
Websocket Server/
├── Server/
│   ├── appv3.js                    # Main server file (HTTPS/WSS)
│   ├── appv1.js                    # HTTP/WS version (non-secure)
│   ├── appv2.js                    # Another variant
│   ├── cert.crt                    # SSL Certificate file
│   ├── cert.key                    # SSL Private key file
│   ├── ca.crt                      # Certificate Authority (optional)
│   ├── ca.key                      # CA Private key (optional)
│   └── CustomLib/
│       ├── WebsocketConstants.js   # Konstanta dan konfigurasi
│       └── WebsocketMethods.js     # Implementasi logika WebSocket
├── index.html                      # Client HTML file
├── styles.css                      # Styling untuk UI
└── README.md                       # Dokumentasi ini
```

## 📋 Persyaratan (Requirements)

- **Node.js** (versi 12 atau lebih tinggi)
  - Download: https://nodejs.org/
- **SSL Certificates** (sudah disediakan di project)
  - `cert.crt` dan `cert.key` untuk HTTPS/WSS
- **VS Code dengan Live Server Extension** (recommended)
  - Untuk menjalankan HTML dengan HTTPS

## 🚀 Cara Menjalankan Server

### Langkah 1: Buka Terminal

Buka terminal atau PowerShell di direktori project ini.

### Langkah 2: Navigate ke Folder Server

```bash
cd Server
```

### Langkah 3: Jalankan Server WebSocket

```bash
node appv3.js
```

**Output yang diharapkan:**
```
WebSocket Server is running on port 4430
```

Server sekarang listen di:
- **Protocol:** `wss://` (WebSocket Secure)
- **IP:** `0.0.0.0` (menerima koneksi dari semua IP)
- **Port:** `4430`
- **Full URL:** `wss://localhost:4430`

## 🔧 Cara Menjalankan Client dengan Live Server HTTPS

### Langkah 1: Install VS Code Live Server Extension

1. Buka VS Code
2. Tekan `Ctrl + Shift + X` untuk membuka Extensions
3. Cari "Live Server" (oleh Ritwick Dey)
4. Klik "Install"

### Langkah 2: Konfigurasi Live Server untuk HTTPS

#### Opsi A: Konfigurasi via Settings

1. Tekan `Ctrl + ,` untuk membuka Settings
2. Cari "Live Server" di search box
3. Scroll ke bagian "Settings: Live Server"
4. Set konfigurasi berikut:
   - **Live Server: HTTPS** → `true` (ceklis)
   - **Live Server: Cert** → Path ke `cert.crt`
   - **Live Server: Key** → Path ke `cert.key`

**Path lengkap:**
```
Cert: c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.crt
Key:  c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.key
```

#### Opsi B: Konfigurasi via `.vscode/settings.json`

Buat file `.vscode/settings.json` di root project:

```json
{
    "liveServer.settings.https": {
        "enable": true,
        "cert": "c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.crt",
        "key": "c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.key",
        "passphrase": ""
    },
    "liveServer.settings.port": 5500
}
```

### Langkah 3: Jalankan Live Server

**Cara 1: Dari VS Code**
1. Klik kanan pada file `index.html`
2. Pilih "Open with Live Server"
3. Browser akan membuka di: `https://localhost:5500`

**Cara 2: Dari Command Line**
```bash
npx live-server --https=c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.crt --key=c:/Randy's/Bot/Websocket/Websocket Server/Server/cert.key --port=5500
```

## ⚠️ Langkah Penting: Izinkan HTTPS Localhost

Karena menggunakan self-signed SSL certificate, browser akan menampilkan peringatan:

1. Saat membuka `https://localhost:5500`, browser menampilkan warning:
   - "Your connection is not private"
   - atau "Not Secure"

2. **Klik "Advanced"** (atau "Lanjutan")

3. **Klik "Proceed to localhost (unsafe)"** (atau "Lanjut ke localhost (tidak aman)")

4. Browser sekarang akan memuat halaman dengan HTTPS

5. **PENTING:** Juga test akses langsung ke server:
   ```
   https://localhost:4430
   ```
   Harus muncul: `WebSocket Server is running`

## 🎯 Cara Menggunakan WebSocket Client

### Step 1: Pastikan Server Berjalan

Terminal harus menampilkan:
```
WebSocket Server is running on port 4430
```

### Step 2: Buka HTML di Browser

Buka `https://localhost:5500` via Live Server dengan HTTPS.

### Step 3: Klik "Open WS"

1. Klik tombol **"Open WS"**
2. Status akan berubah menjadi: "Connected to: wss://localhost:4430"
3. Form pesan akan muncul

### Step 4: Kirim Pesan

1. Ketik pesan di textarea
2. Klik **"Send Message"**
3. Pesan akan dikirim ke server dan di-echo balik

### Step 5: Tutup Koneksi

Klik tombol **"Close Connection"** untuk menutup koneksi WebSocket.

## 🔍 Verifikasi Koneksi

### Cek Server Status di Terminal

```powershell
netstat -ano | findstr :4430
```

Harus muncul:
```
TCP    0.0.0.0:4430           0.0.0.0:0              LISTENING       [PID]
TCP    [::]:4430              [::]:0                 LISTENING       [PID]
```

### Cek dengan cURL

```powershell
curl -k https://localhost:4430
```

Harus muncul:
```
WebSocket Server is running
```

## 📊 Cara Kerja Aplikasi

### Handshake Process

1. **Client mengirim HTTP request:**
   ```
   GET / HTTP/1.1
   Host: localhost:4430
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: [random key]
   Sec-WebSocket-Version: 13
   Origin: https://localhost:5500
   ```

2. **Server memverifikasi request:**
   - Cek header `Upgrade: websocket`
   - Cek header `Connection: Upgrade`
   - Cek method `GET`
   - Cek origin (harus diizinkan)
   - Cek WebSocket Version

3. **Server mengirim upgrade response:**
   ```
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: [server key]
   ```

   Server key dihasilkan dengan:
   ```
   Server Key = Base64(SHA1(Client Key + GUID))
   ```

4. **Koneksi WebSocket terbuka**
   - HTTP connection di-upgrade ke WebSocket
   - Client dan server bisa bertukar pesan dalam frame

### Frame Structure

Setiap frame WebSocket memiliki struktur:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

### Flow Diagram

```
Client                                    Server
  |                                          |
  |  HTTP Request (Upgrade)                  |
  |----------------------------------------->|
  |                                          |  Validate Headers
  |                                          |  Generate Server Key
  |  HTTP Response (101 Switching)          |
  |<-----------------------------------------|
  |                                          |
  |  WebSocket Connection Open                |
  |<========================================>|
  |                                          |
  |  WebSocket Frame (Masked)                |
  |----------------------------------------->|
  |                                          |  Unmask Data
  |                                          |  Process Message
  |  WebSocket Frame (Unmasked Echo)         |
  |<-----------------------------------------|
  |                                          |
  |  Close Frame                             |
  |----------------------------------------->|
  |                                          |
  |  Close Frame Response                    |
  |<-----------------------------------------|
  |                                          |
```

## 🛠️ Konfigurasi

### Mengubah Port

Edit file `Server/CustomLib/WebsocketConstants.js`:

```javascript
PORT: process.env.PORT || 4430,  // Ubah 4430 ke port lain
```

Atau gunakan environment variable:
```powershell
$env:PORT = 8080
node Server/appv3.js
```

### Mengubah Allowed Origins

Edit file `Server/CustomLib/WebsocketConstants.js`:

```javascript
ALLOWED_ORIGINS: [
    'https://localhost:5500',
    'https://127.0.0.1:5500',
    'null',  // Untuk file:// protocol
    'https://your-custom-domain.com',  // Tambahkan origin lain
]
```

### Mengubah Maximum Payload Size

Edit file `Server/CustomLib/WebsocketMethods.js`:

```javascript
MaxPayload: 1024 * 1024,  // 1 MB (default)
```

## ❓ Troubleshooting

### Problem: "WebSocket connection to 'wss://localhost:4430/' failed"

**Cause:** Server tidak berjalan atau ada masalah sertifikat.

**Solution:**
1. Cek apakah server berjalan:
   ```powershell
   netstat -ano | findstr :4430
   ```
2. Pastikan server appv3.js berjalan
3. Pastikan sertifikat SSL valid
4. Test akses: `https://localhost:4430`

### Problem: "Mixed Content: The page was loaded over HTTPS"

**Cause:** HTML dibuka via HTTP tapi koneksi ke WSS.

**Solution:**
- Pastikan HTML dibuka via Live Server dengan HTTPS
- URL harus: `https://localhost:5500` (bukan `http://`)

### Problem: "Origin not allowed"

**Cause:** Origin HTML tidak ada di ALLOWED_ORIGINS.

**Solution:**
1. Tambahkan origin ke `ALLOWED_ORIGINS` di `WebsocketConstants.js`
2. Atau buka HTML dari origin yang sudah diizinkan

### Problem: Browser menolak koneksi SSL

**Cause:** Self-signed certificate tidak dipercaya.

**Solution:**
1. Klik "Advanced" → "Proceed to localhost (unsafe)"
2. Atau import certificate ke trusted root CA

### Problem: Port sudah digunakan (EADDRINUSE)

**Cause:** Port 4430 sudah dipakai proses lain.

**Solution:**
1. Cari proses yang pakai port:
   ```powershell
   netstat -ano | findstr :4430
   ```
2. Kill proses:
   ```powershell
   taskkill /PID [PID_NUMBER] /F
   ```
3. Atau gunakan port lain

## 📝 Catatan Penting

1. **Self-Signed Certificate:** Certificate yang digunakan adalah self-signed, jadi browser akan menampilkan warning. Ini normal untuk development.

2. **HTTPS Required:** Karena menggunakan WSS (WebSocket Secure), HTML harus dibuka via HTTPS, bukan HTTP.

3. **Origin Check:** Server melakukan strict origin checking untuk security. Pastikan origin HTML ada di `ALLOWED_ORIGINS`.

4. **Masking:** Semua frame dari client harus di-mask. Server akan menolak frame yang tidak di-mask.

5. **Payload Size:** Default max payload adalah 1 MB. Bisa diubah di `WebsocketMethods.js`.

6. **Error Handling:** Server menutup koneksi dengan error code jika:
   - Frame tidak di-mask (Code: 1002)
   - Opcode tidak valid (Code: 1003)
   - Payload terlalu besar (Code: 1009)
   - Tidak ada status code di close frame (Code: 1008)

## 🔗 Referensi

- [RFC 6455 - The WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [MDN Web Docs - WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [WebSocket Frame Visualization](https://websocket.org/frames)

## 📄 Lisensi

Project ini dibuat untuk tujuan edukasi untuk memahami protokol WebSocket dari implementasi low-level sesuai RFC 6455.

## 👨‍💻 Penjelasan Technical Implementation

### Handshake Implementation

Lihat `Server/CustomLib/WebsocketMethods.js`:

```javascript
function upgradeConnection(req, socket, head) {
    const clientKey = req.headers['sec-websocket-key'];
    const headers = createUpgradeHeaders(clientKey);
    socket.write(headers);
    startWebSocketConnection(socket);
}

function generateServerKey(clientKey) {
    let data = clientKey + WsConstants.GUID;
    const hash = crypto.createHash('sha1');
    hash.update(data);
    return hash.digest('base64');
}
```

### Frame Processing

WebSocketReceiver class menangani parsing frame:

1. **GET_INFO** - Extract FIN, Opcode, Masking, dan payload length indicator
2. **GET_LENGTH** - Parse payload length (extended jika perlu)
3. **GET_MASK_KEY** - Extract 4-byte masking key
4. **GET_PAYLOAD** - Extract dan unmask payload
5. **SEND_ECHO** - Kirim balik pesan ke client
6. **GET_CLOSE_INFO** - Process close frame

### Masking Implementation

```javascript
function UnmaskedPayload(PayloadBuffer, MaskKey) {
    for (let i = 0; i < PayloadBuffer.length; i++) {
        PayloadBuffer[i] = PayloadBuffer[i] ^ MaskKey[i % 4];
    }
    return PayloadBuffer;
}
```

Ini mengimplementasikan algoritma masking dari RFC 6455 section 5.3.

---

**Selamat belajar WebSocket! 🎉**