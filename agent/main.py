from __future__ import annotations

import asyncio
import json
import logging
import uuid
import requests
from dataclasses import asdict, dataclass
from typing import Any, Dict

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    WorkerType,
    cli,
)
from livekit.agents import AgentSession, Agent
from livekit.plugins import openai

from dotenv import load_dotenv

load_dotenv(".env.local")

logger = logging.getLogger("my-worker")
logger.setLevel(logging.INFO)

@dataclass
class SessionConfig:
    openai_api_key: str
    instructions: str
    voice: str
    temperature: float
    max_response_output_tokens: str | int
    modalities: list[str]

    def to_dict(self):
        return {k: v for k, v in asdict(self).items() if k != "openai_api_key"}

def parse_session_config(data: Dict[str, Any]) -> SessionConfig:
    return SessionConfig(
        openai_api_key=data.get("openai_api_key", ""),
        instructions=data.get("instructions", "Anda adalah Interactive Call Agent AI."),
        voice=data.get("voice", "alloy"),
        temperature=float(data.get("temperature", 0.8)),
        max_response_output_tokens=int(data.get("max_output_tokens") or 2048),
        modalities=["text", "audio"],
    )

async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    metadata = json.loads(participant.metadata) if participant.metadata else {}
    config = parse_session_config(metadata)

    if not config.openai_api_key:
        raise Exception("OpenAI API Key is required")

    # Get PDF text from port 8002
    pdf_text = ""
    try:
        response = requests.get("http://127.0.0.1:8002/pdf-text")
        if response.status_code == 200:
            pdf_data = response.json()
            pdf_text = pdf_data.get("text", "")
    except Exception as e:
        logger.error(f"Error fetching PDF text: {e}")

    # Build instructions
    instructions = "Anda adalah Interactive Call Agent AI yang membantu pelanggan. Jangan menyebutkan nama bisnis kecuali diminta."
    instructions += "\n\nFITUR PEMESANAN: Bantu pelanggan memesan makanan dari menu yang tersedia."
    instructions += "\n\nKONFIRMASI PESANAN: Setelah pelanggan konfirmasi pesanan, tanyakan nama, nomor telepon, email (opsional), dan alamat pengiriman. Lalu katakan 'ORDER_CONFIRMED' diikuti detail dalam format: NAMA|TELEPON|EMAIL|ALAMAT|ITEM1,ITEM2|TOTAL|CATATAN"
    instructions += "\n\nAUTO CALL CLOSURE: Katakan 'CLOSE_CALL_CONFIRMED' untuk menutup panggilan."
    instructions += "\n\nHUMAN TAKEOVER: Katakan 'TRANSFER_TO_HUMAN' untuk transfer ke staff."
    
    if pdf_text:
        instructions += f"\n\nMENU MAKANAN:\n{pdf_text[:5000]}"

    # Setup session
    session_id = str(uuid.uuid4())
    call_ended = False
    
    def log_message(participant_type: str, message: str, status: str = "active"):
        try:
            from datetime import datetime
            requests.post("http://127.0.0.1:8002/log-conversation", json={
                "session_id": session_id,
                "participant_type": participant_type,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "status": status
            })
            
            # Deteksi konfirmasi pesanan
            if "ORDER_CONFIRMED" in message and participant_type == "agent":
                process_order_confirmation(message)
                
        except Exception as e:
            logger.error(f"Error logging: {e}")
    
    def process_order_confirmation(message: str):
        """Proses konfirmasi pesanan dan kirim notifikasi"""
        try:
            # Parse detail pesanan dari format: ORDER_CONFIRMED NAMA|TELEPON|EMAIL|ALAMAT|ITEM1,ITEM2|TOTAL|CATATAN
            if "ORDER_CONFIRMED" in message:
                parts = message.split("ORDER_CONFIRMED")[1].strip().split("|")
                if len(parts) >= 6:
                    customer_name = parts[0].strip()
                    customer_phone = parts[1].strip()
                    customer_email = parts[2].strip() if parts[2].strip() else None
                    delivery_address = parts[3].strip()
                    order_items = [item.strip() for item in parts[4].split(",")]
                    total_amount = float(parts[5].strip().replace("Rp", "").replace(".", "").replace(",", ""))
                    notes = parts[6].strip() if len(parts) > 6 else None
                    
                    # Kirim ke endpoint konfirmasi pesanan
                    order_data = {
                        "session_id": session_id,
                        "customer_name": customer_name,
                        "customer_phone": customer_phone,
                        "customer_email": customer_email,
                        "delivery_address": delivery_address,
                        "order_items": order_items,
                        "total_amount": total_amount,
                        "notes": notes
                    }
                    
                    response = requests.post("http://127.0.0.1:8002/confirm-order", json=order_data)
                    if response.status_code == 200:
                        result = response.json()
                        logger.info(f"Order confirmed and notifications sent: {result}")
                    else:
                        logger.error(f"Error confirming order: {response.text}")
                        
        except Exception as e:
            logger.error(f"Error processing order confirmation: {e}")

    # Create agent
    agent = Agent(instructions=instructions)
    
    try:
        realtime_model = openai.realtime.RealtimeModel(
            api_key=config.openai_api_key,
            voice=config.voice,
            temperature=config.temperature,
            modalities=config.modalities,
        )
        
        session = AgentSession(llm=realtime_model)
        
        await session.start(agent=agent, room=ctx.room)
        log_message("system", "Session started")
        
        # Monitor session dan pesan
        async def message_handler(message):
            if hasattr(message, 'content'):
                log_message("agent", message.content)
        
        # Monitor session
        while not call_ended:
            await asyncio.sleep(2)
            
    except Exception as e:
        logger.error(f"Error: {e}")
        log_message("system", f"Error: {str(e)}", "error")
        raise

    logger.info(f"Agent started for session {session_id}")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, worker_type=WorkerType.ROOM))