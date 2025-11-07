#!/bin/bash
# Enterprise Web Scraper - Quick Start Script (Linux/macOS)

echo "=================================="
echo "Enterprise Web Scraper v1.0.0"
echo "=================================="
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo ""
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/.installed" ]; then
    echo ""
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
    echo "✓ Dependencies installed"
fi

# Run application
echo ""
echo "Starting Enterprise Web Scraper..."
echo ""
python -m enterprise_scraper.main

# Deactivate on exit
deactivate
