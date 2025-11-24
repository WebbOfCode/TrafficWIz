# TrafficWiz Frontend Technical Documentation

> **Comprehensive guide to the React frontend architecture, pages, components, and data flow**  
> Last updated: November 24, 2025

---

## 📁 1. Project Structure Overview

### Files Found in `frontend/`

**Root Configuration:**
- `vite.config.js` - Vite build configuration
- `tailwind.config.cjs` - Tailwind CSS theme and utility classes
- `postcss.config.cjs` - PostCSS configuration for Tailwind
- `package.json` - Dependencies and scripts
- `index.html` - HTML entry point

**Source Files (`src/`):**
- **Entry Point**: `main.jsx` - React app initialization
- **Root Component**: `App.jsx` - Router setup and global layout
- **API Layer**: `api.js` - All backend API calls
- **Config**: `config.js` - Backend URL configuration
- **Styles**: `index.css` - Global styles and Tailwind imports

**Pages (`src/Pages/`):**
- `Home.jsx` - Landing page with weather and map preview
- `Dashboard.jsx` - Incident summary cards and data table
- `Incidents.jsx` - Searchable list of all incidents
- `IncidentDetail.jsx` - Single incident detail view
- `Risk.jsx` - ML-powered risk analysis and travel recommendations
- `Routes.jsx` - Weather-aware route planning
- `HereTraffic.jsx` - Live traffic data from HERE Maps API

**Components (`src/components/`):**
- `SimpleHereMap.jsx` - OpenStreetMap iframe with incident overlay
- `HereMap.jsx` - (Additional map component)

---

### Routing Setup

TrafficWiz uses **React Router v6** for client-side routing. All routes are defined in `App.jsx`:

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes as RouterRoutes, Route, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      {/* Global navigation bar */}
      <nav className="bg-black/80 text-white px-6 py-3 flex justify-between items-center shadow-lg border-b border-violet-700">
        <Link to="/" className="flex items-center space-x-3">
          <img src="/trafficwiz-logo.png" alt="TrafficWiz Logo" className="w-10 h-10 rounded-full border border-violet-500" />
          <h1 className="text-xl font-bold text-violet-400">TrafficWiz</h1>
        </Link>

        <div className="flex items-center space-x-6 font-medium">
          <Link to="/dashboard" className="hover:text-violet-400">Dashboard</Link>
          <Link to="/incidents" className="hover:text-violet-400">Incidents</Link>
          <Link to="/risk" className="hover:text-violet-400">Risk</Link>
          <Link to="/routes" className="hover:text-violet-400">Routes</Link>
          <Link to="/traffic" className="hover:text-violet-400">Live Traffic</Link>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-grow p-6">
        <RouterRoutes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/routes" element={<Routes />} />
          <Route path="/traffic" element={<HereTraffic />} />
        </RouterRoutes>
      </main>

      <footer className="bg-black/80 text-gray-400 text-center py-3 border-t border-violet-700">
        © 2025 <span className="text-violet-400">TrafficWiz</span> — Nashville Analytics
      </footer>
    </Router>
  );
}
```

**Key Routing Features:**
- **Nested Routes**: `/incidents/:id` for dynamic incident details
- **Global Layout**: Navigation bar and footer persist across all pages
- **Declarative Navigation**: Uses `<Link>` components for SPA navigation

---

### State Management

TrafficWiz uses **local component state** with React hooks. There's no global state management library (no Redux, Zustand, etc.).

**State Management Pattern:**
- Each page manages its own data with `useState`
- Data fetching handled with `useEffect`
- API calls centralized in `src/api.js`
- Props passed down for shared components (e.g., map center coordinates)

---

### Global Providers

The app has **minimal global providers** - just React Router:

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**What's Happening:**
- `StrictMode` - Enables React development warnings and checks
- `App` component wrapped by `<Router>` internally
- No theme providers, query clients, or context providers

---

## 📊 2. Dashboard Page – Detailed Explanation

**File:** `src/Pages/Dashboard.jsx`

### What It Does

The Dashboard displays:
1. **Three severity summary cards** (High, Medium, Low incident counts)
2. **Filtering dropdown** (filter by severity)
3. **Sorting dropdown** (sort by date or severity)
4. **Data table** showing 500 most recent incidents

### Data Flow

```jsx
// Fetches incident data from backend
useEffect(() => {
  async function fetchTrafficData() {
    try {
      const data = await getTraffic(); // Calls /api/traffic?limit=500
      console.debug("Dashboard fetched traffic incidents =>", data);
      setTraffic(data || []);
    } catch (error) {
      console.error("Error fetching traffic:", error);
      setTraffic([]);
    } finally {
      setLoading(false);
    }
  }

  fetchTrafficData();
  
  // Auto-refresh every 2 minutes
  const refreshInterval = setInterval(fetchTrafficData, 120000);
  return () => clearInterval(refreshInterval);
}, []);
```

**API Endpoint:** `GET /api/traffic?limit=500`  
**Response Format:**
```json
[
  {
    "id": 6039,
    "date": "2025-11-24T13:00:00",
    "location": "I-24 near 21st Ave S",
    "severity": "Low",
    "description": "Backed-up traffic. Approach with care"
  },
  ...
]
```

---

### State Variables

```jsx
const [traffic, setTraffic] = useState([]);           // Raw incident data from API
const [loading, setLoading] = useState(true);          // Loading state
const [sortBy, setSortBy] = useState("date_desc");     // Current sort option
const [severityFilter, setSeverityFilter] = useState("all"); // Current filter
```

---

### Data Normalization & Transformation

**Problem Solved:** Backend returns severity as `"High"`, `"Medium"`, or `"Low"`, but we need case-insensitive matching.

```jsx
// Normalize severity to lowercase for consistent matching
const normalizeSeverity = (severity) => {
  if (!severity) return "low";
  return String(severity).trim().toLowerCase();
};

