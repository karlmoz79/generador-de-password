import getpass
import uvicorn
from src.config import set_settings


def start_app():
    print("=== MyPass Portable ===")
    url = input("Supabase URL: ")
    key = getpass.getpass("Supabase API Key: ")
    pwd = getpass.getpass("Master Password: ")

    set_settings(url, key, pwd)
    print("Iniciando servidor local de MyPass en http://127.0.0.1:8000...")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    start_app()
