import json

# Patch Notebook 06
nb6 = "notebooks/06_AI_Investigator_Copilot.ipynb"
with open(nb6, 'r', encoding='utf-8') as f:
    data = json.load(f)

for cell in data.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = cell['source']
        new_source = []
        for line in source:
            if 'import json' in line and 'src.utils.json_utils' not in "".join(source):
                new_source.append(line)
                new_source.append("from src.utils.json_utils import CustomJSONEncoder\n")
            elif 'json.dumps(case_json, indent=2)' in line:
                new_source.append(line.replace('json.dumps(case_json, indent=2)', 'json.dumps(case_json, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dumps(display_req, indent=2)' in line:
                new_source.append(line.replace('json.dumps(display_req, indent=2)', 'json.dumps(display_req, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dump(case_json, f, indent=2)' in line:
                new_source.append(line.replace('json.dump(case_json, f, indent=2)', 'json.dump(case_json, f, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dump(api_example, f, indent=2)' in line:
                new_source.append(line.replace('json.dump(api_example, f, indent=2)', 'json.dump(api_example, f, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dump(latency, f, indent=2)' in line:
                new_source.append(line.replace('json.dump(latency, f, indent=2)', 'json.dump(latency, f, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dump(all_cases, f, indent=2)' in line:
                new_source.append(line.replace('json.dump(all_cases, f, indent=2)', 'json.dump(all_cases, f, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dump(pipeline_metadata, f, indent=2)' in line:
                new_source.append(line.replace('json.dump(pipeline_metadata, f, indent=2)', 'json.dump(pipeline_metadata, f, cls=CustomJSONEncoder, indent=2)'))
            elif 'json.dumps(pipeline_metadata, indent=2)' in line:
                new_source.append(line.replace('json.dumps(pipeline_metadata, indent=2)', 'json.dumps(pipeline_metadata, cls=CustomJSONEncoder, indent=2)'))
            else:
                new_source.append(line)
        cell['source'] = new_source

with open(nb6, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1)


# Patch Notebook 09
nb9 = "notebooks/09_MLOps_Drift_Monitoring.ipynb"
with open(nb9, 'r', encoding='utf-8') as f:
    data = json.load(f)

for cell in data.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = cell['source']
        new_source = []
        for line in source:
            if 'from src.graph_learning.model_registry.ModelRegistry import ModelRegistry' in line:
                new_source.append(line)
                new_source.append("from src.graph_learning.model_registry.ModelRegistry import ModelRegistration\n")
            elif 'champ = registry.register_model(' in line:
                # We need to replace the call signature
                pass # We will handle this block manually below
            else:
                new_source.append(line)
        
        # Manually fix the register_model call
        source_str = "".join(new_source)
        if "champ = registry.register_model(" in source_str:
            old_block = '''champ = registry.register_model(
    model_name="Full_Fusion_XGBoost",
    experiment_id="4_Full_Fusion",
    dataset_hash="1234abcd",
    metrics={"pr_auc": 0.95, "f1": 0.92},
    status="Champion"
)'''
            new_block = '''champ = registry.register_model(ModelRegistration(
    model_name="Full_Fusion_XGBoost",
    experiment_id="4_Full_Fusion",
    dataset_hash="1234abcd",
    metrics={"pr_auc": 0.95, "f1": 0.92},
    status="Champion"
))'''
            source_str = source_str.replace(old_block, new_block)
            
            # Write back as list of lines
            # Split by \n, keeping the \n
            cell['source'] = [s + '\n' for s in source_str.split('\n')]
            # Remove the last empty string's newline
            if cell['source'] and cell['source'][-1] == '\n':
                cell['source'] = cell['source'][:-1]
            elif cell['source']:
                cell['source'][-1] = cell['source'][-1].rstrip('\n')

with open(nb9, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1)

print("Notebooks 06 and 09 patched successfully.")
