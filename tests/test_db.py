from unittest.mock import MagicMock, patch
from src.config import set_settings

# Configurar settings antes de importar db
set_settings("https://fake.supabase.co", "fake_key", "test_pass")


def _mock_client():
    """Crea un mock del cliente Supabase con la cadena de métodos."""
    return MagicMock()


@patch("src.db.create_client")
def test_get_supabase_client_returns_client(mock_create):
    mock_create.return_value = _mock_client()
    from src.db import get_supabase_client, _reset_client

    _reset_client()
    client = get_supabase_client()
    assert client is not None
    mock_create.assert_called_once()


@patch("src.db.create_client")
def test_load_all_credentials(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.select.return_value.execute.return_value = (
        MagicMock(
            data=[
                {
                    "website": "github",
                    "email": "a@b.com",
                    "password": "123",
                    "breached": False,
                    "breach_count": 0,
                    "last_checked": None,
                }
            ]
        )
    )
    mock_create.return_value = mock_client
    from src.db import load_all_credentials, _reset_client

    _reset_client()
    data = load_all_credentials()
    assert "github" in data
    assert data["github"]["email"] == "a@b.com"


@patch("src.db.create_client")
def test_get_credential_found(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {
                "website": "github",
                "email": "a@b.com",
                "password": "secret",
                "breached": False,
                "breach_count": 0,
                "last_checked": None,
            }
        ]
    )
    mock_create.return_value = mock_client
    from src.db import get_credential, _reset_client

    _reset_client()
    cred = get_credential("github")
    assert cred is not None
    assert cred["password"] == "secret"


@patch("src.db.create_client")
def test_get_credential_not_found(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    mock_create.return_value = mock_client
    from src.db import get_credential, _reset_client

    _reset_client()
    cred = get_credential("nonexistent")
    assert cred is None


@patch("src.db.create_client")
def test_save_event(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        MagicMock()
    )
    mock_create.return_value = mock_client
    from src.db import save_event, _reset_client

    _reset_client()
    save_event("Test Title", "Test Desc", "login")
    mock_client.table.assert_called_with("events")


@patch("src.db.create_client")
def test_load_events(mock_create):
    mock_client = _mock_client()
    mock_client.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[
            {
                "title": "Login",
                "description": "Searched github",
                "type": "login",
                "timestamp": "2026-01-01T00:00:00",
            }
        ]
    )
    mock_create.return_value = mock_client
    from src.db import load_events, _reset_client

    _reset_client()
    events = load_events()
    assert len(events) == 1
    assert events[0]["title"] == "Login"
