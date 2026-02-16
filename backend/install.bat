@echo off
echo Backend bagimliliklari yukleniyor...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python bulunamadi! Lutfen Python yukleyin.
    pause
    exit /b 1
)

REM Create virtual environment if not exists
if not exist "venv" (
    echo Virtual environment olusturuluyor...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip and build tools
echo Pip ve build araclari guncelleniyor...
python -m pip install --upgrade pip
python -m pip install --upgrade wheel setuptools

REM Try to install pydantic-core from pre-built wheel first
echo Pydantic-core onceden derlenmis paket olarak yukleniyor...
python -m pip install pydantic-core --only-binary :all: || (
    echo Onceden derlenmis paket bulunamadi, kaynak koddan derleniyor...
    echo NOT: Bu islem Rust gerektirebilir ve uzun surebilir.
)

REM Install all requirements
echo Tum bagimliliklari yukleniyor...
python -m pip install -r requirements.txt

echo.
echo Backend bagimliliklari yuklendi!
pause