// Count incidents by severity with normalized matching
const highCount = traffic.filter((t) => normalizeSeverity(t.severity) === "high").length;
const mediumCount = traffic.filter((t) => normalizeSeverity(t.severity) === "medium").length;
const lowCount = traffic.filter((t) => normalizeSeverity(t.severity) === "low").length;
```

**Debug Logging in Development:**
```jsx
if (process.env.NODE_ENV === 'development' && traffic.length > 0) {
  const severityCounts = traffic.reduce((acc, t) => {
    const normalized = normalizeSeverity(t.severity);
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {});
  console.debug('[Dashboard] Severity distribution:', severityCounts);
  
  // Warn about unknown severities
  const unknownSeverities = traffic.filter(t => {
    const norm = normalizeSeverity(t.severity);
    return norm !== 'high' && norm !== 'medium' && norm !== 'low';
  });
  if (unknownSeverities.length > 0) {
    console.warn('[Dashboard] Found incidents with unknown severity:', 
      unknownSeverities.map(t => ({ id: t.id, severity: t.severity }))
    );
  }
}
```

---

### Filtering Logic

```jsx
// Apply severity filter with normalized matching
const filteredIncidents = severityFilter === "all" 
  ? traffic 
  : traffic.filter(t => normalizeSeverity(t.severity) === severityFilter);
```

---

### Sorting Logic

```jsx
// Helper to convert severity string to numeric rank for sorting
const getSeverityRank = (severity) => {
  const normalized = normalizeSeverity(severity);
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  if (normalized === "low") return 1;
  return 0; // Unknown severity gets lowest rank
};

// Apply sorting
const sortedIncidents = [...filteredIncidents].sort((a, b) => {
  if (sortBy === "date_desc") {
    return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
  }
  if (sortBy === "date_asc") {
    return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0);
  }
  if (sortBy === "severity_desc") {
    return getSeverityRank(b.severity) - getSeverityRank(a.severity);
  }
  if (sortBy === "severity_asc") {
    return getSeverityRank(a.severity) - getSeverityRank(b.severity);
  }
  return 0;
});
```

---

### UI Structure

**Summary Cards:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  {/* High Severity Card */}
  <div className="card border-l-4 border-red-500 p-4">
    <h3 className="text-lg font-semibold text-gray-300">High Severity</h3>
    <p className="text-3xl font-bold text-red-400">{highCount}</p>
  </div>
  
  {/* Medium Severity Card */}
  <div className="card border-l-4 border-yellow-400 p-4">
    <h3 className="text-lg font-semibold text-gray-300">Medium Severity</h3>
    <p className="text-3xl font-bold text-yellow-400">{mediumCount}</p>
  </div>
  
  {/* Low Severity Card */}
  <div className="card border-l-4 border-green-400 p-4">
    <h3 className="text-lg font-semibold text-gray-300">Low Severity</h3>
    <p className="text-3xl font-bold text-green-400">{lowCount}</p>
  </div>
</div>
```

**Filters & Controls:**
```jsx
<div className="flex items-center justify-between mb-4">
  <div className="text-sm text-gray-300">Showing {traffic.length} incidents</div>
  <div className="flex items-center space-x-4">
    {/* Severity Filter */}
    <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
      <option value="all">All</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>

    {/* Sort Dropdown */}
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
      <option value="date_desc">Date: Recent</option>
      <option value="date_asc">Date: Oldest</option>
      <option value="severity_desc">Severity (High → Low)</option>
      <option value="severity_asc">Severity (Low → High)</option>
    </select>
  </div>
</div>
```

