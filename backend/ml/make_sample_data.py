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