import subprocess
import sys
import time

def run_script(script_name):
    print(f"\n{'='*50}")
    print(f"Running {script_name}...")
    print(f"{'='*50}")
    
    start_time = time.time()
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        elapsed = time.time() - start_time
        print(f"PASS: {script_name} passed in {elapsed:.2f}s")
        return True
    except subprocess.CalledProcessError as e:
        print(e.stdout)
        print(e.stderr)
        elapsed = time.time() - start_time
        print(f"FAIL: {script_name} FAILED in {elapsed:.2f}s")
        return False

def main():
    print("Starting RC-2 Master Validation Suite...\n")
    
    scripts_to_run = [
        "validate_package.py",          # Stage 3
        "validate_artifacts.py",        # Stage 4
        "validate_api.py",              # Stage 5
        "validate_logic.py",            # Stage 6
        "validate_graph_pipeline.py",   # Stage 7
        "validate_ml_pipeline.py",      # Stage 8
        "validate_mlops_pipeline.py",   # Stage 9
        "validate_docs.py",             # Stage 10
        "validate_e2e_simulation.py"    # Stage 11
    ]
    
    total = len(scripts_to_run)
    passed = 0
    
    for script in scripts_to_run:
        if run_script(script):
            passed += 1
            
    print(f"\n{'='*50}")
    print(f"MASTER VALIDATION COMPLETE: {passed}/{total} stages passed.")
    print(f"{'='*50}")
    
    if passed == total:
        print("\nALL SYSTEMS GO. RC-2 IS READY FOR PRODUCTION.")
    else:
        print("\nVALIDATION FAILED. Review logs above.")

if __name__ == "__main__":
    main()
