# TrafficWiz
Smart Traffic Analysis Project

## Overview
TrafficWIz is a group project designed to analyze traffic patterns in **Nashville, TN** using crash, congestion, and weather data. Our system combines SQL database design with Python data processing and visualization to provide meaningful insights for improving road safety and traffic flow.

## Features
- Database schema for city, segments, incidents, congestion, and weather
- SQL queries to retrieve crash and congestion patterns
- Python scripts for data cleaning, processing, and machine learning models
- Visualizations for traffic prediction and analysis

## Tech Stack
- **Database**: MySQL  
- **Backend**: Python  
- **Visualization**: Bokeh / Matplotlib  
- **Documentation**: Google Slides & GitHub

## Team Roles 
- Web & Frontend – Merhawit  
- Python ML Developer – Ben 
- Data Integration – Demeric 
- Documentation & Presentation – Hayder
- Database & SQL Analyst – Zelalem 

---
## TrafficWiz Setup installations

### Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

### Frontend
cd frontend/frontend
npm install
echo VITE_API_BASE_URL=http://127.0.0.1:8000 > .env
npm run dev

### Database
- Import schema.sql into MySQL
- Run seed_data.sql


