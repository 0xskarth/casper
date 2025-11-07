"""
Enterprise Scraper Configuration
Configurazioni hardcoded per massima sicurezza e performance
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
EXPORTS_DIR = BASE_DIR / "exports"
PROXIES_DIR = BASE_DIR / "proxies"
DATABASE_DIR = BASE_DIR / "database"

# Crea directory se non esistono
for directory in [DATA_DIR, LOGS_DIR, EXPORTS_DIR, PROXIES_DIR, DATABASE_DIR]:
    directory.mkdir(exist_ok=True)

# Database Configuration
DATABASE_PATH = DATABASE_DIR / "scraper.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Scraping Configuration
DEFAULT_TIMEOUT = 30
MAX_RETRIES = 5
RETRY_BACKOFF_FACTOR = 2
CONCURRENT_REQUESTS = 10
RATE_LIMIT_DELAY = 1  # secondi tra richieste
MAX_REDIRECTS = 10

# Anti-Detection Configuration
ROTATE_USER_AGENTS = True
ROTATE_PROXIES = False  # Abilitare se si hanno proxy
USE_STEALTH_MODE = True
RANDOMIZE_DELAYS = True
MIN_DELAY = 1
MAX_DELAY = 3

# User Agents Pool (Enterprise Grade)
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
]

# Headers Configuration
DEFAULT_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
}

# Selenium Configuration
SELENIUM_HEADLESS = False
SELENIUM_WINDOW_SIZE = (1920, 1080)
SELENIUM_IMPLICIT_WAIT = 10
SELENIUM_PAGE_LOAD_TIMEOUT = 30

# Export Configuration
EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'xml', 'html']
DEFAULT_EXPORT_FORMAT = 'json'
EXPORT_ENCODING = 'utf-8'

# Logging Configuration
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
LOG_FILE = LOGS_DIR / 'scraper.log'
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5

# GUI Configuration
GUI_THEME = "dark-blue"
GUI_APPEARANCE = "dark"
GUI_WINDOW_SIZE = "1400x900"
GUI_MIN_SIZE = (1200, 800)

# Security Configuration
VERIFY_SSL = True
ALLOW_REDIRECTS = True
TRUST_ENV = False

# Content Configuration
MAX_CONTENT_SIZE = 50 * 1024 * 1024  # 50MB
SUPPORTED_CONTENT_TYPES = [
    'text/html',
    'application/json',
    'application/xml',
    'text/xml',
    'text/plain'
]

# Parsing Configuration
DEFAULT_PARSER = 'lxml'  # lxml, html.parser, html5lib
ENCODING_DETECTION = True

# Cache Configuration
ENABLE_CACHE = True
CACHE_EXPIRY = 3600  # secondi (1 ora)
CACHE_SIZE_LIMIT = 1000  # numero di entry

# Proxy Configuration
PROXY_ROTATION_ENABLED = False
PROXY_TEST_URL = 'https://httpbin.org/ip'
PROXY_TIMEOUT = 10
PROXY_FILE = PROXIES_DIR / 'proxies.txt'

# API Configuration
API_RATE_LIMIT = 100  # richieste per minuto
API_BURST_LIMIT = 10

# Data Extraction Patterns
COMMON_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    'url': r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)',
    'ipv4': r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b',
    'hash_md5': r'\b[a-fA-F0-9]{32}\b',
    'hash_sha256': r'\b[a-fA-F0-9]{64}\b',
}

# Cybersecurity Specific
SCAN_FOR_VULNERABILITIES = True
DETECT_SECURITY_HEADERS = True
CHECK_SSL_CERTIFICATE = True
EXTRACT_METADATA = True

# Performance Configuration
ENABLE_THREADING = True
MAX_WORKERS = 10
CHUNK_SIZE = 8192
STREAM_DOWNLOADS = True
