# Kurulum & Çalıştırma Rehberi

Proje **frontend** (Next.js) ve **backend** (FastAPI + MongoDB) olmak üzere iki parçadan oluşur.

---

## Gereksinimler

- Python 3.11 veya 3.12
- Node.js 18+
- MongoDB Atlas hesabı (veya local MongoDB)

---

## 1. Backend Kurulumu

```powershell
cd backend

# Sanal ortam oluştur (ilk kez)
python -m venv venv

# Sanal ortamı aktifleştir
.\venv\Scripts\Activate.ps1

# Bağımlılıkları yükle
pip install -r requirements.txt
```

### Backend'i Başlatma

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

---

## 2. Frontend Kurulumu

```powershell
cd frontend

# Bağımlılıkları yükle (ilk kez)
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

- Uygulama: http://localhost:3000

---

## 3. Environment Değişkenleri

`backend/.env` dosyasını oluşturun:

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=ayhanticaret

# Google Gemini (AI Ürün Analizi)
GOOGLE_API_KEY=your_key
GOOGLE_MODEL=gemini-2.5-flash
GOOGLE_MODEL_FALLBACK=gemini-2.0-flash

# Groq (Ses Çevirme)
GROQ_API_KEY=your_key

# LangSmith (Opsiyonel - AI tracing)
LANGSMITH_API_KEY=your_key
LANGSMITH_PROJECT=ayhanticaret
```

---

## 4. Hızlı Başlatma (start.bat)

Windows'ta her iki servisi tek seferde başlatmak için:

```powershell
start.bat
```

Bu script backend ve frontend'i ayrı cmd pencerelerinde başlatır ve tarayıcıyı açar.

---

## 5. Ngrok ile Dış Erişim (Opsiyonel)

Uygulamayı dışarıdan erişime açmak için ngrok kullanılabilir:

```powershell
# Backend için (ayrı terminalde)
ngrok start --config ngrok-backend.yml backend

# Frontend için (ayrı terminalde)
ngrok start --config ngrok-frontend.yml frontend
```

> ngrok yml dosyaları kendi auth token'ınızı içermelidir. Bu dosyalar `.gitignore`'da olduğu için repo'ya dahil edilmez.

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `ModuleNotFoundError` | `pip install -r requirements.txt` tekrar çalıştırın |
| npm access token hatası | `npm logout && npm cache clean --force && npm install` |
| CORS hatası | Backend ve frontend'in aynı anda çalıştığından emin olun |
| AI analiz 429 hatası | Rate limit aşıldı, birkaç dakika bekleyin (otomatik retry var) |
| MongoDB bağlantı hatası | `.env` dosyasındaki `MONGODB_URI` değerini kontrol edin |

---

## Portlar

| Servis | Port | Adres |
|--------|------|-------|
| Backend API | 8000 | http://localhost:8000 |
| Frontend | 3000 | http://localhost:3000 |
| Swagger UI | 8000 | http://localhost:8000/docs |
