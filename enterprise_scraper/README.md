# 🔒 Enterprise Web Scraper - Cybersecurity Grade

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![License](https://img.shields.io/badge/License-Enterprise-green)
![Status](https://img.shields.io/badge/Status-Production-success)

**Enterprise-grade web scraper professionale per il settore cybersecurity con GUI dark-theme moderna e features avanzate anti-detection.**

---

## 🚀 Features Principali

### Core Scraping Engine
- ✅ **Dual Scraping Mode**:
  - Fast mode (requests-based) per scraping veloce
  - Browser mode (Selenium/Undetected ChromeDriver) per siti JavaScript-heavy

- 🛡️ **Anti-Detection System**:
  - User-Agent rotation automatica
  - Headers randomization
  - Undetected ChromeDriver integration
  - Cookie management avanzato
  - Stealth mode per evitare bot detection

- ⚡ **High Performance**:
  - Multi-threading con thread pool configurabile
  - Concurrent requests (fino a 20 workers)
  - Rate limiting intelligente
  - Cache system per ottimizzare performance
  - Retry logic con exponential backoff

- 🔍 **Advanced Extraction**:
  - HTML parsing avanzato (BeautifulSoup + lxml)
  - Automatic pattern extraction (emails, phones, URLs, hashes MD5/SHA256, IP addresses)
  - Metadata extraction (OpenGraph, Twitter Cards)
  - Links, images e scripts extraction
  - Text content extraction con cleaning

### Security Analysis
- 🔐 **Security Headers Analysis**:
  - HSTS, CSP, X-Frame-Options detection
  - Missing security headers identification
  - Cookie security analysis (Secure, HttpOnly, SameSite)
  - SSL/TLS verification

- 🛡️ **Vulnerability Detection**:
  - Security patterns identification
  - Certificate validation
  - Automated security scoring

### Data Management
- 💾 **Database Integration**:
  - SQLite database con SQLAlchemy ORM
  - Session management per organizzare scraping runs
  - Query avanzate per analytics
  - Automatic data persistence
  - Record history tracking

- 📊 **Multi-Format Export**:
  - **JSON** - Structured data con pretty print
  - **CSV** - Compatibile Excel con encoding UTF-8
  - **XLSX** - Excel nativo con formatting e auto-width
  - **XML** - Standard XML con proper escaping
  - **HTML** - Reports visuali con dark theme styling

### Professional GUI
- 🎨 **Modern Dark Theme UI**:
  - CustomTkinter per UI moderna
  - Responsive design
  - Real-time logging
  - Progress tracking
  - Results visualization

- 🎛️ **Advanced Controls**:
  - URL input singolo o batch
  - Scraper type selector
  - Threading configuration (1-20 workers)
  - Feature toggles per parsing, patterns, security
  - One-click export in tutti i formati

### Enterprise Features
- 📝 **Professional Logging**:
  - Colored console output
  - File rotation (10MB limit, 5 backups)
  - Multiple log levels
  - Request/Response logging
  - Performance metrics

- ⚙️ **Configuration System**:
  - Centralized settings
  - Hardcoded enterprise defaults
  - Extensible architecture
  - Environment-based configuration

- 🔄 **Proxy Support**:
  - Proxy rotation system
  - Proxy testing utilities
  - Failover automatico
  - SOCKS5 support

---

## 📦 Installazione

### Requisiti di Sistema
- Python 3.8 o superiore
- pip package manager
- Google Chrome (per browser scraping)
- 4GB RAM minimo raccomandato
- Sistema operativo: Windows, Linux, macOS

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd casper/enterprise_scraper
```

### Step 2: Crea Virtual Environment (Raccomandato)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Installa Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Verifica Installazione Chrome
Il browser scraper richiede Google Chrome installato.

**Windows**: Scarica da [google.com/chrome](https://www.google.com/chrome)

**Linux**:
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb
```

**macOS**:
```bash
brew install --cask google-chrome
```

---

## 🎮 Utilizzo

### Avvio GUI Application
```bash
python -m enterprise_scraper.main
```

oppure:

```bash
cd enterprise_scraper
python main.py
```

### GUI Workflow

#### 1. **Input URL(s)**
   - Inserisci uno o più URL (uno per linea)
   - Supporta HTTP e HTTPS
   - Valida automaticamente formato URL

#### 2. **Configura Scraper**
   - **Scraper Type**:
     - `Requests (Fast)` - Per siti statici, velocissimo
     - `Browser (JS Support)` - Per siti con JavaScript, React, Vue, etc.

   - **Options**:
     - ☑️ Parse HTML Content - Estrae links, images, metadata
     - ☑️ Extract Patterns - Trova emails, phones, URLs, hashes
     - ☑️ Security Analysis - Analizza headers, SSL, vulnerabilities
     - ☑️ Save to Database - Salva risultati in SQLite

   - **Workers**: 1-20 thread per scraping parallelo

#### 3. **Start Scraping**
   - Click `▶ START SCRAPING`
   - Monitora progress in real-time
   - Visualizza logs con color coding
   - Vedi risultati man mano che arrivano

#### 4. **Export Results**
   - Seleziona formato (JSON/CSV/XLSX/XML/HTML)
   - Click `💾 Export Data`
   - File salvato in `enterprise_scraper/exports/`

#### 5. **View Statistics**
   - Click `📊 Statistics`
   - Vedi success rate, timing, database stats

---

## 💻 Utilizzo Programmatico

### Example 1: Basic Scraping
```python
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

# Crea engine
scraper = EnterpriseScraperEngine()

# Scrape URL
result = scraper.scrape("https://example.com")

if result.success:
    print(f"Title: {result.title}")
    print(f"Links found: {len(result.links)}")
    print(f"Response time: {result.response_time}s")
else:
    print(f"Error: {result.error}")

# Cleanup
scraper.close()
```

### Example 2: Multiple URLs with Threading
```python
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

urls = [
    "https://example.com",
    "https://example.org",
    "https://example.net"
]

scraper = EnterpriseScraperEngine()

# Scrape parallelo (10 workers)
results = scraper.scrape_multiple(urls, max_workers=10)

for result in results:
    print(f"{result.url}: {'✓' if result.success else '✗'}")

scraper.close()
```

### Example 3: Browser Scraping
```python
from enterprise_scraper.core.browser_scraper import BrowserScraperEngine

# Context manager per auto-cleanup
with BrowserScraperEngine(use_undetected=True) as browser:
    result = browser.scrape(
        url="https://example.com",
        scroll_to_bottom=True,
        screenshot=True
    )

    print(f"Title: {result.title}")
    print(f"Text content: {result.content[:200]}...")
```

### Example 4: Database Operations
```python
from enterprise_scraper.database.models import DatabaseManager
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

# Setup
scraper = EnterpriseScraperEngine()
db = DatabaseManager()

# Scrape e salva
result = scraper.scrape("https://example.com")
record_id = db.save_result(result, session_id="my-session-123")

# Retrieve
records = db.get_by_session("my-session-123")
for record in records:
    print(record.url, record.status_code)

# Stats
stats = db.get_stats()
print(f"Total records: {stats['total_records']}")
print(f"Success rate: {stats['success_rate']:.1f}%")

# Cleanup
scraper.close()
db.close()
```

### Example 5: Export Data
```python
from enterprise_scraper.exports.exporter import DataExporter
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

scraper = EnterpriseScraperEngine()
exporter = DataExporter()

# Scrape
results = scraper.scrape_multiple([
    "https://example.com",
    "https://example.org"
])

# Convert to dicts
data = [r.to_dict() for r in results]

# Export in vari formati
exporter.export(data, 'json', 'results.json')
exporter.export(data, 'xlsx', 'results.xlsx')
exporter.export(data, 'html', 'report.html')

scraper.close()
```

### Example 6: Pattern Extraction
```python
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

scraper = EnterpriseScraperEngine()
result = scraper.scrape("https://example.com")

if result.extracted_data:
    if 'email' in result.extracted_data:
        print("Emails found:", result.extracted_data['email'])

    if 'phone' in result.extracted_data:
        print("Phones found:", result.extracted_data['phone'])

    if 'url' in result.extracted_data:
        print("URLs found:", result.extracted_data['url'])

    if 'hash_md5' in result.extracted_data:
        print("MD5 hashes found:", result.extracted_data['hash_md5'])

scraper.close()
```

### Example 7: Security Analysis
```python
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

scraper = EnterpriseScraperEngine()
result = scraper.scrape("https://example.com")

if result.security_info:
    # Security headers
    headers = result.security_info.get('headers', {})
    print("Security Headers:")
    for header, value in headers.items():
        print(f"  {header}: {value}")

    # Missing headers
    missing = result.security_info.get('missing_headers', [])
    if missing:
        print("\n⚠️ Missing Security Headers:")
        for header in missing:
            print(f"  - {header}")

    # Cookie security
    cookies = result.security_info.get('cookies', [])
    for cookie in cookies:
        print(f"\nCookie: {cookie['name']}")
        print(f"  Secure: {cookie['secure']}")
        print(f"  HttpOnly: {cookie['httponly']}")

scraper.close()
```

---

## 📁 Struttura Progetto

```
enterprise_scraper/
├── main.py                      # Entry point applicazione
├── requirements.txt             # Dependencies Python
├── README.md                    # Documentazione
│
├── config/
│   └── settings.py             # Configurazioni centralized
│
├── core/
│   ├── __init__.py
│   ├── scraper_engine.py       # Core scraping engine (requests)
│   └── browser_scraper.py      # Browser-based scraper (Selenium)
│
├── gui/
│   ├── __init__.py
│   └── main_window.py          # GUI CustomTkinter
│
├── database/
│   ├── __init__.py
│   ├── models.py               # SQLAlchemy models & manager
│   └── scraper.db              # SQLite database (auto-created)
│
├── exports/
│   ├── __init__.py
│   └── exporter.py             # Multi-format exporter
│
├── utils/
│   ├── __init__.py
│   ├── logger.py               # Enterprise logging system
│   ├── validators.py           # Input validators
│   └── proxy_manager.py        # Proxy rotation manager
│
├── logs/
│   └── scraper.log             # Application logs (auto-created)
│
├── data/
│   └── (screenshots, temp)     # Data temporanei (auto-created)
│
├── exports/
│   └── (exported files)        # File esportati (auto-created)
│
└── proxies/
    └── proxies.txt             # Lista proxy (opzionale)
```

---

## ⚙️ Configurazione Avanzata

### File: `config/settings.py`

#### Scraping Configuration
```python
DEFAULT_TIMEOUT = 30              # Timeout richieste (secondi)
MAX_RETRIES = 5                   # Retry automatici
RETRY_BACKOFF_FACTOR = 2          # Exponential backoff
CONCURRENT_REQUESTS = 10          # Richieste simultanee
RATE_LIMIT_DELAY = 1              # Delay tra richieste
```

#### Anti-Detection
```python
ROTATE_USER_AGENTS = True         # Rotation User-Agent
ROTATE_PROXIES = False            # Rotation Proxy (richiede proxies.txt)
USE_STEALTH_MODE = True           # Stealth mode browser
RANDOMIZE_DELAYS = True           # Delays randomizzati
MIN_DELAY = 1                     # Delay minimo
MAX_DELAY = 3                     # Delay massimo
```

#### Database
```python
DATABASE_PATH = DATABASE_DIR / "scraper.db"
ENABLE_CACHE = True               # Cache risultati
CACHE_EXPIRY = 3600               # Expiry cache (secondi)
```

#### Export
```python
EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'xml', 'html']
DEFAULT_EXPORT_FORMAT = 'json'
EXPORT_ENCODING = 'utf-8'
```

#### Logging
```python
LOG_LEVEL = 'INFO'                # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_MAX_BYTES = 10 * 1024 * 1024 # 10MB
LOG_BACKUP_COUNT = 5              # File di backup
```

---

## 🔐 Proxy Configuration

### Setup Proxy File

Crea file `enterprise_scraper/proxies/proxies.txt`:

```
# HTTP Proxies
http://proxy1.example.com:8080
http://user:pass@proxy2.example.com:3128

# HTTPS Proxies
https://proxy3.example.com:443

# SOCKS5 Proxies
socks5://proxy4.example.com:1080
```

### Enable Proxy Rotation

In `config/settings.py`:
```python
ROTATE_PROXIES = True
PROXY_ROTATION_ENABLED = True
```

### Test Proxies

```python
from enterprise_scraper.utils.proxy_manager import ProxyManager

manager = ProxyManager()
results = manager.test_all_proxies()

print(f"Working: {len(results['working'])}")
print(f"Failed: {len(results['failed'])}")

# Salva working proxies
manager.save_working_proxies()
```

---

## 📊 Pattern Extraction

Patterns automaticamente estratti dal contenuto:

| Pattern | Regex | Example |
|---------|-------|---------|
| **Email** | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z\|a-z]{2,}` | info@example.com |
| **Phone** | `\d{3}[-.]?\d{3}[-.]?\d{4}` | 555-123-4567 |
| **URL** | `https?://...` | https://example.com/page |
| **IPv4** | `\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}` | 192.168.1.1 |
| **MD5** | `[a-fA-F0-9]{32}` | 5d41402abc4b2a76b9719d911017c592 |
| **SHA256** | `[a-fA-F0-9]{64}` | e3b0c44298fc1c149... |

Customizza in `config/settings.py`:
```python
COMMON_PATTERNS = {
    'custom_pattern': r'your-regex-here',
    # ...
}
```

---

## 🛠️ Troubleshooting

### Issue: "ChromeDriver not found"
**Soluzione**: Installa Chrome e/o aggiorna selenium
```bash
pip install --upgrade selenium undetected-chromedriver
```

### Issue: "Module not found"
**Soluzione**: Verifica virtual environment e dependencies
```bash
pip install -r requirements.txt
```

### Issue: "Permission denied writing to database"
**Soluzione**: Verifica permissions cartella database
```bash
chmod 755 enterprise_scraper/database
```

### Issue: "SSL Certificate Error"
**Soluzione**: Disabilita SSL verification (solo per testing!)
In `config/settings.py`:
```python
VERIFY_SSL = False
```

### Issue: GUI non si avvia
**Soluzione**: Verifica tkinter installato
```bash
# Linux
sudo apt-get install python3-tk

# macOS (già incluso)
# Windows (già incluso)
```

---

## 📈 Performance Tips

### 1. **Threading Optimization**
- Usa 10-15 workers per I/O-bound tasks (web scraping)
- Riduci workers se server target ha rate limiting aggressivo

### 2. **Browser vs Requests**
- Usa **Requests** quando possibile (10x più veloce)
- Usa **Browser** solo per siti che richiedono JavaScript

### 3. **Cache**
- Abilita cache per ridurre richieste duplicate
- Pulisci cache periodicamente per dati freschi

### 4. **Database**
- Usa batch inserts per grandi volumi
- Pulisci vecchi record periodicamente

### 5. **Rate Limiting**
- Rispetta `robots.txt` del sito target
- Aumenta delay se ricevi 429 (Too Many Requests)

---

## 🔒 Security Best Practices

### 1. **Proxy Usage**
- Usa proxy per nascondere IP
- Testa proxy prima dell'uso
- Rotation automatica per evitare ban

### 2. **User-Agent Rotation**
- Sempre abilitata per default
- Usa UA recenti e realistici

### 3. **Rate Limiting**
- Configura delays appropriati
- Monitora response codes
- Rispetta robots.txt

### 4. **Data Security**
- Non loggare credentials
- Sanitizza output prima di export
- Cripta database se contiene dati sensibili

### 5. **Legal Compliance**
- Verifica Terms of Service del sito
- Rispetta GDPR per dati personali
- Usa solo per scopi legittimi

---

## 📝 License

**Enterprise License** - Uso professionale per organizzazioni cybersecurity.

Questo software è fornito "as-is" senza garanzie. L'utilizzatore è responsabile del rispetto delle leggi applicabili e dei Terms of Service dei siti web target.

---

## 🤝 Support & Contribution

### Bug Reports
Apri issue su GitHub con:
- Descrizione dettagliata
- Steps per riprodurre
- Log rilevanti
- Environment info (OS, Python version)

### Feature Requests
Suggerisci nuove features con use case dettagliato.

### Development
```bash
# Setup dev environment
git clone <repo>
cd enterprise_scraper
python -m venv venv
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Se disponibile
```

---

## 🎯 Roadmap

### Version 1.1 (Planned)
- [ ] Playwright integration (alternativa a Selenium)
- [ ] REST API server
- [ ] Docker containerization
- [ ] Cloud deployment templates
- [ ] Advanced analytics dashboard

### Version 1.2 (Future)
- [ ] Machine Learning per content extraction
- [ ] Distributed scraping cluster
- [ ] Real-time monitoring dashboard
- [ ] Integration con SIEM platforms
- [ ] Custom plugin system

---

## 📚 Resources

### Documentation
- [BeautifulSoup Docs](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [CustomTkinter Docs](https://github.com/TomSchimansky/CustomTkinter)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)

### Related Projects
- Scrapy Framework
- Playwright
- Requests-HTML
- lxml

---

## 👨‍💻 Author

**Senior Python Developer**
Enterprise Security Solutions

---

## 🌟 Acknowledgments

Grazie alle community open-source di:
- Requests
- BeautifulSoup
- Selenium
- CustomTkinter
- SQLAlchemy

---

**⚡ Built with ❤️ for the Cybersecurity Community**

*Enterprise Web Scraper v1.0.0 - Production Ready*
