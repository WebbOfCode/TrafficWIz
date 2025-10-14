"""
============================================================
TrafficWiz - Sample Data Generator for ML Training
============================================================
Purpose: Create synthetic traffic dataset for model training

Features:
- Generates CSV file with randomized traffic features
- Configurable number of rows (default: 200)
- Columns: traffic_volume, accidents, avg_speed, road_condition, risk_score
- Uses numpy random seed for reproducible data

Output:
- traffic_data.csv: Training dataset for train_model.py

Usage:
  from make_sample_data import make_sample_data
  make_sample_data("traffic_data.csv", rows=500)

Note: This generates synthetic data for demonstration
      Replace with real data pipeline for production
============================================================
"""

import pandas as pd
import numpy as np

def make_sample_data(filename="traffic_data.csv", rows=200):
    np.random.seed(42)
    data = {
        "traffic_volume": np.random.randint(100, 1000, rows),
        "accidents": np.random.randint(0, 5, rows),
        "avg_speed": np.random.uniform(30, 70, rows),
        "road_condition": np.random.choice(["Good", "Moderate", "Poor"], rows),
        "day_of_week": np.random.choice(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], rows
        ),
    }
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"✅ Sample data saved to {filename}")

if __name__ == "__main__":
    make_sample_data()