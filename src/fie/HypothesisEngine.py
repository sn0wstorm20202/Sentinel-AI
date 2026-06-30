from typing import List
from ..models.evidence import Evidence
from ..models.hypothesis import Hypothesis
from ..knowledge.KnowledgeManager import KnowledgeManager


class HypothesisEngine:
    """
    Infers probabilistic fraud patterns by matching Evidence against institutional Typologies.
    """

    def __init__(self, knowledge_manager: KnowledgeManager):
        self.km = knowledge_manager

    def generate_hypotheses(self, evidence: List[Evidence]) -> List[Hypothesis]:
        """
        Returns a ranked list of potential fraud typologies based on evidence.
        """
        hypotheses = []
        typologies = self.km.get_all_typologies()

        # Map raw feature IDs in evidence to conceptual names
        observed_concepts = {}
        for ev in evidence:
            concept = self.km.get_feature_concept(ev.feature_id)
            observed_concepts[concept] = ev

        for typ in typologies:
            required_concepts = typ.get("required_conceptual_features", [])
            match_count = 0
            supporting_ids = []
            cumulative_confidence = 0.0

            for req in required_concepts:
                if req in observed_concepts:
                    match_count += 1
                    ev = observed_concepts[req]
                    supporting_ids.append(ev.feature_id)
                    cumulative_confidence += ev.confidence

            if match_count > 0:
                # Calculate a hypothesis confidence score
                base_mult = typ.get("base_confidence_multiplier", 1.0)
                coverage = match_count / len(required_concepts)
                # Formula: coverage * average evidence confidence * base multiplier
                hyp_conf = round(
                    coverage * (cumulative_confidence / match_count) * base_mult, 4
                )
                hyp_conf = min(hyp_conf, 0.99)  # Cap at 0.99

                h = Hypothesis(
                    name=typ["name"],
                    confidence=hyp_conf,
                    supporting_evidence_ids=supporting_ids,
                )
                hypotheses.append(h)

        # Sort by confidence descending
        hypotheses.sort(key=lambda x: x.confidence, reverse=True)
        return hypotheses
