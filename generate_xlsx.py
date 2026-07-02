import sys
import subprocess

try:
    import openpyxl
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])

import json
import pandas as pd
from pathlib import Path

def generate_report():
    print("Generating ranked candidates report...")
    
    cases_path = Path("reports/phase_06/case_examples.json")
    if not cases_path.exists():
        print(f"Error: {cases_path} not found.")
        return
        
    with open(cases_path, "r") as f:
        cases = json.load(f)
        
    data = []
    for c in cases:
        data.append({
            "Case ID": c["metadata"]["case_id"],
            "Transaction ID": c["metadata"]["transaction_id"],
            "Risk Tier": c["risk_assessment"]["risk_tier"],
            "Risk Score": c["risk_assessment"]["risk_score"],
            "Probability": c["risk_assessment"]["probability"],
            "Date": c["metadata"]["generated_at"],
            "Summary": c["intelligence"].get("natural_language_summary", "")
        })
        
    df = pd.DataFrame(data)
    # Sort by highest risk score first
    df = df.sort_values(by="Risk Score", ascending=False)
    
    output_file = "ranked_fraud_candidates.xlsx"
    df.to_excel(output_file, index=False)
    print(f"Successfully created {output_file}!")

if __name__ == "__main__":
    generate_report()
