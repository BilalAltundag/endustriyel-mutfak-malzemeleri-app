# Kurulum & Çalıştırma Rehberi

Proje **frontend** (Next.js) ve **backend** (FastAPI + MongoDB) olmak üzere iki parçadan oluşur.

---

## Gereksinimler

- Python 3.11 veya 3.12
- Node.js 18+
- MongoDB Atlas hesabı (veya local MongoDB)

---

## 1. Environment Değişkenleri

`backend/.env.example` dosyasını `backend/.env` olarak kopyalayıp kendi bilgilerinizi girin:

```bash
cp backend/.env.example backend/.env
```

Gerekli servisler (hepsinin ücretsiz planı var):

| Servis | Amaç | API Key Alma |
|--------|------|-------------|
| MongoDB Atlas | Veritabanı | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Cloudinary | Görsel depolama | [cloudinary.com](https://cloudinary.com/users/register_free) |
| Google AI Studio | AI ürün analizi | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | Ses çevirme | [console.groq.com/keys](https://console.groq.com/keys) |
| LangSmith | AI izleme (opsiyonel) | [smith.langchain.com](https://smith.langchain.com) |

---

## 2. Backend Kurulumu

```bash
cd backend

# Sanal ortam oluştur (ilk kez)
python -m venv venv

# Sanal ortamı aktifleştir
# Windows:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

### Backend'i Başlatma

```bash
cd backend
.\venv\Scripts\Activate.ps1   # veya source venv/bin/activate
python main.py
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

---

## 3. Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükle (ilk kez)
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

- Uygulama: http://localhost:3000

---

## 4. Hızlı Başlatma (Windows)

Her iki servisi tek seferde başlatmak için:

```powershell
start.bat
```

Bu script backend ve frontend'i ayrı cmd pencerelerinde başlatır ve tarayıcıyı açar.

---

## 5. Ngrok ile Dış Erişim (Opsiyonel)

Uygulamayı dışarıdan (telefon, tablet vb.) erişime açmak için [ngrok](https://ngrok.com) kullanılabilir:

```bash
# Backend için (ayrı terminalde)
ngrok http 8000

# Frontend için (ayrı terminalde)
ngrok http 3000
```

Ngrok yml dosyası kullanmak isterseniz, proje kökünde `ngrok-backend.yml` ve `ngrok-frontend.yml` oluşturabilirsiniz. Bu dosyalar `.gitignore`'da olduğu için repo'ya dahil edilmez.

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `ModuleNotFoundError` | `pip install -r requirements.txt` tekrar çalıştırın |
| npm hatası | `npm cache clean --force && npm install` |
| CORS hatası | Backend ve frontend'in aynı anda çalıştığından emin olun |
| AI analiz 429 hatası | Rate limit aşıldı, birkaç dakika bekleyin (otomatik retry var) |
| MongoDB bağlantı hatası | `.env` dosyasındaki `MONGODB_URI` değerini kontrol edin |
| `MONGODB_URI environment variable is required` | `backend/.env` dosyası oluşturulmamış, `.env.example`'dan kopyalayın |

---

## Portlar

| Servis | Port | Adres |
|--------|------|-------|
| Backend API | 8000 | http://localhost:8000 |
| Frontend | 3000 | http://localhost:3000 |
| Swagger UI | 8000 | http://localhost:8000/docs |
