"""
============================================================
TrafficWiz - Local ML Prediction CLI Tool
============================================================
Purpose: Command-line utility for testing ML model predictions

Features:
- Load model.pkl from local filesystem
- Run predictions on sample data or JSON files
- Display prediction results in terminal
- Useful for testing/validation without running Flask server

Usage Examples:
  # Predict from JSON file
  python predict_local.py --input sample.json

  # Interactive mode
  python predict_local.py

  # Batch prediction
  python predict_local.py --input incidents.json --output results.json

Inputs:
- Expects model.pkl in same directory
- JSON input with feature columns matching training data

Note: This is a standalone tool - Flask /predict endpoint
      loads the model separately. Use this for development
      and testing without starting the full backend.
============================================================
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from joblib import load as joblib_load


# Where we expect the trained model (produced by train_model.py)
MODEL_PATH = Path(__file__).with_name("model.pkl")

# The feature names the model expects (must match train_model.py)
FEATURES = ["accidents", "avg_speed"]


# ------------------------
# Helpers
# ------------------------
def load_model():
    """
    Load the trained model from MODEL_PATH.
    """
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. "
            "Train a model first (run train_model.py) or check the path."
        )
    try:
        model = joblib_load(MODEL_PATH)
    except Exception as e:
        raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}") from e
    return model


def _rows_to_dataframe(rows: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert a list of mapping rows into a pandas DataFrame with the exact
    columns the model expects. Coerces to numeric and errors if required
    columns are missing.
    """
    if not isinstance(rows, list) or not all(isinstance(r, dict) for r in rows):
        raise ValueError("--json must be a JSON array of objects (list of dicts).")

    df = pd.DataFrame(rows)

    # Ensure required columns exist
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise KeyError(
            f"Missing required keys in JSON rows: {missing}. "
            f"Expected keys: {FEATURES}"
        )

    # Coerce to numeric
    for col in FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Guard against NaNs after coercion
    if df[FEATURES].isna().any().any():
        bad_cols = [c for c in FEATURES if df[c].isna().any()]
        raise ValueError(
            f"Some values in {bad_cols} could not be parsed as numbers."
        )

    return df[FEATURES]


def predict_batch(model, json_input: str) -> List[float]:
    """
    Accepts either:
      * a JSON string (e.g. '[{\"accidents\":2,\"avg_speed\":55}]'), or
      * a path to a .json file containing that array.
    Returns a list of float predictions.
    """
    # If the provided string is a path to a file, read it
    maybe_path = Path(json_input)
    if maybe_path.exists() and maybe_path.is_file():
        text = maybe_path.read_text(encoding="utf-8")
        data = json.loads(text)
    else:
        data = json.loads(json_input)

    df = _rows_to_dataframe(data)
    preds = model.predict(df)
    # Ensure pure Python floats for JSON serialization
    return [float(x) for x in np.asarray(preds).ravel().tolist()]


def predict_single(model, accidents: float, avg_speed: float) -> float:
    """
    Single row prediction helper.
    """
    df = pd.DataFrame([{FEATURES[0]: accidents, FEATURES[1]: avg_speed}])[FEATURES]
    pred = model.predict(df)[0]
    return float(pred)


# ------------------------
# CLI entry
# ------------------------
def main():
    parser = argparse.ArgumentParser(
        description=(
            "TrafficWiz local predictor: pass either --json (array of rows with "
            "'accidents' and 'avg_speed') OR both --accidents and --avg_speed."
        )
    )

    parser.add_argument(
        "--json",
        type=str,
        help=(
            "JSON array or path to a .json file. Example JSON: "
            '\'[{"accidents": 2, "avg_speed": 55}, {"accidents": 0, "avg_speed": 42}]\''
        ),
    )
    parser.add_argument(
        "--accidents",
        type=float,
        help="Number of accidents for a single prediction (float).",
    )
    parser.add_argument(
        "--avg_speed",
        type=float,
        help="Average speed (float, same unit used during training).",
    )

    args = parser.parse_args()
    model = load_model()

    # Batch mode via JSON (string or file path)
    if args.json is not None:
        try:
            preds = predict_batch(model, args.json)
        except Exception as e:
            # Present a clean error to the CLI user
            raise SystemExit(f"Error parsing --json input: {e}") from e

        print(json.dumps({"predictions": preds}, indent=2))
        return

    # Single example mode requires both scalars
    if args.accidents is None or args.avg_speed is None:
        parser.error(
            "When --json is not provided, both --accidents and --avg_speed are required."
        )

    yhat = predict_single(model, args.accidents, args.avg_speed)
    print(
        json.dumps(
            {
                "prediction": yhat,
                "inputs": {"accidents": args.accidents, "avg_speed": args.avg_speed},
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()