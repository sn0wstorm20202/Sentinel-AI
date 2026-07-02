import subprocess
import time
import json
import os
from pathlib import Path

notebooks = [
    "06_AI_Investigator_Copilot.ipynb",
    "07_Graph_Intelligence.ipynb",
    "08_Graph_Learning_Advanced_Intelligence.ipynb",
    "09_MLOps_Drift_Monitoring.ipynb"
]

report = []

total_time = 0
total_failures = 0
print(f"| Notebook | Status | Runtime | Artifacts | Notes |")
print(f"| --- | --- | --- | --- | --- |")

for nb in notebooks:
    nb_path = Path("notebooks") / nb
    if not nb_path.exists():
        print(f"| {nb} | FAIL | - | - | Missing File |")
        total_failures += 1
        continue
    
    start_time = time.time()
    
    # Run jupyter nbconvert
    cmd = [
        ".venv\\Scripts\\python", "-m", "jupyter", "nbconvert", 
        "--execute", "--to", "notebook", "--inplace", str(nb_path)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        end_time = time.time()
        elapsed = end_time - start_time
        total_time += elapsed
        
        minutes = int(elapsed // 60)
        seconds = int(elapsed % 60)
        runtime_str = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
        
        if result.returncode == 0:
            status = "PASS"
            phase_num = nb[:2]
            artifacts_dir = Path("reports") / f"phase_{phase_num}"
            artifacts_count = len(list(artifacts_dir.glob("*"))) if artifacts_dir.exists() else 0
            
            print(f"| {nb} | {status} | {runtime_str} | {artifacts_count} | - |")
        else:
            status = "FAIL"
            total_failures += 1
            print(f"| {nb} | {status} | {runtime_str} | - | Error: {result.stderr.strip().split()[-1] if result.stderr else 'Unknown'} |")
            with open(f"fail_{nb}.log", "w") as f:
                f.write(result.stderr)
            
    except Exception as e:
        status = "FAIL"
        total_failures += 1
        print(f"| {nb} | {status} | - | - | Exception: {str(e)} |")
        
print(f"\nTotal Execution Time: {int(total_time//60)}m {int(total_time%60)}s")
print(f"Total Failures: {total_failures}")
print(f"Overall Verdict: {'PASS' if total_failures == 0 else 'FAIL'}")
