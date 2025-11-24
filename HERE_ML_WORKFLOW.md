# HERE API Integration & ML Training Workflow

## Overview

TrafficWiz now fetches real-time traffic incident data from HERE Maps API, stores it in the database, displays it in the Dashboard and Incidents pages, and uses it to train ML models for traffic prediction.

## System Architecture

```
HERE API → Data Collector → Database → Dashboard/Incidents
                                ↓
                          ML Training → Predictions
```

## Components

### 1. HERE API Data Collector (`backend/services/here_data_collector.py`)

**Purpose**: Continuously fetches live traffic incidents from HERE API and stores them in the database.

**Features**:
- Fetches incidents for Nashville area (configurable bounding box)
- Deduplicates incidents to avoid storing the same incident twice
- Maps HERE severity levels to database ENUM ('Low', 'Medium', 'High')
- Stores incident metadata: type, location (lat/lon), description, HERE ID

**Usage**:

```bash
# Run continuously (fetches every 10 minutes)
python backend/services/here_data_collector.py

# Run once and exit
python backend/services/here_data_collector.py --once

# Run with custom interval (e.g., every 5 minutes)
python backend/services/here_data_collector.py --interval 5
```

**Configuration**:
- Edit `NASHVILLE_BBOX` in the script to change coverage area
- Set `HERE_API_KEY` in `.env` file
- Database credentials in `.env` file

### 2. Database Schema

**traffic_incidents** table stores both seed data and HERE API data:

Core columns:
- `id`: Auto-increment primary key
- `date`: Incident timestamp
- `location`: Location string (lat,lon or address)
- `severity`: ENUM('Low', 'Medium', 'High')
- `description`: Incident description

Extended columns (for HERE API):
- `incident_type`: Type of incident (e.g., ACCIDENT, CONSTRUCTION)
- `latitude`: Decimal latitude
- `longitude`: Decimal longitude
- `here_id`: HERE API incident ID (for deduplication)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

**Migration**: Run `db/migration_here_support.sql` in MySQL Workbench to add extended columns if needed.

### 3. Frontend Display

**Dashboard** (`frontend/src/Pages/Dashboard.jsx`):
- Fetches from `/api/traffic` endpoint
- Shows incident counts by severity
- Displays sortable/filterable incident table
- Auto-refreshes every 2 minutes

**Incidents Page** (`frontend/src/Pages/Incidents.jsx`):
- Lists all incidents from database
- Real-time search/filter functionality
- Clickable cards link to incident details

### 4. ML Training Pipeline

**Export Training Data** (`backend/ml/export_training_data.py`):

Exports database incidents to `traffic_data.csv` with ML-ready features:
- Datetime features (hour, day_of_week, month, year)
- Location features (latitude, longitude, road name)
- Categorical features (severity, incident_type, is_weekend, is_rush_hour)

```bash
python backend/ml/export_training_data.py
```

**Train Model** (`backend/ml/train_model.py`):

Trains ML model using incident data from database:
- Fetches incidents directly from MySQL
- Extracts time-based patterns
- Analyzes risk by location and time of day
- Generates predictions for best/worst travel times

```bash
python backend/ml/train_model.py
```

**Outputs**:
- `model.pkl`: Trained model for risk prediction
- `metrics.json`: Performance metrics & travel time analysis
- `road_analysis.json`: Per-road recommendations

## Complete Workflow

### Step 1: Start Data Collection

```bash
# Terminal 1: Start HERE data collector
cd backend/services
python here_data_collector.py --interval 10
```

This will fetch new incidents every 10 minutes and store them in the database.

### Step 2: Start Backend Server

```bash
# Terminal 2: Start Flask backend
cd backend
python app.py
```

Backend serves data to frontend via REST API.

### Step 3: Start Frontend

```bash
# Terminal 3: Start Vite dev server
cd frontend
npm run dev
```

Access application at `http://localhost:5173`

### Step 4: Train ML Model (Periodic)

Once you have collected sufficient data (recommendation: at least 100-200 incidents):