**Data Table:**
```jsx
<table className="min-w-full border border-violet-700">
  <thead className="bg-black/40">
    <tr>
      <th className="px-4 py-2 border border-violet-700">Date</th>
      <th className="px-4 py-2 border border-violet-700">Location</th>
      <th className="px-4 py-2 border border-violet-700">Severity</th>
      <th className="px-4 py-2 border border-violet-700">Description</th>
    </tr>
  </thead>
  <tbody>
    {sortedIncidents.map((incident) => {
      const normalizedSeverity = normalizeSeverity(incident.severity);
      return (
        <tr key={incident.id} className="hover:bg-violet-900/40">
          <td className="border border-violet-800 px-3 py-2">
            {incident.date ? new Date(incident.date).toLocaleDateString() : "Unknown"}
          </td>
          <td className="border border-violet-800 px-3 py-2">
            {incident.location || "Unknown"}
          </td>
          <td className={`border border-violet-800 px-3 py-2 font-semibold ${
              normalizedSeverity === "high" ? "text-red-400" :
              normalizedSeverity === "medium" ? "text-yellow-400" :
              "text-green-400"
            }`}>
            {incident.severity || "N/A"}
          </td>
          <td className="border border-violet-800 px-3 py-2 text-gray-300">
            {incident.description || "—"}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

---

## 🔍 3. Incidents Page – Detailed Explanation

**File:** `src/Pages/Incidents.jsx`

### What It Does

The Incidents page provides:
1. **Search bar** to filter incidents by location, description, or type
2. **Clickable incident cards** that navigate to detail view
3. **Auto-refresh** every 2 minutes
4. **Severity color coding** (red/yellow/green)

### Data Fetching

```jsx
useEffect(() => {
  async function fetchIncidents() {
    try {
      const data = await getTraffic(); // Same endpoint as Dashboard
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  }
  
  fetchIncidents();
  
  // Refresh every 2 minutes
  const refreshInterval = setInterval(fetchIncidents, 120000);
  return () => clearInterval(refreshInterval);
}, []);
```

---

### Search/Filter Logic

```jsx
const [searchQuery, setSearchQuery] = useState("");

// Filter incidents by search query (case-insensitive, searches location, description, type)
const filteredIncidents = incidents.filter((incident) =>
  (incident.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
  (incident.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
  (incident.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
);
```

**Search Input:**
```jsx
<input
  type="text"
  placeholder="Search by location..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="border border-violet-700 bg-black/60 text-white rounded px-3 py-2 mb-4 w-full"
/>
```

---

### Incident Cards with Navigation

Each incident is a clickable card that navigates to `/incidents/:id`:

```jsx
{filteredIncidents.map((incident) => (
  <Link
    key={incident.id}
    to={`/incidents/${incident.id}`}
    className="card p-4 hover:bg-violet-900/40 transition block"
  >
    <div className="flex justify-between">
      <span className="font-semibold">{incident.location}</span>
      <span className={`font-bold ${
          incident.severity === "High" ? "text-red-400" :
          incident.severity === "Medium" ? "text-yellow-400" :
          "text-green-400"
        }`}>
        {incident.severity}
      </span>
    </div>
    <p className="text-sm text-gray-300 mt-1 truncate">{incident.description}</p>
    <div className="text-xs text-gray-400 mt-2">Click for details →</div>
  </Link>
))}
```

**Navigation:** Uses React Router's `<Link>` component for client-side navigation without full page reload.

---

### Incident Detail Page

**File:** `src/Pages/IncidentDetail.jsx`

**Route:** `/incidents/:id`

**URL Parameter Extraction:**
```jsx
import { useParams } from "react-router-dom";

function IncidentDetail() {
  const { id } = useParams(); // Extracts :id from URL
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchIncidentDetails() {
      try {
        const response = await fetch(`${API_BASE}/api/traffic/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setIncident(data.incident || null);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIncidentDetails();
  }, [id]);

  // Render logic...
}
```

**API Endpoint:** `GET /api/traffic/:id`

**Display:**
```jsx
<div className="card p-4 mt-4 bg-black/40 border border-violet-700">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="text-xl font-semibold">{incident.location}</h3>
      <p className="text-sm text-gray-300 mt-1">
        {new Date(incident.date).toLocaleString()}
      </p>
    </div>
    <div className={`font-bold px-3 py-1 rounded ${
        incident.severity === 'High' ? 'bg-red-600 text-white' : 
        incident.severity === 'Medium' ? 'bg-yellow-500 text-black' : 
        'bg-green-600 text-white'
      }`}>
      {incident.severity}
    </div>
  </div>

  <hr className="my-4 border-violet-700" />

  <h4 className="text-md font-semibold text-gray-300">Description</h4>
  <p className="text-gray-200 mt-2">{incident.description}</p>

  <div className="mt-4 text-sm text-gray-400">ID: {incident.id}</div>
</div>
```

**Back Navigation:**
```jsx
<Link to="/incidents" className="text-sm text-violet-300 mb-4 inline-block">
  ← Back to incidents
</Link>
```

---

## 📈 4. Risk Page – Detailed Explanation

**File:** `src/Pages/Risk.jsx`

### What It Does

The Risk page displays **ML-powered insights** including:
1. **Model Performance Metrics** (accuracy, training data size)
2. **Severity Distribution Pie Chart**
3. **Road-by-Road Analysis** with:
   - Total incidents
   - Average risk level
   - Rush hour incidents
   - Weekend incidents
   - Best times to travel
   - Times to avoid
   - Safest/riskiest days
4. **Most Dangerous Roads** (top 3 by risk score)

---

### Data Sources

The Risk page fetches from **THREE** endpoints:

```jsx
useEffect(() => {
  async function fetchAnalysisData() {
    // 1. Incident severity distribution
    try {
      const severityResponse = await fetch(`${API_BASE}/api/incidents/by-severity`);
      const severityJson = await severityResponse.json();
      setSeverityData(severityJson.by_severity || []);
    } catch (error) {
      console.error("Error fetching severity data:", error);
    }

    // 2. ML model performance metrics
    try {
      const metricsResponse = await fetch(`${API_BASE}/metrics`);
      if (metricsResponse.ok) {
        const metricsJson = await metricsResponse.json();
        setMlMetrics(metricsJson);
      }
    } catch (error) {
      console.error("Error fetching ML metrics:", error);
    }

    // 3. Road-by-road analysis from ML training
    try {
      const roadResponse = await fetch(`${API_BASE}/road-analysis`);
      if (roadResponse.ok) {
        const roadJson = await roadResponse.json();
        setRoadAnalysis(roadJson);
        
        // Select first road by default
        const roadNames = Object.keys(roadJson);
        if (roadNames.length > 0) {
          setSelectedRoad(roadNames[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching road analysis:", error);
    }
  }
  
  fetchAnalysisData();
}, []);
```

**API Endpoints:**
- `GET /api/incidents/by-severity` - Returns severity distribution
- `GET /metrics` - Returns ML model accuracy from `backend/ml/metrics.json`
- `GET /road-analysis` - Returns road analysis from `backend/ml/road_analysis.json`

---

### State Management

```jsx
const [severityData, setSeverityData] = useState([]);       // Pie chart data
const [mlMetrics, setMlMetrics] = useState(null);           // Model accuracy, training size
const [roadAnalysis, setRoadAnalysis] = useState(null);     // Per-road stats
const [selectedRoad, setSelectedRoad] = useState(null);     // Currently selected road
```

---

### Road Analysis Data Structure

**Response from `/road-analysis`:**
```json
{
  "I-24 near 21st Ave S": {
    "total_incidents": 47,
    "avg_severity": 1.57,
    "risk_score": 74.0,
    "best_hours": [6, 21, 22],
    "worst_hours": [20, 19, 0],
    "best_day": "Monday",
    "worst_day": "Saturday",
    "rush_hour_incidents": 10,
    "weekend_incidents": 12
  },
  ...
}
```

---

### Road Selection Dropdown

```jsx
<select
  value={selectedRoad || ''}
  onChange={(e) => setSelectedRoad(e.target.value)}
  className="w-full md:w-1/2 px-4 py-3 bg-gray-700/50 border border-violet-500/30 rounded-lg text-white"
>
  {Object.keys(roadAnalysis).map(roadName => (
    <option key={roadName} value={roadName}>{roadName}</option>
  ))}
</select>
```

**When the user changes the dropdown, ALL displayed stats update automatically** because they reference `roadAnalysis[selectedRoad]`.

---

### Displaying Road Stats

**Total Incidents:**
```jsx
<div>
  <p className="text-sm text-gray-400">Total Incidents</p>
  <p className="text-2xl font-bold text-white">
    {roadAnalysis[selectedRoad].total_incidents || 0}
  </p>
</div>
```

**Average Risk Level:**
```jsx
// Helper function to get risk color
const getRiskColor = (avgSeverity) => {
  if (avgSeverity >= 2.5) return "text-red-400";
  if (avgSeverity >= 1.5) return "text-yellow-400";
  return "text-green-400";
};

// Helper function to get risk label
const getRiskLabel = (avgSeverity) => {
  if (avgSeverity >= 2.5) return "High Risk";
  if (avgSeverity >= 1.5) return "Medium Risk";
  return "Low Risk";
};

// Display
<div>
  <p className="text-sm text-gray-400">Average Risk Level</p>
  <p className={`text-2xl font-bold ${getRiskColor(roadAnalysis[selectedRoad].avg_severity || 0)}`}>
    {getRiskLabel(roadAnalysis[selectedRoad].avg_severity || 0)}
  </p>
</div>
```

**Rush Hour & Weekend Incidents:**
```jsx
<div>
  <p className="text-sm text-gray-400">Rush Hour Incidents</p>
  <p className="text-2xl font-bold text-orange-400">
    {roadAnalysis[selectedRoad].rush_hour_incidents || 0}
  </p>
</div>

<div>
  <p className="text-sm text-gray-400">Weekend Incidents</p>
  <p className="text-2xl font-bold text-blue-400">
    {roadAnalysis[selectedRoad].weekend_incidents || 0}
  </p>
</div>
```

---

### Best/Worst Travel Times

**Time Formatting Helper:**
```jsx
// Convert 24-hour time to readable format (e.g., "3:00 PM")
const formatHour = (hour) => {
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${period}`;
};
```

**Best Times to Travel:**
```jsx
{roadAnalysis[selectedRoad].best_hours && roadAnalysis[selectedRoad].best_hours.length > 0 ? (
  <div className="mb-6">
    <h5 className="text-lg font-semibold text-green-400 mb-3">Best Times to Travel</h5>
    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {roadAnalysis[selectedRoad].best_hours.map(hour => (
          <span key={hour} className="px-3 py-1 bg-green-600/40 rounded-full text-sm border border-green-400/30">
            {formatHour(hour)}
          </span>
        ))}
      </div>
      <p className="text-sm text-green-300">
        Safest day: <span className="font-semibold">{roadAnalysis[selectedRoad].best_day || 'N/A'}</span>
      </p>
    </div>
  </div>
) : (
  <div className="mb-6 text-gray-400 text-sm">No data available for best travel times yet.</div>
)}
```

**Times to Avoid:**
```jsx
{roadAnalysis[selectedRoad].worst_hours && roadAnalysis[selectedRoad].worst_hours.length > 0 ? (
  <div>
    <h5 className="text-lg font-semibold text-red-400 mb-3">Avoid These Times</h5>
    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {roadAnalysis[selectedRoad].worst_hours.map(hour => (
          <span key={hour} className="px-3 py-1 bg-red-600/40 rounded-full text-sm border border-red-400/30">
            {formatHour(hour)}
          </span>
        ))}
      </div>
      <p className="text-sm text-red-300">
        Riskiest day: <span className="font-semibold">{roadAnalysis[selectedRoad].worst_day || 'N/A'}</span>
      </p>
    </div>
  </div>
) : (
  <div className="text-gray-400 text-sm">No data available for times to avoid yet.</div>
)}
```

---

### Most Dangerous Roads (Top 3)

**Dynamically sorted by risk_score:**
```jsx
<div className="mt-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-6 border border-violet-600/30">
  <h4 className="text-xl font-semibold text-violet-300 mb-4">Most Dangerous Roads</h4>
  <p className="text-sm text-gray-400 mb-4">Ranked by risk score (incident count × average severity)</p>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Object.entries(roadAnalysis)
      .sort((a, b) => (b[1].risk_score || 0) - (a[1].risk_score || 0))  // Sort by risk_score DESC
      .slice(0, 3)  // Take top 3
      .map(([roadName, roadData], index) => (
        <div 
          key={roadName} 
          className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 hover:bg-red-900/30 transition-colors cursor-pointer"
          onClick={() => setSelectedRoad(roadName)}  // Click to jump to this road
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-red-400">#{index + 1}</span>
            <h5 className="text-sm font-semibold text-white line-clamp-2">{roadName}</h5>
          </div>
          <p className="text-2xl font-bold text-red-300">{roadData.total_incidents}</p>
          <p className="text-xs text-gray-400">incidents</p>
          {roadData.risk_score && (
            <p className="text-xs text-red-400 mt-1">Risk: {roadData.risk_score.toFixed(1)}</p>
          )}
        </div>
      ))}
  </div>
</div>
```

**Key Features:**
- Cards are **clickable** - clicking sets `selectedRoad` to jump to that road's details
- Sorting is **dynamic** based on `risk_score` field (added by ML training)
- Shows **incident count AND risk score**

---

### ML Model Performance Display

```jsx
{mlMetrics && (
  <div className="mb-8">
    <h3 className="text-2xl font-semibold mb-4 text-violet-200">ML Model Performance</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Accuracy Card */}
      <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 rounded-lg p-6 border border-violet-500/30">
        <h4 className="text-sm font-medium text-violet-200 mb-2">Model Accuracy</h4>
        <p className="text-3xl font-bold text-green-400">
          {(mlMetrics.accuracy * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Predicts incident severity based on time/location
        </p>
      </div>

      {/* Training Data Card */}
      <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 rounded-lg p-6 border border-violet-500/30">
        <h4 className="text-sm font-medium text-violet-200 mb-2">Training Data</h4>
        <p className="text-3xl font-bold text-violet-300">
          {mlMetrics.n_train + mlMetrics.n_test}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Total incidents analyzed
        </p>
      </div>

      {/* Algorithm Card */}
      <div className="bg-gradient-to-br from-violet-800/60 to-purple-900/60 rounded-lg p-6 border border-violet-500/30">
        <h4 className="text-sm font-medium text-violet-200 mb-2">Algorithm</h4>
        <p className="text-lg font-semibold text-violet-300">Random Forest</p>
        <p className="text-xs text-gray-400 mt-2">
          Time-of-day pattern recognition
        </p>
      </div>
    </div>
  </div>
)}
```

---

### Severity Pie Chart

Uses **Recharts** library:

```jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CHART_COLORS = ["#9333EA", "#A855F7", "#C084FC"];

// In render:
{severityData.length > 0 ? (
  <div className="bg-gray-800/60 rounded-lg p-6 border border-violet-600/30">
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={severityData}
          dataKey="count"
          nameKey="severity"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {severityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#1F1F1F", border: "1px solid #9333EA", color: "#FFF" }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
) : (
  <p className="text-gray-400">No severity data available.</p>
)}
```

**Data Format from `/api/incidents/by-severity`:**
```json
{
  "by_severity": [
    { "severity": "Low", "count": 3150 },
    { "severity": "Medium", "count": 2011 },
    { "severity": "High", "count": 878 }
  ]
}
```

---

## 🗺️ 5. Routes Page & Live Traffic

### Routes Page

**File:** `src/Pages/Routes.jsx`

**Purpose:** Weather-aware route planning with:
- Address geocoding (search by street address)
- Route calculation
- Weather forecasts for origin and destination
- Traffic incidents along route

**Key Features:**
```jsx
// Geocode addresses
const [originGeo, destGeo] = await Promise.all([
  geocodeHere(origin),
  geocodeHere(destination)
]);

// Calculate route
const routeData = await calculateHereRoute(
  `${originPos.lat},${originPos.lon}`,
  `${destPos.lat},${destPos.lon}`
);

// Fetch weather for both locations
const [originWeather, destWeather] = await Promise.all([
  fetchWeatherForLocation(originPos.lat, originPos.lon),
  fetchWeatherForLocation(destPos.lat, destPos.lon)
]);

// Analyze weather conditions
const analyzeWeatherConditions = (weatherData) => {
  const warnings = [];
  let severity = 'low';
  const condition = weatherData.condition?.toLowerCase() || '';
  
  if (condition.includes('snow') || condition.includes('ice')) {
    warnings.push('Snow/ice conditions - drive carefully');
    severity = 'high';
  }
  if (condition.includes('rain') || condition.includes('storm')) {
    warnings.push('Wet road conditions');
    severity = severity === 'high' ? 'high' : 'medium';
  }
  // ... more conditions
  
  return { safe: warnings.length === 0, warnings, severity };
};
```

---

### Live Traffic Page

**File:** `src/Pages/HereTraffic.jsx`

**Purpose:** Real-time traffic data from HERE Maps API

**Key Features:**
- Nashville traffic overview
- Traffic flow data
- Live incident markers
- API health status

*(Full details available in the actual file - this page is not modified per your instructions)*

---

## 🧩 6. Shared Components & Utilities

### SimpleHereMap Component

**File:** `src/components/SimpleHereMap.jsx`

**Purpose:** Displays OpenStreetMap with traffic incidents overlay

**Props:**
```jsx
<SimpleHereMap 
  center={{ lat: 36.1627, lng: -86.7816 }}
  height="500px"
/>
```

**How It Works:**
```jsx
const SimpleHereMap = ({ center = { lat: 36.1627, lng: -86.7816 }, height = '500px' }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, [center]);

  const fetchIncidents = async () => {
    try {
      const data = await getHereIncidents({
        lat: center.lat,
        lng: center.lng,
        radius: 20000  // 20km radius
      });
      setIncidents(data.incidents || []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  // OpenStreetMap embed (no API key required)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng-0.1},${center.lat-0.1},${center.lng+0.1},${center.lat+0.1}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
      
      {/* Incident count badge */}
      {!loading && incidents.length > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
```

**Usage Example:**
```jsx
// In Home.jsx
<SimpleHereMap center={{ lat: 36.1627, lng: -86.7816 }} height="400px" />
```

---

### API Client

**File:** `src/api.js`

**Purpose:** Centralized API calls with error handling

**Core Pattern:**
```jsx
const j = (res) => {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};
```

**API Functions:**
```jsx
// Traffic/Incident endpoints
export const getTraffic = (limit = 500) => fetch(`/api/traffic?limit=${limit}`).then(j);
export const getBySeverity = () => fetch('/api/incidents/by-severity').then(j);
export const getByLocation = () => fetch('/api/incidents/by-location').then(j);
export const getByDay = () => fetch('/api/incidents/by-day').then(j);

// HERE Maps API
export const getHereTrafficFlow = (lat, lng, radius = 5000) => 
  fetch(`/api/here/traffic-flow?lat=${lat}&lon=${lng}&radius=${radius}`).then(j);

export const getHereIncidents = ({ bbox, lat, lng, radius = 10000 }) => {
  if (bbox) {
    return fetch(`/api/here/traffic-incidents?bbox=${bbox}`).then(j);
  } else if (lat && lng) {
    return fetch(`/api/here/traffic-incidents?lat=${lat}&lon=${lng}&radius=${radius}`).then(j);
  }
  return fetch('/api/here/traffic-incidents?bbox=-87.0,36.0,-86.5,36.4').then(j);
};

export const calculateHereRoute = (start, end, departureTime = null) => 
  fetch('/api/here/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end, departure_time: departureTime })
  }).then(j);

export const geocodeHere = (address) => 
  fetch(`/api/here/geocode?address=${encodeURIComponent(address)}`).then(j);
```

---

### Global Styles

**File:** `src/index.css`

**Tailwind Configuration:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom card component */
@layer components {
  .card {
    @apply bg-gray-800/60 backdrop-blur-sm rounded-lg border border-violet-600/30;
  }
}
```

**Theme Colors (from `tailwind.config.cjs`):**
- Primary: Violet/Purple shades (#9333EA, #A855F7, etc.)
- Background: Black → Gray → Violet gradient
- Accent: Violet-400 (#A855F7)

---

## 🔄 7. Data Flow & API Integration

### Request Flow

```
User Action
    ↓
React Component (Page)
    ↓
API Function (src/api.js)
    ↓
Fetch Request → Backend API (Flask on port 5000)
    ↓
Backend Queries MySQL or Returns Static ML Files
    ↓
JSON Response
    ↓
Component State Update (useState)
    ↓
UI Re-renders
```

### Example: Dashboard Data Flow

1. **Component Mounts** → `useEffect` triggers
2. **API Call** → `getTraffic()` fetches from `/api/traffic?limit=500`
3. **Backend Handler** → Flask queries MySQL: `SELECT * FROM traffic_incidents ORDER BY id DESC LIMIT 500`
4. **Response** → JSON array of incidents
5. **State Update** → `setTraffic(data)`
6. **Derived State** → Compute `highCount`, `mediumCount`, `lowCount`
7. **User Filters** → Update `severityFilter` state
8. **Re-compute** → `filteredIncidents` array updates
9. **User Sorts** → Update `sortBy` state
10. **Re-compute** → `sortedIncidents` array updates
11. **Render** → Table displays `sortedIncidents`

---

### Data Normalization Examples

**Severity Normalization:**
```jsx
// Problem: Backend sends "High", "Medium", "Low" but we need case-insensitive matching
const normalizeSeverity = (severity) => {
  if (!severity) return "low";
  return String(severity).trim().toLowerCase();
};

// Usage:
const highCount = traffic.filter(t => normalizeSeverity(t.severity) === "high").length;
```

**Date Formatting:**
```jsx
// Convert ISO timestamp to readable date
<td>{incident.date ? new Date(incident.date).toLocaleDateString() : "Unknown"}</td>
```

**Time Formatting:**
```jsx
// Convert 24-hour to 12-hour format
const formatHour = (hour) => {
  const displayHour = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${period}`;
};
```

---

## ⚡ 8. State Management & UX Patterns

### Loading States

**Pattern:**
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      const result = await apiCall();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);

// In render:
{loading ? (
  <p className="text-gray-400">Loading data...</p>
) : data.length > 0 ? (
  <div>
    {/* Render data */}
  </div>
) : (
  <p className="text-gray-400">No data available.</p>
)}
```

---

### Error Handling

**Pattern:**
```jsx
const [error, setError] = useState(null);

try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  setData(data);
} catch (err) {
  setError(err.message);
}

// In render:
{error && <p className="text-red-400">Error: {error}</p>}
```

---

### Filtering Pattern

**Step 1: Store Filter State**
```jsx
const [severityFilter, setSeverityFilter] = useState("all");
```

**Step 2: Compute Filtered Data**
```jsx
const filteredIncidents = severityFilter === "all" 
  ? incidents 
  : incidents.filter(i => normalizeSeverity(i.severity) === severityFilter);
```

**Step 3: Dropdown Updates State**
```jsx
<select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
  <option value="all">All</option>
  <option value="high">High</option>
  <option value="medium">Medium</option>
  <option value="low">Low</option>
</select>
```

**Step 4: Render Filtered Data**
```jsx
{filteredIncidents.map(incident => ...)}
```

---

### Sorting Pattern

**Step 1: Store Sort State**
```jsx
const [sortBy, setSortBy] = useState("date_desc");
```

**Step 2: Create Sorted Array**
```jsx
const sortedIncidents = [...filteredIncidents].sort((a, b) => {
  if (sortBy === "date_desc") {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }
  if (sortBy === "severity_desc") {
    return getSeverityRank(b.severity) - getSeverityRank(a.severity);
  }
  return 0;
});
```

**Step 3: Dropdown Updates State**
```jsx
<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
  <option value="date_desc">Date: Recent</option>
  <option value="severity_desc">Severity (High → Low)</option>
</select>
```

---

### Auto-Refresh Pattern

**Pattern:**
```jsx
useEffect(() => {
  fetchData(); // Initial fetch
  
  const interval = setInterval(fetchData, 120000); // Refresh every 2 minutes
  return () => clearInterval(interval); // Cleanup on unmount
}, []);
```

---

## 🛠️ 9. How to Extend / Modify the Frontend

### Adding a New Page

**Step 1: Create Page Component**
```jsx
// src/Pages/MyNewPage.jsx
import { useState, useEffect } from "react";
import { getTraffic } from "../api";

function MyNewPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getTraffic();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-4 text-white">
      <h2 className="text-3xl font-bold text-violet-300 mb-6">My New Page</h2>
      {loading ? <p>Loading...</p> : <div>{/* Render data */}</div>}
    </div>
  );
}

export default MyNewPage;
```

**Step 2: Add Route to App.jsx**
```jsx
import MyNewPage from "./Pages/MyNewPage";

// In RouterRoutes:
<Route path="/mynewpage" element={<MyNewPage />} />
```

**Step 3: Add Navigation Link**
```jsx
// In nav bar:
<Link to="/mynewpage" className="hover:text-violet-400">
  My New Page
</Link>
```

---

### Adding a New Card/Metric to Dashboard

**Step 1: Compute Metric**
```jsx
// In Dashboard.jsx, after severity counts:
const recentIncidents = traffic.filter(t => {
  const date = new Date(t.date);
  const hoursSince = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  return hoursSince <= 24;
}).length;
```

**Step 2: Add Card to Grid**
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  {/* Existing cards... */}
  
  {/* New card */}
  <div className="card border-l-4 border-blue-500 p-4">
    <h3 className="text-lg font-semibold text-gray-300">Last 24 Hours</h3>
    <p className="text-3xl font-bold text-blue-400">{recentIncidents}</p>
  </div>
</div>
```

---

### Adding a New Filter/Dropdown

**Step 1: Add State**
```jsx
const [locationFilter, setLocationFilter] = useState("all");
```

**Step 2: Add Dropdown**
```jsx
<select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
  <option value="all">All Locations</option>
  <option value="i-24">I-24</option>
  <option value="i-65">I-65</option>
  <option value="i-40">I-40</option>
</select>
```

**Step 3: Apply Filter**
```jsx
const filteredIncidents = incidents.filter(incident => {
  // Apply severity filter
  if (severityFilter !== "all" && normalizeSeverity(incident.severity) !== severityFilter) {
    return false;
  }
  
  // Apply location filter
  if (locationFilter !== "all" && !incident.location.toLowerCase().includes(locationFilter)) {
    return false;
  }
  
  return true;
});
```

---

### Adding a New API Endpoint

**Step 1: Add Function to api.js**
```jsx
export const getWeeklyStats = () => fetch('/api/stats/weekly').then(j);
```

**Step 2: Use in Component**
```jsx
import { getWeeklyStats } from "../api";

const [weeklyStats, setWeeklyStats] = useState(null);

useEffect(() => {
  async function fetchStats() {
    try {
      const data = await getWeeklyStats();
      setWeeklyStats(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  fetchStats();
}, []);
```

---

## 🚀 10. Start Script Explanation

**File:** `start.bat`

**Purpose:** One-click startup script for the entire TrafficWiz application

### What It Does

```bat
@echo off
echo ============================================
echo TrafficWiz - Starting Application
echo ============================================

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo ERROR: Virtual environment not found!
    pause
    exit /b 1
)

REM [1/5] Setup Windows Task Scheduler for hourly data collection
echo [1/5] Setting up scheduled data collection...
schtasks /create /tn "TrafficWiz_HereCollector" /tr "%CD%\backend\venv\Scripts\python.exe %CD%\backend\services\here_data_collector.py --once" /sc hourly /mo 1 /f

REM [2/5] Start Flask backend (port 5000)
echo [2/5] Starting Flask backend server...
start "TrafficWiz Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"
timeout /t 3 /nobreak >nul

REM [3/5] Start Vite frontend (port 5173)
echo [3/5] Starting Vite frontend server...
start "TrafficWiz Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

REM [4/5] Run HERE data collector once on startup
echo [4/5] Collecting initial HERE traffic data...
start "HERE Data Collector" cmd /k "cd backend && venv\Scripts\activate && python services\here_data_collector.py --once"

REM [5/5] Train ML model with current data
echo [5/5] Training machine learning model...
start "ML Model Training" cmd /k "cd backend && venv\Scripts\activate && python ml\train_model.py"

echo ============================================
echo TrafficWiz Started Successfully!
echo ============================================
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:5173
echo Press any key to open the application...
pause >nul
start http://localhost:5173
```

### Execution Flow

1. **Validate Environment** - Check if Python venv exists
2. **Create Scheduled Task** - Windows Task Scheduler runs data collector every hour
3. **Start Backend** - Flask server on port 5000 (new terminal window)
4. **Start Frontend** - Vite dev server on port 5173 (new terminal window)
5. **Initial Data Collection** - Fetch current incidents from HERE API
6. **Train ML Model** - Analyze patterns and generate road analysis JSON
7. **Open Browser** - Auto-launch frontend at localhost:5173

**Result:** Four terminal windows open:
- Backend (Flask)
- Frontend (Vite)
- HERE Data Collector
- ML Model Training

---

## 📝 Summary

### Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Maps**: OpenStreetMap (via iframe)
- **API Communication**: Native Fetch API
- **Build Tool**: Vite

### Key Architectural Patterns

1. **Page-Based Architecture** - Each route is a separate page component
2. **Local State Management** - No global state, each page manages its own data
3. **Centralized API Layer** - All backend calls in `src/api.js`
4. **Component Composition** - Reusable components like `SimpleHereMap`
5. **Auto-Refresh Pattern** - `setInterval` in `useEffect` for live data
6. **Normalized Data** - Helper functions for consistent severity/date formatting

### Data Sources

- **MySQL Database** - Historical incident data
- **HERE Maps API** - Live traffic and incident data
- **National Weather Service API** - Real-time weather data
- **ML Model Outputs** - Risk analysis and travel recommendations

### Pages Summary

| Page | Route | Purpose | Key Features |
|------|-------|---------|--------------|
| Home | `/` | Landing page | Weather widget, map preview |
| Dashboard | `/dashboard` | Incident overview | Summary cards, filter/sort table |
| Incidents | `/incidents` | Searchable list | Search bar, clickable cards |
| Incident Detail | `/incidents/:id` | Single incident | Full details, back navigation |
| Risk | `/risk` | ML insights | Road analysis, best/worst times, dangerous roads |
| Routes | `/routes` | Route planning | Geocoding, weather-aware routing |
| Live Traffic | `/traffic` | Real-time data | HERE Maps integration |

---

**End of Documentation**

*This documentation reflects the actual codebase as of November 24, 2025. All code snippets are from real files, not pseudo-code.*
