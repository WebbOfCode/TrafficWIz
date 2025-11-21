# Project documentation
Backend (folder: backend)
Purpose: serve REST API endpoints, talk to MySQL, run/serve ML predictions.

Important files

app.py

Main Flask application.

Registers API routes used in the frontend:
/ — simple root/health message.
/api/health — DB-aware health check (added).
/incidents — returns rows from traffic_incidents (full JSON array).
/api/traffic — returns { "traffic_data": [...] } (compatibility for frontend).
/api/traffic/<id> — return single incident { "incident": {...} }.
/api/incidents/by-severity, /api/incidents/by-location, /api/incidents/by-day — aggregation endpoints used by Risk/dashboard.
/predict — load ml/model.pkl and run prediction on posted JSON.
/metrics, /retrain — return ML training metrics and retrain (runs train script).
Database connection: get_db_connection() uses mysql.connector and reads credentials from environment variables (.env is used in local dev).
Note: recent edits aligned all endpoints to use the traffic_incidents table.


.env
Holds DB credentials and PORT. Example keys used: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT.
start.bat relies on this.

ml

train_model.py — trains the ML model and writes model.pkl and metrics.json (used by app.py).
predict_local.py — CLI helper to load model.pkl and run predictions from CLI or file. (Standalone CLI; the Flask /predict endpoint loads the model directly.)
model.pkl (if present) — serialized model used by /predict.
metrics.json — saved training metrics, returned by /metrics.

scripts (general)
Other helper scripts.


How backend uses DB
get_db_connection() uses mysql.connector and DB_CONFIG. If these env vars are missing or incorrect, DB queries will fail.
Backend reads from the traffic_incidents table.
Frontend (folder: frontend)
Purpose: React SPA (Vite) that calls backend APIs, shows lists, dashboards, charts.

Important files

index.html

Vite entry HTML. Contains <div id="root"></div> and loads main.jsx.
config.js

API_BASE constant. Frontend direct absolute requests use this. It’s currently set to http://127.0.0.1:5000 to match the running backend.
vite.config.js

Vite config and dev server proxy. Proxy forwards relative /api fetches to the backend (recently changed to http://127.0.0.1:5000).
main.jsx

React entry: mounts <App /> into #root.
App.jsx

Top-level router and navbar. Shows links to pages and now contains StatusBadge component (health indicator).
Pages:

Incidents.jsx — lists incidents, now links each item to /incidents/:id.
IncidentDetail.jsx — fetches /api/traffic/:id and displays details.
Dashboard.jsx — summary cards + table. Was updated to:
Use relative /api/traffic (Vite proxy).
Normalize several API response shapes and added debug logging/panel to show raw response.
Risk.jsx — fetches /api/incidents/by-severity and draws a PieChart (Recharts).
StatusBadge.jsx

Polls /api/health every 15s and displays API up/down indicator in navbar.
Other tools/config

Tailwind config: tailwind.config.cjs (converted to CommonJS module.exports = {} so Node can load it).
package.json, postcss.config.cjs, tailwind.config.cjs — frontend build/dev dependencies.
How frontend talks to backend

Two ways:
Relative fetches (fetch("/api/traffic")) — Vite dev server proxies them to server.proxy target (so the frontend dev server forwards to the backend).
Absolute fetches using API_BASE (e.g., fetch(${API_BASE}/api/incidents/by-severity)) — direct to backend.
When developing via Vite you typically use relative paths and the Vite proxy (this avoids CORS in dev), but both approaches are supported.
The config.js API_BASE is used by pages that call absolute URLs (some pages do).
DB (folder: db)
schema.sql
Schema defining multiple tables (city, segment, incident, congestion, weather_hourly, views).
Note: schema uses an incident table name in this SQL, but current backend endpoints use traffic_incidents.


start.bat (project root)
Creates/activates a venv in backend, installs requirements,
Then starts python app.py.
After a short wait it runs npm install and npm run dev in frontend.



How everything fits together (end-to-end flow)
Developer runs start.bat (or starts backend and frontend manually).
Backend app.py launches Flask on the port from .env (defaults to 5000 in repo).
Frontend runs Vite dev server (default port 5173). Vite proxies /api to the backend target in vite.config.js.
User opens the React app (http://localhost:5173).
Frontend pages request data:
Incidents page: fetches /api/traffic or ${API_BASE}/api/traffic.
Dashboard: fetches /api/traffic (relative -> proxied to backend).
Risk page: fetches ${API_BASE}/api/incidents/by-severity.
Backend receives request, uses get_db_connection() to open MySQL connection (credentials from .env).
Backend queries the traffic_incidents table and returns JSON (e.g., { "traffic_data": [...] }).
Frontend receives JSON, normalizes it (Dashboard does shape normalization), and renders UI components and charts.


                    For ML:
/predict endpoint loads model.pkl with joblib and returns predictions for posted payloads.
predict_local.py is a CLI tool to run predictions locally against the same model.pkl (not called by server).
train_model.py can generate model.pkl and metrics.json if you want to retrain locally (retrain endpoint calls that script).
Locations that previously caused issues (and what I changed)




Port mismatch: Some configs pointed to port 5001 while Flask was running on 5000. I changed:
config.js -> http://127.0.0.1:5000
vite.config.js proxy -> http://127.0.0.1:5000
.env default PORT -> 5000
This resolved ECONNREFUSED to 5001.


Table name mismatch: Different files used incident vs traffic_incidents. I updated backend endpoints to read traffic_incidents (consistent with seeder & seed_data.sql).


Tailwind config ESM/CJS mismatch: Converted tailwind.config.cjs to use module.exports = {}.


how to run this project
Assuming MySQL is already running and .env contains the correct credentials:




Suggested next improvements (practical)


Add a small /api/db-counts endpoint (or extend /api/health) to report counts for traffic_incidents and incident to help debugging.

Consolidate the schema name(s): pick one canonical table name (traffic_incidents or incident) across schema and backend to avoid mismatch confusion.

Move ML helper code into a shared module so predict_local.py and Flask /predict call the same code (remove duplication).

Add small README dev instructions that document ports and how to change them.

Add unit tests for a couple of backend endpoints (fast smoke tests).



Short troubleshooting checklist (if pages show “no data”)
Is MySQL running? Can you connect using the creds in .env?
Does traffic_incidents contain rows?
Use the MySQL client to check.
Is the Flask backend running on the expected port (5000)? Check netstat -ano.
Is the frontend pointing to the right backend?
config.js and vite.config.js proxy should point to the backend port.
Open browser DevTools → Network and inspect the failing API request: URL, response body, and status.
Check backend logs (console where app.py runs) for SQL/connection tracebacks.
