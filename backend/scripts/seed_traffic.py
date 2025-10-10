import os, random, datetime
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

load_dotenv()

DB = dict(
    host=os.getenv("DB_HOST", "127.0.0.1"),
    user=os.getenv("DB_USER", "trafficwiz_user"),
    password=os.getenv("DB_PASSWORD", "StrongPass123!"),
    database=os.getenv("DB_NAME", "trafficwiz"),
    port=int(os.getenv("DB_PORT", "3306")),
)

NEIGHBORHOODS = [
    "Downtown", "The Gulch", "Midtown", "12 South", "East Nashville",
    "Germantown", "Sylvan Park", "Green Hills", "Hillsboro Village",
    "Berry Hill", "Donelson", "Hermitage", "Antioch", "Madison",
    "Bellevue", "West End", "Music Row", "SoBro", "Edgehill", "Inglewood"
]

ROADS = [
    "I-40", "I-24", "I-65", "I-440", "Briley Pkwy", "Ellington Pkwy",
    "Charlotte Ave", "West End Ave", "Broadway", "Murfreesboro Pike",
    "Gallatin Pike", "Nolensville Pike", "Lebanon Pike", "Old Hickory Blvd",
    "Harding Pl", "Woodmont Blvd", "8th Ave S", "21st Ave S"
]

DESCRIPTIONS = [
    "Minor fender bender", "Multi-vehicle crash", "Stalled vehicle",
    "Road debris", "Overturned vehicle", "Construction lane closure",
    "Traffic signal issue", "Police activity", "Disabled tractor-trailer",
    "Shoulder blocked", "Ramp backup", "Oil spill cleanup"
]

SEVERITIES = ["Low", "Medium", "High"]

def random_location():
    road = random.choice(ROADS)
    nh = random.choice(NEIGHBORHOODS)
    segment = random.choice([
        "@ Exit 52", "@ Exit 209", "@ Wedgewood", "@ Charlotte Ave",
        "near Demonbreun", "near Broadway", "at Briley Pkwy",
        "near Old Hickory Blvd", "near 21st Ave S", "near Spence Ln"
    ])
    return f"{road} {segment}, {nh}"

def main(n=200, days_back=60):
    try:
        conn = mysql.connector.connect(**DB)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS traffic_incidents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATETIME NOT NULL,
                location VARCHAR(255) NOT NULL,
                severity ENUM('Low','Medium','High') NOT NULL,
                description TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        rows = []
        now = datetime.datetime.now()
        for _ in range(n):
            dt = now - datetime.timedelta(
                days=random.randint(0, days_back),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            location = random_location()
            sev = random.choices(SEVERITIES, weights=[0.5, 0.35, 0.15], k=1)[0]
            desc = random.choice(DESCRIPTIONS)
            rows.append((dt.strftime("%Y-%m-%d %H:%M:%S"), location, sev, desc))

        cur.executemany(
            "INSERT INTO traffic_incidents (date, location, severity, description) VALUES (%s, %s, %s, %s)",
            rows
        )
        conn.commit()
        print(f"✅ Inserted {cur.rowcount} sample incidents.")
    except Error as e:
        print("❌ MySQL error:", e)
    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=200)
    ap.add_argument("--days", type=int, default=60)
    args = ap.parse_args()
    main(n=args.n, days_back=args.days)