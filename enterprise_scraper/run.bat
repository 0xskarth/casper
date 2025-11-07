@echo off
REM Enterprise Web Scraper - Quick Start Script (Windows)

echo ==================================
echo Enterprise Web Scraper v1.0.0
echo ==================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

python --version

REM Check if venv exists
if not exist "venv\" (
    echo.
    echo Virtual environment not found. Creating...
    python -m venv venv
    echo OK Virtual environment created
)

REM Activate venv
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if dependencies installed
if not exist "venv\.installed" (
    echo.
    echo Installing dependencies...
    pip install -r requirements.txt
    echo installed > venv\.installed
    echo OK Dependencies installed
)

REM Run application
echo.
echo Starting Enterprise Web Scraper...
echo.
python -m enterprise_scraper.main

REM Deactivate
call venv\Scripts\deactivate.bat

pause
