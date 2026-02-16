@echo off
chcp 65001 >nul
echo ========================================
echo Endustriyel Mutfak Yonetim Sistemi
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [HATA] Python bulunamadi!
    echo Lutfen Python 3.8-3.12 yukleyin.
    echo.
    pause
    exit /b 1
)
echo [OK] Python bulundu

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen Node.js yukleyin.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js bulundu
echo.

REM Create necessary directories
if not exist "data" (
    mkdir data
    echo [OK] data klasoru olusturuldu
)
if not exist "uploads" mkdir uploads
if not exist "uploads\products" mkdir uploads\products

REM Initialize database if not exists
if not exist "data\app.db" (
    echo Veritabani olusturuluyor...
    cd backend
    if exist "venv\Scripts\activate.bat" (
        call venv\Scripts\activate.bat
    )
    python init_db.py
    if errorlevel 1 (
        echo [HATA] Veritabani olusturulamadi!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Veritabani olusturuldu
)

REM Install backend dependencies only if needed
if not exist "backend\venv" (
    echo.
    echo Backend bagimliliklari ilk kez yukleniyor...
    echo Bu islem bir kac dakika surebilir, lutfen bekleyin...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [HATA] Virtual environment olusturulamadi!
        cd ..
        pause
        exit /b 1
    )
    call venv\Scripts\activate.bat
    pip install --upgrade pip --quiet
    pip install --upgrade wheel setuptools --quiet
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [HATA] Backend bagimliliklari yuklenemedi!
        echo Lutfen backend\install.bat dosyasini calistirin.
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Backend bagimliliklari yuklendi
) else (
    REM Quick check if fastapi is installed
    cd backend
    call venv\Scripts\activate.bat
    python -c "import fastapi" >nul 2>&1
    if errorlevel 1 (
        echo Backend bagimliliklari eksik, yukleniyor...
        pip install --upgrade pip --quiet
        pip install --upgrade wheel setuptools --quiet
        pip install -r requirements.txt
        if errorlevel 1 (
            echo [HATA] Backend bagimliliklari yuklenemedi!
            cd ..
            pause
            exit /b 1
        )
        echo [OK] Backend bagimliliklari yuklendi
    )
    cd ..
)

REM Install frontend dependencies only if needed
if not exist "frontend\node_modules" (
    echo.
    echo Frontend bagimliliklari ilk kez yukleniyor...
    echo Bu islem bir kac dakika surebilir, lutfen bekleyin...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo [HATA] Frontend bagimliliklari yuklenemedi!
        echo Lutfen npm cache clean --force yapip tekrar deneyin.
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend bagimliliklari yuklendi
) else (
    REM Quick check if next is installed
    if not exist "frontend\node_modules\next" (
        echo Frontend bagimliliklari eksik, yukleniyor...
        cd frontend
        call npm install
        if errorlevel 1 (
            echo [HATA] Frontend bagimliliklari yuklenemedi!
            cd ..
            pause
            exit /b 1
        )
        echo [OK] Frontend bagimliliklari yuklendi
    )
)

echo.
echo ========================================
echo Sistem baslatiliyor...
echo ========================================
echo.

REM Start backend
echo Backend baslatiliyor...
cd backend
start "Backend Server" cmd /k "cd /d %CD% && call venv\Scripts\activate.bat && python main.py"
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Frontend baslatiliyor...
cd frontend
start "Frontend Server" cmd /k "cd /d %CD% && npm run dev"
cd ..

REM Wait a bit for frontend to start
timeout /t 5 /nobreak >nul

REM Open browser
echo Tarayici aciliyor...
start http://localhost:3000

echo.
echo ========================================
echo Sistem baslatildi!
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Backend ve Frontend pencereleri acik kalacak.
echo Kapatmak icin o pencereleri kapatin.
echo.
echo Bu pencereyi kapatabilirsiniz.
echo ========================================
timeout /t 3 /nobreak >nul
