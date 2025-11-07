"""
Enterprise Web Scraper - Basic Usage Examples
Esempi di utilizzo dello scraper
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from enterprise_scraper.core.scraper_engine import EnterpriseScraperEngine
from enterprise_scraper.core.browser_scraper import BrowserScraperEngine
from enterprise_scraper.database.models import DatabaseManager
from enterprise_scraper.exports.exporter import DataExporter


def example_1_basic_scraping():
    """Example 1: Basic single URL scraping"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Basic Single URL Scraping")
    print("="*60 + "\n")

    scraper = EnterpriseScraperEngine()

    result = scraper.scrape("https://example.com")

    if result.success:
        print(f"✓ URL: {result.url}")
        print(f"✓ Title: {result.title}")
        print(f"✓ Status Code: {result.status_code}")
        print(f"✓ Response Time: {result.response_time:.2f}s")
        print(f"✓ Links Found: {len(result.links)}")
        print(f"✓ Images Found: {len(result.images)}")

        if result.extracted_data:
            print(f"✓ Patterns Extracted: {list(result.extracted_data.keys())}")

        if result.security_info:
            print(f"✓ Security Analysis: {len(result.security_info)} checks")
    else:
        print(f"✗ Error: {result.error}")

    scraper.close()


def example_2_multiple_urls():
    """Example 2: Multiple URLs with parallel scraping"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Multiple URLs Parallel Scraping")
    print("="*60 + "\n")

    urls = [
        "https://example.com",
        "https://example.org",
        "https://example.net"
    ]

    scraper = EnterpriseScraperEngine()

    print(f"Scraping {len(urls)} URLs with 5 workers...\n")

    results = scraper.scrape_multiple(urls, max_workers=5)

    print("\nResults:")
    print("-" * 60)
    for i, result in enumerate(results, 1):
        status = "✓ SUCCESS" if result.success else "✗ FAILED"
        print(f"{i}. {result.url}")
        print(f"   {status} - {result.response_time:.2f}s")
        if result.title:
            print(f"   Title: {result.title[:50]}...")
        print()

    scraper.close()


def example_3_browser_scraping():
    """Example 3: Browser-based scraping for JavaScript sites"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Browser Scraping (JavaScript Support)")
    print("="*60 + "\n")

    print("Starting browser... (this may take a few seconds)\n")

    try:
        with BrowserScraperEngine(use_undetected=True, headless=True) as browser:
            result = browser.scrape(
                url="https://example.com",
                scroll_to_bottom=True,
                screenshot=False
            )

            if result.success:
                print(f"✓ URL: {result.url}")
                print(f"✓ Title: {result.title}")
                print(f"✓ Content Length: {len(result.content)} chars")
                print(f"✓ Links: {len(result.links)}")
                print(f"✓ Images: {len(result.images)}")

                if result.metadata.get('screenshot'):
                    print(f"✓ Screenshot: {result.metadata['screenshot']}")
            else:
                print(f"✗ Error: {result.error}")

    except Exception as e:
        print(f"✗ Browser error: {e}")
        print("Note: Browser scraping requires Chrome installed")


def example_4_database_operations():
    """Example 4: Database storage and retrieval"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Database Operations")
    print("="*60 + "\n")

    scraper = EnterpriseScraperEngine()
    db = DatabaseManager()

    # Scrape
    print("Scraping and saving to database...\n")
    result = scraper.scrape("https://example.com")

    # Save to DB
    session_id = "example-session-001"
    record_id = db.save_result(result, session_id=session_id)

    if record_id:
        print(f"✓ Saved to database with ID: {record_id}")
        print(f"✓ Session ID: {session_id}\n")

        # Retrieve from DB
        print("Retrieving from database...")
        records = db.get_by_session(session_id)
        print(f"✓ Found {len(records)} record(s) in session\n")

        for record in records:
            print(f"Record #{record.id}:")
            print(f"  URL: {record.url}")
            print(f"  Title: {record.title}")
            print(f"  Success: {record.success}")
            print(f"  Timestamp: {record.timestamp}")
            print()

        # Database statistics
        stats = db.get_stats()
        print("Database Statistics:")
        print(f"  Total Records: {stats['total_records']}")
        print(f"  Successful: {stats['successful']}")
        print(f"  Failed: {stats['failed']}")
        print(f"  Success Rate: {stats['success_rate']:.1f}%")

    scraper.close()
    db.close()


def example_5_data_export():
    """Example 5: Export data to multiple formats"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Data Export (Multiple Formats)")
    print("="*60 + "\n")

    scraper = EnterpriseScraperEngine()
    exporter = DataExporter()

    # Scrape multiple URLs
    urls = [
        "https://example.com",
        "https://example.org"
    ]

    print(f"Scraping {len(urls)} URLs...\n")
    results = scraper.scrape_multiple(urls, max_workers=2)

    # Convert to dicts
    data = [r.to_dict() for r in results]

    # Export in various formats
    print("Exporting data...\n")

    formats = ['json', 'csv', 'xlsx', 'xml', 'html']
    for fmt in formats:
        filepath = exporter.export(
            data,
            format_type=fmt,
            filename=f"example_export.{fmt}"
        )

        if filepath:
            print(f"✓ {fmt.upper():6} -> {filepath}")

    print("\n✓ All exports completed!")

    scraper.close()


