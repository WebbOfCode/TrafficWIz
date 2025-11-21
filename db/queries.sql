-- Sample queries for TrafficWiz database operations

-- ==============================================
-- READ OPERATIONS (used by frontend)
-- ==============================================

-- Get all recent incidents (Dashboard, Incidents page)
SELECT id, date, location, severity, description 
FROM traffic_incidents 
ORDER BY date DESC 
LIMIT 100;

-- Get single incident by ID (Incident detail page)
SELECT id, date, location, severity, description, incident_type, latitude, longitude, delay_seconds, end_time
FROM traffic_incidents 
WHERE id = ?;

-- Get incidents by severity (Risk page)
SELECT severity, COUNT(*) as count
FROM traffic_incidents
GROUP BY severity
ORDER BY 
    CASE severity
        WHEN 'High' THEN 1
        WHEN 'Medium' THEN 2
        WHEN 'Low' THEN 3
        ELSE 4
    END;

-- Get recent incidents (last 24 hours)
SELECT id, date, location, severity, description
FROM traffic_incidents
WHERE date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY date DESC;

-- Get incidents within a geographic area
SELECT id, date, location, severity, description, latitude, longitude
FROM traffic_incidents
WHERE latitude BETWEEN ? AND ?
  AND longitude BETWEEN ? AND ?
ORDER BY date DESC;

-- ==============================================
-- ML TRAINING QUERIES
-- ==============================================

-- Export training data with temporal features
SELECT 
    id,
    date,
    location,
    severity,
    description,
    HOUR(date) as hour,
    DAYOFWEEK(date) as day_of_week,
    CASE 
        WHEN severity = 'High' THEN 3
        WHEN severity = 'Medium' THEN 2
        WHEN severity = 'Low' THEN 1
        ELSE 0
    END as severity_numeric
FROM traffic_incidents
WHERE date IS NOT NULL
ORDER BY date DESC;

-- Road-specific analysis for best/worst travel times
SELECT 
    location as road,
    COUNT(*) as total_incidents,
    AVG(CASE 
        WHEN severity = 'High' THEN 3
        WHEN severity = 'Medium' THEN 2
        WHEN severity = 'Low' THEN 1
        ELSE 0
    END) as avg_severity,
    SUM(CASE WHEN HOUR(date) BETWEEN 7 AND 9 OR HOUR(date) BETWEEN 16 AND 18 THEN 1 ELSE 0 END) as rush_hour_incidents,
    SUM(CASE WHEN DAYOFWEEK(date) IN (1, 7) THEN 1 ELSE 0 END) as weekend_incidents
FROM traffic_incidents
WHERE date IS NOT NULL
GROUP BY location
HAVING total_incidents >= 5
ORDER BY total_incidents DESC;

-- ==============================================
-- MAINTENANCE QUERIES
-- ==============================================

-- Check for duplicate external_ids (should return 0 rows)
SELECT external_id, COUNT(*) as count
FROM traffic_incidents
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING count > 1;

-- Clean up old resolved incidents (older than 7 days)
DELETE FROM traffic_incidents
WHERE date < DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND (end_time IS NULL OR end_time < NOW());

-- Get database statistics
SELECT 
    COUNT(*) as total_incidents,
    COUNT(DISTINCT DATE(date)) as days_with_data,
    MIN(date) as oldest_incident,
    MAX(date) as newest_incident,
    SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_severity,
    SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium_severity,
    SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_severity
FROM traffic_incidents;

-- ==============================================
-- INGESTION QUERIES (used by backend)
-- ==============================================

-- Check if incident already exists (by external_id)
SELECT id 
FROM traffic_incidents 
WHERE external_id = ?;

-- Insert new incident from HERE API
INSERT INTO traffic_incidents 
(external_id, date, location, latitude, longitude, severity, incident_type, description, delay_seconds, end_time)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- Update existing incident
UPDATE traffic_incidents 
SET date = ?, location = ?, latitude = ?, longitude = ?,
    severity = ?, incident_type = ?, description = ?,
    delay_seconds = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP
WHERE external_id = ?;
