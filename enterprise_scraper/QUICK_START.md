# 🚀 Quick Start Guide - Enterprise Web Scraper

Guida rapida per iniziare in 5 minuti!

---

## 📋 Prerequisites

- Python 3.8+ installato
- Google Chrome (per browser scraping)
- 4GB RAM minimo

**Check Python version:**
```bash
python --version
# or
python3 --version
```

---

## ⚡ Installation (2 minutes)

### Method 1: Automatic (Recommended)

**Linux/macOS:**
```bash
cd enterprise_scraper
chmod +x run.sh
./run.sh
```

**Windows:**
```cmd
cd enterprise_scraper
run.bat
```

Lo script automaticamente:
1. Crea virtual environment
2. Installa dependencies
3. Avvia GUI

### Method 2: Manual

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run
python -m enterprise_scraper.main
```

---

## 🎮 First Scraping (1 minute)

### GUI Mode

1. **Launch GUI:**
   ```bash
   python -m enterprise_scraper.main
   ```

2. **Enter URL:**
   - Type `https://example.com` in URL box

3. **Configure:**
   - Select "Requests (Fast)" mode
   - Keep default settings

4. **Start:**
   - Click `▶ START SCRAPING`
   - Wait for results

5. **Export:**
   - Select format (JSON recommended)
   - Click `💾 Export Data`

### Programmatic Mode

Create `test_scraper.py`:

```python
from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine

# Create scraper
scraper = EnterpriseScraperEngine()

# Scrape
result = scraper.scrape("https://example.com")

# Print results
if result.success:
    print(f"Title: {result.title}")
    print(f"Links: {len(result.links)}")
    print(f"Time: {result.response_time}s")

# Cleanup
scraper.close()
```

Run:
```bash
python test_scraper.py
```

---

## 📚 Next Steps

1. **Read Full Documentation:**
   - Check `README.md` for all features

2. **Try Examples:**
   ```bash
   python -m enterprise_scraper.examples.basic_usage
   ```

3. **Configure Settings:**
   - Edit `config/settings.py` for customization

4. **Enable Browser Mode:**
   - For JavaScript-heavy sites
   - Select "Browser (JS Support)" in GUI

5. **Setup Proxies (Optional):**
   - Add proxies to `proxies/proxies.txt`
   - Enable in settings

---

## 🆘 Common Issues

### "Python not found"
**Solution:** Install Python 3.8+ from python.org

### "No module named 'customtkinter'"
**Solution:**
```bash
pip install -r requirements.txt
```

### "ChromeDriver error"
**Solution:** Install Chrome browser

### GUI doesn't open
**Solution (Linux):**
```bash
sudo apt-get install python3-tk
```

---

## 🎯 Quick Tips

- Use **Requests mode** for speed (10x faster)
- Use **Browser mode** only if site requires JavaScript
- Enable **Multi-threading** (10 workers) for batch scraping
- Check **logs/** folder for detailed logs
- Export to **XLSX** for easy Excel analysis

---

## 📞 Need Help?

- Read full **README.md**
- Check **examples/** folder
- Review logs in **logs/scraper.log**

---

**Happy Scraping! 🚀**

*Enterprise Web Scraper v1.0.0 - Cybersecurity Grade*
