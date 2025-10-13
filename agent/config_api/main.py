from fastapi import FastAPI, Response, Request, Cookie, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import uuid
from typing import Optional

app = FastAPI()

# When using cookies and credentials, avoid allow_origins=["*"].
# Allow only the frontend origin used in development so cookies can be sent.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = "config.json"

class ConfigData(BaseModel):
    data: dict


# Simple in-memory session store for dev/testing only
SESSIONS: dict = {}


class LoginData(BaseModel):
    username: str
    password: Optional[str] = None

@app.get("/config")
def get_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {"data": {}}

@app.post("/config")
def set_config(config: ConfigData):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return {"success": True}


@app.post("/login")
def login(data: LoginData, response: Response):
    # NOTE: this is a dev-only placeholder. Replace with real auth.
    if not data.username:
        raise HTTPException(status_code=400, detail="username required")

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {"username": data.username}

    # Set HttpOnly cookie
    response.set_cookie(key="session_id", value=session_id, httponly=True, samesite="lax")
    return {"ok": True}


@app.post("/logout")
def logout(session_id: Optional[str] = Cookie(None), response: Response = None):
    if session_id and session_id in SESSIONS:
        del SESSIONS[session_id]
    # Expire cookie
    response = response or Response()
    response.delete_cookie("session_id")
    return {"ok": True}


@app.get("/me")
def me(session_id: Optional[str] = Cookie(None)):
    if not session_id:
        return {"user": None}
    user = SESSIONS.get(session_id)
    return {"user": user}

# Redirect endpoints to port 8002
@app.get("/call-logs/{session_id}")
def redirect_call_logs(session_id: str):
    import requests
    try:
        response = requests.get(f"http://127.0.0.1:8002/call-logs/{session_id}")
        return response.json()
    except:
        return {"error": "Service unavailable"}

@app.post("/send-chat-message")
def redirect_chat_message(request: dict):
    import requests
    try:
        response = requests.post("http://127.0.0.1:8002/send-chat-message", json=request)
        return response.json()
    except:
        return {"error": "Service unavailable"}

@app.get("/active-sessions")
def redirect_active_sessions():
    import requests
    try:
        response = requests.get("http://127.0.0.1:8002/active-sessions")
        return response.json()
    except:
        return {"sessions": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)

