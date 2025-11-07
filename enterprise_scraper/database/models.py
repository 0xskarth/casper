"""
Database Models usando SQLAlchemy
Storicizza risultati scraping per analisi e cache
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from typing import Optional, List, Dict, Any

from ..config import settings
from ..utils.logger import EnterpriseLogger

Base = declarative_base()


class ScrapingRecord(Base):
    """Model per record di scraping"""
    __tablename__ = 'scraping_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(2048), nullable=False, index=True)
    title = Column(String(512))
    status_code = Column(Integer)
    success = Column(Boolean, default=False)
    content = Column(Text)
    html = Column(Text)
    metadata = Column(JSON)
    headers = Column(JSON)
    cookies = Column(JSON)
    links = Column(JSON)
    images = Column(JSON)
    scripts = Column(JSON)
    security_info = Column(JSON)
    extracted_data = Column(JSON)
    response_time = Column(Float)
    error = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(String(64), index=True)

    def __repr__(self):
        return f"<ScrapingRecord(id={self.id}, url='{self.url}', success={self.success})>"

    def to_dict(self) -> Dict[str, Any]:
        """Converte record in dizionario"""
        return {
            'id': self.id,
            'url': self.url,
            'title': self.title,
            'status_code': self.status_code,
            'success': self.success,
            'content': self.content,
            'html': self.html,
            'metadata': self.metadata,
            'headers': self.headers,
            'cookies': self.cookies,
            'links': self.links,
            'images': self.images,
            'scripts': self.scripts,
            'security_info': self.security_info,
            'extracted_data': self.extracted_data,
            'response_time': self.response_time,
            'error': self.error,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'session_id': self.session_id
        }


class DatabaseManager:
    """Manager per operazioni database"""

    def __init__(self, db_url: Optional[str] = None):
        """
        Inizializza Database Manager

        Args:
            db_url: URL database (default: settings.DATABASE_URL)
        """
        self.logger = EnterpriseLogger.get_logger("DatabaseManager")
        self.db_url = db_url or settings.DATABASE_URL
        self.engine = None
        self.Session = None
        self._initialize_db()

    def _initialize_db(self):
        """Inizializza database e crea tabelle"""
        try:
            self.engine = create_engine(
                self.db_url,
                echo=False,
                pool_pre_ping=True,
                pool_recycle=3600
            )

            # Crea tabelle
            Base.metadata.create_all(self.engine)

            # Session maker
            self.Session = sessionmaker(bind=self.engine)

            self.logger.info(f"Database initialized: {self.db_url}")

        except Exception as e:
            self.logger.error(f"Failed to initialize database: {e}")
            raise

    def save_result(self, result, session_id: Optional[str] = None) -> Optional[int]:
        """
        Salva ScrapingResult nel database

        Args:
            result: ScrapingResult da salvare
            session_id: ID sessione per raggruppamento

        Returns:
            ID del record salvato o None se errore
        """
        session = self.Session()
        try:
            record = ScrapingRecord(
                url=result.url,
                title=result.title,
                status_code=result.status_code,
                success=result.success,
                content=result.content,
                html=result.html,
                metadata=result.metadata,
                headers=result.headers,
                cookies=result.cookies,
                links=result.links,
                images=result.images,
                scripts=result.scripts,
                security_info=result.security_info,
                extracted_data=result.extracted_data,
                response_time=result.response_time,
                error=result.error,
                session_id=session_id
            )

            session.add(record)
            session.commit()

            record_id = record.id
            self.logger.debug(f"Saved record {record_id} for {result.url}")

            return record_id

        except Exception as e:
            session.rollback()
            self.logger.error(f"Failed to save result: {e}")
            return None

        finally:
            session.close()

    def save_results(self, results: List, session_id: Optional[str] = None) -> List[int]:
        """
        Salva multipli risultati in batch

        Args:
            results: Lista di ScrapingResult
            session_id: ID sessione

        Returns:
            Lista di ID salvati
        """
        saved_ids = []
        for result in results:
            record_id = self.save_result(result, session_id)
            if record_id:
                saved_ids.append(record_id)

        self.logger.info(f"Saved {len(saved_ids)}/{len(results)} records")
        return saved_ids

    def get_by_url(self, url: str, limit: int = 1) -> List[ScrapingRecord]:
        """
        Ottiene record per URL

        Args:
            url: URL da cercare
            limit: Numero massimo risultati

        Returns:
            Lista di ScrapingRecord
        """
        session = self.Session()
        try:
            records = session.query(ScrapingRecord)\
                .filter(ScrapingRecord.url == url)\
                .order_by(ScrapingRecord.timestamp.desc())\
                .limit(limit)\
                .all()

            return records

        finally:
            session.close()

    def get_by_session(self, session_id: str) -> List[ScrapingRecord]:
        """
        Ottiene tutti i record di una sessione

        Args:
            session_id: ID sessione

        Returns:
            Lista di ScrapingRecord
        """
        session = self.Session()
        try:
            records = session.query(ScrapingRecord)\
                .filter(ScrapingRecord.session_id == session_id)\
                .order_by(ScrapingRecord.timestamp)\
                .all()

            return records

        finally:
            session.close()

    def get_all(self, limit: Optional[int] = None) -> List[ScrapingRecord]:
        """
        Ottiene tutti i record

        Args:
            limit: Limite risultati

        Returns:
            Lista di ScrapingRecord
        """
        session = self.Session()
        try:
            query = session.query(ScrapingRecord)\
                .order_by(ScrapingRecord.timestamp.desc())

            if limit:
                query = query.limit(limit)

            return query.all()

        finally:
            session.close()

    def get_stats(self) -> Dict[str, Any]:
        """
        Ottiene statistiche database

        Returns:
            Dizionario con statistiche
        """
        session = self.Session()
        try:
            total_records = session.query(ScrapingRecord).count()
            successful = session.query(ScrapingRecord)\
                .filter(ScrapingRecord.success == True).count()
            failed = session.query(ScrapingRecord)\
                .filter(ScrapingRecord.success == False).count()

            return {
                'total_records': total_records,
                'successful': successful,
                'failed': failed,
                'success_rate': (successful / total_records * 100) if total_records > 0 else 0
            }

        finally:
            session.close()

    def delete_old_records(self, days: int = 30) -> int:
        """
        Elimina record più vecchi di N giorni

        Args:
            days: Numero giorni

        Returns:
            Numero record eliminati
        """
        session = self.Session()
        try:
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            deleted = session.query(ScrapingRecord)\
                .filter(ScrapingRecord.timestamp < cutoff_date)\
                .delete()

            session.commit()
            self.logger.info(f"Deleted {deleted} old records")

            return deleted

        except Exception as e:
            session.rollback()
            self.logger.error(f"Failed to delete old records: {e}")
            return 0

        finally:
            session.close()

    def clear_all(self) -> bool:
        """
        Pulisce tutti i record dal database

        Returns:
            True se successo
        """
        session = self.Session()
        try:
            session.query(ScrapingRecord).delete()
            session.commit()
            self.logger.warning("All records cleared from database")
            return True

        except Exception as e:
            session.rollback()
            self.logger.error(f"Failed to clear database: {e}")
            return False

        finally:
            session.close()

    def close(self):
        """Chiude connessione database"""
        if self.engine:
            self.engine.dispose()
            self.logger.info("Database connection closed")
