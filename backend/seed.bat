@echo off
echo Endustriyel Mutfak Kategorileri ve Urunleri Yukleniyor...
echo.

cd backend
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment bulunamadi! Lutfen once start.bat dosyasini calistirin.
    pause
    exit /b 1
)

python seed_data.py

echo.
echo Tamamlandi!
pause



