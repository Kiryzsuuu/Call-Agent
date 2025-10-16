# Interactive Call Agent AI dengan WhatsApp & Microsoft Booking

Proyek ini adalah sistem Interactive Call Agent AI yang terintegrasi dengan WhatsApp Business API dan Microsoft Booking untuk pemesanan makanan Warteg OPET. Dibangun menggunakan LiveKit Agents dan OpenAI Realtime API.

## Struktur Repository

### /agent
- `main.py` - LiveKit Agent utama untuk voice AI
- `pdf_api.py` - Backend FastAPI untuk PDF upload, OCR, dan food ordering
- `whatsapp_bot.py` - WhatsApp Business API bot
- `uploaded_pdfs/` - Folder penyimpanan PDF menu
- `call_logs/` - Log percakapan
- `food_orders/` - Data pesanan makanan

### /web
- Frontend Next.js dengan interface untuk upload PDF dan monitoring

## Prasyarat

- Python 3.10+
- Node.js & pnpm
- LiveKit Cloud atau self-hosted LiveKit server
- WhatsApp Business API (Meta)
- Microsoft 365 Business (untuk Bookings)
- Poppler (untuk pdf2image)
- Tesseract OCR (untuk pytesseract)

## Setup dan Instalasi

### 1. Setup Backend Agent

```bash
cd agent
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. Konfigurasi Environment Variables

Buat file `.env.local` di folder `agent/`:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# WhatsApp Business API Configuration
WHATSAPP_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
ADMIN_WHATSAPP=628123456789  # Nomor admin untuk notifikasi

# Microsoft Graph API (untuk Bookings)
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=your_tenant_id
```

### 3. Setup Backend Config (Global Setting)

Jika ingin agar setting (konfigurasi) hanya bisa diubah staff dan berlaku untuk semua user (customer & staff):

```bash
cd agent/config_api
python -m venv venv
venv\Scripts\activate  # Windows
pip install fastapi uvicorn
uvicorn main:app --reload --port 8001  # Backend config (khusus endpoint /config)
```

- Endpoint GET/POST: `http://localhost:8001/config`
- Integrasikan frontend agar staff melakukan POST ke endpoint ini saat mengubah setting, dan semua user melakukan GET saat load aplikasi.
- Lihat detail di `agent/config_api/README.md`.

### 4. Setup Frontend

```bash
cd ../web
npm install
```

Buat file `.env.local` di folder `web/`:

```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

## Menjalankan Sistem


### 1. Jalankan Backend Config (Port 8001)
```bash
cd agent/config_api
uvicorn main:app --reload --port 8001
```

### 2. Jalankan Backend PDF & OCR (Port 8002)
```bash
cd agent
uvicorn pdf_api:app --reload --host 127.0.0.1 --port 8002
```

### 2. Jalankan WhatsApp Bot (Port 8002)
```bash
cd agent
python whatsapp_bot.py
# atau
uvicorn whatsapp_bot:app --reload --host 0.0.0.0 --port 8002
```

### 3. Jalankan LiveKit Agent (Voice AI)
```bash
cd agent
python main.py dev
```

### 4. Jalankan Frontend (Port 3000)
```bash
cd web
npm run dev
```

---

# 📱 Backend WhatsApp Business API

## Setup WhatsApp Business API

### 1. Buat WhatsApp Business Account
1. Daftar di [Meta for Developers](https://developers.facebook.com/)
2. Buat aplikasi baru dan pilih "WhatsApp Business API"
3. Dapatkan:
   - `WHATSAPP_TOKEN` (Access Token)
   - `WHATSAPP_PHONE_ID` (Phone Number ID)
   - `WHATSAPP_VERIFY_TOKEN` (Webhook Verify Token)

### 2. Konfigurasi Webhook
1. URL Webhook: `https://your-domain.com/webhook`
2. Verify Token: sesuai dengan `WHATSAPP_VERIFY_TOKEN`
3. Subscribe ke events: `messages`

### 3. Fitur WhatsApp Bot
- ✅ Menerima pesan dari pelanggan
- 🤖 Respons otomatis menggunakan OpenAI GPT-4
- 📋 Membantu pemesanan makanan berdasarkan menu PDF
- 📞 Integrasi dengan sistem call logs
- 🔔 Notifikasi pesanan ke admin

