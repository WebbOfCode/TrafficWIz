
-- Create database
CREATE DATABASE IF NOT EXISTS trafficwiz
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE trafficwiz;

-- =========================
-- 1) CITY
-- =========================
CREATE TABLE IF NOT EXISTS city (
  city_id      INT AUTO_INCREMENT PRIMARY KEY,
  city_name    VARCHAR(100) NOT NULL,
  state        CHAR(2)      NOT NULL,          -- e.g., 'TN'
  UNIQUE KEY uq_city_state (city_name, state)
) ENGINE=InnoDB;

-- Seed Nashville (optional)
INSERT INTO city (city_name, state) VALUES ('Nashville', 'TN')
ON DUPLICATE KEY UPDATE state=VALUES(state);

-- =========================
-- 2) SEGMENT (road segments within a city)
-- =========================
CREATE TABLE IF NOT EXISTS segment (
  segment_id        INT AUTO_INCREMENT PRIMARY KEY,
  city_id           INT NOT NULL,
  road_name         VARCHAR(255) NOT NULL,
  from_intersection VARCHAR(255),
  to_intersection   VARCHAR(255),
  CONSTRAINT fk_segment_city
    FOREIGN KEY (city_id) REFERENCES city(city_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX ix_segment_city ON segment(city_id);
CREATE INDEX ix_segment_road ON segment(road_name);

-- =========================
-- 3) INCIDENT (crashes, hazards, etc.)
-- =========================
CREATE TABLE IF NOT EXISTS incident (
  incident_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  segment_id    INT NOT NULL,
  occurred_at   DATETIME NOT NULL,             -- UTC recommended
  type          ENUM('crash','hazard','construction','closure','other') NOT NULL,
  severity      TINYINT UNSIGNED NOT NULL,     -- 1..5 scale
  description   VARCHAR(500),
  CONSTRAINT fk_incident_segment
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_incident_severity CHECK (severity BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE INDEX ix_incident_segment ON incident(segment_id);
CREATE INDEX ix_incident_time    ON incident(occurred_at);

-- =========================
-- 4) CONGESTION (measured per segment & time)
-- =========================
CREATE TABLE IF NOT EXISTS congestion (
  congestion_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
  segment_id      INT NOT NULL,
  measured_at     DATETIME NOT NULL,
  avg_speed_kph   DECIMAL(5,2) NOT NULL,       -- e.g., 0.00–200.00
  congestion_level TINYINT UNSIGNED,           -- 0..100 (%) optional
  CONSTRAINT fk_congestion_segment
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_speed_nonneg CHECK (avg_speed_kph >= 0),
  CONSTRAINT ck_congestion_pct CHECK (congestion_level IS NULL OR congestion_level <= 100)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_congestion_point ON congestion(segment_id, measured_at);
CREATE INDEX ix_congestion_speed ON congestion(avg_speed_kph);

-- =========================
-- 5) WEATHER_HOURLY (city-level weather snapshots)
-- =========================
CREATE TABLE IF NOT EXISTS weather_hourly (
  weather_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  city_id           INT NOT NULL,
  observed_at       DATETIME NOT NULL,
  precipitation_mm  DECIMAL(6,2) DEFAULT 0.00,
  temperature_c     DECIMAL(5,2),
  weather_condition VARCHAR(80),               -- e.g., 'Clear', 'Rain', 'Snow'
  CONSTRAINT fk_weather_city
    FOREIGN KEY (city_id) REFERENCES city(city_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_precip_nonneg CHECK (precipitation_mm >= 0)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_weather_point ON weather_hourly(city_id, observed_at);
CREATE INDEX ix_weather_temp ON weather_hourly(temperature_c);

-- =========================
-- Helpful Views (optional)
-- =========================

-- Crashes per city per day
CREATE OR REPLACE VIEW vw_city_crashes_daily AS
SELECT c.city_name,
       c.state,
       DATE(i.occurred_at) AS day,
       COUNT(*) AS crash_count
FROM incident i
JOIN segment s ON s.segment_id = i.segment_id
JOIN city    c ON c.city_id    = s.city_id
GROUP BY c.city_name, c.state, DATE(i.occurred_at);

-- Average speed per segment per hour
CREATE OR REPLACE VIEW vw_segment_speed_hourly AS
SELECT s.segment_id,
       s.road_name,
       DATE_FORMAT(measured_at, '%Y-%m-%d %H:00:00') AS hour_bucket,
       AVG(avg_speed_kph) AS avg_speed_kph
FROM congestion cg
JOIN segment s ON s.segment_id = cg.segment_id
GROUP BY s.segment_id, s.road_name, DATE_FORMAT(measured_at, '%Y-%m-%d %H:00:00');
CREATE TABLE IF NOT EXISTS incident_interval (
  interval_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  incident_id     BIGINT NOT NULL,
  segment_id      INT NOT NULL,
  start_time      DATETIME NOT NULL,
  end_time        DATETIME,
  
  -- Duration auto-calculated when end_time exists
  duration_min    INT GENERATED ALWAYS AS (
                      CASE 
                        WHEN end_time IS NULL THEN NULL
                        ELSE TIMESTAMPDIFF(MINUTE, start_time, end_time)
                      END
                    ) VIRTUAL,

  CONSTRAINT fk_interval_incident
    FOREIGN KEY (incident_id) REFERENCES incident(incident_id)
      ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_interval_segment
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id)
      ON UPDATE CASCADE ON DELETE RESTRICT,

  -- Ensures the time range is valid
  CONSTRAINT ck_valid_interval
    CHECK (end_time IS NULL OR end_time >= start_time)
) ENGINE=InnoDB;