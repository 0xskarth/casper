"""
Browser-Based Scraper usando Selenium
Per siti che richiedono JavaScript execution
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, WebDriverException
import undetected_chromedriver as uc
from typing import Optional, Dict, List, Any
import time
import random
from datetime import datetime

from ..config import settings
from ..utils.logger import EnterpriseLogger
from .scraper_engine import ScrapingResult


class BrowserScraperEngine:
    """
    Scraper basato su browser (Selenium/Undetected ChromeDriver)
    Utilizzato per siti con JavaScript pesante o protezioni anti-bot
    """

    def __init__(self, use_undetected: bool = True, headless: bool = None):
        """
        Inizializza Browser Scraper

        Args:
            use_undetected: Usa undetected_chromedriver per evitare detection
            headless: Modalità headless (None = usa settings.SELENIUM_HEADLESS)
        """
        self.logger = EnterpriseLogger.get_logger("BrowserScraper")
        self.driver = None
        self.use_undetected = use_undetected
        self.headless = headless if headless is not None else settings.SELENIUM_HEADLESS
        self._initialize_driver()

    def _initialize_driver(self):
        """Inizializza WebDriver con configurazione enterprise"""
        try:
            if self.use_undetected:
                self.logger.info("Initializing Undetected ChromeDriver")
                options = uc.ChromeOptions()
            else:
                self.logger.info("Initializing Standard ChromeDriver")
                options = Options()

            # Configurazione opzioni
            if self.headless:
                options.add_argument('--headless=new')

            # Anti-detection options
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_argument('--disable-infobars')
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-gpu')
            options.add_argument(f'--window-size={settings.SELENIUM_WINDOW_SIZE[0]},{settings.SELENIUM_WINDOW_SIZE[1]}')

            # User Agent random
            if settings.ROTATE_USER_AGENTS:
                user_agent = random.choice(settings.USER_AGENTS)
                options.add_argument(f'--user-agent={user_agent}')

            # Performance options
            options.add_argument('--disable-logging')
            options.add_argument('--log-level=3')
            options.add_experimental_option('excludeSwitches', ['enable-logging', 'enable-automation'])
            options.add_experimental_option('useAutomationExtension', False)

            # Preferences
            prefs = {
                'profile.default_content_setting_values': {
                    'notifications': 2,  # Block notifications
                    'media_stream': 2,   # Block camera/mic access
                },
                'profile.managed_default_content_settings': {
                    'images': 2 if settings.SELENIUM_HEADLESS else 1  # Block images in headless
                }
            }
            options.add_experimental_option('prefs', prefs)

            # Crea driver
            if self.use_undetected:
                self.driver = uc.Chrome(options=options, version_main=None)
            else:
                self.driver = webdriver.Chrome(options=options)

            # Configurazione timeouts
            self.driver.implicitly_wait(settings.SELENIUM_IMPLICIT_WAIT)
            self.driver.set_page_load_timeout(settings.SELENIUM_PAGE_LOAD_TIMEOUT)

            # JavaScript per nascondere webdriver
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": self.driver.execute_script("return navigator.userAgent").replace('Headless', '')
            })

            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            self.logger.info("WebDriver initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise

    def scrape(self, url: str, wait_for_element: Optional[str] = None,
               wait_timeout: int = 10, execute_script: Optional[str] = None,
               scroll_to_bottom: bool = False, screenshot: bool = False) -> ScrapingResult:
        """
        Scrape URL usando browser

        Args:
            url: URL da scrapare
            wait_for_element: CSS selector di elemento da attendere
            wait_timeout: Timeout per attesa elemento (secondi)
            execute_script: JavaScript da eseguire sulla pagina
            scroll_to_bottom: Scrolla fino in fondo (per lazy loading)
            screenshot: Cattura screenshot

        Returns:
            ScrapingResult con dati estratti
        """
        start_time = time.time()
        result = ScrapingResult(url=url)

        try:
            self.logger.info(f"Browser scraping: {url}")

            # Naviga all'URL
            self.driver.get(url)

            # Attendi caricamento
            if wait_for_element:
                try:
                    WebDriverWait(self.driver, wait_timeout).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_element))
                    )
                    self.logger.debug(f"Element found: {wait_for_element}")
                except TimeoutException:
                    self.logger.warning(f"Timeout waiting for element: {wait_for_element}")

            # Scroll to bottom se richiesto
            if scroll_to_bottom:
                self._scroll_to_bottom()

            # Esegui script custom se fornito
            if execute_script:
                self.driver.execute_script(execute_script)
                time.sleep(1)  # Attendi completamento

            # Estrai dati
            result.html = self.driver.page_source
            result.title = self.driver.title
            result.status_code = 200  # Assume success se arriviamo qui

            # Estrai links
            links = self.driver.find_elements(By.TAG_NAME, 'a')
            result.links = [link.get_attribute('href') for link in links if link.get_attribute('href')]

            # Estrai images
            images = self.driver.find_elements(By.TAG_NAME, 'img')
            result.images = [img.get_attribute('src') for img in images if img.get_attribute('src')]

            # Estrai text content
            body = self.driver.find_element(By.TAG_NAME, 'body')
            result.content = body.text

            # Cookies
            result.cookies = {cookie['name']: cookie['value'] for cookie in self.driver.get_cookies()}

            # Screenshot se richiesto
            if screenshot:
                screenshot_path = settings.DATA_DIR / f"screenshot_{int(time.time())}.png"
                self.driver.save_screenshot(str(screenshot_path))
                result.metadata['screenshot'] = str(screenshot_path)
                self.logger.info(f"Screenshot saved: {screenshot_path}")

            # Metadata addizionali
            result.metadata['current_url'] = self.driver.current_url  # Può essere diverso se redirect
            result.metadata['browser_scraping'] = True

            result.success = True
            result.response_time = time.time() - start_time

            self.logger.info(f"Browser scraping completed in {result.response_time:.2f}s")

        except TimeoutException:
            result.error = f"Page load timeout after {settings.SELENIUM_PAGE_LOAD_TIMEOUT}s"
            self.logger.error(f"Timeout loading {url}")

        except WebDriverException as e:
            result.error = f"WebDriver error: {str(e)}"
            self.logger.error(f"WebDriver error for {url}: {e}")

        except Exception as e:
            result.error = f"Unexpected error: {str(e)}"
            self.logger.exception(f"Unexpected error browser scraping {url}")

        return result

    def _scroll_to_bottom(self, pause_time: float = 0.5):
        """
        Scrolla progressivamente fino in fondo alla pagina

        Args:
            pause_time: Pausa tra scroll (secondi)
        """
        last_height = self.driver.execute_script("return document.body.scrollHeight")

        while True:
            # Scrolla in fondo
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(pause_time)

            # Calcola nuova altezza
            new_height = self.driver.execute_script("return document.body.scrollHeight")

            # Break se non cambia più
            if new_height == last_height:
                break

            last_height = new_height

        self.logger.debug("Scrolled to bottom")

    def click_element(self, selector: str, by: By = By.CSS_SELECTOR, wait_timeout: int = 10) -> bool:
        """
        Clicca elemento nella pagina

        Args:
            selector: Selettore elemento
            by: Tipo di selettore (CSS_SELECTOR, XPATH, ID, etc.)
            wait_timeout: Timeout attesa elemento

        Returns:
            True se click riuscito, False altrimenti
        """
        try:
            element = WebDriverWait(self.driver, wait_timeout).until(
                EC.element_to_be_clickable((by, selector))
            )
            element.click()
            self.logger.debug(f"Clicked element: {selector}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to click element {selector}: {e}")
            return False

    def fill_form(self, form_data: Dict[str, str]) -> bool:
        """
        Compila form con dati forniti

        Args:
            form_data: Dict con {selector: valore} per ogni campo

        Returns:
            True se compilazione riuscita
        """
        try:
            for selector, value in form_data.items():
                element = self.driver.find_element(By.CSS_SELECTOR, selector)
                element.clear()
                element.send_keys(value)
                self.logger.debug(f"Filled field {selector}")

            return True
        except Exception as e:
            self.logger.error(f"Failed to fill form: {e}")
            return False

    def wait_for_element(self, selector: str, by: By = By.CSS_SELECTOR,
                        timeout: int = 10) -> bool:
        """
        Attende comparsa elemento

        Args:
            selector: Selettore elemento
            by: Tipo selettore
            timeout: Timeout attesa

        Returns:
            True se elemento trovato
        """
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, selector))
            )
            return True
        except TimeoutException:
            return False

    def execute_script(self, script: str) -> Any:
        """
        Esegue JavaScript nella pagina

        Args:
            script: JavaScript code

        Returns:
            Risultato dello script
        """
        try:
            return self.driver.execute_script(script)
        except Exception as e:
            self.logger.error(f"Failed to execute script: {e}")
            return None

    def get_cookies(self) -> Dict[str, str]:
        """Ottiene tutti i cookie"""
        return {cookie['name']: cookie['value'] for cookie in self.driver.get_cookies()}

    def set_cookie(self, name: str, value: str, **kwargs):
        """
        Imposta cookie

        Args:
            name: Nome cookie
            value: Valore cookie
            **kwargs: Altri parametri (domain, path, etc.)
        """
        cookie = {'name': name, 'value': value}
        cookie.update(kwargs)
        self.driver.add_cookie(cookie)

    def close(self):
        """Chiude browser"""
        if self.driver:
            try:
                self.driver.quit()
                self.logger.info("WebDriver closed")
            except Exception as e:
                self.logger.error(f"Error closing WebDriver: {e}")

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()
