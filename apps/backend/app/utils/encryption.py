"""
Encryption utilities for sensitive data
Encrypt/decrypt API keys, passwords, and other sensitive information
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_key(self) -> bytes:
        """Get encryption key from env or generate new one"""
        key_str = os.getenv("ENCRYPTION_KEY")
        
        if key_str:
            return key_str.encode()
        
        # Generate key from a secret
        secret = os.getenv("SECRET_KEY", "wataomi-default-secret-key-change-in-production")
        salt = b"wataomi-salt"  # In production, use a random salt stored securely
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        return key
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt a string
        Returns base64 encoded encrypted string
        """
        if not data:
            return ""
        
        encrypted = self.cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt an encrypted string
        Returns original string
        """
        if not encrypted_data:
            return ""
        
        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return ""
    
    def encrypt_dict(self, data: dict, keys_to_encrypt: list) -> dict:
        """
        Encrypt specific keys in a dictionary
        """
        result = data.copy()
        for key in keys_to_encrypt:
            if key in result and result[key]:
                result[key] = self.encrypt(str(result[key]))
        return result
    
    def decrypt_dict(self, data: dict, keys_to_decrypt: list) -> dict:
        """
        Decrypt specific keys in a dictionary
        """
        result = data.copy()
        for key in keys_to_decrypt:
            if key in result and result[key]:
                result[key] = self.decrypt(result[key])
        return result


# Global encryption service instance
encryption_service = EncryptionService()


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key"""
    return encryption_service.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    return encryption_service.decrypt(encrypted_key)


def mask_api_key(api_key: str, visible_chars: int = 4) -> str:
    """
    Mask an API key for display
    Example: sk-1234567890abcdef -> sk-12...cdef
    """
    if not api_key or len(api_key) <= visible_chars * 2:
        return "****"
    
    return f"{api_key[:visible_chars]}...{api_key[-visible_chars:]}"
