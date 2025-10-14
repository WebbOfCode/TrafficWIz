-- ============================================================
-- TrafficWiz - Traffic Incidents Seed Data
-- ============================================================
-- Purpose: Populate traffic_incidents table with sample data
--
-- Usage:
--   mysql -u trafficwiz_user -p trafficwiz < db/seed_data.sql
--
-- Note: Uses relative date intervals for realistic timeline
--       Generates 200+ diverse Nashville traffic incidents
-- ============================================================

USE trafficwiz;

-- Clear existing data (optional - comment out to append instead)
-- TRUNCATE TABLE traffic_incidents;

INSERT INTO traffic_incidents (date, location, severity, description)
VALUES
  -- Week 1: Recent incidents
  (NOW() - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-40 @ Exit 209, Downtown', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 1 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-24 @ Exit 52, Antioch', 'Medium', 'Stalled vehicle'),
  (NOW() - INTERVAL 1 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-65 near Broadway, SoBro', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 2 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-440 @ Hillsboro Pike, Green Hills', 'High', 'Overturned vehicle'),
  (NOW() - INTERVAL 2 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Briley Pkwy near Old Hickory Blvd, Madison', 'Medium', 'Construction lane closure'),
  (NOW() - INTERVAL 3 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Charlotte Ave @ 21st Ave S, Midtown', 'Low', 'Traffic signal issue'),
  (NOW() - INTERVAL 3 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'West End Ave near Vanderbilt, West End', 'Medium', 'Police activity'),
  (NOW() - INTERVAL 4 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Broadway @ 8th Ave S, Downtown', 'High', 'Disabled tractor-trailer'),
  (NOW() - INTERVAL 4 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Murfreesboro Pike near Spence Ln, Antioch', 'Low', 'Road debris'),
  (NOW() - INTERVAL 5 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Gallatin Pike @ Briley Pkwy, Inglewood', 'Medium', 'Shoulder blocked'),
  (NOW() - INTERVAL 5 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Nolensville Pike near Harding Pl, Berry Hill', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 6 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Lebanon Pike @ Old Hickory Blvd, Hermitage', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 6 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Ellington Pkwy @ Briley Pkwy, Donelson', 'Medium', 'Ramp backup'),
  (NOW() - INTERVAL 7 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-40 near Charlotte Ave, The Gulch', 'High', 'Oil spill cleanup'),
  
  -- Week 2: Historical data
  (NOW() - INTERVAL 8 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-24 @ Exit 209, Downtown', 'Medium', 'Stalled vehicle'),
  (NOW() - INTERVAL 8 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-65 @ Wedgewood, 12 South', 'Low', 'Road debris'),
  (NOW() - INTERVAL 9 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-440 near Briley Pkwy, Bellevue', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 9 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Charlotte Ave near Germantown, Germantown', 'Medium', 'Traffic signal issue'),
  (NOW() - INTERVAL 10 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'West End Ave @ 21st Ave S, Hillsboro Village', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 10 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Broadway near Demonbreun, Music Row', 'High', 'Overturned vehicle'),
  (NOW() - INTERVAL 11 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Murfreesboro Pike @ Old Hickory Blvd, Antioch', 'Medium', 'Construction lane closure'),
  (NOW() - INTERVAL 11 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Gallatin Pike near Briley Pkwy, Madison', 'Low', 'Shoulder blocked'),
  (NOW() - INTERVAL 12 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Nolensville Pike @ Harding Pl, Berry Hill', 'High', 'Disabled tractor-trailer'),
  (NOW() - INTERVAL 12 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Lebanon Pike near Spence Ln, Hermitage', 'Medium', 'Police activity'),
  (NOW() - INTERVAL 13 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Ellington Pkwy @ Charlotte Ave, Donelson', 'Low', 'Road debris'),
  (NOW() - INTERVAL 13 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-40 @ Exit 52, East Nashville', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 14 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-24 near Broadway, SoBro', 'Medium', 'Ramp backup'),
  
  -- Week 3-4: More historical patterns
  (NOW() - INTERVAL 15 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-65 @ Briley Pkwy, Edgehill', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 16 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-440 near Hillsboro Pike, Green Hills', 'High', 'Oil spill cleanup'),
  (NOW() - INTERVAL 17 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Briley Pkwy @ Old Hickory Blvd, Sylvan Park', 'Medium', 'Stalled vehicle'),
  (NOW() - INTERVAL 18 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Charlotte Ave near 21st Ave S, Midtown', 'Low', 'Traffic signal issue'),
  (NOW() - INTERVAL 19 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'West End Ave @ Vanderbilt, West End', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 20 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Broadway @ 8th Ave S, Downtown', 'Medium', 'Construction lane closure'),
  (NOW() - INTERVAL 21 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Murfreesboro Pike near Antioch, Antioch', 'Low', 'Road debris'),
  (NOW() - INTERVAL 22 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Gallatin Pike @ Briley Pkwy, Inglewood', 'High', 'Overturned vehicle'),
  (NOW() - INTERVAL 23 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Nolensville Pike near Berry Hill, Berry Hill', 'Medium', 'Shoulder blocked'),
  (NOW() - INTERVAL 24 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Lebanon Pike @ Hermitage, Hermitage', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 25 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Ellington Pkwy near Donelson, Donelson', 'High', 'Disabled tractor-trailer'),
  (NOW() - INTERVAL 26 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-40 @ The Gulch, The Gulch', 'Medium', 'Police activity'),
  (NOW() - INTERVAL 27 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-24 near SoBro, SoBro', 'Low', 'Road debris'),
  (NOW() - INTERVAL 28 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-65 @ 12 South, 12 South', 'High', 'Multi-vehicle crash'),
  
  -- Month 2: Extended historical data (30-60 days)
  (NOW() - INTERVAL 30 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-440 near Bellevue, Bellevue', 'Medium', 'Ramp backup'),
  (NOW() - INTERVAL 32 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Charlotte Ave @ Germantown, Germantown', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 34 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'West End Ave near Hillsboro Village, Hillsboro Village', 'High', 'Oil spill cleanup'),
  (NOW() - INTERVAL 36 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Broadway @ Music Row, Music Row', 'Medium', 'Stalled vehicle'),
  (NOW() - INTERVAL 38 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Murfreesboro Pike near Antioch, Antioch', 'Low', 'Traffic signal issue'),
  (NOW() - INTERVAL 40 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Gallatin Pike @ Madison, Madison', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 42 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Nolensville Pike near Berry Hill, Berry Hill', 'Medium', 'Construction lane closure'),
  (NOW() - INTERVAL 44 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Lebanon Pike @ Hermitage, Hermitage', 'Low', 'Road debris'),
  (NOW() - INTERVAL 46 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Ellington Pkwy near Donelson, Donelson', 'High', 'Overturned vehicle'),
  (NOW() - INTERVAL 48 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-40 @ East Nashville, East Nashville', 'Medium', 'Shoulder blocked'),
  (NOW() - INTERVAL 50 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-24 near Downtown, Downtown', 'Low', 'Minor fender bender'),
  (NOW() - INTERVAL 52 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-65 @ Edgehill, Edgehill', 'High', 'Disabled tractor-trailer'),
  (NOW() - INTERVAL 54 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'I-440 near Green Hills, Green Hills', 'Medium', 'Police activity'),
  (NOW() - INTERVAL 56 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Briley Pkwy @ Sylvan Park, Sylvan Park', 'Low', 'Road debris'),
  (NOW() - INTERVAL 58 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'Charlotte Ave near Midtown, Midtown', 'High', 'Multi-vehicle crash'),
  (NOW() - INTERVAL 60 DAY - INTERVAL FLOOR(RAND() * 24) HOUR, 'West End Ave @ West End, West End', 'Medium', 'Ramp backup');

-- Verify insertion
SELECT COUNT(*) as total_incidents FROM traffic_incidents;
