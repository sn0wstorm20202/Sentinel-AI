import json
import re

nb9 = "notebooks/09_MLOps_Drift_Monitoring.ipynb"
with open(nb9, 'r', encoding='utf-8') as f:
    data = json.load(f)

for cell in data.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = "".join(cell['source'])
        
        if "from src.graph_learning.model_registry.ModelRegistry import ModelRegistry" in source and "ModelRegistration" not in source:
            source = source.replace("from src.graph_learning.model_registry.ModelRegistry import ModelRegistry", 
                                    "from src.graph_learning.model_registry.ModelRegistry import ModelRegistry, ModelRegistration")
            
            cell['source'] = [s + '\n' for s in source.split('\n')]
            if cell['source'] and cell['source'][-1] == '\n':
                cell['source'] = cell['source'][:-1]
            elif cell['source']:
                cell['source'][-1] = cell['source'][-1].rstrip('\n')

with open(nb9, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1)

print("Notebook 09 import patched successfully.")
