# Ayhan Ticaret Uygulaması – Çalıştırma Rehberi

Bu proje **frontend** (Next.js) ve **backend** (FastAPI) olmak üzere iki parçadan oluşur. İkisini de ayrı terminallerde çalıştırmanız gerekir.

---

## 1. Backend (API) çalıştırma

Backend Python (FastAPI) ile yazılmıştır ve **port 8000** üzerinde çalışır.

### İlk kurulum (sadece bir kez)

```powershell
cd C:\Users\bilal\ayhanticaret_app\backend

# Sanal ortam yoksa oluştur
python -m venv venv

# Sanal ortamı aktifleştir (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Bağımlılıkları yükle
pip install -r requirements.txt
```

*Alternatif:* `install.bat` dosyasına çift tıklayarak da kurulum yapabilirsiniz.

### Backend’i başlatma

```powershell
cd C:\Users\bilal\ayhanticaret_app\backend
.\venv\Scripts\Activate.ps1
python main.py
```

**veya** uvicorn ile:

```powershell
cd C:\Users\bilal\ayhanticaret_app\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API adresi: **http://localhost:8000**
- API dokümantasyonu: **http://localhost:8000/docs**

---

## 2. Frontend çalıştırma

Frontend Next.js ile yazılmıştır ve **port 3000** üzerinde çalışır.

### İlk kurulum (sadece bir kez)

```powershell
cd C:\Users\bilal\ayhanticaret_app\frontend
npm install
```

### Frontend’i başlatma (geliştirme modu)

```powershell
cd C:\Users\bilal\ayhanticaret_app\frontend
npm run dev
```

- Uygulama adresi: **http://localhost:3000**

---

## 3. İkisini birlikte çalıştırma

1. **İlk terminal** – Backend:
   ```powershell
   cd C:\Users\bilal\ayhanticaret_app\backend
   .\venv\Scripts\Activate.ps1
   python main.py
   ```

2. **İkinci terminal** – Frontend:
   ```powershell
   cd C:\Users\bilal\ayhanticaret_app\frontend
   npm run dev
   ```

3. Tarayıcıda **http://localhost:3000** adresine gidin. Frontend, API isteklerini **http://localhost:8000** adresine gönderir.

---

## Özet komutlar

| Ne yapıyorsunuz? | Komut |
|------------------|--------|
| Backend başlat   | `cd backend` → `.\venv\Scripts\Activate.ps1` → `python main.py` |
| Frontend başlat  | `cd frontend` → `npm run dev` |
| Backend API      | http://localhost:8000 |
| Frontend         | http://localhost:3000 |
| API dokümantasyonu | http://localhost:8000/docs |

---

## Sorun giderme

- **Backend:** `venv` aktif değilse `.\venv\Scripts\Activate.ps1` çalıştırın; `ModuleNotFoundError` alıyorsanız `pip install -r requirements.txt` tekrar çalıştırın.
- **Frontend:** `npm install` yapılmamışsa önce onu çalıştırın.
- **CORS:** Backend, `http://localhost:3000` için CORS açık; frontend ve backend aynı anda çalışıyorsa ek ayar gerekmez.
