# Browser-use → Playwright Geçiş Planı

Bu doküman, Facebook Marketplace agent'larını **browser-use** yerine **Playwright** ile yeniden yazmak için adım adım planı içerir.

---

## 1. Mevcut Durum vs Hedef

| Özellik | browser-use | Playwright (Hedef) |
|---------|-------------|---------------------|
| Tarayıcı kontrolü | LLM karar verir (çok adım) | Kod ile doğrudan kontrol |
| Veri çıkarma | `extract_content` (AI her adımda) | Seçenek A: DOM selectors / Seçenek B: AI (tek çağrı) |
| API çağrısı | ~10–25 LLM çağrısı/çalıştırma | 0 veya 1 LLM çağrısı |
| Bağımlılık | browser-use + playwright | Sadece playwright |
| Hız | Yavaş (agent düşünür) | Daha hızlı |
| Bakım | Düşük (AI adapte olur) | Yüksek (selector güncellemesi) |

---

## 2. Mimari Seçenekler

### Seçenek A: Saf Playwright + DOM Selectors

```
Playwright → navigate → scroll → page.locator("...") → JSON
```

**Artıları:** LLM yok, hızlı, maliyet yok  
**Eksileri:** Facebook DOM sık değişir, selector'lar kırılır, bakım zor

### Seçenek B: Playwright + AI Extraction (Önerilen)

```
Playwright → navigate → scroll → page.content() veya screenshot
    → Gemini'ye gönder (tek prompt) → JSON
```

**Artıları:** DOM değişse bile AI sayfayı okuyabilir, tek LLM çağrısı  
**Eksileri:** Her çalıştırmada 1 Gemini çağrısı (mevcut agent’tan daha az)

### Seçenek C: Hibrit (Selector + AI Fallback)

```
Playwright → selector ile dene → başarısızsa → AI extraction
```

**Artıları:** Çoğu zaman selector, nadiren AI  
**Eksileri:** Daha karmaşık mantık

---

## 3. Önerilen Mimari: Seçenek B

```
┌─────────────────────────────────────────────────────────────────┐
│  search_marketplace_prices() / search_marketplace_listings()     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Playwright: Browser başlat (headless)                        │
│  2. Playwright: URL'e git                                        │
│  3. Playwright: Popup kapat (varsa)                               │
│  4. Playwright: 8–10 kez scroll (lazy load)                       │
│  5. Playwright: page.content() veya page.screenshot()              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Gemini: HTML/screenshot + prompt → JSON extraction            │
│     (tek LLM çağrısı, Flash → Flash-Lite fallback)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Python: Parse, filtrele, IQR (price_agent için)               │
│  8. Sonucu döndür                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Uygulama Adımları

### Faz 1: Ortak Playwright Modülü

**Dosya:** `backend/browser/playwright_marketplace.py`

```python
# Sorumluluklar:
# - async def load_marketplace_page(url, scroll_count=10) -> str
#   → HTML veya base64 screenshot döner
# - Popup kapatma, scroll, bekleme
# - Browser lifecycle (context manager)
```

**Bağımlılıklar:** `playwright` (zaten var)

### Faz 2: AI Extraction Modülü

**Dosya:** `backend/browser/marketplace_extractor.py`

```python
# Sorumluluklar:
# - async def extract_listings_from_html(html: str, schema: dict) -> list[dict]
# - Gemini Flash/Flash-Lite ile tek çağrı
# - Prompt: HTML + "Bu sayfadan ilanları çıkar, JSON döndür"
# - Rate limit fallback (mevcut mantık)
```

**Bağımlılıklar:** `langchain-google-genai`, `agent.config`

### Faz 3: price_agent Refactor

**Değişiklikler:**
- `browser-use` import'ları kaldır
- `load_marketplace_page()` çağır
- `extract_listings_from_html()` çağır
- Mevcut `_parse_agent_result`, `_cluster_average` aynı kalır

### Faz 4: marketplace_agent Refactor

**Değişiklikler:**
- Aynı `load_marketplace_page()` kullan
- Farklı extraction prompt (location, description dahil)
- Mevcut `_parse_marketplace_result`, `_title_matches_query` aynı kalır

### Faz 5: Temizlik

- `browser-use` requirements.txt'ten çıkar
- Eski agent kodları silinir veya yedeklenir
- Testler güncellenir

---

## 5. Dosya Yapısı (Hedef)

```
backend/
├── browser/
│   ├── __init__.py
│   ├── playwright_marketplace.py   # Playwright: navigate, scroll, HTML
│   └── marketplace_extractor.py    # Gemini: HTML → JSON
├── price_agent.py                  # Refactor: Playwright + extractor
├── marketplace_agent.py             # Refactor: Playwright + extractor
└── requirements.txt                # browser-use kaldırılır
```

---

## 6. Örnek Kod Taslağı

### playwright_marketplace.py

```python
async def load_marketplace_page(
    url: str,
    scroll_count: int = 10,
    scroll_delay_ms: int = 800,
) -> str:
    """Marketplace sayfasını yükler, scroll eder, HTML döner."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="tr-TR",
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await _close_popup_if_any(page)
            for _ in range(scroll_count):
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
                await page.wait_for_timeout(scroll_delay_ms)
            return await page.content()
        finally:
            await browser.close()
```

### marketplace_extractor.py

```python
async def extract_listings_from_html(
    html: str,
    extract_schema: str,  # "price_only" | "full"
) -> list[dict]:
    """HTML'i Gemini'ye gönderir, ilan listesi döner."""
    prompt = EXTRACTION_PROMPT.format(html=html[:150000], schema=extract_schema)
    for model in [GOOGLE_MODEL, GOOGLE_MODEL_FALLBACK]:
        try:
            llm = get_google_llm(model=model)
            response = await llm.ainvoke([HumanMessage(content=prompt)])
            return json.loads(_extract_json_from_text(response.content))
        except Exception as e:
            if not _is_rate_limit_error(e):
                raise
    raise RuntimeError("Tüm modeller kota aşımı")
```

---

## 7. Riskler ve Önlemler

| Risk | Önlem |
|------|-------|
| HTML çok büyük (token limiti) | `html[:150000]` ile kes, veya screenshot kullan |
| Facebook bot tespiti | User-Agent, viewport, gecikme ayarları |
| Login duvarı | Cookie/session yönetimi (ileride) |
| Gemini rate limit | Mevcut fallback zinciri korunur |

---

## 8. Tahmini Süre

| Faz | Süre |
|-----|------|
| Faz 1: Playwright modülü | 2–3 saat |
| Faz 2: AI extractor | 1–2 saat |
| Faz 3: price_agent refactor | 1 saat |
| Faz 4: marketplace_agent refactor | 1 saat |
| Faz 5: Test + temizlik | 1–2 saat |
| **Toplam** | **~8 saat** |

---

## 9. Başlamadan Önce

1. `playwright install chromium` ile tarayıcı kurulumu
2. Mevcut agent'ların çıktı formatını korumak (API uyumluluğu)
3. LangSmith tracing'i yeni akışa uyarlamak
