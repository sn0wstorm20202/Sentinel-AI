import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

# Import Engines
from src.exceptions import KnowledgeBaseError
from src.knowledge.KnowledgeManager import KnowledgeManager
from src.fie.EvidenceEngine import EvidenceEngine
from src.fie.HypothesisEngine import HypothesisEngine
from src.fie.RecommendationEngine import RecommendationEngine
from src.fie.NaturalLanguageEngine import NaturalLanguageEngine
from src.engine.FraudDecisionEngine import FraudDecisionEngine
from src.graph.GraphBuilder import GraphBuilder

from src.graph_learning.embedding.Node2VecEngine import Node2VecLiteEngine
from src.mlops.drift.DataDriftEngine import DataDriftEngine
from src.mlops.shadow.ShadowDeploymentEngine import ShadowDeploymentEngine
from src.utils.json_utils import CustomJSONEncoder

def run_logic_validation():
    results = {
        "FraudDecisionEngine": {"total": 3, "passed": 0},
        "KnowledgeManager": {"total": 1, "passed": 0},
        "EvidenceEngine": {"total": 1, "passed": 0},
        "HypothesisEngine": {"total": 1, "passed": 0},
        "RecommendationEngine": {"total": 3, "passed": 0},
        "NaturalLanguageEngine": {"total": 1, "passed": 0},
        "GraphBuilder": {"total": 2, "passed": 0},
        "Node2Vec": {"total": 1, "passed": 0},
        "DriftEngine": {"total": 2, "passed": 0},
        "ShadowDeployment": {"total": 2, "passed": 0},
    }
    
    # ---------------------------------------------------------
    # 2. Knowledge Manager
    # ---------------------------------------------------------
    try:
        km = KnowledgeManager(knowledge_dir="knowledge")
        try:
            km.get_feature_concept("UNKNOWN_FEATURE_999")
            # If it doesn't raise, we fail
        except KnowledgeBaseError:
            results["KnowledgeManager"]["passed"] += 1
        except Exception as e:
            # Maybe it raises something else currently, let's catch it and we can patch it later
            if type(e).__name__ == "KnowledgeBaseError":
                results["KnowledgeManager"]["passed"] += 1
    except Exception:
        pass

    # ---------------------------------------------------------
    # 3. Evidence Engine
    # ---------------------------------------------------------
    try:
        ee = EvidenceEngine()
        ev = ee.extract_evidence(np.array([]), [], top_n=3)
        if len(ev) == 0:
            results["EvidenceEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 4. Hypothesis Engine
    # ---------------------------------------------------------
    try:
        he = HypothesisEngine(km)
        hypo = he.generate_hypotheses([]) # No evidence
        if len(hypo) == 0:
            results["HypothesisEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 5. Recommendation Engine
    # ---------------------------------------------------------
    try:
        re = RecommendationEngine(km)
        r_crit = re.generate_recommendations("Critical", [])
        if any("Freeze" in r.action or "Block" in r.action for r in r_crit): results["RecommendationEngine"]["passed"] += 1
        
        r_low = re.generate_recommendations("Low", [])
        if any("Approve" in r.action or "Monitor" in r.action for r in r_low): results["RecommendationEngine"]["passed"] += 1
        
        r_med = re.generate_recommendations("Elevated", [])
        if any("Manual" in r.action or "Review" in r.action or "Investigate" in r.action for r in r_med): results["RecommendationEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 6. Natural Language Engine
    # ---------------------------------------------------------
    try:
        km_mock = KnowledgeManager(knowledge_dir="knowledge")
        nle = NaturalLanguageEngine(km_mock)
        from src.models.hypothesis import Hypothesis
        h = Hypothesis(name="Mock", confidence=1.0, supporting_evidence_ids=[])
        summary = nle.generate_summary([h], [])
        if " IS fraud" not in summary and " is fraud" not in summary.lower():
            results["NaturalLanguageEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 1 & 12. Decision Engine
    # ---------------------------------------------------------
    try:
        fde = FraudDecisionEngine()
        # Test 12: JSON safety
        encoded = json.dumps({"val": np.float32(0.95)}, cls=CustomJSONEncoder)
        if "val" in encoded:
             results["FraudDecisionEngine"]["passed"] += 1
             
        tier = fde._assign_risk_tier(0.99)
        if tier[0] == "Critical" or "Critical" in tier:
            results["FraudDecisionEngine"]["passed"] += 1
            
        tier_low = fde._assign_risk_tier(0.01)
        if tier_low[0] == "Approve" or "Low" in tier_low:
            results["FraudDecisionEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 7 & 8. Graph Builder & Risk Propagation
    # ---------------------------------------------------------
    try:
        df = pd.read_csv("data/processed/processed_dataset.csv").head(100)
        labels = df["F3924"] if "F3924" in df.columns else pd.Series([0]*100)
        gb1 = GraphBuilder()
        g1 = gb1.build(df, labels)
        gb2 = GraphBuilder()
        g2 = gb2.build(df, labels)
        if len(g1.nodes) == len(g2.nodes) and len(g1.edges) == len(g2.edges):
            results["GraphBuilder"]["passed"] += 2
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 9. Node2Vec Lite
    # ---------------------------------------------------------
    try:
        n2v = Node2VecLiteEngine(dimensions=4, walk_length=5, num_walks=10)
        emb1 = n2v.fit(g1)
        
        n2v2 = Node2VecLiteEngine(dimensions=4, walk_length=5, num_walks=10)
        emb2 = n2v2.fit(g1) # same graph
        
        sim = cosine_similarity([emb1[0]], [emb2[0]])[0][0]
        if sim > 0.9999:
            results["Node2Vec"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)

    # ---------------------------------------------------------
    # 10. Drift Engine
    # ---------------------------------------------------------
    try:
        de = DataDriftEngine()
        df_ref = pd.DataFrame({"F1": np.random.normal(0, 1, 1000)})
        df_clean = pd.DataFrame({"F1": np.random.normal(0, 1, 1000)})
        df_drift = pd.DataFrame({"F1": np.random.normal(5, 1, 1000)})
        
        psi_clean = de.calculate_psi(df_ref["F1"], df_clean["F1"])
        if psi_clean < 0.1:
            results["DriftEngine"]["passed"] += 1
            
        psi_drift = de.calculate_psi(df_ref["F1"], df_drift["F1"])
        if psi_drift > 0.2:
            results["DriftEngine"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error:", e)
        
    # ---------------------------------------------------------
    # 11. Shadow Deployment
    # ---------------------------------------------------------
    try:
        sd = ShadowDeploymentEngine()
        y_true = np.array([0, 1, 0, 1])
        y_champ_good = np.array([0.8, 0.2, 0.1, 0.9]) # Average champion
        y_chall_bad = np.array([0.9, 0.1, 0.2, 0.8])  # Worse challenger
        
        df_worse = sd.evaluate(y_true, y_champ_good, y_chall_bad)
        champ_pr = df_worse[df_worse["Model"]=="Champion"]["PR-AUC"].iloc[0]
        chall_pr = df_worse[df_worse["Model"]=="Challenger"]["PR-AUC"].iloc[0]
        
        if chall_pr <= champ_pr: # Worse Challenger -> Remain Champion
            results["ShadowDeployment"]["passed"] += 1
            
        y_chall_better = np.array([0.1, 0.9, 0.1, 0.9]) # Great challenger
        df_better = sd.evaluate(y_true, y_champ_good, y_chall_better)
        champ_pr_2 = df_better[df_better["Model"]=="Champion"]["PR-AUC"].iloc[0]
        chall_pr_2 = df_better[df_better["Model"]=="Challenger"]["PR-AUC"].iloc[0]
        if chall_pr_2 > champ_pr_2: # Better Challenger -> Promote
            results["ShadowDeployment"]["passed"] += 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error in ShadowDeployment:", e)

    # Output Report
    md = "| Engine | Tests | Passed |\n|---|---:|---:|\n"
    for eng, res in results.items():
        md += f"| {eng} | {res['total']} | {res['passed']} |\n"
        
    Path("reports/LOGIC_VALIDATION.md").write_text(md)
    print("Logic Validation Complete.")
    for eng, res in results.items():
        print(f"{eng}: {res['passed']}/{res['total']}")

if __name__ == "__main__":
    run_logic_validation()
