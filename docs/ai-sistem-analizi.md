# AI Sistem Analizi & API Kullanım Raporu

Bu döküman, projede kullanılan AI servislerinin maliyet ve kota analizini içerir.

---

## Kullanılan AI Servisleri

| Bileşen | Servis | Model | Amaç |
|---------|--------|-------|------|
| Ürün Analizi (Ana) | Google Gemini API | `gemini-2.5-flash` | Metin analizinden form JSON oluşturma |
| Ürün Analizi (Yedek) | Google Gemini API | `gemini-2.0-flash` | Rate limit durumunda fallback |
| Ses Çevirme | Groq API | `whisper-large-v3-turbo` | Sesli açıklamayı metne çevirme |

## Mimari

Sistem **tek bir LLM çağrısıyla** çalışır. Önceki ReAct agent mimarisi 7+ API çağrısı yapıyordu; mevcut Direct Pipeline yaklaşımı bunu tek çağrıya indirdi.

```
Kullanıcı açıklaması
    ↓
[Python] Kategori şemasını hazırla (FRONTEND_CATEGORY_FIELDS)
    ↓
[LLM] Açıklama + şema → Doldurulmuş form JSON  (tek çağrı)
    ↓
[Python] JSON çıkarma + doğrulama + filtreleme
    ↓
Frontend-uyumlu form verisi
```

Retry mekanizması: Rate limit (429) alınırsa aynı model 2 kez denenir, sonra fallback modele geçilir.

---

## Token Kullanımı

| Metrik | Değer |
|--------|-------|
| Sorgu başına ortalama token | ~3.000 (input + output) |
| Aylık tahmini kullanım | 10-15 sorgu |
| Aylık toplam token | ~30.000 - 45.000 |

---

## Google Gemini API - Free Tier Limitleri

> Son güncelleme: Şubat 2026. Google bu limitleri değiştirebilir.
> Güncel limitler: https://ai.google.dev/gemini-api/docs/rate-limits

| Limit Türü | Gemini 2.5 Flash (Free) | Bizim Kullanımımız | Durum |
|------------|------------------------|-------------------|-------|
| Dakikada istek (RPM) | 10 | 1 | Sorun yok |
| Günde istek (RPD) | 250 | En fazla 1-2 | Sorun yok |
| Dakikada token (TPM) | 250.000 | ~3.000 | Sorun yok |
| Aylık sınır | **Yok** (sadece dakika/gün limiti) | ~45.000 | Sorun yok |

**Sonuç:** Free tier limitlerinin %1'ine bile yaklaşmıyoruz. Günde 250 istek hakkımız var, biz ayda 15 yapıyoruz.

### Billing (Ücretlendirme) Durumu

Free tier'da kalmak için Cloud Billing'in **aktif olmaması** gerekir:

- Kontrol adresi: https://aistudio.google.com/usage
- Billing kontrolü: https://console.cloud.google.com/billing

Eğer yanlışlıkla paid tier aktifse, fiyatlandırma:
- Input: $0.30 / 1M token
- Output: $2.50 / 1M token
- 45.000 token/ay ile tahmini maliyet: **~$0.01-0.05/ay** (ihmal edilebilir)

---

## Groq API - Free Tier Limitleri (Ses Çevirme)

| Limit Türü | Whisper (Free) | Bizim Kullanımımız | Durum |
|------------|---------------|-------------------|-------|
| Dakikada istek (RPM) | 20 | 1 | Sorun yok |
| Günde istek (RPD) | 2.000 | 10-15/ay | Sorun yok |
| Günde ses süresi (ASD) | 28.800 sn (~8 saat) | Birkaç dakika | Sorun yok |
| Maks dosya boyutu | 25 MB | Kısa ses kayıtları | Sorun yok |

---

## Konfigürasyon

Tüm API anahtarları `backend/.env` dosyasında saklanır:

```env
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-2.5-flash
GOOGLE_MODEL_FALLBACK=gemini-2.0-flash
GROQ_API_KEY=...
LANGSMITH_API_KEY=...        # Opsiyonel - tracing için
```

Fallback sırası: `gemini-2.5-flash` → `gemini-2.0-flash`

---

## Özet

- Free tier ile rahatça çalışabiliriz
- Aylık 10-15 sorgu ile limitlerin yanına bile yaklaşmıyoruz
- Tek LLM çağrısı mimarisi token kullanımını minimize ediyor
- Rate limit retry + model fallback mekanizması kesintisiz çalışmayı sağlıyor
