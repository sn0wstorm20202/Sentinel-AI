import json
import glob

bootstrap_code = [
    "from pathlib import Path\n",
    "import sys\n",
    "\n",
    "current = Path.cwd().resolve()\n",
    "while current != current.parent:\n",
    "    if (current / \"src\").exists():\n",
    "        sys.path.insert(0, str(current))\n",
    "        break\n",
    "    current = current.parent\n",
    "else:\n",
    "    raise RuntimeError(\"Project root could not be located.\")\n"
]

notebooks = glob.glob("notebooks/*.ipynb")

for nb_file in notebooks:
    with open(nb_file, 'r', encoding='utf-8') as f:
        nb_data = json.load(f)
        
    modified = False
    for cell in nb_data.get('cells', []):
        if cell.get('cell_type') == 'code':
            source = cell.get('source', [])
            new_source = []
            replaced = False
            for line in source:
                if 'sys.path.insert(0, str(Path.cwd()))' in line:
                    replaced = True
                else:
                    new_source.append(line)
            
            if replaced:
                # Prepend the bootstrap code to this cell if we removed the old insert
                # Actually, we need to ensure pathlib and sys are imported, but they usually are.
                # Let's just insert the bootstrap code at the exact place.
                idx = 0
                # find where to insert (after imports)
                for i, l in enumerate(new_source):
                    if l.startswith('import ') or l.startswith('from '):
                        idx = i + 1
                
                # Let's just put it at the end of the cell or replace exactly
                cell['source'] = bootstrap_code + new_source
                modified = True
                print(f"Patched {nb_file}")
                
    if modified:
        with open(nb_file, 'w', encoding='utf-8') as f:
            json.dump(nb_data, f, indent=1)
            
print("Patching complete.")
