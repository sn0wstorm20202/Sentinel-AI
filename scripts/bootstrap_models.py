"""
Bootstrap Model Generator for Sentinel AI
==========================================
Generates functional champion_model_calibrated.pkl and shap_explainer.pkl
from the actual training data when real model artifacts are unavailable.

This creates a REAL trained model (not a mock/stub) using the same architecture
documented in the stabilization report:
  - CalibratedClassifierCV wrapping XGBClassifier
  - Trained on the selected features from the data pipeline
  - SHAP TreeExplainer for explainability

Usage:
    python -m scripts.bootstrap_models
    python scripts/bootstrap_models.py
"""

import os
import sys
import pickle
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def find_project_root():
    """Locate the project root directory."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        if (current / "src").exists() and (current / "configs").exists():
            return current
        current = current.parent
    # Fallback: check CWD
    cwd = Path.cwd().resolve()
    if (cwd / "src").exists():
        return cwd
    raise RuntimeError("Cannot locate project root")


def bootstrap_models(models_dir: Path, data_dir: Path):
    """Generate champion model and SHAP explainer from training data."""

    champion_path = models_dir / "champion_model_calibrated.pkl"
    explainer_path = models_dir / "shap_explainer.pkl"

    if champion_path.exists() and explainer_path.exists():
        # Verify they are real files (not LFS pointers)
        champion_size = champion_path.stat().st_size
        explainer_size = explainer_path.stat().st_size
        if champion_size > 1000 and explainer_size > 1000:
            logger.info(
                f"Model files already exist and appear valid "
                f"(champion={champion_size} bytes, explainer={explainer_size} bytes). "
                f"Skipping bootstrap."
            )
            return True

        logger.warning(
            f"Model files exist but appear to be stubs/pointers "
            f"(champion={champion_size} bytes, explainer={explainer_size} bytes). "
            f"Regenerating..."
        )

    logger.info("Bootstrapping model artifacts...")

    try:
        import numpy as np
        import pandas as pd
        from xgboost import XGBClassifier
        from sklearn.calibration import CalibratedClassifierCV
        from sklearn.model_selection import train_test_split
        import shap
    except ImportError as e:
        logger.error(f"Missing dependency for model bootstrap: {e}")
        logger.error("Install requirements: pip install xgboost scikit-learn shap pandas numpy")
        return False

    # --- Load training data ---
    feature_data_path = data_dir / "engineered" / "feature_engineered_dataset.csv"
    if not feature_data_path.exists():
        # Fallback to raw data
        feature_data_path = data_dir / "raw" / "bank_fraud_dataset.csv"

    if not feature_data_path.exists():
        logger.error(f"No training data found at {feature_data_path}")
        return False

    logger.info(f"Loading training data from {feature_data_path}...")
    df = pd.read_csv(feature_data_path)

    # Identify target column
    target_col = None
    for candidate in ["fraud_bool", "is_fraud", "target", "label", "fraud"]:
        if candidate in df.columns:
            target_col = candidate
            break

    if target_col is None:
        # Try the last column if it looks binary
        last_col = df.columns[-1]
        if df[last_col].nunique() <= 2:
            target_col = last_col
        else:
            logger.error("Cannot identify target column in training data")
            return False

    logger.info(f"Using target column: {target_col}")

    # Separate features and target
    y = df[target_col].astype(int)
    X = df.drop(columns=[target_col])

    # Keep only numeric columns
    X = X.select_dtypes(include=[np.number])

    # Handle NaN/Inf
    X = X.replace([np.inf, -np.inf], np.nan)

    logger.info(f"Training data shape: {X.shape} (features={X.shape[1]}, samples={X.shape[0]})")
    logger.info(f"Target distribution: {y.value_counts().to_dict()}")

    # --- Train model ---
    X_train, X_cal, y_train, y_cal = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    logger.info("Training XGBClassifier...")
    base_model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=len(y_train[y_train == 0]) / max(len(y_train[y_train == 1]), 1),
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
    )
    base_model.fit(X_train, y_train, eval_set=[(X_cal, y_cal)], verbose=False)

    logger.info("Calibrating with CalibratedClassifierCV...")
    calibrated_model = CalibratedClassifierCV(base_model, cv="prefit", method="sigmoid")
    calibrated_model.fit(X_cal, y_cal)

    # Verify the model has feature_names_in_
    if not hasattr(calibrated_model, "feature_names_in_"):
        calibrated_model.feature_names_in_ = np.array(X.columns.tolist())

    # --- Create SHAP explainer ---
    logger.info("Creating SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(base_model)

    # --- Save artifacts ---
    models_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Saving champion model to {champion_path}...")
    with open(champion_path, "wb") as f:
        pickle.dump(calibrated_model, f)

    logger.info(f"Saving SHAP explainer to {explainer_path}...")
    with open(explainer_path, "wb") as f:
        pickle.dump(explainer, f)

    # Verify
    champion_size = champion_path.stat().st_size
    explainer_size = explainer_path.stat().st_size
    logger.info(
        f"Bootstrap complete! "
        f"champion_model_calibrated.pkl = {champion_size:,} bytes, "
        f"shap_explainer.pkl = {explainer_size:,} bytes"
    )

    # Quick smoke test
    logger.info("Running smoke test...")
    with open(champion_path, "rb") as f:
        test_model = pickle.load(f)
    test_proba = test_model.predict_proba(X.head(1))[0, 1]
    logger.info(f"Smoke test prediction: {test_proba:.4f} — Model is functional!")

    return True


def main():
    root = find_project_root()
    os.chdir(root)
    logger.info(f"Project root: {root}")

    models_dir = root / "models"
    data_dir = root / "data"

    success = bootstrap_models(models_dir, data_dir)
    if not success:
        logger.error("Model bootstrap FAILED")
        sys.exit(1)

    logger.info("Model bootstrap completed successfully")


if __name__ == "__main__":
    main()
