"""
============================================================
TrafficWiz - SQL Data Generator for Traffic Incidents
============================================================
Purpose: Generate SQL INSERT statements for traffic incidents

Features:
- Creates SQL file with randomized traffic incident data
- Configurable number of incidents (default: 200)
- Nashville-specific locations (highways, neighborhoods)
- Realistic severity distribution (50% Low, 35% Medium, 15% High)
- Date range: Last 60 days with random timestamps
- Compatible with MySQL traffic_incidents table schema

Output:
- generated_seed_data.sql: SQL INSERT statements

Usage:
  python make_sample_data.py --n 200 --days 60
  mysql -u trafficwiz_user -p trafficwiz < backend/ml/generated_seed_data.sql

Note: This generates SQL INSERT statements, not CSV
      Use db/seed_data.sql for standard seeding
============================================================
"""

import random
import datetime
import argparse

# Nashville neighborhoods
NEIGHBORHOODS = [
    "Downtown", "The Gulch", "Midtown", "12 South", "East Nashville",
    "Germantown", "Sylvan Park", "Green Hills", "Hillsboro Village",
    "Berry Hill", "Donelson", "Hermitage", "Antioch", "Madison",
    "Bellevue", "West End", "Music Row", "SoBro", "Edgehill", "Inglewood"
]

# Major roads and highways
ROADS = [
    "I-40", "I-24", "I-65", "I-440", "Briley Pkwy", "Ellington Pkwy",
    "Charlotte Ave", "West End Ave", "Broadway", "Murfreesboro Pike",
    "Gallatin Pike", "Nolensville Pike", "Lebanon Pike", "Old Hickory Blvd",
    "Harding Pl", "Woodmont Blvd", "8th Ave S", "21st Ave S"
]

# Incident descriptions
DESCRIPTIONS = [
    "Minor fender bender", "Multi-vehicle crash", "Stalled vehicle",
    "Road debris", "Overturned vehicle", "Construction lane closure",
    "Traffic signal issue", "Police activity", "Disabled tractor-trailer",
    "Shoulder blocked", "Ramp backup", "Oil spill cleanup"
]

# Severity levels with realistic distribution
SEVERITIES = ["Low", "Medium", "High"]
SEVERITY_WEIGHTS = [0.5, 0.35, 0.15]  # 50% Low, 35% Medium, 15% High

def random_location():
    """Generate random Nashville traffic location"""
    road = random.choice(ROADS)
    neighborhood = random.choice(NEIGHBORHOODS)
    segment = random.choice([
        "@ Exit 52", "@ Exit 209", "@ Wedgewood", "@ Charlotte Ave",
        "near Demonbreun", "near Broadway", "at Briley Pkwy",
        "near Old Hickory Blvd", "near 21st Ave S", "near Spence Ln"
    ])
    return f"{road} {segment}, {neighborhood}"

def make_sample_data(filename="generated_seed_data.sql", rows=200, days_back=60):
    """
    Generate SQL INSERT statements for traffic incidents
    
    Args:
        filename: Output SQL file path
        rows: Number of incidents to generate
        days_back: Date range in days from today
    """
    now = datetime.datetime.now()
    
    # Generate SQL header
    sql_lines = [
        "-- ============================================================",
        "-- TrafficWiz - Generated Traffic Incidents Data",
        "-- ============================================================",
        f"-- Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}",
        f"-- Records: {rows} incidents over {days_back} days",
        "-- ============================================================",
        "",
        "USE trafficwiz;",
        "",
        "-- Optional: Clear existing data",
        "-- TRUNCATE TABLE traffic_incidents;",
        "",
        "INSERT INTO traffic_incidents (date, location, severity, description)",
        "VALUES"
    ]
    
    # Generate incident data
    incidents = []
    for i in range(rows):
        # Random datetime within range
        random_days = random.randint(0, days_back)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        incident_date = now - datetime.timedelta(
            days=random_days,
            hours=random_hours,
            minutes=random_minutes
        )
        
        # Random incident details
        location = random_location()
        severity = random.choices(SEVERITIES, weights=SEVERITY_WEIGHTS, k=1)[0]
        description = random.choice(DESCRIPTIONS)
        
        # Format SQL value row
        date_str = incident_date.strftime('%Y-%m-%d %H:%M:%S')
        # Escape single quotes in location/description
        location_escaped = location.replace("'", "''")
        description_escaped = description.replace("'", "''")
        
        value_row = f"  ('{date_str}', '{location_escaped}', '{severity}', '{description_escaped}')"
        
        # Add comma except for last row
        if i < rows - 1:
            value_row += ","
        else:
            value_row += ";"
        
        incidents.append(value_row)
    
    # Combine all SQL lines
    sql_content = "\n".join(sql_lines + incidents)
    sql_content += "\n\n-- Verify insertion\nSELECT COUNT(*) as total_incidents FROM traffic_incidents;\n"
    
    # Write to file
    with open(filename, 'w') as f:
        f.write(sql_content)
    
    print(f"✅ Generated {rows} incidents in {filename}")
    print(f"📊 Date range: {days_back} days")
    print(f"💾 Run: mysql -u trafficwiz_user -p trafficwiz < {filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate SQL seed data for traffic incidents")
    parser.add_argument("--n", type=int, default=200, help="Number of incidents to generate")
    parser.add_argument("--days", type=int, default=60, help="Date range in days from today")
    parser.add_argument("--output", type=str, default="generated_seed_data.sql", help="Output SQL filename")
    
    args = parser.parse_args()
    make_sample_data(filename=args.output, rows=args.n, days_back=args.days)