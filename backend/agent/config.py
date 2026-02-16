"""
Agent Konfigürasyonu
─────────────────────────────────────────────────────────────
LLM Provider: Google Gemini Flash (billing aktif — yüksek kota)
Yedek: Groq (rate limit durumunda fallback)
"""
import os
from dotenv import load_dotenv

# .env dosyasını yükle (backend/ dizininden)
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()

# ─── Google AI (Ana LLM Provider) ─────────────────────────────
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")
GOOGLE_MODEL_FALLBACK: str = os.getenv("GOOGLE_MODEL_FALLBACK", "gemini-2.0-flash")

# ─── Groq (Yedek) ────────────────────────────────────────────
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ─── LangSmith ──────────────────────────────────────────────
LANGSMITH_TRACING: str = os.getenv("LANGSMITH_TRACING", "true")
LANGSMITH_ENDPOINT: str = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
LANGSMITH_API_KEY: str = os.getenv("LANGSMITH_API_KEY", "")
LANGSMITH_PROJECT: str = os.getenv("LANGSMITH_PROJECT", "ayhanticaret")

# ─── Agent Ayarları ──────────────────────────────────────────
AGENT_TEMPERATURE: float = float(os.getenv("AGENT_TEMPERATURE", "0.1"))


def get_google_llm(model: str | None = None, temperature: float | None = None):
    """Google Gemini LLM instance döndür."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model=model or GOOGLE_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=temperature if temperature is not None else AGENT_TEMPERATURE,
    )


def get_groq_llm(model: str | None = None, temperature: float | None = None):
    """Groq LLM instance döndür (yedek)."""
    from langchain_groq import ChatGroq
    return ChatGroq(
        model=model or GROQ_MODEL,
        api_key=GROQ_API_KEY,
        temperature=temperature if temperature is not None else AGENT_TEMPERATURE,
    )


def configure_langsmith() -> None:
    """LangSmith environment değişkenlerini aktif et."""
    os.environ["LANGSMITH_TRACING"] = LANGSMITH_TRACING
    os.environ["LANGSMITH_ENDPOINT"] = LANGSMITH_ENDPOINT
    os.environ["LANGSMITH_PROJECT"] = LANGSMITH_PROJECT
    if LANGSMITH_API_KEY:
        os.environ["LANGSMITH_API_KEY"] = LANGSMITH_API_KEY
    if GOOGLE_API_KEY:
        os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY


def validate_config() -> list[str]:
    """Gerekli konfigürasyon değerlerini kontrol et."""
    issues: list[str] = []
    if not GOOGLE_API_KEY or GOOGLE_API_KEY == "your_google_api_key_here":
        issues.append("GOOGLE_API_KEY ayarlanmamış")
    if not LANGSMITH_API_KEY:
        issues.append("LANGSMITH_API_KEY ayarlanmamış (tracing çalışmaz)")
    return issues
