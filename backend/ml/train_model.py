"""
============================================================
TrafficWiz - ML Model Training Script
============================================================
Purpose: Train and save machine learning model for traffic predictions

Features:
- Loads training data from traffic_data.csv
- Trains RandomForestRegressor model
- Calculates performance metrics (R², MAE)
- Saves trained model to model.pkl (joblib format)
- Saves metrics to metrics.json

Outputs:
- model.pkl: Serialized model for /predict endpoint
- metrics.json: Training metrics for /metrics endpoint

Usage:
  python train_model.py

Called by:
- POST /retrain endpoint (triggers retraining)
- Manual execution for initial model creation

Note: Requires traffic_data.csv with feature columns
Customize features and target in this script as needed
============================================================
"""

import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.ensemble import RandomForestRegressor

DATA_PATH = Path("traffic_data.csv")
MODEL_PATH = Path("model.pkl")
METRICS_PATH = Path("metrics.json")

def load_data():
    df = pd.read_csv(DATA_PATH)
    # Our generated data columns
    features = ["accidents", "avg_speed"]
    target = "traffic_volume"
    X = df[features]
    y = df[target]
    return X, y

def train():
    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200, random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    metrics = {
        "r2": float(r2_score(y_test, preds)),
        "mae": float(mean_absolute_error(y_test, preds)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "features": list(X.columns),
        "target": "traffic_volume"
    }

    joblib.dump(model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    print(f"✅ Saved model to {MODEL_PATH.resolve()}")
    print(f"📊 Metrics:\n{json.dumps(metrics, indent=2)}")

if __name__ == "__main__":
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Could not find {DATA_PATH}. Run make_sample_data.py first."
        )
    train()