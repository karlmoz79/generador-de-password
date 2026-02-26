from dataclasses import dataclass


@dataclass
class Settings:
    supabase_url: str = ""
    supabase_key: str = ""
    admin_password: str = ""


_settings = Settings()


def set_settings(url: str, key: str, password: str) -> None:
    _settings.supabase_url = url
    _settings.supabase_key = key
    _settings.admin_password = password


def get_settings() -> Settings:
    return _settings
