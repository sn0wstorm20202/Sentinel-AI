import json
import pandas as pd
import numpy as np
from pathlib import Path
from fastapi.testclient import TestClient

from src.api.InvestigatorAPI import app
from src.mlops.drift.DataDriftEngine import DataDriftEngine
from src.graph.CentralityEngine import CentralityEngine

def run_e2e_simulation():
    print("Starting Stage 11 - End-to-End Simulation...")
    results = []
    failures = 0
    client = TestClient(app)
    
    try:
        # 1. Transaction
        print("1. Loading Transaction...")
        df = pd.read_csv("data/selected/approved_features.csv")
        # Find a fraud transaction to ensure we hit the copilot logic (risk > threshold)
        fraud_df = df[df["F3924"] == 1].drop(columns=["F3924"])
        txn_features = fraud_df.iloc[0].to_dict()
        
        # We must sanitize the dict for JSON (no numpy types)
        clean_features = {}
        for k, v in txn_features.items():
            if pd.isna(v):
                clean_features[k] = 0.0
            elif isinstance(v, (np.int64, np.int32)):
                clean_features[k] = int(v)
            elif isinstance(v, (np.float64, np.float32)):
                clean_features[k] = float(v)
            else:
                clean_features[k] = v
                
        results.append(("Transaction", "PASS", "Transaction loaded and sanitized for JSON payload"))
        
        # 2. API -> Decision Engine -> Copilot -> JSON -> Frontend Contract
        print("2. Hitting API (Decision Engine + Copilot)...")
        payload = {
            "request_id": "REQ_001",
            "case_id": "CASE_999",
            "transaction_id": "TXN_888",
            "timestamp": "2026-07-01T00:00:00Z",
            "features": clean_features
        }
        
        response = client.post("/api/v1/cases/explain", json=payload)
        if response.status_code == 200:
            data = response.json()
            if "metadata" in data and "risk_assessment" in data and "intelligence" in data:
                results.append(("API & Copilot", "PASS", "API executed Decision Engine and Copilot. Returned valid Frontend Contract JSON"))
            else:
                results.append(("API & Copilot", "FAIL", "Response missing required contract fields"))
                failures += 1
        else:
            results.append(("API & Copilot", "FAIL", f"API Error {response.status_code}: {response.text}"))
            failures += 1

        # 3. Graph
        print("3. Querying Graph Intelligence...")
        graph_res = client.get("/api/v1/graph/statistics")
        if graph_res.status_code == 200:
            results.append(("Graph", "PASS", "Graph API responded successfully with topological intelligence"))
        else:
            results.append(("Graph", "FAIL", "Graph API failed"))
            failures += 1

        # 4. MLOps
        print("4. Triggering MLOps Monitoring...")
        de = DataDriftEngine()
        # Mock reference vs this single transaction (simulate batch)
        ref_series = pd.Series(np.random.normal(0, 1, 100))
        prod_series = pd.Series([clean_features.get("F1", 0.0)] * 100)
        psi = de.calculate_psi(ref_series, prod_series)
        results.append(("MLOps", "PASS", f"Data Drift Engine evaluated transaction batch (PSI: {psi:.3f})"))

    except Exception as e:
        results.append(("E2E Simulation", "FAIL", f"Exception during execution: {str(e)}"))
        failures += 1
        import traceback
        traceback.print_exc()

    # ---------------------------------------------------------
    # Output Report
    # ---------------------------------------------------------
    report_md = "# Stage 11 — End-to-End Simulation Report\n\n"
    report_md += "| Simulation Step | Status | Notes |\n"
    report_md += "| :--- | :--- | :--- |\n"
    
    for target, status, notes in results:
        icon = "✅ PASS" if status == "PASS" else "❌ FAIL"
        report_md += f"| **{target}** | {icon} | {notes} |\n"
        
    report_md += f"\n**Overall Verdict:** {'✅ PASS' if failures == 0 else '❌ FAIL'} ({failures} failures)\n"
    
    Path("reports/E2E_Simulation_Report.md").write_text(report_md, encoding="utf-8")
    print(f"\nSimulation Complete. Failures: {failures}")
    print("Report written to reports/E2E_Simulation_Report.md")

if __name__ == "__main__":
    run_e2e_simulation()