### 4. Endpoint WhatsApp Bot

```
GET  /webhook          - Verifikasi webhook
POST /webhook          - Menerima pesan WhatsApp
GET  /status           - Status konfigurasi bot
POST /send-whatsapp    - Kirim pesan manual
GET  /whatsapp-conversations - Daftar percakapan
```

### 5. Testing WhatsApp Bot

```bash
# Test webhook verification
curl "http://localhost:8002/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=12345"

# Test status
curl http://localhost:8002/status

# Kirim pesan manual
curl -X POST http://localhost:8002/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "628123456789", "message": "Test message"}'
```

---

# 📅 Backend Microsoft Booking

## Setup Microsoft Bookings

### 1. Buat Microsoft 365 Business Account
1. Daftar [Microsoft 365 Business](https://www.microsoft.com/microsoft-365/business)
2. Aktifkan Microsoft Bookings di admin center
3. Buat booking page untuk "Warteg OPET Delivery"

### 2. Setup Azure App Registration
1. Masuk ke [Azure Portal](https://portal.azure.com/)
2. Buat App Registration baru:
   - Name: "Warteg OPET Booking"
   - Supported account types: "Single tenant"
3. Dapatkan:
   - `MICROSOFT_CLIENT_ID` (Application ID)
   - `MICROSOFT_CLIENT_SECRET` (Client Secret)
   - `MICROSOFT_TENANT_ID` (Directory ID)

### 3. Konfigurasi API Permissions
Tambahkan permissions berikut:
- `Bookings.ReadWrite.All`
- `Calendars.ReadWrite`
- `User.Read`

### 4. Fitur Food Ordering System

#### Endpoint Pemesanan:
```
POST /create-food-order     - Buat pesanan baru
POST /update-order-status   - Update status pesanan
GET  /food-orders           - Daftar semua pesanan
```

#### Flow Pemesanan:
1. 🛒 Pelanggan pesan via WhatsApp/Voice AI
2. 📋 Sistem collect data: nama, email, phone, items, alamat
3. 💾 Simpan order ke file JSON lokal
4. 📅 Buat appointment di Microsoft Bookings
5. 📱 Kirim konfirmasi WhatsApp ke pelanggan
6. 🔔 Notifikasi ke admin WhatsApp

#### Contoh Request Pemesanan:
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "628123456789",
  "items": [
    {"name": "Nasi Gudeg", "quantity": 2, "price": 25000},
    {"name": "Es Teh", "quantity": 2, "price": 5000}
  ],
  "total_amount": 60000,
  "delivery_time": "2024-01-15T12:00:00Z",
  "delivery_address": "Jl. Sudirman No. 123, Jakarta",
  "notes": "Pedas sedang"
}
```

### 5. Status Tracking System

Status pesanan:
- `pending` - Menunggu konfirmasi
- `confirmed` - Dikonfirmasi, akan diproses
- `preparing` - Sedang disiapkan
- `delivering` - Dalam perjalanan
- `completed` - Selesai
- `cancelled` - Dibatalkan

Setiap update status akan mengirim notifikasi WhatsApp otomatis.

---

# 📄 PDF Upload & OCR Integration

## Fitur PDF System
- ✅ Upload PDF menu dari frontend
- 🔍 Ekstraksi teks dan OCR otomatis
- 🤖 AI menggunakan menu PDF untuk membantu pemesanan
- 📚 Multi-PDF support dengan selector
- 💾 Penyimpanan permanen di folder database

## Instalasi Dependencies

### Windows:
1. **Poppler**: Download dari [releases](https://github.com/oschwartz10612/poppler-windows/releases/)
   - Extract ke `C:\poppler`
   - Tambahkan `C:\poppler\Library\bin` ke PATH

2. **Tesseract OCR**: Download dari [GitHub](https://github.com/tesseract-ocr/tesseract)
   - Install ke `C:\Program Files\Tesseract-OCR`
   - Tambahkan ke PATH

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils tesseract-ocr

# macOS
brew install poppler tesseract
```

## API Endpoints PDF

```
POST /upload-pdf-ocr    - Upload dan proses PDF baru
GET  /pdf-text          - Ambil teks PDF yang aktif
GET  /list-pdfs         - Daftar semua PDF tersimpan
POST /select-pdf        - Pilih PDF untuk digunakan AI
GET  /debug-pdf-cache   - Debug status PDF cache
```

## Cara Penggunaan

1. **Upload Menu PDF**:
   - Buka frontend (localhost:3000)
   - Drag & drop PDF menu ke area upload
   - Sistem otomatis ekstrak teks + OCR

2. **Pilih PDF Aktif**:
   - Gunakan dropdown selector untuk ganti menu
   - AI akan menggunakan menu yang dipilih

3. **Pemesanan via AI**:
   - Voice AI atau WhatsApp bot bisa akses menu
   - AI bantu pelanggan pilih makanan dan hitung harga

## Struktur Data

```
agent/
├── uploaded_pdfs/          # Penyimpanan PDF permanen
│   ├── uuid1_menu-warteg.pdf
│   └── uuid2_menu-baru.pdf
├── pdf_text_cache.txt      # Cache teks PDF aktif
├── call_logs/              # Log percakapan
└── food_orders/            # Data pesanan
```

---

# 📊 Monitoring & Analytics

## Dashboard Features
- 📞 Real-time call monitoring
- 💬 WhatsApp conversation tracking  
- 🍽️ Food order management
- 📈 Analytics dan reporting
- 👥 Staff takeover untuk complex cases

## API Endpoints Monitoring

```
GET  /call-logs              - Daftar semua percakapan
GET  /call-logs/{session_id} - Detail percakapan
GET  /active-sessions        - Session yang sedang aktif
POST /staff-takeover         - Staff ambil alih percakapan
GET  /whatsapp-conversations - Percakapan WhatsApp
GET  /food-orders            - Daftar pesanan makanan
```

## Logging System

Setiap interaksi tersimpan dalam format JSON:

```json
{
  "session_id": "uuid-session",
  "start_time": "2024-01-15T10:00:00Z",
  "status": "active|completed|staff_taken",
  "messages": [
    {
      "type": "user|agent|staff",
      "message": "Pesan content",
      "timestamp": "2024-01-15T10:01:00Z"
    }
  ],
  "result": "order_completed|info_provided|escalated"
}
```

---

# 🔧 Troubleshooting

## WhatsApp Issues
- ❌ **Webhook tidak terverifikasi**: Pastikan `WHATSAPP_VERIFY_TOKEN` sama dengan yang di Meta Developer Console
- ❌ **Pesan tidak terkirim**: Cek `WHATSAPP_TOKEN` dan `WHATSAPP_PHONE_ID`
- ❌ **Format nomor salah**: Bot otomatis format ke +62xxx

## Microsoft Booking Issues
- ❌ **Authentication failed**: Cek `MICROSOFT_CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`
- ❌ **Permission denied**: Pastikan API permissions sudah di-grant admin consent
- ❌ **Booking gagal**: Cek apakah Microsoft Bookings sudah aktif

## General Issues
- ❌ **Port conflict**: Pastikan port 8001, 8002, 3000 tidak digunakan aplikasi lain
- ❌ **PDF OCR gagal**: Install Poppler dan Tesseract, tambahkan ke PATH
- ❌ **OpenAI timeout**: Cek `OPENAI_API_KEY` dan quota

## Deployment Production

### 1. Backend Deployment
- Deploy FastAPI menggunakan Gunicorn + Nginx
- Setup SSL certificate untuk HTTPS (required untuk WhatsApp webhook)
- Gunakan database PostgreSQL untuk production

### 2. WhatsApp Webhook
- URL harus HTTPS dan publicly accessible
- Gunakan ngrok untuk development: `ngrok http 8002`

### 3. Environment Variables Production
```env
# Production settings
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@localhost/warteg_db
REDIS_URL=redis://localhost:6379
```

## Resources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/)
- [Microsoft Graph Bookings API](https://docs.microsoft.com/en-us/graph/api/resources/booking-api-overview)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)