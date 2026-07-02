import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    has_logging = any('import logging' in line for line in lines)
    has_logger = any('logger = logging.getLogger(__name__)' in line for line in lines)
    
    new_lines = []
    changed = False
    for line in lines:
        if 'print(' in line and not line.strip().startswith('#'):
            line = line.replace('print(', 'logger.info(')
            changed = True
        new_lines.append(line)
        
    if changed:
        if not has_logger:
            # Insert logger after imports
            insert_idx = 0
            for i, line in enumerate(new_lines):
                if line.startswith('import ') or line.startswith('from '):
                    insert_idx = i + 1
            
            if not has_logging:
                new_lines.insert(insert_idx, "import logging\n")
                insert_idx += 1
            new_lines.insert(insert_idx, "\nlogger = logging.getLogger(__name__)\n")
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Patched {filepath}")

replace_in_file('src/engine/FraudDecisionEngine.py')
replace_in_file('src/graph_learning/GraphLearningOrchestrator.py')
replace_in_file('src/mlops/MLOpsOrchestrator.py')
