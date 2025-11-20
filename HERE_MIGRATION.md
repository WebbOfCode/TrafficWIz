# HERE Maps Migration Guide

TrafficWiz has been successfully migrated from TomTom to HERE Maps API!

## 🎉 What Changed

### Backend Updates
- ✅ Created `backend/services/here_service.py` - Complete HERE Maps API wrapper
- ✅ Updated `backend/app.py` - All endpoints now use HERE service
  - `/api/here/traffic-flow` - Real-time traffic flow data
  - `/api/here/traffic-incidents` - Live traffic incidents
  - `/api/here/route` - Route calculation with traffic
  - `/api/here/geocode` - Address geocoding
  - `/api/here/nashville-overview` - Nashville traffic overview
  - `/api/here/ml/risk-assessment` - ML-based risk predictions
  - `/api/here/ml/prediction-features` - Traffic features for ML
- ✅ Renamed `backend/ml/tomtom_ml_integration.py` → `here_ml_integration.py`
- ✅ Updated ML integration to use HERE data

### Frontend Updates
- ✅ Created `frontend/src/components/HereMap.jsx` - Interactive HERE Maps component
- ✅ Created `frontend/src/Pages/HereTraffic.jsx` - Live traffic dashboard page
- ✅ Updated `frontend/src/config.js` - HERE API configuration
- ✅ Updated `frontend/src/api.js` - All API calls now use HERE endpoints
- ✅ Updated `frontend/src/App.jsx` - Routes now use HereTraffic component

## 🔑 Get Your HERE API Key

1. Go to **https://platform.here.com/**
2. Click "Sign Up" for FREE account
3. Create a new project
4. Generate an API key
5. **Important:** Enable these APIs for your key:
   - Maps API
   - Traffic API
   - Routing API
   - Geocoding & Search API

## ⚙️ Configuration

### Backend Setup
1. Open `backend/app.py`
2. Find line with `HERE_API_KEY = os.getenv("HERE_API_KEY", "")`
3. Add your API key:
   ```python
   HERE_API_KEY = os.getenv("HERE_API_KEY", "YOUR_HERE_API_KEY_HERE")
   ```

### Frontend Setup
1. Open `frontend/src/config.js`
2. Find the `HERE_CONFIG` section
3. Add your API key:
   ```javascript
   export const HERE_CONFIG = {
     apiKey: "YOUR_HERE_API_KEY_HERE",
     baseUrl: "https://api.here.com"
   };
   ```

## 🚀 Run TrafficWiz

### Start Backend
```bash
cd backend
python app.py
```
Backend will run on http://localhost:5000

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

## 🧪 Test the Integration

1. Open http://localhost:5173
2. Click "Live Traffic" in the navigation
3. You should see:
   - ✅ Interactive HERE Maps with traffic layer
   - ✅ Live traffic incidents displayed on map
   - ✅ Incident list in sidebar
   - ✅ Route planner functionality
   - ✅ Location search

## 🎯 HERE Maps Benefits

### vs TomTom
- **250,000 free transactions/month** (vs TomTom's problematic limits)
- **No authorization issues** - API keys work immediately
- **Better documentation** - Clear API references
- **More reliable** - Enterprise-grade service
- **Excellent US coverage** - Great for Nashville data

### Features Available
- Real-time traffic flow visualization
- Live incident reporting (accidents, construction, hazards)
- Traffic-aware route planning
- Address geocoding and search
- Historical traffic patterns
- ML integration for predictions

## 📊 API Endpoints Reference

### Traffic Flow
```javascript
GET /api/here/traffic-flow?lat=36.1627&lon=-86.7816&radius=5000
```

### Traffic Incidents
```javascript
// By bounding box
GET /api/here/traffic-incidents?bbox=-87.0,36.0,-86.5,36.4

// By center point + radius
GET /api/here/traffic-incidents?lat=36.1627&lon=-86.7816&radius=10000
```

### Route Calculation
```javascript
POST /api/here/route
Body: {
  "start": {"lat": 36.1627, "lon": -86.7816},
  "end": {"lat": 36.1800, "lon": -86.7500},
  "departure_time": "2025-11-20T14:30:00" // optional
}
```

### Geocoding
```javascript
GET /api/here/geocode?address=Broadway%20Nashville%20TN
```

### Nashville Overview
```javascript
GET /api/here/nashville-overview
```

## 🔧 Troubleshooting

### Map Not Loading
- ✅ Check that HERE API key is set in `frontend/src/config.js`
- ✅ Verify API key is enabled for "Maps API" in HERE dashboard
- ✅ Check browser console for error messages

### No Traffic Data
- ✅ Confirm API key is set in `backend/app.py`
- ✅ Verify "Traffic API" is enabled in HERE dashboard
- ✅ Check backend terminal for error logs
- ✅ Test endpoint directly: http://localhost:5000/api/here/nashville-overview

### 403 Errors
- ✅ Make sure you copied the full API key (no spaces)
- ✅ Check that required APIs are enabled in HERE dashboard
- ✅ Wait 5-10 minutes after enabling APIs (propagation time)

### Route Planning Not Working
- ✅ Verify "Routing API" is enabled
- ✅ Check that addresses are valid Nashville locations
- ✅ Look for errors in browser console

## 📈 Next Steps

1. **Get API Key** - Sign up at https://platform.here.com/
2. **Configure Keys** - Add to both backend and frontend
3. **Test Integration** - Run servers and check Live Traffic page
4. **Explore Features** - Try route planning, incident viewing
5. **ML Integration** - Use HERE data for traffic predictions

## 💡 Tips

- HERE's free tier resets monthly (250k transactions)
- 1 map load = 1 transaction
- 1 API call = 1 transaction
- Monitor usage at https://platform.here.com/admin/dashboard
- Enable only APIs you need to conserve quota

## 🆘 Support

If you encounter issues:
1. Check HERE documentation: https://developer.here.com/documentation
2. Review browser console for errors
3. Check backend terminal logs
4. Verify API key permissions in HERE dashboard

---

**Migration Complete!** 🎊

You're now using HERE Maps instead of TomTom. Enjoy the better free tier and reliable API access!
