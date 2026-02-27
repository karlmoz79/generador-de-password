"""Servicio de generación de contraseñas seguras."""

import secrets
import string


def generate_password(
    length: int = 16,
    uppercase: bool = True,
    lowercase: bool = True,
    numbers: bool = True,
    symbols: bool = True,
) -> str:
    """Genera una contraseña aleatoria criptográficamente segura.

    Args:
        length: Longitud deseada (4–128).
        uppercase: Incluir mayúsculas.
        lowercase: Incluir minúsculas.
        numbers: Incluir dígitos.
        symbols: Incluir símbolos.

    Returns:
        Contraseña generada.

    Raises:
        ValueError: Si la longitud está fuera del rango permitido.
    """
    if length < 4 or length > 128:
        raise ValueError("Length must be between 4 and 128")

    chars = ""
    if uppercase:
        chars += string.ascii_uppercase
    if lowercase:
        chars += string.ascii_lowercase
    if numbers:
        chars += string.digits
    if symbols:
        chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if not chars:
        chars = string.ascii_lowercase

    return "".join(secrets.choice(chars) for _ in range(length))
