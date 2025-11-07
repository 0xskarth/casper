"""
Enterprise Grade Logging System
Sistema di logging avanzato con rotazione file e colori
"""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime
import colorlog

from ..config import settings


class EnterpriseLogger:
    """Logger professionale per enterprise application"""

    _loggers = {}

    @staticmethod
    def get_logger(name: str = "EnterpriseScaper") -> logging.Logger:
        """
        Ottiene o crea un logger configurato

        Args:
            name: Nome del logger

        Returns:
            Logger configurato
        """
        if name in EnterpriseLogger._loggers:
            return EnterpriseLogger._loggers[name]

        logger = logging.getLogger(name)
        logger.setLevel(getattr(logging, settings.LOG_LEVEL))
        logger.propagate = False

        # Rimuovi handlers esistenti
        logger.handlers.clear()

        # Console Handler con colori
        console_handler = colorlog.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        console_formatter = colorlog.ColoredFormatter(
            '%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s%(reset)s',
            datefmt=settings.LOG_DATE_FORMAT,
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File Handler con rotazione
        file_handler = RotatingFileHandler(
            settings.LOG_FILE,
            maxBytes=settings.LOG_MAX_BYTES,
            backupCount=settings.LOG_BACKUP_COUNT,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.INFO)

        file_formatter = logging.Formatter(
            settings.LOG_FORMAT,
            datefmt=settings.LOG_DATE_FORMAT
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        # Salva logger
        EnterpriseLogger._loggers[name] = logger

        return logger

    @staticmethod
    def log_request(logger: logging.Logger, method: str, url: str, status_code: int = None,
                    response_time: float = None):
        """
        Log specifico per richieste HTTP

        Args:
            logger: Logger da usare
            method: Metodo HTTP
            url: URL richiesto
            status_code: Codice di stato risposta
            response_time: Tempo di risposta in secondi
        """
        msg = f"{method} {url}"
        if status_code:
            msg += f" - Status: {status_code}"
        if response_time:
            msg += f" - Time: {response_time:.2f}s"

        if status_code:
            if 200 <= status_code < 300:
                logger.info(msg)
            elif 300 <= status_code < 400:
                logger.warning(msg)
            else:
                logger.error(msg)
        else:
            logger.info(msg)

    @staticmethod
    def log_scraping_session(logger: logging.Logger, url: str, items_scraped: int,
                            duration: float, errors: int = 0):
        """
        Log per sessione di scraping completata

        Args:
            logger: Logger da usare
            url: URL base scraping
            items_scraped: Numero di item estratti
            duration: Durata in secondi
            errors: Numero di errori
        """
        logger.info(
            f"Scraping Session Completed - URL: {url} | "
            f"Items: {items_scraped} | Duration: {duration:.2f}s | Errors: {errors}"
        )

    @staticmethod
    def log_export(logger: logging.Logger, format_type: str, file_path: str, records: int):
        """
        Log per export dati

        Args:
            logger: Logger da usare
            format_type: Formato export
            file_path: Path file esportato
            records: Numero di record esportati
        """
        logger.info(
            f"Data Exported - Format: {format_type.upper()} | "
            f"File: {file_path} | Records: {records}"
        )


# Logger globale
logger = EnterpriseLogger.get_logger()
