from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from random import randint, choice, shuffle
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

EXPECTED_PASSWORD = os.getenv("ADMIN_VAULT_PASSWORD", "supersecret123")

app = FastAPI()

DATA_FILE = "data.json"
EVENTS_FILE = "events.json"

# Servir archivos estáticos (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

class Credential(BaseModel):
    website: str
    email: str
    password: str

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return {}

def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

def load_events():
    if not os.path.exists(EVENTS_FILE):
        return []
    try:
        with open(EVENTS_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []

def save_event(title: str, description: str, type: str):
    events = load_events()
    event = {
        "title": title,
        "description": description,
        "type": type, # login, warning, device
        "timestamp": datetime.now().isoformat()
    }
    events.insert(0, event) # Add to beginning
    # Keep only last 10 events
    events = events[:10]
    with open(EVENTS_FILE, "w") as file:
        json.dump(events, file, indent=4)

@app.get("/api/password/{website}")
def get_password(website: str):
    data = load_data()
    if website not in data:
        raise HTTPException(status_code=404, detail="No details for the website exist")
        
    save_event("Búsqueda Existosa", f"Credenciales consultadas para {website}", "login")
    return {"email": data[website]["email"], "password": data[website]["password"]}

@app.post("/api/password")
def save_password(cred: Credential):
    if not cred.website or not cred.password:
        raise HTTPException(status_code=400, detail="Please don't leave any fields empty!")
        
    data = load_data()
    data[cred.website] = {
        "email": cred.email,
        "password": cred.password
    }
    save_data(data)
    save_event("Nueva Credencial", f"Contraseña guardada para {cred.website}", "device")
    return {"message": "Success"}

@app.get("/api/stats")
def get_stats():
    data = load_data()
    total = len(data)
    
    passwords = [entry["password"] for entry in data.values()]
    
    # Calculate strong passwords (>8 chars, has letters and numbers)
    strong_count = 0
    for pwd in passwords:
        if len(pwd) >= 8 and any(c.isalpha() for c in pwd) and any(c.isdigit() for c in pwd):
            strong_count += 1
            
    # Calculate reused passwords
    reused_count = 0
    seen = set()
    reused_set = set()
    for pwd in passwords:
        if pwd in seen:
            reused_set.add(pwd)
        seen.add(pwd)
    
    # Count how many passwords are total reused ones
    reused_count = sum(1 for pwd in passwords if pwd in reused_set)
    
    score = 0
    if total > 0:
        score = int((strong_count / total) * 100)
        
    return {
        "score": score,
        "strong": strong_count,
        "reused": reused_count,
        "breached": 0, # Mocked for now to avoid external API dependencies without request
        "total": total
    }

@app.get("/api/generate")
def generate_password():
    letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    symbols = ['!', '#', '$', '%', '&', '(', ')', '*', '+']

    password_letter = [choice(letters) for _ in range(randint(8, 10))]
    password_symbol = [choice(symbols) for _ in range(randint(2, 4))]
    password_number = [choice(numbers) for _ in range(randint(2, 4))]

    password_list = password_letter + password_symbol + password_number
    shuffle(password_list)

    password = "".join(password_list)
    return {"password": password}
    
@app.get("/api/events")
def get_events():
    return load_events()

@app.get("/api/passwords")
def list_passwords(authorization: str | None = Header(default=None)):
    if authorization != f"Bearer {EXPECTED_PASSWORD}":
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    data = load_data()
    # Return as list of objects for easier frontend handling
    return [
        {"website": website, "email": details["email"], "password": details["password"]}
        for website, details in data.items()
    ]

@app.delete("/api/password/{website}")
def delete_password(website: str):
    data = load_data()
    if website not in data:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    del data[website]
    save_data(data)
    save_event("Credencial Eliminada", f"Se eliminaron las credenciales de {website}", "warning")
    return {"message": "Success"}
