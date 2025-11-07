"""
Proxy Manager
Gestione rotation e testing proxy
"""

import random
from typing import List, Optional, Dict
import requests
from pathlib import Path

from ..config import settings
from ..utils.logger import EnterpriseLogger


class ProxyManager:
    """
    Manager per proxy rotation
    Supporta testing, rotation e failover automatico
    """

    def __init__(self, proxy_file: Optional[Path] = None):
        """
        Inizializza Proxy Manager

        Args:
            proxy_file: Path file con lista proxy (uno per linea)
        """
        self.logger = EnterpriseLogger.get_logger("ProxyManager")
        self.proxy_file = proxy_file or settings.PROXY_FILE
        self.proxies: List[str] = []
        self.working_proxies: List[str] = []
        self.failed_proxies: List[str] = []
        self.current_index = 0

        if self.proxy_file.exists():
            self._load_proxies()

    def _load_proxies(self):
        """Carica proxy da file"""
        try:
            with open(self.proxy_file, 'r') as f:
                self.proxies = [
                    line.strip()
                    for line in f
                    if line.strip() and not line.startswith('#')
                ]

            self.logger.info(f"Loaded {len(self.proxies)} proxies from {self.proxy_file}")

        except Exception as e:
            self.logger.error(f"Failed to load proxies: {e}")

    def add_proxy(self, proxy: str):
        """
        Aggiunge proxy alla lista

        Args:
            proxy: Proxy URL (es: http://user:pass@host:port)
        """
        if proxy not in self.proxies:
            self.proxies.append(proxy)
            self.logger.debug(f"Added proxy: {proxy}")

    def remove_proxy(self, proxy: str):
        """
        Rimuove proxy dalla lista

        Args:
            proxy: Proxy da rimuovere
        """
        if proxy in self.proxies:
            self.proxies.remove(proxy)
        if proxy in self.working_proxies:
            self.working_proxies.remove(proxy)
        if proxy in self.failed_proxies:
            self.failed_proxies.remove(proxy)

        self.logger.debug(f"Removed proxy: {proxy}")

    def test_proxy(self, proxy: str, test_url: Optional[str] = None) -> bool:
        """
        Testa se proxy funziona

        Args:
            proxy: Proxy da testare
            test_url: URL per test (default: settings.PROXY_TEST_URL)

        Returns:
            True se proxy funziona
        """
        test_url = test_url or settings.PROXY_TEST_URL

        try:
            proxies = {
                'http': proxy,
                'https': proxy
            }

            response = requests.get(
                test_url,
                proxies=proxies,
                timeout=settings.PROXY_TIMEOUT,
                verify=False
            )

            if response.status_code == 200:
                self.logger.debug(f"Proxy OK: {proxy}")
                return True
            else:
                self.logger.warning(f"Proxy returned {response.status_code}: {proxy}")
                return False

        except Exception as e:
            self.logger.warning(f"Proxy failed: {proxy} - {e}")
            return False

    def test_all_proxies(self) -> Dict[str, List[str]]:
        """
        Testa tutti i proxy

        Returns:
            Dict con 'working' e 'failed' proxy lists
        """
        self.working_proxies = []
        self.failed_proxies = []

        self.logger.info(f"Testing {len(self.proxies)} proxies...")

        for proxy in self.proxies:
            if self.test_proxy(proxy):
                self.working_proxies.append(proxy)
            else:
                self.failed_proxies.append(proxy)

        self.logger.info(
            f"Proxy test complete: {len(self.working_proxies)} working, "
            f"{len(self.failed_proxies)} failed"
        )

        return {
            'working': self.working_proxies,
            'failed': self.failed_proxies
        }

    def get_random_proxy(self) -> Optional[str]:
        """
        Ottiene proxy random dalla lista working

        Returns:
            Proxy URL o None se nessuno disponibile
        """
        if not self.working_proxies:
            if not self.proxies:
                return None
            # Try using all proxies if working list is empty
            return random.choice(self.proxies)

        return random.choice(self.working_proxies)

    def get_next_proxy(self) -> Optional[str]:
        """
        Ottiene prossimo proxy in rotation

        Returns:
            Proxy URL o None
        """
        proxy_list = self.working_proxies if self.working_proxies else self.proxies

        if not proxy_list:
            return None

        proxy = proxy_list[self.current_index]
        self.current_index = (self.current_index + 1) % len(proxy_list)

        return proxy

    def get_proxy_dict(self, proxy: str) -> Dict[str, str]:
        """
        Converte proxy string in dict per requests

        Args:
            proxy: Proxy URL

        Returns:
            Dict formato {'http': proxy, 'https': proxy}
        """
        return {
            'http': proxy,
            'https': proxy
        }

    def mark_proxy_failed(self, proxy: str):
        """
        Marca proxy come fallito

        Args:
            proxy: Proxy da marcare
        """
        if proxy in self.working_proxies:
            self.working_proxies.remove(proxy)

        if proxy not in self.failed_proxies:
            self.failed_proxies.append(proxy)

        self.logger.warning(f"Proxy marked as failed: {proxy}")

    def get_stats(self) -> Dict:
        """
        Ottiene statistiche proxy

        Returns:
            Dict con statistiche
        """
        return {
            'total_proxies': len(self.proxies),
            'working_proxies': len(self.working_proxies),
            'failed_proxies': len(self.failed_proxies),
            'success_rate': (len(self.working_proxies) / len(self.proxies) * 100)
                           if self.proxies else 0
        }

    def save_working_proxies(self, filepath: Optional[Path] = None):
        """
        Salva working proxy su file

        Args:
            filepath: Path file output (default: working_proxies.txt)
        """
        filepath = filepath or (settings.PROXIES_DIR / "working_proxies.txt")

        try:
            with open(filepath, 'w') as f:
                for proxy in self.working_proxies:
                    f.write(f"{proxy}\n")

            self.logger.info(f"Saved {len(self.working_proxies)} working proxies to {filepath}")

        except Exception as e:
            self.logger.error(f"Failed to save working proxies: {e}")


# Example proxy file format:
"""
# HTTP Proxies
http://proxy1.example.com:8080
http://user:pass@proxy2.example.com:3128

# HTTPS Proxies
https://proxy3.example.com:443

# SOCKS5 Proxies
socks5://proxy4.example.com:1080
"""
