import os
import uvicorn
from dotenv import load_dotenv
from src.config import set_settings
import app


def start_app():
    print("=== MyPass Portable ===")
    
    # Cargar variables del archivo .env oculto si existe
    load_dotenv()
    
    env_url = os.getenv("SUPABASE_URL")
    env_key = os.getenv("SUPABASE_KEY")
    env_pwd = os.getenv("MASTER_PASSWORD")
    
    url = env_url.strip() if env_url else ""
    if url:
        print("[✓] Supabase URL cargada del .env")
    else:
        while not url:
            url = input("Supabase URL: ").strip()
            
    key = env_key.strip() if env_key else ""
    if key:
        print("[✓] Supabase API Key cargada del .env")
    else:
        while not key:
            key = input("Supabase API Key: ").strip()

    pwd = env_pwd.strip() if env_pwd else ""
    if pwd:
        print("[✓] Master Password cargada del .env")
    else:
        import getpass
        while not pwd:
            pwd = getpass.getpass("Master Password (elige una para hoy): ").strip()
        print("[✓] Master Password guardada en RAM")

    set_settings(url, key, pwd)
    print("\nIniciando servidor local de MyPass en http://127.0.0.1:8000...")
    uvicorn.run(app.app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    start_app()
