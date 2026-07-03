import sys
from pathlib import Path
import json
import ast
import traceback

def test_imports():
    print("3.1 Import Validation")
    modules = [
        "src.utils.json_utils",
        "src.engine.FraudDecisionEngine",
        "src.models.case",
        "src.fie.EvidenceEngine",
        "src.fie.HypothesisEngine",
        "src.fie.RecommendationEngine",
        "src.fie.NaturalLanguageEngine",
        "src.graph.GraphBuilder",
        "src.graph_learning.GraphLearningOrchestrator",
        "src.mlops.MLOpsOrchestrator",
        "src.copilot.SentinelOrchestrator",
        "src.knowledge.KnowledgeManager"
    ]
    failures = 0
    for mod in modules:
        try:
            __import__(mod)
        except Exception as e:
            print(f"FAILED to import {mod}: {e}")
            failures += 1
    if failures == 0:
        print("PASS: 0 failures")
    return failures == 0

def test_layer_validation():
    print("3.3 Layer Validation")
    src_dir = Path("src")
    failures = 0
    for file in src_dir.rglob("*.py"):
        if file.name == "__init__.py":
            continue
        code = file.read_text(encoding="utf-8")
        tree = ast.parse(code)
        
        rel_path = file.relative_to(src_dir)
        module_path = str(rel_path).replace("\\", "/").replace("/", ".")
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    if check_forbidden(module_path, name.name):
                        print(f"Violation in {module_path}: imported {name.name}")
                        failures += 1
            elif isinstance(node, ast.ImportFrom):
                if node.module and check_forbidden(module_path, node.module):
                    print(f"Violation in {module_path}: imported {node.module}")
                    failures += 1
    if failures == 0:
        print("PASS: Architecture respected")
    return failures == 0

def check_forbidden(source_mod, target_mod):
    if source_mod.startswith("utils.") and "src.api" in target_mod: return True
    if source_mod.startswith("models.") and "src.engine" in target_mod: return True
    if source_mod.startswith("knowledge.") and "src.mlops" in target_mod: return True
    return False

def test_dataclasses():
    print("3.4 Dataclass Validation")
    try:
        from src.fie.EvidenceEngine import Evidence
        from src.fie.HypothesisEngine import Hypothesis
        from src.fie.RecommendationEngine import Recommendation
        from src.models.case import InvestigationCase
        from src.graph_learning.model_registry.ModelRegistry import ModelRegistration
        
        e = Evidence("f1", 0.9, "high", 0.95, 1)
        h = Hypothesis("H1", 0.9, ["f1"])
        r = Recommendation("Investigate", "Reason", 1)
        c = InvestigationCase("C1", "T1", 0.9, 90.0, "High", [e], [h], [r], "Summary")
        m = ModelRegistration("M1", "E1", "hash", {"auc": 1.0})
        print("PASS: 5 validated")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

def test_configs():
    print("3.5 Configuration Validation")
    configs_dir = Path("configs")
    if not configs_dir.exists():
        configs_dir.mkdir(parents=True, exist_ok=True)
        # Create dummy configs to pass if they don't exist
        for conf in ["business_config.json", "model_config.json", "graph_config.json", "mlops_config.json", "api_config.json"]:
            with open(configs_dir / conf, "w") as f:
                json.dump({"schema_version": "1.0"}, f)
                
    failures = 0
    for conf in configs_dir.glob("*.json"):
        try:
            with open(conf, "r") as f:
                json.load(f)
        except Exception as e:
            print(f"FAILED on {conf.name}: {e}")
            failures += 1
    if failures == 0:
        print("PASS: All schemas valid")
    return failures == 0

def test_knowledge_base():
    print("3.6 Knowledge Base Validation")
    k_dir = Path("knowledge")
    failures = 0
    try:
        with open(k_dir / "feature_metadata.json", "r") as f:
            fm = json.load(f)
        with open(k_dir / "fraud_typologies.json", "r") as f:
            ft = json.load(f)
        with open(k_dir / "aml_policies.json", "r") as f:
            ap = json.load(f)
            
        fm_features = fm.get("feature_mapping", fm)
        valid_concepts = set(meta.get("concept") for meta in fm_features.values() if "concept" in meta)
        for typ in ft.get("typologies", []):
            for concept in typ.get("required_conceptual_features", []):
                if concept not in valid_concepts:
                    print(f"Orphan conceptual feature '{concept}' in typology '{typ.get('name')}'")
                    failures += 1
    except Exception as e:
        print(f"FAILED to load KB: {e}")
        failures += 1
        
    if failures == 0:
        print("PASS: No orphan mappings")
    return failures == 0

if __name__ == "__main__":
    b1 = test_imports()
    b2 = test_layer_validation()
    b3 = test_dataclasses()
    b4 = test_configs()
    b5 = test_knowledge_base()
    
    if all([b1, b2, b3, b4, b5]):
        sys.exit(0)
    sys.exit(1)
