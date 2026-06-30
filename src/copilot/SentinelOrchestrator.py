import pandas as pd
from typing import Dict, Any

from ..engine.FraudDecisionEngine import FraudDecisionEngine
from ..knowledge.KnowledgeManager import KnowledgeManager
from ..fie.EvidenceEngine import EvidenceEngine
from ..fie.HypothesisEngine import HypothesisEngine
from ..fie.RecommendationEngine import RecommendationEngine
from ..fie.NaturalLanguageEngine import NaturalLanguageEngine
from ..models.case import InvestigationCase


class SentinelOrchestrator:
    """
    The central coordinator for the Fraud Intelligence Engine (FIE).
    Strictly follows the Single Responsibility Principle: it computes nothing itself.
    """

    def __init__(
        self,
        models_dir: str = "models",
        configs_dir: str = "configs",
        knowledge_dir: str = "knowledge",
    ):
        # 1. Base ML Engine
        self.decision_engine = FraudDecisionEngine(
            models_dir=models_dir, configs_dir=configs_dir
        )

        # 2. Institutional Knowledge Layer
        self.km = KnowledgeManager(knowledge_dir=knowledge_dir)

        # 3. FIE Modules
        self.evidence_engine = EvidenceEngine()
        self.hypothesis_engine = HypothesisEngine(self.km)
        self.recommendation_engine = RecommendationEngine(self.km)
        self.nlg_engine = NaturalLanguageEngine(self.km)

    def process_transaction(
        self, transaction_data: Dict[str, Any], transaction_id: str, case_id: str
    ) -> InvestigationCase:
        """
        Orchestrates the full pipeline from raw data to a fully reasoned Investigation Case.
        """
        df = pd.DataFrame([transaction_data])

        # Step 1: Decision Engine Inference
        prob = float(self.decision_engine.model.predict_proba(df)[0, 1])
        tier, _, _, _ = self.decision_engine._assign_risk_tier(prob)

        case = InvestigationCase(
            case_id=case_id,
            transaction_id=transaction_id,
            probability=round(prob, 4),
            risk_score=round(prob * 100, 1),
            risk_tier=tier,
        )

        # If the risk is low, we can bypass deep explainability to save compute
        if tier in ["Approve", "Elevated"]:
            return case

        # Step 2: Extract Explainability (SHAP)
        shap_values = self.decision_engine.explainer.shap_values(df)

        # Step 3: Evidence Engine (Raw Math -> Structured Facts)
        evidence = self.evidence_engine.extract_evidence(shap_values, list(df.columns))
        case.evidence = evidence

        # Step 4: Hypothesis Engine (Facts -> Possible Typologies)
        hypotheses = self.hypothesis_engine.generate_hypotheses(evidence)
        case.hypotheses = hypotheses

        # Step 5: Recommendation Engine (Typologies + Risk -> Institutional Actions)
        recommendations = self.recommendation_engine.generate_recommendations(
            tier, hypotheses
        )
        case.recommendations = recommendations

        # Step 6: Natural Language Generation
        nlg_summary = self.nlg_engine.generate_summary(hypotheses, evidence)
        case.natural_language_summary = nlg_summary

        return case
