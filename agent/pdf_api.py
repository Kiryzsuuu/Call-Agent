import os
import uuid
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timedelta
import os
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
import pytesseract
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdf-api")

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
PDF_TEXT_PATH = "pdf_text_cache.txt"
PDF_STORAGE_DIR = "uploaded_pdfs"
os.makedirs(PDF_STORAGE_DIR, exist_ok=True)

@app.post("/upload-pdf-ocr")
async def upload_pdf_ocr(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"error": "File harus PDF"})
    contents = await file.read()
    # Simpan file PDF ke folder database
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    pdf_path = os.path.join(PDF_STORAGE_DIR, unique_name)
    with open(pdf_path, "wb") as f:
        f.write(contents)
    temp_path = pdf_path
    try:
        # Ekstrak teks langsung dari PDF
        reader = PdfReader(pdf_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        logger.info(f"Extracted text from PDF: {len(text)} characters")
        
        # OCR untuk gambar di PDF (optional, bisa di-skip jika error)
        ocr_text = ""
        try:
            images = convert_from_path(pdf_path)
            for img in images:
                ocr_text += pytesseract.image_to_string(img, lang="eng") + "\n"
            logger.info(f"OCR text extracted: {len(ocr_text)} characters")
        except Exception as ocr_error:
            logger.warning(f"OCR failed, skipping: {ocr_error}")
        
        full_text = text + "\n" + ocr_text
        with open(PDF_TEXT_PATH, "w", encoding="utf-8") as f:
            f.write(full_text)
        logger.info("PDF processed successfully")
    except Exception as e:
        logger.error(f"PDF processing error: {e}", exc_info=True)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        return JSONResponse(status_code=500, content={"error": str(e)})
    # File PDF tetap disimpan di database
    return {"success": True, "pdf_path": pdf_path}

@app.get("/pdf-text")
def get_pdf_text():
    if not os.path.exists(PDF_TEXT_PATH):
        return {"text": ""}
    with open(PDF_TEXT_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    return {"text": text}

@app.get("/list-pdfs")
def list_pdfs():
    """Mendapatkan daftar semua PDF yang sudah diupload"""
    if not os.path.exists(PDF_STORAGE_DIR):
        return {"pdfs": []}
    
    pdf_files = []
    for filename in os.listdir(PDF_STORAGE_DIR):
        if filename.endswith('.pdf'):
            file_path = os.path.join(PDF_STORAGE_DIR, filename)
            # Ambil nama asli (tanpa UUID prefix)
            original_name = filename.split('_', 1)[1] if '_' in filename else filename
            pdf_files.append({
                "id": filename,
                "name": original_name,
                "path": file_path,
                "size": os.path.getsize(file_path)
            })
    
    return {"pdfs": pdf_files}

class SelectPdfRequest(BaseModel):
    pdf_id: str

@app.post("/select-pdf")
async def select_pdf(request: SelectPdfRequest):
    """Memilih PDF tertentu untuk digunakan sebagai sumber informasi"""
    pdf_path = os.path.join(PDF_STORAGE_DIR, request.pdf_id)
    
    if not os.path.exists(pdf_path):
        return JSONResponse(status_code=404, content={"error": "PDF tidak ditemukan"})
    
    try:
        # Ekstrak teks dari PDF yang dipilih
        reader = PdfReader(pdf_path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        logger.info(f"PyPDF2 extracted: {len(text)} characters")
        
        # OCR untuk gambar di PDF (wajib jika text extraction gagal)
        ocr_text = ""
        try:
            images = convert_from_path(pdf_path)
            logger.info(f"Converting PDF to {len(images)} images for OCR")
            for i, img in enumerate(images):
                page_text = pytesseract.image_to_string(img, lang="eng")
                ocr_text += f"Page {i+1}:\n{page_text}\n\n"
                logger.info(f"OCR page {i+1}: {len(page_text)} characters")
        except Exception as ocr_error:
            logger.error(f"OCR failed: {ocr_error}")
        
        # Gunakan OCR jika text extraction gagal
        if len(text.strip()) < 50 and len(ocr_text.strip()) > 0:
            logger.info("Using OCR text as primary source")
            full_text = ocr_text
        else:
            full_text = text + "\n" + ocr_text
        
        # Simpan teks ke cache
        with open(PDF_TEXT_PATH, "w", encoding="utf-8") as f:
            f.write(full_text)
        
        logger.info(f"Selected PDF: {request.pdf_id}, extracted {len(full_text)} characters")
        return {"success": True, "message": "PDF berhasil dipilih", "text_length": len(full_text)}
        
    except Exception as e:
        logger.error(f"Error selecting PDF: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

CALL_LOGS_DIR = "call_logs"
os.makedirs(CALL_LOGS_DIR, exist_ok=True)

class CallLogRequest(BaseModel):
    session_id: str
    participant_type: str  # "user" or "agent"
    message: str
    timestamp: str
    result: str = None  # Result/outcome of conversation
    status: str = "active"  # active, completed, staff_taken

class StaffTakeoverRequest(BaseModel):
    session_id: str
    staff_name: str
    message: str

@app.post("/log-conversation")
async def log_conversation(request: CallLogRequest):
    """Log percakapan dengan order status dan session stats"""
    log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
    
    # Load existing log or create new
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8") as f:
            log_data = json.load(f)
    else:
        log_data = {
            "session_id": request.session_id,
            "start_time": request.timestamp,
            "messages": [],
            "order_status": "none",
            "session_stats": {
                "total_messages": 0,
                "response_delays": [],
                "keywords_detected": []
            }
        }
    
    # Add new message
    log_data["messages"].append({
        "type": request.participant_type,
        "message": request.message,
        "timestamp": request.timestamp
    })
    
    # Update session stats
    log_data["session_stats"]["total_messages"] += 1
    
    # Detect order completion
    if "CLOSE_CALL_CONFIRMED" in request.message:
        log_data["order_status"] = "completed"
        log_data["session_stats"]["keywords_detected"].append("CLOSE_CALL_CONFIRMED")
    
    # Detect human transfer
    if "TRANSFER_TO_HUMAN" in request.message:
        log_data["order_status"] = "transferred"
        log_data["session_stats"]["keywords_detected"].append("TRANSFER_TO_HUMAN")
    
    # Update result and status if provided
    if request.result:
        log_data["result"] = request.result
    if request.status:
        log_data["status"] = request.status
    
    # Save log
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)
    
    return {"success": True}

@app.get("/call-logs")
def get_call_logs():
    """Mendapatkan daftar semua log panggilan"""
    if not os.path.exists(CALL_LOGS_DIR):
        return {"logs": []}
    
    logs = []
    for filename in os.listdir(CALL_LOGS_DIR):
        if filename.endswith('.json'):
            file_path = os.path.join(CALL_LOGS_DIR, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    log_data = json.load(f)
                    logs.append({
                        "session_id": log_data["session_id"],
                        "start_time": log_data["start_time"],
                        "message_count": len(log_data["messages"]),
                        "last_message": log_data["messages"][-1]["timestamp"] if log_data["messages"] else log_data["start_time"],
                        "status": log_data.get("status", "active"),
                        "result": log_data.get("result", "")
                    })
            except Exception as e:
                logger.error(f"Error reading log file {filename}: {e}")
    
    # Sort by start time descending
    logs.sort(key=lambda x: x["start_time"], reverse=True)
    return {"logs": logs}

@app.get("/call-logs/{session_id}")
def get_call_log_detail(session_id: str):
    """Mendapatkan detail percakapan berdasarkan session ID"""
    log_file = os.path.join(CALL_LOGS_DIR, f"{session_id}.json")
    
    if not os.path.exists(log_file):
        return JSONResponse(status_code=404, content={"error": "Log tidak ditemukan"})
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            log_data = json.load(f)
        return log_data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/staff-takeover")
async def staff_takeover(request: StaffTakeoverRequest):
    """Staff mengambil alih percakapan"""
    log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
    
    if not os.path.exists(log_file):
        return JSONResponse(status_code=404, content={"error": "Session tidak ditemukan"})
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            log_data = json.load(f)
        
        from datetime import datetime
        log_data["messages"].append({
            "type": "staff",
            "message": f"Staff {request.staff_name} mengambil alih: {request.message}",
            "timestamp": datetime.now().isoformat(),
            "staff_name": request.staff_name
        })
        
        log_data["status"] = "staff_taken"
        log_data["staff_name"] = request.staff_name
        
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        return {"success": True}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/active-sessions")
def get_active_sessions():
    """Mendapatkan session yang sedang aktif"""
    if not os.path.exists(CALL_LOGS_DIR):
        return {"sessions": []}
    
    active_sessions = []
    for filename in os.listdir(CALL_LOGS_DIR):
        if filename.endswith('.json'):
            file_path = os.path.join(CALL_LOGS_DIR, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    log_data = json.load(f)
                    if log_data.get("status", "active") == "active":
                        active_sessions.append({
                            "session_id": log_data["session_id"],
                            "start_time": log_data["start_time"],
                            "message_count": len(log_data["messages"]),
                            "last_activity": log_data["messages"][-1]["timestamp"] if log_data["messages"] else log_data["start_time"]
                        })
            except Exception:
                pass
    
    return {"sessions": active_sessions}

class StaffTakeoverRequestModel(BaseModel):
    session_id: str
    message: str

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    sender: str  # "user" or "agent" or "staff"

class EditTranscriptRequest(BaseModel):
    session_id: str
    item_id: str
    new_text: str

class OrderConfirmationRequest(BaseModel):
    session_id: str
    customer_name: str
    customer_phone: str
    customer_email: str = None
    delivery_address: str
    order_items: list
    total_amount: float
    notes: str = None

@app.post("/request-staff-takeover")
async def request_staff_takeover(request: StaffTakeoverRequestModel):
    """Request staff takeover for a session"""
    try:
        # Log the takeover request
        log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
        
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        else:
            log_data = {
                "session_id": request.session_id,
                "start_time": datetime.now().isoformat(),
                "messages": []
            }
        
        # Add takeover request message
        log_data["messages"].append({
            "type": "system",
            "message": f"Staff takeover requested: {request.message}",
            "timestamp": datetime.now().isoformat()
        })
        
        log_data["status"] = "staff_requested"
        
        # Save log
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Staff takeover requested for session {request.session_id}")
        return {"success": True, "message": "Staff takeover requested"}
        
    except Exception as e:
        logger.error(f"Error requesting staff takeover: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/send-chat-message")
async def send_chat_message(request: ChatMessageRequest):
    """Send chat message to session"""
    try:
        # Log the chat message
        log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
        
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        else:
            log_data = {
                "session_id": request.session_id,
                "start_time": datetime.now().isoformat(),
                "messages": []
            }
        
        # Add chat message
        log_data["messages"].append({
            "type": f"chat_{request.sender}",
            "message": request.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Save log
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Chat message sent to session {request.session_id}")
        return {"success": True, "message": "Chat message sent"}
        
    except Exception as e:
        logger.error(f"Error sending chat message: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/staff-takeover-requests")
def get_staff_takeover_requests():
    """Get all pending staff takeover requests"""
    if not os.path.exists(CALL_LOGS_DIR):
        return {"requests": []}
    
    takeover_requests = []
    for filename in os.listdir(CALL_LOGS_DIR):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(CALL_LOGS_DIR, filename), "r", encoding="utf-8") as f:
                    log_data = json.load(f)
                    if log_data.get("status") == "staff_requested":
                        takeover_requests.append({
                            "session_id": log_data["session_id"],
                            "start_time": log_data["start_time"],
                            "message_count": len(log_data["messages"]),
                            "last_activity": log_data["messages"][-1]["timestamp"] if log_data["messages"] else log_data["start_time"],
                            "messages": log_data["messages"][-5:]  # Last 5 messages for context
                        })
            except Exception:
                pass
    
    takeover_requests.sort(key=lambda x: x["last_activity"], reverse=True)
    return {"requests": takeover_requests}

@app.post("/close-call")
async def close_call(request: CallLogRequest):
    """Close a call session"""
    try:
        log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
        
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        else:
            return JSONResponse(status_code=404, content={"error": "Session not found"})
        
        # Add closing message
        log_data["messages"].append({
            "type": "system",
            "message": "Call closed by agent",
            "timestamp": datetime.now().isoformat()
        })
        
        log_data["status"] = "completed"
        log_data["end_time"] = datetime.now().isoformat()
        
        # Save log
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Call closed for session {request.session_id}")
        return {"success": True, "message": "Call closed"}
        
    except Exception as e:
        logger.error(f"Error closing call: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/edit-transcript")
async def edit_transcript(request: EditTranscriptRequest):
    """Edit transcript message for typo correction"""
    try:
        log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
        
        if not os.path.exists(log_file):
            return JSONResponse(status_code=404, content={"error": "Session not found"})
        
        with open(log_file, "r", encoding="utf-8") as f:
            log_data = json.load(f)
        
        # Find and update the message
        for message in log_data["messages"]:
            if message.get("id") == request.item_id or f"{message['timestamp']}-{message['type']}" == request.item_id:
                message["message"] = request.new_text
                message["edited"] = True
                message["edited_at"] = datetime.now().isoformat()
                break
        
        # Save updated log
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Transcript edited for session {request.session_id}")
        return {"success": True, "message": "Transcript updated"}
        
    except Exception as e:
        logger.error(f"Error editing transcript: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

def send_email_notification(customer_email: str, customer_name: str, order_details: dict):
    """Kirim email konfirmasi pesanan"""
    try:
        msg = MIMEMultipart()
        msg['From'] = "your-email@gmail.com"  # Ganti dengan email Anda
        msg['To'] = customer_email
        msg['Subject'] = f"Konfirmasi Pesanan - {order_details['session_id'][:8]}"
        
        items_text = "\n".join([f"- {item}" for item in order_details['order_items']])
        
        body = f"""
Halo {customer_name},

Terima kasih atas pesanan Anda!

Detail Pesanan:
{items_text}

Total: Rp {order_details['total_amount']:,.0f}
Alamat: {order_details['delivery_address']}
Telepon: {order_details['customer_phone']}
Catatan: {order_details.get('notes', 'Tidak ada')}

Pesanan sedang diproses dan akan segera diantar.

Salam,
Tim Opetberjuang
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login("your-email@gmail.com", "your-app-password")  # Ganti dengan credentials
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent to {customer_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

def send_whatsapp_notification(customer_phone: str, customer_name: str, order_details: dict):
    """Log WhatsApp message (implementasi manual diperlukan)"""
    try:
        items_text = ", ".join(order_details['order_items'])
        
        message = f"""
Konfirmasi Pesanan untuk {customer_name}
Telepon: {customer_phone}
Pesanan: {items_text}
Total: Rp {order_details['total_amount']:,.0f}
Alamat: {order_details['delivery_address']}
        """
        
        # Simpan ke file log untuk manual WhatsApp
        with open("whatsapp_messages.txt", "a", encoding="utf-8") as f:
            f.write(f"\n{datetime.now().isoformat()}\n{message}\n{'='*50}\n")
        
        logger.info(f"WhatsApp message logged for {customer_phone}")
        return True
        
    except Exception as e:
        logger.error(f"Error logging WhatsApp: {e}")
        return False

@app.post("/confirm-order")
async def confirm_order(request: OrderConfirmationRequest):
    """Konfirmasi pesanan dan kirim notifikasi email/WhatsApp"""
    try:
        # Simpan detail pesanan ke log
        log_file = os.path.join(CALL_LOGS_DIR, f"{request.session_id}.json")
        
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        else:
            log_data = {
                "session_id": request.session_id,
                "start_time": datetime.now().isoformat(),
                "messages": []
            }
        
        # Tambahkan detail pesanan
        order_details = {
            "session_id": request.session_id,
            "customer_name": request.customer_name,
            "customer_phone": request.customer_phone,
            "customer_email": request.customer_email,
            "delivery_address": request.delivery_address,
            "order_items": request.order_items,
            "total_amount": request.total_amount,
            "notes": request.notes,
            "order_time": datetime.now().isoformat()
        }
        
        log_data["order_details"] = order_details
        log_data["order_status"] = "confirmed"
        
        # Log konfirmasi pesanan
        log_data["messages"].append({
            "type": "system",
            "message": f"Pesanan dikonfirmasi untuk {request.customer_name}",
            "timestamp": datetime.now().isoformat()
        })
        
        # Simpan log
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        # Kirim notifikasi
        notifications_sent = {
            "email": False,
            "whatsapp": False
        }
        
        # Kirim email jika ada email
        if request.customer_email:
            notifications_sent["email"] = send_email_notification(
                request.customer_email, 
                request.customer_name, 
                order_details
            )
        
        # Log WhatsApp message
        notifications_sent["whatsapp"] = send_whatsapp_notification(
            request.customer_phone,
            request.customer_name,
            order_details
        )
        
        logger.info(f"Order confirmed for session {request.session_id}")
        return {
            "success": True, 
            "message": "Pesanan berhasil dikonfirmasi",
            "notifications_sent": notifications_sent,
            "order_id": request.session_id[:8]
        }
        
    except Exception as e:
        logger.error(f"Error confirming order: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)