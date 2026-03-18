# Ayhan Ticaret - Deploy Rehberi

> Frontend: **Vercel** | Backend: **Render** | Veritabanı: **MongoDB Atlas** (zaten hazır)

---

## 1. Backend Deploy (Render)

### Adım 1: Render hesabı aç
- https://render.com adresine git, GitHub ile giriş yap.

### Adım 2: Yeni Web Service oluştur
1. Dashboard'da **"New +"** → **"Web Service"** tıkla.
2. GitHub reposundan **ayhanticaret_app** reposunu seç.
3. Ayarları şu şekilde doldur:

| Alan | Değer |
|------|-------|
| **Name** | `ayhanticaret-api` |
| **Region** | `Frankfurt (EU Central)` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `bash build.sh` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (başlangıç için) |

### Adım 3: Environment Variables ekle
Render dashboard'da **"Environment"** sekmesine git ve şu değişkenleri ekle:

```
MONGODB_URI=mongodb+srv://...(senin MongoDB Atlas bağlantı stringin)
MONGODB_DB_NAME=ayhanticaret
CLOUDINARY_URL=cloudinary://...(senin Cloudinary URL'in)
GOOGLE_API_KEY=...(senin Google AI API key'in)
GROQ_API_KEY=...(senin Groq API key'in)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=...(senin LangSmith API key'in)
LANGSMITH_PROJECT=ayhanticaret
LANGSMITH_PRICE_API_KEY=...(senin fiyat arama LangSmith key'in)
LANGSMITH_PRICE_PROJECT=fiyatarama
LANGSMITH_MARKETPLACE_API_KEY=...(senin marketplace LangSmith key'in)
LANGSMITH_MARKETPLACE_PROJECT=marketplace arama
```

> **Not:** Bu değerleri `backend/.env` dosyandan kopyalayabilirsin.

### Adım 4: Deploy et
- **"Create Web Service"** butonuna tıkla.
- Render otomatik olarak build edip deploy edecek.
- Deploy tamamlanınca bir URL alacaksın: `https://ayhanticaret-api.onrender.com`

---

## 2. Frontend Deploy (Vercel)

### Adım 1: Vercel hesabı aç
- https://vercel.com adresine git, GitHub ile giriş yap.

### Adım 2: Yeni proje oluştur
1. **"Add New..."** → **"Project"** tıkla.
2. GitHub'dan **ayhanticaret_app** reposunu import et.
3. Ayarları şu şekilde doldur:

| Alan | Değer |
|------|-------|
| **Framework Preset** | `Next.js` (otomatik algılanır) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (varsayılan) |
| **Output Directory** | `.next` (varsayılan) |

### Adım 3: Environment Variables ekle
**"Environment Variables"** bölümüne şu değişkeni ekle:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://ayhanticaret-api.onrender.com` |

> **Önemli:** Bu URL, Render'da backend deploy ettikten sonra aldığın URL olmalı.

### Adım 4: Deploy et
- **"Deploy"** butonuna tıkla.
- Vercel otomatik olarak build edip deploy edecek.
- Tamamlanınca bir URL alacaksın: `https://ayhanticaret.vercel.app`

---

## 3. Deploy Sonrası Kontrol Listesi

- [ ] Render backend URL'ini tarayıcıda aç → `{"message": "Endüstriyel Mutfak Yönetim API"}` görmelisin
- [ ] Vercel frontend URL'ini aç → Uygulamanın ana sayfası açılmalı
- [ ] Bir ürün eklemeyi/listelemeyi dene → Backend bağlantısı çalışmalı
- [ ] Cloudinary fotoğraf yükleme testi yap

---

## 4. Otomatik Deploy (CI/CD)

Her iki platform da GitHub'a push yaptığında **otomatik olarak yeniden deploy eder**:

- `git push origin main` → Hem Vercel hem Render otomatik güncellenir.
- Vercel: ~1-2 dakika
- Render (Free): ~3-5 dakika

---

## 5. Custom Domain (İsteğe Bağlı)

### Vercel'de:
1. Project Settings → Domains → Domain adını ekle
2. DNS ayarlarında Vercel'in verdiği CNAME kaydını ekle

### Render'da:
1. Service Settings → Custom Domains → Domain adını ekle
2. DNS ayarlarında Render'ın verdiği CNAME kaydını ekle

---

## 6. Render Free Tier Notu

Render Free plan'da servis **15 dakika kullanılmazsa uyku moduna geçer**. İlk istek geldiğinde ~30 saniye bekleyerek uyanır. Bu normaldir.

Sürekli aktif kalmasını istiyorsan:
- Render **Starter** plan ($7/ay) kullanabilirsin
- Ya da ücretsiz bir cron servisi (cron-job.org) ile her 14 dakikada bir backend URL'ine ping atabilirsin

---

## Özet Tablo

| Servis | Platform | Root Directory | URL |
|--------|----------|---------------|-----|
| Frontend | Vercel | `frontend` | `https://ayhanticaret.vercel.app` |
| Backend | Render | `backend` | `https://ayhanticaret-api.onrender.com` |
| Veritabanı | MongoDB Atlas | - | Zaten bağlı |
| Görseller | Cloudinary | - | Zaten bağlı |
