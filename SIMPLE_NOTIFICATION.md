# 📧 Notifikasi Pesanan Sederhana

## ✨ Fitur
- ✅ Email otomatis setelah konfirmasi pesanan
- ✅ Log WhatsApp untuk kirim manual
- ✅ Terintegrasi dengan agent

## 🔧 Setup Email (Gmail)
1. Aktifkan 2FA di Gmail
2. Buat App Password: https://myaccount.google.com/apppasswords
3. Edit `pdf_api.py` baris 418-419:
   ```python
   server.login("your-email@gmail.com", "your-app-password")
   ```

## 📱 WhatsApp Manual
- Pesan tersimpan di `whatsapp_messages.txt`
- Copy-paste manual ke WhatsApp pelanggan

## 🚀 Cara Kerja
```
Pelanggan pesan → Agent: "ORDER_CONFIRMED nama|telepon|email|alamat|items|total" → Email + WhatsApp log otomatis
```

## 🧪 Test
```bash
curl -X POST "http://127.0.0.1:8002/confirm-order" -H "Content-Type: application/json" -d '{"session_id":"test","customer_name":"John","customer_phone":"08123456789","customer_email":"test@email.com","delivery_address":"Jl. Test","order_items":["Nasi Gudeg"],"total_amount":25000}'
```