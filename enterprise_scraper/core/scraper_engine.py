"""
Enterprise Scraper Engine - Core
Sistema di scraping avanzato con anti-detection e features enterprise
"""

import requests
import random
import time
import re
from typing import Optional, Dict, List, Any, Union
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from dataclasses import dataclass, field, asdict
import validators

from ..config import settings
from ..utils.logger import EnterpriseLogger


@dataclass
class ScrapingResult:
    """Risultato di una operazione di scraping"""
    url: str
    status_code: Optional[int] = None
    success: bool = False
    title: Optional[str] = None
    content: Optional[str] = None
    html: Optional[str] = None
    links: List[str] = field(default_factory=list)
    images: List[str] = field(default_factory=list)
    scripts: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    headers: Dict[str, str] = field(default_factory=dict)
    cookies: Dict[str, str] = field(default_factory=dict)
    response_time: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    error: Optional[str] = None
    security_info: Dict[str, Any] = field(default_factory=dict)
    extracted_data: Dict[str, List[str]] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        """Converte in dizionario"""
        return asdict(self)


class EnterpriseScraperEngine:
    """
    Engine di scraping enterprise-grade con features avanzate:
    - Anti-detection (User-Agent rotation, headers randomization)
    - Retry logic con exponential backoff
    - Rate limiting intelligente
    - Proxy support (se configurato)
    - Cookie management
    - Security analysis
    - Pattern extraction
    - Multi-threading support
    """

    def __init__(self):
        self.logger = EnterpriseLogger.get_logger("ScraperEngine")
        self.session = self._create_session()
        self.results_cache = {}
        self.request_count = 0
        self.last_request_time = 0
        self.logger.info("EnterpriseScraperEngine initialized")

    def _create_session(self) -> requests.Session:
        """Crea una sessione requests configurata"""
        session = requests.Session()
        session.headers.update(settings.DEFAULT_HEADERS)
        session.verify = settings.VERIFY_SSL
        session.max_redirects = settings.MAX_REDIRECTS

        # Configurazione adapter per retry
        from requests.adapters import HTTPAdapter
        from urllib3.util.retry import Retry

        retry_strategy = Retry(
            total=settings.MAX_RETRIES,
            backoff_factor=settings.RETRY_BACKOFF_FACTOR,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )

        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=settings.CONCURRENT_REQUESTS,
            pool_maxsize=settings.CONCURRENT_REQUESTS * 2
        )

        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _get_random_user_agent(self) -> str:
        """Ottiene un User-Agent random"""
        return random.choice(settings.USER_AGENTS)

    def _apply_rate_limiting(self):
        """Applica rate limiting intelligente"""
        if settings.RANDOMIZE_DELAYS:
            delay = random.uniform(settings.MIN_DELAY, settings.MAX_DELAY)
        else:
            delay = settings.RATE_LIMIT_DELAY

        elapsed = time.time() - self.last_request_time
        if elapsed < delay:
            sleep_time = delay - elapsed
            time.sleep(sleep_time)

        self.last_request_time = time.time()

    def _get_cache_key(self, url: str, method: str = "GET") -> str:
        """Genera chiave cache per URL"""
        key_string = f"{method}:{url}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def _is_valid_url(self, url: str) -> bool:
        """Valida URL"""
        return validators.url(url) is True

    def scrape(self, url: str, method: str = "GET", data: Optional[Dict] = None,
               headers: Optional[Dict] = None, use_cache: bool = True,
               parse_content: bool = True) -> ScrapingResult:
        """
        Esegue scraping di un URL

        Args:
            url: URL da scrapare
            method: Metodo HTTP (GET, POST, etc.)
            data: Dati per POST request
            headers: Headers addizionali
            use_cache: Usa cache se disponibile
            parse_content: Parse automatico del contenuto HTML

        Returns:
            ScrapingResult con tutti i dati estratti
        """
        start_time = time.time()
        result = ScrapingResult(url=url)

        # Validazione URL
        if not self._is_valid_url(url):
            result.error = "Invalid URL"
            self.logger.error(f"Invalid URL: {url}")
            return result

        # Cache check
        if use_cache and settings.ENABLE_CACHE:
            cache_key = self._get_cache_key(url, method)
            if cache_key in self.results_cache:
                self.logger.info(f"Cache hit for {url}")
                return self.results_cache[cache_key]

        # Rate limiting
        self._apply_rate_limiting()

        # Prepara headers
        request_headers = settings.DEFAULT_HEADERS.copy()
        if settings.ROTATE_USER_AGENTS:
            request_headers['User-Agent'] = self._get_random_user_agent()

        if headers:
            request_headers.update(headers)

        try:
            self.logger.info(f"Scraping {method} {url}")

            # Esegui richiesta
            response = self.session.request(
                method=method,
                url=url,
                data=data,
                headers=request_headers,
                timeout=settings.DEFAULT_TIMEOUT,
                allow_redirects=settings.ALLOW_REDIRECTS
            )

            # Popola risultato base
            result.status_code = response.status_code
            result.headers = dict(response.headers)
            result.cookies = dict(response.cookies)
            result.response_time = time.time() - start_time

            # Check status
            response.raise_for_status()
            result.success = True

            # Salva HTML raw
            result.html = response.text

            # Parse content se richiesto
            if parse_content and 'text/html' in response.headers.get('Content-Type', ''):
                self._parse_html_content(result, response.text, url)

            # Analisi security
            if settings.SCAN_FOR_VULNERABILITIES:
                self._analyze_security(result, response)

            # Estrazione pattern
            self._extract_patterns(result)

            # Log success
            EnterpriseLogger.log_request(
                self.logger, method, url,
                result.status_code, result.response_time
            )

            # Cache result
            if use_cache and settings.ENABLE_CACHE:
                cache_key = self._get_cache_key(url, method)
                self.results_cache[cache_key] = result

            self.request_count += 1

        except requests.exceptions.Timeout:
            result.error = f"Timeout after {settings.DEFAULT_TIMEOUT}s"
            self.logger.error(f"Timeout scraping {url}")

        except requests.exceptions.TooManyRedirects:
            result.error = "Too many redirects"
            self.logger.error(f"Too many redirects for {url}")

        except requests.exceptions.RequestException as e:
            result.error = str(e)
            self.logger.error(f"Request exception for {url}: {e}")

        except Exception as e:
            result.error = f"Unexpected error: {str(e)}"
            self.logger.exception(f"Unexpected error scraping {url}")

        return result

    def _parse_html_content(self, result: ScrapingResult, html: str, base_url: str):
        """
        Parse contenuto HTML ed estrae informazioni

        Args:
            result: ScrapingResult da popolare
            html: HTML da parsare
            base_url: URL base per risolvere link relativi
        """
        try:
            soup = BeautifulSoup(html, settings.DEFAULT_PARSER)

            # Title
            if soup.title:
                result.title = soup.title.string.strip() if soup.title.string else None

            # Text content
            # Rimuovi script e style
            for script in soup(["script", "style"]):
                script.decompose()
            result.content = soup.get_text(separator=' ', strip=True)

            # Links
            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(base_url, link['href'])
                if self._is_valid_url(absolute_url):
                    result.links.append(absolute_url)

            # Images
            for img in soup.find_all('img', src=True):
                absolute_url = urljoin(base_url, img['src'])
                result.images.append(absolute_url)

            # Scripts
            for script in soup.find_all('script', src=True):
                absolute_url = urljoin(base_url, script['src'])
                result.scripts.append(absolute_url)

            # Metadata
            result.metadata = self._extract_metadata(soup)

            self.logger.debug(
                f"Parsed content: {len(result.links)} links, "
                f"{len(result.images)} images, {len(result.scripts)} scripts"
            )

        except Exception as e:
            self.logger.error(f"Error parsing HTML: {e}")

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Estrae metadata dalla pagina"""
        metadata = {}

        # Meta tags
        for meta in soup.find_all('meta'):
            name = meta.get('name') or meta.get('property')
            content = meta.get('content')
            if name and content:
                metadata[name] = content

        # Open Graph
        og_tags = {}
        for meta in soup.find_all('meta', property=re.compile(r'^og:')):
            og_tags[meta.get('property')] = meta.get('content')
        if og_tags:
            metadata['opengraph'] = og_tags

        # Twitter Card
        twitter_tags = {}
        for meta in soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')}):
            twitter_tags[meta.get('name')] = meta.get('content')
        if twitter_tags:
            metadata['twitter'] = twitter_tags

        return metadata

    def _analyze_security(self, result: ScrapingResult, response: requests.Response):
        """
        Analizza security headers e certificati

        Args:
            result: ScrapingResult da popolare
            response: Response object
        """
        security_info = {}

        # Security Headers
        security_headers = {
            'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
            'Content-Security-Policy': response.headers.get('Content-Security-Policy'),
            'X-Frame-Options': response.headers.get('X-Frame-Options'),
            'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
            'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
            'Referrer-Policy': response.headers.get('Referrer-Policy'),
            'Permissions-Policy': response.headers.get('Permissions-Policy')
        }

        # Filtra header None
        security_info['headers'] = {k: v for k, v in security_headers.items() if v}

        # Missing security headers
        missing_headers = [k for k, v in security_headers.items() if not v]
        if missing_headers:
            security_info['missing_headers'] = missing_headers

        # Cookie security
        cookies_info = []
        for cookie in response.cookies:
            cookie_data = {
                'name': cookie.name,
                'secure': cookie.secure,
                'httponly': cookie.has_nonstandard_attr('HttpOnly'),
                'samesite': cookie.get_nonstandard_attr('SameSite')
            }
            cookies_info.append(cookie_data)

        if cookies_info:
            security_info['cookies'] = cookies_info

        # SSL/TLS info (se HTTPS)
        if result.url.startswith('https://'):
            security_info['ssl_enabled'] = True

        result.security_info = security_info

    def _extract_patterns(self, result: ScrapingResult):
        """
        Estrae pattern comuni (email, phone, URLs, etc.) dal contenuto

        Args:
            result: ScrapingResult da popolare
        """
        if not result.content:
            return

        extracted = {}

        for pattern_name, pattern_regex in settings.COMMON_PATTERNS.items():
            matches = re.findall(pattern_regex, result.content)
            if matches:
                # Rimuovi duplicati mantenendo ordine
                unique_matches = list(dict.fromkeys(matches))
                extracted[pattern_name] = unique_matches

        result.extracted_data = extracted

        if extracted:
            self.logger.debug(f"Extracted patterns: {list(extracted.keys())}")

    def scrape_multiple(self, urls: List[str], max_workers: Optional[int] = None,
                       **kwargs) -> List[ScrapingResult]:
        """
        Scrape multipli URL in parallelo usando threading

        Args:
            urls: Lista di URL da scrapare
            max_workers: Numero massimo di thread (default: settings.MAX_WORKERS)
            **kwargs: Parametri addizionali per scrape()

        Returns:
            Lista di ScrapingResult
        """
        max_workers = max_workers or settings.MAX_WORKERS
        results = []

        self.logger.info(f"Starting multi-scraping of {len(urls)} URLs with {max_workers} workers")

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit tutti i task
            future_to_url = {
                executor.submit(self.scrape, url, **kwargs): url
                for url in urls
            }

            # Colleziona risultati
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    self.logger.error(f"Error scraping {url} in thread: {e}")
                    # Crea result con errore
                    error_result = ScrapingResult(url=url, error=str(e))
                    results.append(error_result)

        self.logger.info(f"Multi-scraping completed: {len(results)} results")
        return results

    def get_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche engine"""
        return {
            'total_requests': self.request_count,
            'cache_size': len(self.results_cache),
            'session_active': self.session is not None
        }

    def clear_cache(self):
        """Pulisce cache risultati"""
        self.results_cache.clear()
        self.logger.info("Cache cleared")

    def close(self):
        """Chiude sessione e pulisce risorse"""
        if self.session:
            self.session.close()
            self.logger.info("Session closed")
