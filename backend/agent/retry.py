"""
Rate Limit Retry & Model Fallback Utility
─────────────────────────────────────────────────────────────
Gemini API free tier limitleri model başına farklıdır.
Bir model kota aşarsa otomatik olarak fallback modele geçer.

Retry akışı:
  1. İstek gönder
  2. 429 RESOURCE_EXHAUSTED → kısa süre bekle + tekrar dene (aynı model)
  3. Yine 429 → fallback modele geç
  4. Tüm modeller tükendiyse → kullanıcıya hata dön
"""
import logging
import re
import time
from typing import Any, Callable

logger = logging.getLogger(__name__)

# Retry ayarları
MAX_RETRIES_PER_MODEL = 2
DEFAULT_WAIT_SECONDS = 8


def _extract_retry_delay(error_message: str) -> float:
    """Hata mesajından 'retry in Xs' değerini çıkar."""
    match = re.search(r"retry\s+in\s+([\d.]+)s", error_message, re.IGNORECASE)
    if match:
        return float(match.group(1))
    match = re.search(r'"retryDelay":\s*"(\d+)s"', error_message)
    if match:
        return float(match.group(1))
    return DEFAULT_WAIT_SECONDS


def is_rate_limit_error(error: Exception) -> bool:
    """429 / RESOURCE_EXHAUSTED hatası mı kontrol et."""
    err_str = str(error).lower()
    return any(kw in err_str for kw in [
        "resource_exhausted",
        "429",
        "rate limit",
        "quota exceeded",
    ])


def invoke_with_retry(
    llm_invoke: Callable[..., Any],
    *args: Any,
    max_retries: int = MAX_RETRIES_PER_MODEL,
    **kwargs: Any,
) -> Any:
    """LLM invoke çağrısını rate limit retry ile sarmala.

    Args:
        llm_invoke: Çağrılacak fonksiyon (örn. llm.invoke)
        *args: Fonksiyona aktarılacak argümanlar
        max_retries: Maksimum deneme sayısı
        **kwargs: Fonksiyona aktarılacak keyword argümanlar

    Returns:
        llm_invoke'un döndürdüğü sonuç.

    Raises:
        Son deneme de başarısız olursa orijinal exception.
    """
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return llm_invoke(*args, **kwargs)
        except Exception as e:
            last_error = e
            if is_rate_limit_error(e) and attempt < max_retries:
                wait = _extract_retry_delay(str(e))
                wait = max(5.0, min(wait + 2.0, 60.0))
                logger.warning(
                    "Rate limit aşıldı (deneme %d/%d). %.1f saniye bekleniyor...",
                    attempt,
                    max_retries,
                    wait,
                )
                time.sleep(wait)
            else:
                raise

    raise last_error  # type: ignore[misc]


def create_llm_with_fallback(
    model_chain: list[str],
    api_key: str,
    temperature: float = 0.1,
):
    """Fallback zinciriyle LLM oluştur.

    Model sırayla denenir. Rate limit hatasında bir sonraki modele geçer.

    Args:
        model_chain: Denenecek model adları listesi.
        api_key: Google API anahtarı.
        temperature: Model sıcaklığı.

    Returns:
        (llm, model_name) tuple — başarılı olan model ve adı.

    Raises:
        Tüm modeller başarısız olursa son exception.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    last_error = None

    for model_name in model_chain:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=temperature,
            )
            # Basit test çağrısı — modelin çalışıp çalışmadığını kontrol et
            from langchain_core.messages import HumanMessage
            test_response = llm.invoke([HumanMessage(content="1+1")])
            if test_response and test_response.content:
                logger.info("Model başarılı: %s", model_name)
                return llm, model_name
        except Exception as e:
            last_error = e
            if is_rate_limit_error(e):
                logger.warning(
                    "Model %s kota aşımı, bir sonraki deneniyor...",
                    model_name,
                )
                continue
            else:
                logger.warning(
                    "Model %s hatası: %s — bir sonraki deneniyor...",
                    model_name,
                    str(e)[:100],
                )
                continue

    raise RuntimeError(
        "Tüm AI modelleri kullanılamıyor. "
        "Google AI API kotanız dolmuş olabilir. "
        "Lütfen birkaç dakika bekleyip tekrar deneyin veya "
        "https://aistudio.google.com adresinden kota durumunuzu kontrol edin."
    ) from last_error
