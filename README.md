# 📊 FinBoard – Dynamic Financial Dashboard Builder

FinBoard is a fully customizable **financial analytics dashboard** that allows users to build real-time widgets using data from **Alpha Vantage**, **Finnhub**, and **IndianAPI**.  
Users can create **cards**, **tables**, and **charts** using live financial data — all without writing a single line of code.

This project demonstrates modular architecture, real-time fetching, and a highly flexible UI for building finance dashboards on the fly.

---

## 🌟 Features

### ✅ 1. Add Dashboard Widgets Easily
Through the *Add Widget Modal*, users can configure:

- **Widget Type** → Card / Table / Chart  
- **API URL** → Any allowed financial API  
- **Data Path** → Select using an interactive JSON Explorer  
- **Fields** → Map JSON values to widget fields  
- **Refresh Interval** → Live / 30s / 60s / custom  

---

### ✅ 2. Three Widget Types

#### 🟥 **Card Widgets**
Displays summary data such as:
- Current price  
- Volume  
- Open / High / Low  
- Daily changes  

Supports APIs like:  
- `Alpha Vantage TIME_SERIES_DAILY` *(recommended for card)*  
- `Finnhub /quote`  

---

#### 🟦 **Table Widgets**
Displays financial lists such as:
- US stock symbols  
- Trending stocks  
- Gainers / losers  
- Search results  

Supports:
- `Finnhub /stock/symbol`  
- `Alpha Vantage SYMBOL_SEARCH`  
- `IndianAPI /trending`  

---

#### 🟩 **Chart Widgets**
Displays line charts with:
- Daily price history  
- Time series  
- Snapshot-based trends  

Uses:
- `Alpha Vantage TIME_SERIES_DAILY` *(recommended for charts)*  
- Normalized custom data from IndianAPI  

Charts support:
- Dynamic X-axis and Y-axis selection  
- Data normalization  
- Multiple formats (currency, numbers, strings)

---

### ✅ 3. Built-in API Tester
Before adding a widget:
- Call the API  
- View formatted JSON  
- Explore nodes interactively  
- Choose the correct `dataPath`  
- Auto-generate available fields  

---

### ✅ 4. Unified Data Normalization Layer
All data passes through a custom `normalizeData()` function that intelligently handles:

- Alpha Vantage Time-Series  
- Finnhub Candle Data  
- Arrays of objects  
- Nested JSON  
- Single-object responses  

Ensures every widget receives **clean, consistent `list` and `single` formats**.


## 🛠 Tech Stack

| Layer | Technology |
|------|------------|
| Framework | Next.js (App Router) |
| UI | Tailwind CSS |
| Data Fetching | React Query |
| Charts | Recharts |
| APIs | Alpha Vantage, Finnhub, IndianAPI |
| State | LocalStorage + Custom Hooks |

---