```bash
# Export data
cd backend/ml
python export_training_data.py

# Train model
python train_model.py
```

### Step 5: Use Predictions   

The trained model can predict traffic risk for:
- Specific roads at specific times
- Rush hour vs non-rush hour patterns
- Weekend vs weekday patterns

Access predictions via:
- `/predict` endpoint (POST with location/time)
- `/metrics` endpoint (GET model performance)

## Environment Variables

Create `.env` file in `backend/` directory:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=trafficwiz_user
DB_PASSWORD=StrongPass123!
DB_NAME=trafficwiz

# HERE API
HERE_API_KEY=your_here_api_key_here
```

## API Endpoints

### Backend Endpoints

**Traffic Data**:
- `GET /api/traffic` - List all incidents (paginated, 100 limit)
- `GET /api/traffic/<id>` - Get single incident details
- `GET /api/health` - Database health check

**HERE API Proxies**:
- `GET /api/here/traffic-incidents` - Live HERE incidents
- `GET /api/here/traffic-flow` - Real-time traffic flow
- `POST /api/here/route` - Route calculation
- `GET /api/here/geocode` - Address geocoding

**ML Predictions**:
- `POST /predict` - Predict traffic risk
- `GET /metrics` - Model performance metrics
- `POST /retrain` - Trigger model retraining

## Troubleshooting

### No data showing in Dashboard

1. Check if Flask backend is running (`http://127.0.0.1:5000/api/health`)
2. Check if database has data: `SELECT COUNT(*) FROM traffic_incidents;`
3. Check browser console for errors
4. Verify `/api/traffic` endpoint returns data

### Data collector not saving incidents

1. Verify HERE API key is correct and active
2. Check database connection in `.env`
3. Run with `--once` flag to see error messages
4. Check if there are live incidents in Nashville area

### ML training fails

1. Ensure database has at least 50+ incidents
2. Check database connection
3. Run `export_training_data.py` first to verify data export
4. Check for missing Python packages: `pip install -r requirements.txt`

## Production Deployment

### Recommendations

1. **Data Collector**: Run as background service/daemon
   - Use systemd (Linux) or Windows Service
   - Set reasonable interval (5-15 minutes)
   - Monitor logs for API errors

2. **Backend**: Deploy with production WSGI server
   - Use gunicorn (Linux) or waitress (Windows)
   - Set up proper logging
   - Configure CORS for production domain

3. **Database**: 
   - Set up automated backups
   - Add indexes for performance
   - Monitor disk space

4. **ML Model**:
   - Retrain weekly or monthly
   - Version control model files
   - Monitor prediction accuracy

5. **Frontend**:
   - Build for production: `npm run build`
   - Serve with nginx or similar
   - Update `API_BASE` in config.js

## Data Flow Diagram

```
┌──────────────┐
│  HERE API    │
└──────┬───────┘
       │ HTTP
       ↓
┌──────────────────────┐
│  Data Collector      │
│  (Python Service)    │
└──────┬───────────────┘
       │ INSERT
       ↓
┌──────────────────────┐
│  MySQL Database      │
│  traffic_incidents   │
└──────┬───────────────┘
       │ SELECT
       ├────────────────────┐
       ↓                    ↓
┌──────────────┐    ┌──────────────┐
│  Flask API   │    │  ML Training │
│  /api/traffic│    │  train_model │
└──────┬───────┘    └──────┬───────┘
       │ JSON              │
       ↓                   ↓
┌──────────────┐    ┌──────────────┐
│  React App   │    │  model.pkl   │
│  Dashboard   │    │  Predictions │
└──────────────┘    └──────────────┘
```

## Next Steps

1. ✅ Set up automated data collection
2. ✅ Populate database with HERE API data
3. ✅ Verify Dashboard shows real data
4. ⏳ Collect data for 1-2 weeks
5. ⏳ Train ML model with real incident patterns
6. ⏳ Integrate predictions into UI
7. ⏳ Deploy to production

## Support

For issues or questions:
1. Check logs in backend terminal
2. Review browser console for frontend errors
3. Verify database connectivity
4. Ensure HERE API key is active

