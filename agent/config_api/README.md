# Config API for ICAAI

This is a simple FastAPI backend to store and retrieve configuration for the Interactive Call Agent. Only staff can update the config, but all users (staff & customer) will use the latest config.

## Cara Menjalankan Backend

1. Masuk ke folder backend:
   ```bash
   cd agent/config_api
   ```
2. (Opsional) Buat virtual environment dan aktifkan:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # atau
   source venv/bin/activate  # Linux/Mac
   ```
3. Install FastAPI dan Uvicorn:
   ```bash
   pip install fastapi uvicorn
   ```
4. Jalankan server:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

## Endpoint
- `GET /config` : Ambil konfigurasi terbaru (JSON)
- `POST /config` : Simpan konfigurasi (hanya staff, body: `{ "data": { ... } }`)

## Integrasi di Frontend
- Staff: saat mengubah konfigurasi, lakukan POST ke `/config`.
- Customer & staff: saat load aplikasi, lakukan GET ke `/config` untuk mengambil setting terbaru.

## Catatan
- File konfigurasi akan tersimpan di `config.json` di folder ini.
- Pastikan backend ini berjalan saat frontend digunakan.
