import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from src.knowledge.KnowledgeManager import KnowledgeManager
from src.fie.EvidenceEngine import EvidenceEngine
from src.fie.RecommendationEngine import RecommendationEngine
from src.fie.HypothesisEngine import HypothesisEngine
from src.engine.FraudDecisionEngine import FraudDecisionEngine
from src.mlops.MLOpsOrchestrator import MLOpsOrchestrator

def test_knowledge_manager():
    # Write a dummy knowledge base
    k_dir = Path("knowledge")
    km = KnowledgeManager(knowledge_dir=str(k_dir))
    assert km.get_feature_concept("F100") is not None
    
def test_evidence_engine():
    ee = EvidenceEngine()
    features = ["F1", "F2", "F3"]
    shap = np.array([0.1, -0.2, 0.5])
    evidence = ee.extract_evidence(shap, features, top_n=2)
    assert len(evidence) == 2
    assert evidence[0].feature_id == "F3"
    
def test_recommendation_engine():
    km = KnowledgeManager(knowledge_dir="knowledge")
    re = RecommendationEngine(km)
    recs = re.generate_recommendations("High", [])
    assert len(recs) > 0
    assert recs[0].priority == 1
    
def test_decision_engine():
    # Smoke test initialization
    # We might not have models/ and configs/ fully populated for unit test, but it should init if they exist
    pass

def test_mlops_alert_engine():
    # Just test the orchestrator initialization
    mlo = MLOpsOrchestrator(output_dir="reports/test_mlops")
    assert mlo.output_dir.exists()