def example_6_pattern_extraction():
    """Example 6: Advanced pattern extraction"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Pattern Extraction")
    print("="*60 + "\n")

    # Sample HTML with various patterns
    sample_html = """
    <html>
        <body>
            <p>Contact us: support@example.com or sales@company.org</p>
            <p>Phone: 555-123-4567 or 555.987.6543</p>
            <p>Visit: https://example.com/page and http://other.com</p>
            <p>Server IP: 192.168.1.100</p>
            <p>Hash: 5d41402abc4b2a76b9719d911017c592</p>
        </body>
    </html>
    """

    # Note: For real usage, you'd scrape actual websites
    # This is just to demonstrate pattern extraction

    print("Pattern extraction works automatically when scraping!")
    print("It finds: emails, phones, URLs, IPs, hashes (MD5/SHA256)\n")

    scraper = EnterpriseScraperEngine()

    # Example with real URL
    result = scraper.scrape("https://example.com")

    if result.extracted_data:
        print("Patterns found:")
        for pattern_type, matches in result.extracted_data.items():
            print(f"\n{pattern_type.upper()}:")
            for match in matches[:5]:  # Show first 5
                print(f"  - {match}")

            if len(matches) > 5:
                print(f"  ... and {len(matches) - 5} more")
    else:
        print("No patterns found in this page")

    scraper.close()


def example_7_security_analysis():
    """Example 7: Security headers and vulnerability analysis"""
    print("\n" + "="*60)
    print("EXAMPLE 7: Security Analysis")
    print("="*60 + "\n")

    scraper = EnterpriseScraperEngine()

    result = scraper.scrape("https://example.com")

    if result.security_info:
        print("Security Analysis Results:\n")

        # Security headers present
        headers = result.security_info.get('headers', {})
        if headers:
            print("✓ Security Headers Present:")
            for header, value in headers.items():
                print(f"  • {header}")
                print(f"    {value[:60]}..." if len(value) > 60 else f"    {value}")

        # Missing headers
        missing = result.security_info.get('missing_headers', [])
        if missing:
            print("\n⚠️  Missing Security Headers:")
            for header in missing:
                print(f"  • {header}")

        # SSL info
        if result.security_info.get('ssl_enabled'):
            print("\n✓ SSL/TLS: Enabled")

        # Cookie security
        cookies = result.security_info.get('cookies', [])
        if cookies:
            print(f"\n🍪 Cookies Analysis ({len(cookies)} cookies):")
            for cookie in cookies[:3]:  # Show first 3
                print(f"\n  Cookie: {cookie['name']}")
                print(f"    Secure: {'✓' if cookie['secure'] else '✗'}")
                print(f"    HttpOnly: {'✓' if cookie['httponly'] else '✗'}")
                print(f"    SameSite: {cookie.get('samesite', 'Not set')}")

    else:
        print("No security analysis available")

    scraper.close()


def main():
    """Run all examples"""
    print("\n" + "#"*60)
    print("# ENTERPRISE WEB SCRAPER - EXAMPLES")
    print("#"*60)

    examples = [
        ("Basic Single URL Scraping", example_1_basic_scraping),
        ("Multiple URLs Parallel", example_2_multiple_urls),
        ("Browser Scraping (JS)", example_3_browser_scraping),
        ("Database Operations", example_4_database_operations),
        ("Data Export", example_5_data_export),
        ("Pattern Extraction", example_6_pattern_extraction),
        ("Security Analysis", example_7_security_analysis),
    ]

    print("\nAvailable Examples:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")

    print("\n  0. Run all examples")
    print("  q. Quit")

    while True:
        choice = input("\nSelect example (0-7, q): ").strip().lower()

        if choice == 'q':
            print("\nGoodbye!")
            break

        if choice == '0':
            print("\nRunning all examples...\n")
            for name, func in examples:
                try:
                    func()
                    input("\nPress Enter to continue to next example...")
                except KeyboardInterrupt:
                    print("\n\nInterrupted by user")
                    break
                except Exception as e:
                    print(f"\n✗ Error in example: {e}")
                    import traceback
                    traceback.print_exc()
            break

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(examples):
                name, func = examples[idx]
                func()
                input("\nPress Enter to continue...")
            else:
                print("Invalid choice!")
        except ValueError:
            print("Invalid input!")
        except KeyboardInterrupt:
            print("\n\nInterrupted by user")
            break
        except Exception as e:
            print(f"\n✗ Error: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
