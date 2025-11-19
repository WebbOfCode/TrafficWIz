# TomTom API Integration Setup Guide

## Overview
TrafficWiz now includes TomTom API integration for real-time traffic data, route planning, and enhanced mapping capabilities.

## Getting Your TomTom API Key

### Step 1: Create TomTom Developer Account
1. Visit [TomTom Developer Portal](https://developer.tomtom.com/)
2. Click "Get Started" or "Sign Up"
3. Create an account with your email address
4. Verify your email address

### Step 2: Create an Application
1. Log into the [TomTom Developer Dashboard](https://developer.tomtom.com/user/me/apps)
2. Click "Create a new app"
3. Fill in the application details:
   - **App Name**: TrafficWiz
   - **Description**: Nashville traffic analysis application
   - **Category**: Navigation & Maps
4. Click "Create"

### Step 3: Get Your API Key
1. In your app dashboard, you'll see your API key
2. Copy the API key (it will look like: `abcd1234efgh5678ijkl9012mnop3456`)

## Configuration

### Backend Configuration
1. Navigate to `backend/` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` file and add your TomTom API key:
   ```env
   TOMTOM_API_KEY=your_actual_api_key_here
   ```

### Frontend Configuration
1. Open `frontend/src/config.js`
2. Replace the placeholder API key:
   ```javascript
   export const TOMTOM_CONFIG = {
     apiKey: "your_actual_api_key_here", // Replace this
     baseUrl: "https://api.tomtom.com",
     mapStyle: "main",
     version: "1"
   };
   ```

## TomTom Features Available

### 1. **Live Traffic Incidents**
- Real-time traffic incidents in Nashville area
- Severity levels (Low, Medium, High)
- Incident descriptions and locations
- Road closure information

### 2. **Traffic Flow Data**
- Current speed vs. free-flow speed
- Traffic congestion levels
- Travel time estimates
- Real-time updates

### 3. **Route Planning**
- Optimal route calculation
- Traffic-aware routing
- Distance and time estimates
- Traffic delay information

### 4. **Interactive Maps**
- TomTom Maps SDK integration
- Traffic layer visualization
- Incident markers
- Click-to-select locations

### 5. **Location Services**
- Address geocoding
- Reverse geocoding
- Location search
- Nashville-specific locations

## API Endpoints

The backend provides these TomTom-related endpoints:

- `GET /api/tomtom/status` - Check API configuration status
- `GET /api/tomtom/traffic-flow?lat={lat}&lon={lon}` - Get traffic flow data
- `GET /api/tomtom/traffic-incidents` - Get live traffic incidents
- `POST /api/tomtom/route` - Calculate optimal routes
- `GET /api/tomtom/geocode?address={address}` - Geocode addresses
- `GET /api/tomtom/nashville-overview` - Nashville traffic overview

## Testing the Integration

### 1. Check API Status
Visit: `http://localhost:5000/api/tomtom/status`

Expected response when configured:
```json
{
  "status": "ready",
  "message": "TomTom API is configured and ready",
  "service_available": true,
  "api_key_configured": true,
  "base_url": "https://api.tomtom.com"
}
```

### 2. Test Traffic Incidents
Visit: `http://localhost:5000/api/tomtom/traffic-incidents`

### 3. Frontend Testing
1. Start the frontend: `npm run dev`
2. Navigate to: `http://localhost:5174/tomtom`
3. You should see the TomTom Live Traffic page

## Troubleshooting

### "TomTom service not available"
- Check that the `services/tomtom_service.py` file exists
- Ensure `requests` library is installed: `pip install requests`

### "API key not configured"
- Verify your API key is set correctly in both backend and frontend
- Make sure there are no extra spaces or quotes
- Check that `.env` file is in the `backend/` directory

### "No incidents displayed"
- This is normal if there are currently no traffic incidents in Nashville
- Try expanding the bounding box or check a different time

### Map not loading
- Verify TomTom API key is set in `frontend/src/config.js`
- Check browser console for JavaScript errors
- Ensure internet connection for TomTom Maps SDK

## Rate Limits

TomTom API has the following rate limits for free accounts:
- **Traffic API**: 2,500 requests/day
- **Routing API**: 2,500 requests/day
- **Maps SDK**: Unlimited map loads
- **Search API**: 2,500 requests/day

## Next Steps

1. **Enhanced Mapping**: Add more map layers and controls
2. **Real-time Updates**: Implement WebSocket connections for live updates
3. **Historical Data**: Store and analyze traffic patterns over time
4. **Alerts**: Set up notifications for traffic incidents on specific routes
5. **Mobile App**: Extend to React Native for mobile access

## Support

For TomTom API issues:
- [TomTom Developer Documentation](https://developer.tomtom.com/maps-api/documentation)
- [TomTom Community Forum](https://developer.tomtom.com/forum)

For TrafficWiz integration issues:
- Check the console logs in both backend and frontend
- Verify API key configuration
- Test endpoints directly via browser or Postman