# Ayhan Ticaret - Endüstriyel Mutfak Yönetim Sistemi

Endüstriyel mutfak malzemesi alım-satım işletmesi için kapsamlı yönetim sistemi. AI destekli ürün analizi, stok takibi, finans yönetimi ve daha fazlası.

## Özellikler

- **Ürün Yönetimi** — Ürün ekleme, düzenleme, resim yükleme, fiyat takibi
- **AI Ürün Analizi** — Sesli/yazılı açıklamadan otomatik form doldurma (Gemini AI)
- **Kategori Sistemi** — 20+ endüstriyel mutfak kategorisi ve alt tipleri
- **Stok & Envanter** — Stok durumu, kategori ve malzeme bazlı dağılım
- **Finans Takibi** — Gelir-gider takibi, işlem kayıtları
- **Takvim & Hatırlatıcılar** — Günlük hareketler, aylık özetler, notlar
- **Tedarikçi Yönetimi** — Satın alınan yerlerin bilgileri
- **Fiyat Aralıkları** — Piyasa fiyat referansları

## Teknolojiler

### Backend
- Python 3.11+
- FastAPI
- MongoDB Atlas (PyMongo)
- Google Gemini AI (ürün analizi)
- Groq Whisper (ses-metin çevirme)
- LangChain

### Frontend
- Next.js 14 + TypeScript
- TailwindCSS + ShadCN/UI
- Lucide Icons

## Hızlı Başlangıç

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py                    # → http://localhost:8000

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev                       # → http://localhost:3000
```

Detaylı kurulum: [docs/kurulum.md](docs/kurulum.md)

## Proje Yapısı

```
ayhanticaret_app/
├── backend/
│   ├── agent/           # AI ürün analizi pipeline'ı
│   │   ├── agent.py     # Direct Pipeline (tek LLM çağrısı)
│   │   ├── config.py    # API key ve model konfigürasyonu
│   │   └── retry.py     # Rate limit retry & fallback
│   ├── api/             # FastAPI endpoint'leri
│   │   ├── products.py
│   │   ├── categories.py
│   │   ├── ai_agent.py  # AI analiz & ses çevirme
│   │   ├── finance.py
│   │   ├── inventory.py
│   │   ├── calendar.py
│   │   ├── notes.py
│   │   ├── suppliers.py
│   │   └── price_ranges.py
│   ├── database.py      # MongoDB Atlas bağlantısı
│   ├── main.py          # FastAPI uygulaması
│   └── requirements.txt
├── frontend/
│   ├── app/             # Next.js sayfaları
│   ├── components/      # React bileşenleri
│   └── lib/             # API client, kategori şablonları
├── docs/                # Dökümentasyon
│   ├── kurulum.md       # Kurulum & çalıştırma rehberi
│   └── ai-sistem-analizi.md  # AI maliyet & kota analizi
├── uploads/             # Yüklenen görseller (otomatik)
├── start.bat            # Tek tıkla başlatma (Windows)
└── README.md
```

## Dökümentasyon

| Döküman | İçerik |
|---------|--------|
| [docs/kurulum.md](docs/kurulum.md) | Kurulum, çalıştırma, sorun giderme |
| [docs/ai-sistem-analizi.md](docs/ai-sistem-analizi.md) | AI API kullanımı, maliyet ve kota analizi |

## API

Backend başlatıldıktan sonra Swagger UI: http://localhost:8000/docs

Ana endpoint'ler:

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/ai/analyze` | AI ürün analizi (metin + fotoğraf) |
| `POST /api/ai/transcribe` | Ses → metin çevirme |
| `GET/POST /api/products` | Ürün CRUD |
| `GET/POST /api/categories` | Kategori CRUD |
| `GET/POST /api/finance` | Finans işlemleri |
| `GET/POST /api/suppliers` | Tedarikçi yönetimi |

## Lisans

Bu proje özel kullanım içindir.
