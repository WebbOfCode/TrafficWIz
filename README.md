# TrafficWiz
Smart Traffic Analysis & Prediction System

## Overview
TrafficWiz is a full-stack web application for analyzing and predicting traffic patterns in **Nashville, TN**. The system combines real-time weather data, incident tracking, machine learning predictions, and interactive visualizations to provide actionable insights for road safety and traffic management.

## ⚡ Quick Start

**New to TrafficWiz? Start here:**

📖 **[Complete Setup Guide](SETUP.md)** - First-time installation instructions

### Prerequisites
- MySQL 8.0+ (must be installed and running)
- Python 3.8+
- Node.js 18+

### Fast Setup (Windows)
1. Set up MySQL database (see [SETUP.md](SETUP.md) Step 2)
2. Configure `backend/.env` (copy from `.env.example`)
3. Run: `start.bat`
4. Open: http://localhost:5173

---

## Features
- 📊 **Real-time Dashboard** - Traffic incident summary with sorting and filtering
- 🗺️ **Live Weather Integration** - Current conditions from National Weather Service
- 🎯 **Risk Analysis** - Visual breakdown of incident severity and patterns
- 🤖 **Machine Learning** - Traffic prediction model with metrics display
- 📍 **Interactive Maps** - Mapbox integration for geographic visualization
- 🔍 **Searchable Incidents** - Filter and view detailed incident reports

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS, Recharts
- **Backend**: Flask (Python), MySQL, CORS-enabled REST API
- **ML**: scikit-learn, pandas, joblib (RandomForest model)
- **APIs**: National Weather Service, Mapbox (optional)
- **Database**: MySQL

## Team Roles 
- Web & Frontend – Merhawit  
- Python ML Developer – Ben 
- Data Integration – Demarick
- Documentation & Presentation – Hayder
- Database & SQL Analyst – Zelalem 

---

## Documentation

📚 **[Architecture & API Docs](docs/README.md)** - Detailed technical documentation  
🔧 **[File Headers Guide](HEADERS_ADDED.md)** - Code documentation summary  
⚙️ **[Setup Guide](SETUP.md)** - Installation and configuration  

---

## Database Setup

TrafficWiz uses MySQL:

```bash
# Create database and user
mysql -u root -p
CREATE DATABASE trafficwiz;
CREATE USER 'trafficwiz_user'@'localhost' IDENTIFIED BY 'StrongPass123!';
GRANT ALL PRIVILEGES ON trafficwiz.* TO 'trafficwiz_user'@'localhost';
EXIT;

# Import schema
mysql -u trafficwiz_user -p trafficwiz < db/schema.sql
```

---

## Quick Start

Simply double-click `start.bat` or run from command prompt:
```batch
start.bat
```

---
