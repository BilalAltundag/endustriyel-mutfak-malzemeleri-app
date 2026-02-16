# Endüstriyel Mutfak Yönetim Sistemi

Endüstriyel mutfak malzemesi alım-satım işletmesi için kapsamlı yönetim sistemi.

## Özellikler

- ✅ **Ürün Yönetimi**: Ürün ekleme, düzenleme, resim yükleme, fiyat takibi
- ✅ **Kategori Yönetimi**: Kategoriler oluşturma ve yönetme
- ✅ **Stok & Envanter**: Stok durumu, kategori ve malzeme bazlı dağılım
- ✅ **Finans Takibi**: Gelir-gider takibi, işlem kayıtları
- ✅ **Takvim Sistemi**: Günlük hareketler, aylık özetler
- ✅ **Hatırlatıcılar & Notlar**: Tarihli hatırlatmalar ve notlar
- ✅ **Fiyat Aralıkları**: Piyasa fiyat referansları

## Teknolojiler

### Backend
- Python 3.8+ (Python 3.11 veya 3.12 önerilir)
- FastAPI
- SQLite
- SQLAlchemy

### Frontend
- Next.js 14
- TypeScript
- TailwindCSS
- Lucide Icons

## Kurulum

### Gereksinimler
- Python 3.8-3.12 (Python 3.13 henüz bazı paketlerle uyumlu olmayabilir)
- Node.js 18 veya üzeri
- npm veya yarn

### Hızlı Başlatma

1. Projeyi klonlayın veya indirin
2. `start.bat` dosyasını çift tıklayın

Bu script:
- Gerekli dizinleri oluşturur
- Veritabanını başlatır (ilk çalıştırmada)
- Backend ve frontend bağımlılıklarını yükler
- Her iki sunucuyu başlatır
- Tarayıcıyı açar

### Manuel Kurulum

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# veya: source venv/bin/activate  # Linux/Mac
pip install --upgrade pip wheel setuptools
pip install -r requirements.txt
python init_db.py
python main.py
```

**Not**: Eğer `pydantic-core` kurulumunda sorun yaşıyorsanız:
- Python 3.11 veya 3.12 kullanın (3.13 henüz tam desteklenmiyor)
- Veya `backend/install.bat` dosyasını çalıştırın

#### Frontend
```bash
cd frontend
npm cache clean --force
npm install
npm run dev
```

**Not**: Eğer npm access token hatası alıyorsanız:
```bash
npm logout
npm cache clean --force
npm install
```

## Sorun Giderme

### Backend Kurulum Sorunları

**Problem**: `pydantic-core` kurulum hatası (Rust gerektiriyor)

**Çözümler**:
1. Python 3.11 veya 3.12 kullanın (önerilir)
2. `backend/install.bat` dosyasını çalıştırın
3. Manuel olarak:
   ```bash
   cd backend
   venv\Scripts\activate
   pip install --upgrade pip wheel setuptools
   pip install pydantic-core --only-binary :all:
   pip install -r requirements.txt
   ```

### Frontend Kurulum Sorunları

**Problem**: npm access token hatası

**Çözümler**:
```bash
cd frontend
npm logout
npm cache clean --force
npm install
```

## Önceden Tanımlı Veriler

Endüstriyel mutfak kategorileri ve ürünlerini otomatik yüklemek için:

```bash
cd backend
python seed_data.py
```

Veya Windows'ta:
```bash
backend\seed.bat
```

Bu script 20 kategori ve 100+ ürünü otomatik olarak ekler.

## Kullanım

1. Sistem başlatıldıktan sonra tarayıcıda `http://localhost:3000` adresine gidin
2. Ana sayfadan istediğiniz modüle erişebilirsiniz:
   - **Ürünler**: Ürün ekleme ve yönetimi
   - **Kategoriler**: Kategori yönetimi
   - **Tedarikçiler**: Satın aldığınız yerlerin bilgileri
   - **Notlar**: Genel notlar ve hatırlatıcılar
   - **Takvim**: Günlük hareketler ve özetler
   - **Finans**: Gelir-gider takibi (işlem ve gider ekleme)
   - **Envanter**: Stok durumu ve dağılım
   - **Fiyat Aralıkları**: Piyasa fiyat referansları

## Veritabanı

Veritabanı `data/app.db` dosyasında saklanır. Bu dosya local olarak tutulur ve tüm verileriniz burada saklanır.

## Dosya Yapısı

```
.
├── backend/           # Python FastAPI backend
│   ├── api/          # API endpoints
│   ├── database.py   # Veritabanı modelleri
│   ├── models.py     # Pydantic modelleri
│   ├── main.py       # FastAPI uygulaması
│   └── install.bat   # Manuel kurulum scripti
├── frontend/         # Next.js frontend
│   ├── app/          # Next.js sayfaları
│   ├── components/   # React bileşenleri
│   └── lib/          # Yardımcı fonksiyonlar
├── data/             # SQLite veritabanı (otomatik oluşturulur)
├── uploads/          # Yüklenen resimler (otomatik oluşturulur)
├── start.bat         # Başlatma scripti
└── README.md         # Bu dosya
```

## Notlar

- Sistem tamamen local çalışır, internet gerektirmez
- Veriler `data/app.db` dosyasında saklanır
- Yüklenen resimler `uploads/` klasöründe saklanır
- Backend varsayılan olarak `http://localhost:8000` adresinde çalışır
- Frontend varsayılan olarak `http://localhost:3000` adresinde çalışır

## Geliştirme

### Backend API Dokümantasyonu
Backend başlatıldıktan sonra `http://localhost:8000/docs` adresinden Swagger UI ile API dokümantasyonuna erişebilirsiniz.

### Veritabanı Sıfırlama
Veritabanını sıfırlamak için `data/app.db` dosyasını silin ve `start.bat` dosyasını tekrar çalıştırın.

## Lisans

Bu proje özel kullanım içindir.
