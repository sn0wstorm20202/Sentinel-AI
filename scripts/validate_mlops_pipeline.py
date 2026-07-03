import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from src.mlops.drift.DataDriftEngine import DataDriftEngine
from src.mlops.drift.PredictionDriftEngine import PredictionDriftEngine
from src.mlops.drift.ConceptDriftEngine import ConceptDriftEngine
from src.mlops.drift.EmbeddingDriftEngine import EmbeddingDriftEngine
from src.mlops.alerting.AlertEngine import AlertEngine
from src.mlops.retraining.RetrainingEngine import RetrainingEngine
from src.mlops.shadow.ShadowDeploymentEngine import ShadowDeploymentEngine
from src.graph_learning.model_registry.ModelRegistry import ModelRegistry, ModelRegistration

def run_mlops_validation():
    print("Starting Stage 9 - MLOps Validation...")
    results = []
    failures = 0
    
    # ---------------------------------------------------------
    # 1. PSI (Data Drift)
    # ---------------------------------------------------------
    print("Testing Data Drift (PSI)...")
    try:
        de = DataDriftEngine()
        df_ref = pd.DataFrame({"F1": np.random.normal(0, 1, 1000)})
        df_clean = pd.DataFrame({"F1": np.random.normal(0, 1, 1000)})
        df_drift = pd.DataFrame({"F1": np.random.normal(5, 1, 1000)})
        
        psi_clean = de.calculate_psi(df_ref["F1"], df_clean["F1"])
        psi_drift = de.calculate_psi(df_ref["F1"], df_drift["F1"])
        
        if psi_clean < 0.1 and psi_drift > 0.2:
            results.append(("PSI (Data Drift)", "PASS", f"Stable PSI: {psi_clean:.3f}, Drift PSI: {psi_drift:.3f}"))
        else:
            results.append(("PSI (Data Drift)", "FAIL", "PSI calculations did not breach threshold correctly"))
            failures += 1
    except Exception as e:
        results.append(("PSI (Data Drift)", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 2. Prediction Drift
    # ---------------------------------------------------------
    print("Testing Prediction Drift...")
    try:
        pde = PredictionDriftEngine()
        y_ref = pd.Series(np.random.beta(1, 9, 1000))
        y_prod = pd.Series(np.random.beta(5, 5, 1000))
        
        drift_results = pde.detect_drift(y_prod, y_ref)
        if drift_results.get("fraud_rate_shift_pct", 0) > 10.0:
            results.append(("Prediction Drift", "PASS", "Successfully detected prediction distribution shifts"))
        else:
            results.append(("Prediction Drift", "FAIL", "Failed to detect synthetic prediction drift"))
            failures += 1
    except Exception as e:
        results.append(("Prediction Drift", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 3. Concept Drift
    # ---------------------------------------------------------
    print("Testing Concept Drift...")
    try:
        cde = ConceptDriftEngine()
        y_true = np.array([0, 1, 0, 1])
        y_pred_prod = np.array([1, 0, 1, 0]) # terrible
        
        drift_res = cde.detect_drift(y_true, y_true, y_true, y_pred_prod)
        if drift_res.get("prauc_degradation", 0.0) > 0.1:
            results.append(("Concept Drift", "PASS", "Successfully detected underlying concept/performance drift"))
        else:
            results.append(("Concept Drift", "FAIL", "Did not trigger concept drift on massive performance drop"))
            failures += 1
    except Exception as e:
        results.append(("Concept Drift", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 4. Embedding Drift
    # ---------------------------------------------------------
    print("Testing Embedding Drift...")
    try:
        ede = EmbeddingDriftEngine()
        df_ref_emb = pd.DataFrame(np.random.normal(0, 1, (100, 4)))
        df_prod_emb = pd.DataFrame(np.random.normal(5, 1, (100, 4))) # shifted
        
        emb_res = ede.detect_drift(df_ref_emb, df_prod_emb)
        if emb_res.get("cosine_shift", 0.0) > 0:
            results.append(("Embedding Drift", "PASS", "Covariance/distance shift detected in Graph embeddings"))
        else:
            results.append(("Embedding Drift", "FAIL", "Failed to detect embedding shift"))
            failures += 1
    except Exception as e:
        results.append(("Embedding Drift", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 5. Alert Engine
    # ---------------------------------------------------------
    print("Testing Alert Engine...")
    try:
        alert_dir = Path("reports/temp_alerts")
        alert_dir.mkdir(parents=True, exist_ok=True)
        ae = AlertEngine(output_dir=str(alert_dir))
        ae.evaluate_psi(0.3, "F3924") # should trigger High Alert
        ae.export()
        
        with open(alert_dir / "alert_log.json", "r") as f:
            alerts = json.load(f)
        if len(alerts) > 0 and alerts[0]["severity"] == "CRITICAL":
            results.append(("Alert Engine", "PASS", "Alert logic triggered and logged correctly"))
        else:
            results.append(("Alert Engine", "FAIL", "Alert not registered properly"))
            failures += 1
    except Exception as e:
        results.append(("Alert Engine", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 6. Retraining Engine
    # ---------------------------------------------------------
    print("Testing Retraining Engine...")
    try:
        re = RetrainingEngine()
        rec = re.evaluate_retraining_need([
            {"severity": "CRITICAL", "metric": "Concept Drift", "message": "Massive drop"},
            {"severity": "WARNING", "metric": "Data Drift"}
        ])
        if rec.get("recommendation") == "IMMEDIATE_RETRAINING":
            results.append(("Retraining Engine", "PASS", "Retraining rules evaluated alerts successfully"))
        else:
            results.append(("Retraining Engine", "FAIL", "Retraining engine ignored Critical alerts"))
            failures += 1
    except Exception as e:
        results.append(("Retraining Engine", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 7. Shadow Deployment
    # ---------------------------------------------------------
    print("Testing Shadow Deployment...")
    try:
        sd = ShadowDeploymentEngine()
        y_true = np.array([0, 1, 0, 1])
        y_champ = np.array([0.8, 0.2, 0.1, 0.9])
        y_chall = np.array([0.1, 0.9, 0.1, 0.9]) # Perfect
        
        df_eval = sd.evaluate(y_true, y_champ, y_chall)
        if df_eval.iloc[1]["PR-AUC"] > df_eval.iloc[0]["PR-AUC"]:
            results.append(("Shadow Deployment", "PASS", "Challenger accurately evaluated against Champion"))
        else:
            results.append(("Shadow Deployment", "FAIL", "Evaluation metrics mismatched"))
            failures += 1
    except Exception as e:
        results.append(("Shadow Deployment", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 8. Model Registry
    # ---------------------------------------------------------
    print("Testing Model Registry...")
    try:
        reg_dir = Path("reports/temp_registry")
        reg_dir.mkdir(parents=True, exist_ok=True)
        mr = ModelRegistry(registry_dir=str(reg_dir))
        
        model_reg = ModelRegistration(
            model_name="MockSAGE",
            experiment_id="exp_123",
            dataset_hash="1234",
            metrics={"PR-AUC": 0.95},
            validation_status="PASS",
            deployment_ready="YES"
        )
        
        registered = mr.register_model(model_reg)
        mr.promote_to_champion(registered["model_id"])
        
        champ = mr.get_champion()
        if champ and champ["model_name"] == "MockSAGE":
            results.append(("Model Registry", "PASS", "Model registered and promoted to Champion"))
        else:
            results.append(("Model Registry", "FAIL", "Champion promotion failed"))
            failures += 1
    except Exception as e:
        results.append(("Model Registry", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # Output Report
    # ---------------------------------------------------------
    report_md = "# Stage 9 — MLOps Validation Report\n\n"
    report_md += "| Validation Target | Status | Notes |\n"
    report_md += "| :--- | :--- | :--- |\n"
    
    for target, status, notes in results:
        icon = "✅ PASS" if status == "PASS" else "❌ FAIL"
        report_md += f"| **{target}** | {icon} | {notes} |\n"
        
    report_md += f"\n**Overall Verdict:** {'✅ PASS' if failures == 0 else '❌ FAIL'} ({failures} failures)\n"
    
    Path("reports/MLOps_Validation_Report.md").write_text(report_md, encoding="utf-8")
    print(f"\nValidation Complete. Failures: {failures}")
    print("Report written to reports/MLOps_Validation_Report.md")

if __name__ == "__main__":
    run_mlops_validation()
