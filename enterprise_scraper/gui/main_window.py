"""
Enterprise Scraper - Main GUI Window
GUI moderna con CustomTkinter e dark theme
"""

import customtkinter as ctk
from tkinter import scrolledtext, messagebox, filedialog
import threading
import queue
from typing import Optional, List
import json
from datetime import datetime
import uuid

from ..core.scraper_engine import EnterpriseScraperEngine, ScrapingResult
from ..core.browser_scraper import BrowserScraperEngine
from ..database.models import DatabaseManager
from ..exports.exporter import DataExporter
from ..config import settings
from ..utils.logger import EnterpriseLogger


class EnterpriseScraperGUI:
    """
    GUI principale enterprise scraper
    Features:
    - Input URL singolo o multiplo
    - Configurazione avanzata scraping
    - Selezione scraper type (requests/browser)
    - Visualizzazione risultati real-time
    - Export multi-formato
    - Database storage
    - Statistiche e analytics
    """

    def __init__(self):
        self.logger = EnterpriseLogger.get_logger("GUI")

        # Set appearance
        ctk.set_appearance_mode(settings.GUI_APPEARANCE)
        ctk.set_default_color_theme(settings.GUI_THEME)

        # Main window
        self.root = ctk.CTk()
        self.root.title("Enterprise Web Scraper - Cybersecurity Grade")
        self.root.geometry(settings.GUI_WINDOW_SIZE)
        self.root.minsize(*settings.GUI_MIN_SIZE)

        # Components
        self.scraper_engine = None
        self.browser_scraper = None
        self.db_manager = DatabaseManager()
        self.exporter = DataExporter()

        # State
        self.current_results = []
        self.current_session_id = None
        self.is_scraping = False
        self.log_queue = queue.Queue()

        # Build GUI
        self._build_gui()

        # Log redirect handler
        self._setup_log_handler()

        self.logger.info("GUI initialized")

    def _build_gui(self):
        """Costruisce interfaccia GUI"""

        # Main container con padding
        main_container = ctk.CTkFrame(self.root)
        main_container.pack(fill="both", expand=True, padx=10, pady=10)

        # Header
        self._create_header(main_container)

        # Content area (2 colonne)
        content_frame = ctk.CTkFrame(main_container)
        content_frame.pack(fill="both", expand=True, pady=(10, 0))

        # Left panel - Controls
        left_panel = ctk.CTkFrame(content_frame)
        left_panel.pack(side="left", fill="both", expand=True, padx=(0, 5))

        self._create_input_section(left_panel)
        self._create_config_section(left_panel)
        self._create_action_buttons(left_panel)

        # Right panel - Results & Logs
        right_panel = ctk.CTkFrame(content_frame)
        right_panel.pack(side="right", fill="both", expand=True, padx=(5, 0))

        self._create_results_section(right_panel)
        self._create_log_section(right_panel)

        # Status bar
        self._create_status_bar(main_container)

    def _create_header(self, parent):
        """Crea header con titolo e info"""
        header_frame = ctk.CTkFrame(parent, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 10))

        # Title
        title_label = ctk.CTkLabel(
            header_frame,
            text="🔒 ENTERPRISE WEB SCRAPER",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=5)

        # Subtitle
        subtitle_label = ctk.CTkLabel(
            header_frame,
            text="Cybersecurity Grade • Anti-Detection • Multi-Format Export",
            font=ctk.CTkFont(size=12),
            text_color="gray"
        )
        subtitle_label.pack()

    def _create_input_section(self, parent):
        """Crea sezione input URL"""
        section = ctk.CTkFrame(parent)
        section.pack(fill="x", pady=(0, 10))

        label = ctk.CTkLabel(
            section,
            text="Target URL(s)",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        label.pack(anchor="w", padx=10, pady=(10, 5))

        # URL input
        self.url_input = ctk.CTkTextbox(section, height=80)
        self.url_input.pack(fill="x", padx=10, pady=(0, 5))
        self.url_input.insert("1.0", "https://example.com")

        # Info label
        info_label = ctk.CTkLabel(
            section,
            text="💡 Multiple URLs: one per line",
            font=ctk.CTkFont(size=11),
            text_color="gray"
        )
        info_label.pack(anchor="w", padx=10, pady=(0, 10))

    def _create_config_section(self, parent):
        """Crea sezione configurazione"""
        section = ctk.CTkFrame(parent)
        section.pack(fill="x", pady=(0, 10))

        label = ctk.CTkLabel(
            section,
            text="Configuration",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        label.pack(anchor="w", padx=10, pady=(10, 5))

        # Scraper Type
        type_frame = ctk.CTkFrame(section, fg_color="transparent")
        type_frame.pack(fill="x", padx=10, pady=5)

        ctk.CTkLabel(type_frame, text="Scraper Type:").pack(side="left", padx=(0, 10))

        self.scraper_type = ctk.CTkSegmentedButton(
            type_frame,
            values=["Requests (Fast)", "Browser (JS Support)"]
        )
        self.scraper_type.set("Requests (Fast)")
        self.scraper_type.pack(side="left", fill="x", expand=True)

        # Parse Content
        self.parse_content_var = ctk.BooleanVar(value=True)
        parse_check = ctk.CTkCheckBox(
            section,
            text="Parse HTML Content (extract links, images, metadata)",
            variable=self.parse_content_var
        )
        parse_check.pack(anchor="w", padx=10, pady=5)

        # Extract Patterns
        self.extract_patterns_var = ctk.BooleanVar(value=True)
        patterns_check = ctk.CTkCheckBox(
            section,
            text="Extract Patterns (emails, phones, URLs, hashes)",
            variable=self.extract_patterns_var
        )
        patterns_check.pack(anchor="w", padx=10, pady=5)

        # Security Analysis
        self.security_analysis_var = ctk.BooleanVar(value=True)
        security_check = ctk.CTkCheckBox(
            section,
            text="Security Analysis (headers, SSL, vulnerabilities)",
            variable=self.security_analysis_var
        )
        security_check.pack(anchor="w", padx=10, pady=5)

        # Save to Database
        self.save_db_var = ctk.BooleanVar(value=True)
        db_check = ctk.CTkCheckBox(
            section,
            text="Save to Database",
            variable=self.save_db_var
        )
        db_check.pack(anchor="w", padx=10, pady=5)

        # Multi-threading
        threading_frame = ctk.CTkFrame(section, fg_color="transparent")
        threading_frame.pack(fill="x", padx=10, pady=(5, 10))

        ctk.CTkLabel(threading_frame, text="Concurrent Workers:").pack(side="left", padx=(0, 10))

        self.workers_slider = ctk.CTkSlider(
            threading_frame,
            from_=1,
            to=20,
            number_of_steps=19
        )
        self.workers_slider.set(settings.MAX_WORKERS)
        self.workers_slider.pack(side="left", fill="x", expand=True, padx=(0, 10))

        self.workers_label = ctk.CTkLabel(threading_frame, text=f"{int(self.workers_slider.get())}")
        self.workers_label.pack(side="left")

        self.workers_slider.configure(command=self._update_workers_label)

    def _create_action_buttons(self, parent):
        """Crea bottoni azione"""
        section = ctk.CTkFrame(parent)
        section.pack(fill="x", pady=(0, 10))

        # Primary button - Start Scraping
        self.start_button = ctk.CTkButton(
            section,
            text="▶ START SCRAPING",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=40,
            command=self._start_scraping,
            fg_color="#2e7d32",
            hover_color="#1b5e20"
        )
        self.start_button.pack(fill="x", padx=10, pady=(10, 5))

        # Stop button
        self.stop_button = ctk.CTkButton(
            section,
            text="⬛ STOP",
            command=self._stop_scraping,
            state="disabled",
            fg_color="#c62828",
            hover_color="#8e0000"
        )
        self.stop_button.pack(fill="x", padx=10, pady=5)

        # Export buttons frame
        export_frame = ctk.CTkFrame(section, fg_color="transparent")
        export_frame.pack(fill="x", padx=10, pady=(10, 5))

        ctk.CTkLabel(
            export_frame,
            text="Export Results:",
            font=ctk.CTkFont(weight="bold")
        ).pack(anchor="w", pady=(0, 5))

        # Export format selector
        self.export_format = ctk.CTkOptionMenu(
            export_frame,
            values=["JSON", "CSV", "XLSX", "XML", "HTML"]
        )
        self.export_format.set("JSON")
        self.export_format.pack(fill="x", pady=(0, 5))

        # Export button
        export_button = ctk.CTkButton(
            export_frame,
            text="💾 Export Data",
            command=self._export_results
        )
        export_button.pack(fill="x")

        # Utility buttons
        util_frame = ctk.CTkFrame(section, fg_color="transparent")
        util_frame.pack(fill="x", padx=10, pady=(10, 10))

        clear_button = ctk.CTkButton(
            util_frame,
            text="🗑 Clear Results",
            command=self._clear_results,
            width=120
        )
        clear_button.pack(side="left", padx=(0, 5))

        stats_button = ctk.CTkButton(
            util_frame,
            text="📊 Statistics",
            command=self._show_statistics,
            width=120
        )
        stats_button.pack(side="left")

    def _create_results_section(self, parent):
        """Crea sezione risultati"""
        section = ctk.CTkFrame(parent)
        section.pack(fill="both", expand=True, pady=(0, 5))

        label = ctk.CTkLabel(
            section,
            text="Results",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        label.pack(anchor="w", padx=10, pady=(10, 5))

        # Results text area
        self.results_text = scrolledtext.ScrolledText(
            section,
            wrap="word",
            bg="#1a1a1a",
            fg="#e0e0e0",
            font=("Consolas", 10),
            insertbackground="white"
        )
        self.results_text.pack(fill="both", expand=True, padx=10, pady=(0, 10))

    def _create_log_section(self, parent):
        """Crea sezione log"""
        section = ctk.CTkFrame(parent)
        section.pack(fill="both", expand=True)

        label = ctk.CTkLabel(
            section,
            text="Logs",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        label.pack(anchor="w", padx=10, pady=(10, 5))

        # Log text area
        self.log_text = scrolledtext.ScrolledText(
            section,
            wrap="word",
            height=10,
            bg="#1a1a1a",
            fg="#00ff00",
            font=("Consolas", 9),
            insertbackground="white"
        )
        self.log_text.pack(fill="both", expand=True, padx=10, pady=(0, 10))

    def _create_status_bar(self, parent):
        """Crea barra di stato"""
        status_frame = ctk.CTkFrame(parent, height=30)
        status_frame.pack(fill="x", pady=(10, 0))

        self.status_label = ctk.CTkLabel(
            status_frame,
            text="Ready",
            font=ctk.CTkFont(size=11)
        )
        self.status_label.pack(side="left", padx=10, pady=5)

        self.progress_label = ctk.CTkLabel(
            status_frame,
            text="",
            font=ctk.CTkFont(size=11)
        )
        self.progress_label.pack(side="right", padx=10, pady=5)

    def _update_workers_label(self, value):
        """Aggiorna label workers count"""
        self.workers_label.configure(text=f"{int(value)}")

    def _setup_log_handler(self):
        """Setup handler per log redirection"""
        # Periodic check log queue
        self.root.after(100, self._check_log_queue)

    def _check_log_queue(self):
        """Check log queue e aggiorna UI"""
        try:
            while True:
                log_msg = self.log_queue.get_nowait()
                self._append_log(log_msg)
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self._check_log_queue)

    def _append_log(self, message: str):
        """Appende messaggio al log"""
        self.log_text.insert("end", f"{message}\n")
        self.log_text.see("end")

    def _append_result(self, message: str):
        """Appende risultato"""
        self.results_text.insert("end", f"{message}\n")
        self.results_text.see("end")

    def _update_status(self, message: str):
        """Aggiorna status bar"""
        self.status_label.configure(text=message)

    def _update_progress(self, message: str):
        """Aggiorna progress label"""
        self.progress_label.configure(text=message)

    def _start_scraping(self):
        """Avvia scraping in background thread"""
        # Ottieni URLs
        urls_text = self.url_input.get("1.0", "end").strip()
        urls = [url.strip() for url in urls_text.split('\n') if url.strip()]

        if not urls:
            messagebox.showwarning("No URLs", "Please enter at least one URL")
            return

        # Disable start button
        self.start_button.configure(state="disabled")
        self.stop_button.configure(state="normal")
        self.is_scraping = True

        # Genera session ID
        self.current_session_id = str(uuid.uuid4())

        # Clear previous results
        self.results_text.delete("1.0", "end")
        self.current_results = []

        # Start in thread
        thread = threading.Thread(
            target=self._scraping_worker,
            args=(urls,),
            daemon=True
        )
        thread.start()

    def _scraping_worker(self, urls: List[str]):
        """Worker thread per scraping"""
        try:
            self._update_status(f"Scraping {len(urls)} URL(s)...")
            self.log_queue.put(f"[{datetime.now().strftime('%H:%M:%S')}] Starting scraping session: {self.current_session_id}")

            scraper_type = self.scraper_type.get()

            if "Browser" in scraper_type:
                # Browser scraping
                self.log_queue.put("Using Browser Scraper (JavaScript support)")
                self._browser_scraping(urls)
            else:
                # Requests scraping
                self.log_queue.put("Using Requests Scraper (Fast)")
                self._requests_scraping(urls)

            self._update_status(f"Completed: {len(self.current_results)} results")
            self.log_queue.put(f"Scraping completed: {len(self.current_results)} results")

            # Save to DB if enabled
            if self.save_db_var.get():
                saved_ids = self.db_manager.save_results(
                    self.current_results,
                    self.current_session_id
                )
                self.log_queue.put(f"Saved {len(saved_ids)} records to database")

        except Exception as e:
            self.log_queue.put(f"ERROR: {str(e)}")
            self._update_status("Error occurred")

        finally:
            self.is_scraping = False
            self.root.after(0, lambda: self.start_button.configure(state="normal"))
            self.root.after(0, lambda: self.stop_button.configure(state="disabled"))

    def _requests_scraping(self, urls: List[str]):
        """Scraping usando requests engine"""
        if not self.scraper_engine:
            self.scraper_engine = EnterpriseScraperEngine()

        max_workers = int(self.workers_slider.get())
        parse_content = self.parse_content_var.get()

        if len(urls) == 1:
            # Single URL
            result = self.scraper_engine.scrape(urls[0], parse_content=parse_content)
            self.current_results.append(result)
            self._display_result(result)
        else:
            # Multiple URLs - parallel
            results = self.scraper_engine.scrape_multiple(
                urls,
                max_workers=max_workers,
                parse_content=parse_content
            )
            self.current_results.extend(results)

            for i, result in enumerate(results, 1):
                self._update_progress(f"{i}/{len(results)}")
                self._display_result(result)

    def _browser_scraping(self, urls: List[str]):
        """Scraping usando browser engine"""
        try:
            with BrowserScraperEngine(use_undetected=True) as browser:
                for i, url in enumerate(urls, 1):
                    if not self.is_scraping:
                        break

                    self._update_progress(f"{i}/{len(urls)}")
                    result = browser.scrape(url, scroll_to_bottom=True)
                    self.current_results.append(result)
                    self._display_result(result)

        except Exception as e:
            self.log_queue.put(f"Browser scraping error: {e}")

    def _display_result(self, result: ScrapingResult):
        """Display risultato in UI"""
        separator = "=" * 80
        output = f"\n{separator}\n"
        output += f"URL: {result.url}\n"
        output += f"Status: {'✓ SUCCESS' if result.success else '✗ FAILED'}\n"

        if result.status_code:
            output += f"Status Code: {result.status_code}\n"

        if result.title:
            output += f"Title: {result.title}\n"

        if result.response_time:
            output += f"Response Time: {result.response_time:.2f}s\n"

        if result.links:
            output += f"Links Found: {len(result.links)}\n"

        if result.images:
            output += f"Images Found: {len(result.images)}\n"

        if result.extracted_data:
            output += f"Patterns Extracted: {list(result.extracted_data.keys())}\n"

        if result.security_info:
            output += f"Security Analysis: {len(result.security_info)} checks\n"

        if result.error:
            output += f"Error: {result.error}\n"

        output += f"{separator}\n"

        self.root.after(0, lambda: self._append_result(output))

    def _stop_scraping(self):
        """Stop scraping"""
        self.is_scraping = False
        self._update_status("Stopping...")
        self.log_queue.put("Scraping stopped by user")

    def _export_results(self):
        """Export risultati"""
        if not self.current_results:
            messagebox.showwarning("No Data", "No results to export")
            return

        format_type = self.export_format.get().lower()

        # Convert results to dicts
        data = [result.to_dict() for result in self.current_results]

        # Export
        filepath = self.exporter.export(data, format_type)

        if filepath:
            messagebox.showinfo("Export Complete", f"Data exported to:\n{filepath}")
            self.log_queue.put(f"Exported {len(data)} records to {filepath}")
        else:
            messagebox.showerror("Export Failed", "Failed to export data")

    def _clear_results(self):
        """Pulisce risultati"""
        self.results_text.delete("1.0", "end")
        self.current_results = []
        self._update_status("Ready")
        self._update_progress("")
        self.log_queue.put("Results cleared")

    def _show_statistics(self):
        """Mostra statistiche"""
        if not self.current_results:
            messagebox.showinfo("Statistics", "No data available")
            return

        total = len(self.current_results)
        successful = sum(1 for r in self.current_results if r.success)
        failed = total - successful
        avg_time = sum(r.response_time for r in self.current_results if r.response_time) / total

        stats_text = f"""
Current Session Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total URLs: {total}
Successful: {successful} ({successful/total*100:.1f}%)
Failed: {failed} ({failed/total*100:.1f}%)
Average Response Time: {avg_time:.2f}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

        db_stats = self.db_manager.get_stats()
        stats_text += f"Total Records: {db_stats['total_records']}\n"
        stats_text += f"Success Rate: {db_stats['success_rate']:.1f}%\n"

        messagebox.showinfo("Statistics", stats_text)

    def run(self):
        """Avvia applicazione"""
        self.logger.info("Starting GUI application")
        self.root.mainloop()

    def __del__(self):
        """Cleanup on exit"""
        if self.scraper_engine:
            self.scraper_engine.close()
        if self.db_manager:
            self.db_manager.close()
