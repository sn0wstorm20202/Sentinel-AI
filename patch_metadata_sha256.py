import json
from pathlib import Path
import hashlib

# 1. Update all metadata files to include artifact_version
for meta_path in Path('reports').rglob('*metadata*.json'):
    with open(meta_path, 'r') as f:
        data = json.load(f)
    
    if "artifact_version" not in data:
        data["artifact_version"] = "1.0"
        
    if "phase" not in data:
        # Infer phase from path
        if "phase_" in str(meta_path):
            phase = str(meta_path).split("phase_")[1][:2]
            data["phase"] = phase
        else:
            data["phase"] = "Unknown"
            
    with open(meta_path, 'w') as f:
        json.dump(data, f, indent=2)

print("Updated metadata files with artifact_version")

# 2. Update validate_artifacts.py to use sha256 instead of md5
val_path = Path("validate_artifacts.py")
code = val_path.read_text()
code = code.replace("hashlib.md5()", "hashlib.sha256()")
code = code.replace("file_hash = get_hash(filepath)", "file_hash = get_hash(filepath)\n        # Using SHA-256 for enterprise integrity validation")
val_path.write_text(code)
print("Updated validate_artifacts.py to use SHA-256")
