"""
Enterprise Web Scraper - Main Entry Point
Avvia applicazione GUI
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from enterprise_scraper.gui.main_window import EnterpriseScraperGUI
from enterprise_scraper.utils.logger import logger


def main():
    """Main entry point"""
    try:
        logger.info("=" * 60)
        logger.info("Enterprise Web Scraper - Cybersecurity Grade")
        logger.info("Version 1.0.0")
        logger.info("=" * 60)

        # Crea e avvia GUI
        app = EnterpriseScraperGUI()
        app.run()

    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        sys.exit(0)

    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
