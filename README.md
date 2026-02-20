# Industrial Kitchen Equipment Management System

A full-stack business management platform built for **second-hand industrial kitchen equipment** dealers. Manage inventory, track finances, analyze products with AI, and monitor market prices — all from a single, mobile-first dashboard.

> **Built with:** Next.js 14 · FastAPI · MongoDB Atlas · Google Gemini AI · TailwindCSS

---

## Features

### Core Business Management
- **Product Management** — Add, edit, track, and sell products with image uploads (Cloudinary)
- **Category System** — 20+ pre-configured industrial kitchen categories with dynamic spec fields
- **Inventory Dashboard** — Real-time stock status, category/material breakdowns, daily activity logs
- **Finance Tracking** — Income/expense records, transaction history, profit/loss summaries
- **Supplier Management** — Keep track of your suppliers with contact info and notes
- **Calendar & Reminders** — Daily activity feed, monthly summaries, notes and reminders
- **Price Ranges** — Market price references for buying and selling decisions

### AI-Powered Features
- **AI Product Analysis** — Describe a product via text or voice, and AI auto-fills the product form (powered by Google Gemini)
- **Voice-to-Text** — Record voice descriptions that get transcribed and analyzed (Groq Whisper)
- **AI Price Research** — Automated market price scanning using browser automation agents
- **Marketplace Search** — Search and compare prices across online marketplaces

### Technical Highlights
- **Mobile-first responsive design** — Works seamlessly on phone, tablet, and desktop
- **Single LLM call architecture** — Efficient AI pipeline that minimizes API costs
- **Auto-retry with model fallback** — Rate limit handling with automatic fallback models
- **Next.js API proxy** — Secure backend communication without exposing API endpoints
- **Real-time data** — React Query for optimistic updates and cache management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, Radix UI, React Query, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 |
| **Database** | MongoDB Atlas (PyMongo) |
| **AI / LLM** | Google Gemini 2.5 Flash, Groq Whisper, LangChain |
| **Image Storage** | Cloudinary |
| **Browser Automation** | Playwright, browser-use |
| **Monitoring** | LangSmith (optional) |

---

## Project Structure

```
├── backend/
│   ├── agent/              # AI product analysis pipeline
│   │   ├── agent.py        # Direct Pipeline (single LLM call)
│   │   ├── config.py       # API key & model configuration
│   │   ├── retry.py        # Rate limit retry & fallback
│   │   └── tools/          # Field mapping, validation, multimodal
│   ├── api/                # FastAPI route handlers
│   │   ├── products.py     # Product CRUD + image upload
│   │   ├── categories.py   # Category management + seeding
│   │   ├── inventory.py    # Stock summaries & analytics
│   │   ├── finance.py      # Income/expense tracking
│   │   ├── ai_agent.py     # AI analysis & transcription
│   │   ├── price_scraper.py    # AI price research
│   │   ├── marketplace_search.py # Marketplace comparison
│   │   └── ...             # calendar, notes, suppliers, etc.
│   ├── database.py         # MongoDB connection & helpers
│   ├── models.py           # Pydantic data models
│   ├── main.py             # FastAPI application entry point
│   └── requirements.txt
├── frontend/
│   ├── app/                # Next.js pages (App Router)
│   │   ├── products/       # Product list, add, edit
│   │   ├── categories/     # Category management
│   │   ├── inventory/      # Stock dashboard
│   │   ├── finance/        # Financial overview
│   │   ├── calendar/       # Daily/monthly activity
│   │   ├── suppliers/      # Supplier directory
│   │   ├── notes/          # Notes & reminders
│   │   ├── price-ranges/   # Market price references
│   │   └── api/            # Next.js API proxy to backend
│   ├── components/         # Shared UI components
│   ├── lib/                # API client, hooks, templates
│   └── package.json
├── docs/                   # Documentation (Turkish)
├── start.bat               # One-click Windows launcher
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python** 3.11 or 3.12
- **Node.js** 18+
- **MongoDB Atlas** account (free tier works perfectly) — [cloud.mongodb.com](https://cloud.mongodb.com)

### 1. Clone the repository

```bash
git clone https://github.com/bilalaltundag/ayhanticaret_app.git
cd ayhanticaret_app
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

**Required services** (all have generous free tiers):

| Service | Purpose | Get API Key |
|---------|---------|-------------|
| MongoDB Atlas | Database | [cloud.mongodb.com](https://cloud.mongodb.com) |
| Cloudinary | Image storage | [cloudinary.com](https://cloudinary.com/users/register_free) |
| Google AI Studio | Product analysis | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | Voice transcription | [console.groq.com/keys](https://console.groq.com/keys) |
| LangSmith | AI monitoring (optional) | [smith.langchain.com](https://smith.langchain.com) |

### 3. Backend setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

Backend runs at **http://localhost:8000** — API docs at **http://localhost:8000/docs**

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 5. Quick start (Windows)

On Windows, you can start everything with a single command:

```powershell
start.bat
```

This installs dependencies (if needed), starts both servers, and opens the browser.

---

## Customization

This system is designed to be easily customized for your own business:

1. **Categories** — Edit category names and product types in `backend/api/categories.py` or through the UI
2. **Spec Fields** — Each category has configurable specification fields (dimensions, materials, energy type, etc.)
3. **Business Name** — Update the title in `frontend/app/layout.tsx` and `frontend/components/Navigation.tsx`
4. **Language** — UI is in Turkish; text strings are in component files for easy translation

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/products` | Product CRUD |
| `GET/POST` | `/api/categories` | Category management |
| `GET` | `/api/inventory/summary` | Stock overview |
| `GET/POST` | `/api/finance/transactions` | Financial records |
| `GET/POST` | `/api/suppliers` | Supplier directory |
| `GET/POST` | `/api/notes` | Notes & reminders |
| `POST` | `/api/ai/analyze` | AI product analysis (text + image) |
| `POST` | `/api/ai/transcribe` | Voice → text transcription |
| `GET/POST` | `/api/price-ranges` | Market price references |

Full interactive API documentation available at `/docs` when backend is running.

---

## Remote Access (Optional)

To access the app from your phone or share with others, you can use [ngrok](https://ngrok.com):

```bash
# Backend tunnel
ngrok http 8000

# Frontend tunnel (separate terminal)
ngrok http 3000
```

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Next.js    │────▶│   FastAPI    │
│  (Mobile /   │     │  Frontend    │     │   Backend    │
│   Desktop)   │◀────│  + API Proxy │◀────│              │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                │
                         ┌──────────────────────┼──────────────┐
                         │                      │              │
                    ┌────▼─────┐      ┌────────▼───┐   ┌─────▼──────┐
                    │ MongoDB  │      │  Gemini AI │   │ Cloudinary │
                    │  Atlas   │      │  + Groq    │   │  (Images)  │
                    └──────────┘      └────────────┘   └────────────┘
```

---

## License

This project is open for personal and commercial use. Built by [Bilal Altundag](https://github.com/bilalaltundag).
