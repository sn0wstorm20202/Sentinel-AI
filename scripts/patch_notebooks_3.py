import json
import glob

notebooks = glob.glob("notebooks/*.ipynb")

bad_substrings = [
    'if (current / "src").exists():',
    'sys.path.insert(0, str(current))',
    'sys.path.insert(0, str(Path.cwd()))',
    'break',
    'current = current.parent',
    'else:',
    'raise RuntimeError("Project root could not be located.")',
    'current = Path.cwd().resolve()',
    'while current != current.parent:'
]

for nb_file in notebooks:
    with open(nb_file, 'r', encoding='utf-8') as f:
        nb_data = json.load(f)
        
    for cell in nb_data.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = cell.get('source', [])
            
            new_source = []
            for line in source:
                # If the line contains any of the bad substrings (ignoring whitespace), skip it
                if any(bad in line for bad in bad_substrings) and not line.startswith('import '):
                    continue
                new_source.append(line)
            
            # Ensure bootstrap is only added once
            if not any('from src.utils.bootstrap import bootstrap' in l for l in new_source):
                new_source = [
                    "from src.utils.bootstrap import bootstrap\n",
                    "bootstrap()\n",
                    "\n"
                ] + new_source
                
            cell['source'] = new_source
            break # Only patch the first code cell
                
    with open(nb_file, 'w', encoding='utf-8') as f:
        json.dump(nb_data, f, indent=1)
            
print("Patching complete.")
