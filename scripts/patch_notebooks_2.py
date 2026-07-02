import json
import glob

notebooks = glob.glob("notebooks/*.ipynb")

for nb_file in notebooks:
    with open(nb_file, 'r', encoding='utf-8') as f:
        nb_data = json.load(f)
        
    for cell in nb_data.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = cell.get('source', [])
            
            # Remove any existing sys.path or os.chdir lines
            new_source = []
            for line in source:
                if 'sys.path.insert' in line or 'Path.cwd()' in line or 'from src.utils.bootstrap' in line or 'bootstrap()' in line or 'while current !=' in line or 'current = current.parent' in line:
                    continue
                new_source.append(line)
            
            # Prepend the new bootstrap logic
            bootstrap_code = [
                "from src.utils.bootstrap import bootstrap\n",
                "bootstrap()\n",
                "\n"
            ]
            
            cell['source'] = bootstrap_code + new_source
            break # Only patch the first code cell
                
    with open(nb_file, 'w', encoding='utf-8') as f:
        json.dump(nb_data, f, indent=1)
            
print("Patching complete.")
