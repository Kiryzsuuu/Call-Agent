# Memisahkan Repository Backend dan Frontend

## Struktur Repository Terpisah

### Backend Repository (call-agent-backend)
```
call-agent-backend/
├── agent/
│   ├── main.py
│   ├── pdf_api.py
│   ├── whatsapp_bot.py
│   ├── requirements.txt
│   └── .env.local
├── uploaded_pdfs/
├── call_logs/
├── food_orders/
├── deploy.bat
└── README.md
```

### Frontend Repository (call-agent-frontend)
```
call-agent-frontend/
├── src/
├── public/
├── package.json
├── .env.local
├── deploy.bat
└── README.md
```

## Environment Variables

### Backend (.env.local)
```env
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-livekit-url
OPENAI_API_KEY=your_openai_key
API_BASE_URL=http://127.0.0.1:8002
CORS_ORIGINS=http://localhost:3000,https://your-frontend.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
```

## Deployment

### Development
1. **Backend**: `.\deploy-backend.bat`
2. **Frontend**: `.\deploy-frontend.bat`

### Production
1. **Backend**: Deploy ke Heroku/Railway/DigitalOcean
2. **Frontend**: Deploy ke Vercel/Netlify
3. Update environment variables dengan production URLs

## Koneksi Antar Repository
- Frontend menggunakan `NEXT_PUBLIC_API_BASE_URL` untuk API calls
- Backend menggunakan `CORS_ORIGINS` untuk allow frontend domains
- LiveKit Agent menggunakan `API_BASE_URL` untuk internal API calls

## Testing Koneksi
1. Start backend: `http://localhost:8002/docs`
2. Start frontend: `http://localhost:3000`
3. Test API connection di browser console