"""
Validation Utilities
Validatori per input e dati
"""

import re
import validators
from typing import List, Optional
from urllib.parse import urlparse


class URLValidator:
    """Validatore per URLs"""

    @staticmethod
    def is_valid_url(url: str) -> bool:
        """
        Verifica se URL è valido

        Args:
            url: URL da validare

        Returns:
            True se valido
        """
        return validators.url(url) is True

    @staticmethod
    def is_valid_domain(domain: str) -> bool:
        """
        Verifica se dominio è valido

        Args:
            domain: Dominio da validare

        Returns:
            True se valido
        """
        return validators.domain(domain) is True

    @staticmethod
    def extract_domain(url: str) -> Optional[str]:
        """
        Estrae dominio da URL

        Args:
            url: URL

        Returns:
            Dominio o None
        """
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return None

    @staticmethod
    def is_same_domain(url1: str, url2: str) -> bool:
        """
        Verifica se due URL hanno stesso dominio

        Args:
            url1: Primo URL
            url2: Secondo URL

        Returns:
            True se stesso dominio
        """
        domain1 = URLValidator.extract_domain(url1)
        domain2 = URLValidator.extract_domain(url2)
        return domain1 == domain2 if domain1 and domain2 else False


class EmailValidator:
    """Validatore per email"""

    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

    @staticmethod
    def is_valid_email(email: str) -> bool:
        """
        Verifica se email è valida

        Args:
            email: Email da validare

        Returns:
            True se valida
        """
        return bool(EmailValidator.EMAIL_REGEX.match(email))

    @staticmethod
    def extract_emails(text: str) -> List[str]:
        """
        Estrae email da testo

        Args:
            text: Testo da analizzare

        Returns:
            Lista di email trovate
        """
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(pattern, text)


class DataValidator:
    """Validatore generico per dati"""

    @staticmethod
    def is_valid_json(text: str) -> bool:
        """
        Verifica se stringa è JSON valido

        Args:
            text: Stringa da validare

        Returns:
            True se JSON valido
        """
        try:
            import json
            json.loads(text)
            return True
        except:
            return False

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitizza nome file rimuovendo caratteri non validi

        Args:
            filename: Nome file

        Returns:
            Nome file sanitizzato
        """
        # Rimuovi caratteri non validi
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # Limita lunghezza
        if len(filename) > 200:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:200-len(ext)-1] + '.' + ext if ext else name[:200]
        return filename

    @staticmethod
    def truncate_string(text: str, max_length: int = 100, suffix: str = '...') -> str:
        """
        Tronca stringa a lunghezza massima

        Args:
            text: Testo da troncare
            max_length: Lunghezza massima
            suffix: Suffisso da aggiungere

        Returns:
            Testo troncato
        """
        if len(text) <= max_length:
            return text
        return text[:max_length - len(suffix)] + suffix
