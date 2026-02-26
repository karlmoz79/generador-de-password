from src.config import get_settings, set_settings, Settings


def test_in_memory_settings():
    set_settings("https://supa.url", "supa_key", "my_master_pass")
    settings = get_settings()
    assert settings.supabase_url == "https://supa.url"
    assert settings.supabase_key == "supa_key"
    assert settings.admin_password == "my_master_pass"


def test_settings_not_configured():
    """Un Settings limpio debe tener cadenas vacías."""
    s = Settings()
    assert s.supabase_url == ""
    assert s.supabase_key == ""
    assert s.admin_password == ""
