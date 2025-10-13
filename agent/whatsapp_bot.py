import os
import json
import logging
import asyncio
from datetime import datetime
from fastapi import FastAPI, Request
from pydantic import BaseModel
import requests
import openai
from dotenv import load_dotenv

load_dotenv(".env.local")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("whatsapp-bot")

app = FastAPI()

# WhatsApp Configuration
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "your_verify_token")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# OpenAI Client
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

class WhatsAppMessage(BaseModel):
    from_number: str
    message_text: str
    message_id: str

async def get_pdf_context():
    """Ambil konteks PDF dari backend"""
    try:
        response = requests.get("http://127.0.0.1:8001/pdf-text")
        if response.status_code == 200:
            pdf_data = response.json()
            return pdf_data.get("text", "")[:10000]  # Ambil 10k karakter
    except Exception as e:
        logger.error(f"Error fetching PDF context: {e}")
    return ""

async def generate_ai_response(user_message: str, user_phone: str):
    """Generate response menggunakan OpenAI dengan konteks PDF"""
    try:
        # Ambil konteks PDF
        pdf_context = await get_pdf_context()
        
        # System prompt untuk WhatsApp bot
        system_prompt = """Anda adalah Interactive Call Agent AI untuk Warteg OPET yang berkomunikasi melalui WhatsApp. 
        Selalu merespons dalam bahasa Indonesia dengan ramah dan informatif.
        
        FITUR PEMESANAN MAKANAN:
        Jika pelanggan ingin memesan makanan, bantu mereka dengan menanyakan:
        1. Nama lengkap
        2. Email  
        3. Nomor telepon (sudah ada dari WhatsApp)
        4. Item yang dipesan (nama, jumlah, harga)
        5. Waktu pengiriman yang diinginkan
        6. Alamat pengiriman
        7. Catatan khusus
        
        Setelah mendapat semua informasi, konfirmasi pesanan dan buat pesanan melalui sistem.
        """
        
        if pdf_context:
            system_prompt += f"\n\nSumber data dari PDF (MENU MAKANAN):\n{pdf_context}\n\nGunakan informasi menu ini untuk membantu pelanggan memilih makanan dan menghitung total harga pesanan."
        
        # Generate response
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.8
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return "Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti."

async def send_whatsapp_message(to_number: str, message: str):
    """Kirim pesan WhatsApp"""
    try:
        # Format nomor telepon
        formatted_phone = to_number.replace("+", "").replace("-", "").replace(" ", "")
        if formatted_phone.startswith("0"):
            formatted_phone = "62" + formatted_phone[1:]
        elif not formatted_phone.startswith("62"):
            formatted_phone = "62" + formatted_phone
        
        url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages"
        
        headers = {
            "Authorization": f"Bearer {WHATSAPP_TOKEN}",
            "Content-Type": "application/json"
        }
        
        data = {
            "messaging_product": "whatsapp",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            logger.info(f"WhatsApp message sent to {formatted_phone}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        return False

async def create_food_order_from_whatsapp(order_data: dict):
    """Buat pesanan makanan dari WhatsApp"""
    try:
        response = requests.post("http://127.0.0.1:8001/create-food-order", json=order_data)
        if response.status_code == 200:
            result = response.json()
            return result
        else:
            logger.error(f"Failed to create order: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        return None

# Webhook verification
@app.get("/webhook")
async def verify_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        return int(challenge)
    else:
        logger.warning("Webhook verification failed")
        return "Verification failed", 403

# Webhook untuk menerima pesan
@app.post("/webhook")
async def handle_webhook(request: Request):
    try:
        body = await request.json()
        logger.info(f"Received webhook: {json.dumps(body, indent=2)}")
        
        # Parse WhatsApp message
        if "entry" in body:
            for entry in body["entry"]:
                if "changes" in entry:
                    for change in entry["changes"]:
                        if change.get("field") == "messages":
                            value = change.get("value", {})
                            
                            # Handle incoming messages
                            if "messages" in value:
                                for message in value["messages"]:
                                    from_number = message.get("from")
                                    message_id = message.get("id")
                                    
                                    # Handle text messages
                                    if message.get("type") == "text":
                                        message_text = message["text"]["body"]
                                        
                                        logger.info(f"Received message from {from_number}: {message_text}")
                                        
                                        # Generate AI response
                                        ai_response = await generate_ai_response(message_text, from_number)
                                        
                                        # Send response
                                        await send_whatsapp_message(from_number, ai_response)
                                        
                                        # Log conversation
                                        try:
                                            requests.post("http://127.0.0.1:8001/log-conversation", json={
                                                "session_id": f"whatsapp_{from_number}",
                                                "participant_type": "user",
                                                "message": message_text,
                                                "timestamp": datetime.now().isoformat()
                                            })
                                            
                                            requests.post("http://127.0.0.1:8001/log-conversation", json={
                                                "session_id": f"whatsapp_{from_number}",
                                                "participant_type": "agent",
                                                "message": ai_response,
                                                "timestamp": datetime.now().isoformat()
                                            })
                                        except Exception as e:
                                            logger.error(f"Error logging conversation: {e}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "WhatsApp Bot is running"}

@app.get("/status")
async def status():
    return {
        "whatsapp_configured": bool(WHATSAPP_TOKEN and WHATSAPP_PHONE_ID),
        "openai_configured": bool(OPENAI_API_KEY),
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)