import json
import re

nb9 = "notebooks/09_MLOps_Drift_Monitoring.ipynb"
with open(nb9, 'r', encoding='utf-8') as f:
    data = json.load(f)

for cell in data.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = "".join(cell['source'])
        
        # We want to replace:
        # champ = registry.register_model(
        #     model_name="Full_Fusion_XGBoost",
        #     experiment_id="4_Full_Fusion",
        #     dataset_hash="1234abcd",
        #     metrics={"pr_auc": 0.95, "f1": 0.92},
        #     status="Champion"
        # )
        
        if "registry.register_model(" in source and "ModelRegistration" not in source:
            # Simple regex replace for the whole block
            pattern = re.compile(r'champ = registry\.register_model\(\s*model_name="Full_Fusion_XGBoost",\s*experiment_id="4_Full_Fusion",\s*dataset_hash="1234abcd",\s*metrics=\{"pr_auc": 0\.95, "f1": 0\.92\},\s*status="Champion"\s*\)', re.MULTILINE)
            
            replacement = """champ = registry.register_model(ModelRegistration(
    model_name="Full_Fusion_XGBoost",
    experiment_id="4_Full_Fusion",
    dataset_hash="1234abcd",
    metrics={"pr_auc": 0.95, "f1": 0.92},
    status="Champion"
))"""
            new_source = pattern.sub(replacement, source)
            
            if new_source != source:
                cell['source'] = [s + '\n' for s in new_source.split('\n')]
                if cell['source'] and cell['source'][-1] == '\n':
                    cell['source'] = cell['source'][:-1]
                elif cell['source']:
                    cell['source'][-1] = cell['source'][-1].rstrip('\n')

with open(nb9, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1)

print("Notebook 09 patched successfully.")
