from typing import List
from ..models.evidence import Evidence
from ..models.hypothesis import Hypothesis
from ..knowledge.KnowledgeManager import KnowledgeManager


class NaturalLanguageEngine:
    """
    Safely templates mathematical evidence and hypotheses into defensible English.
    Never interacts directly with raw SHAP tensors.
    """

    def __init__(self, knowledge_manager: KnowledgeManager):
        self.km = knowledge_manager

    def generate_summary(
        self, hypotheses: List[Hypothesis], evidence: List[Evidence]
    ) -> str:
        """
        Generates a defensible summary strictly bounding certainty to 'possible'.
        """
        if not hypotheses:
            return "No specific fraud patterns were identified. Risk score driven by general baseline deviation."

        top_hyp = hypotheses[0]

        # Gather human-readable feature concepts for the supporting evidence
        supporting_concepts = []
        for ev_id in top_hyp.supporting_evidence_ids:
            concept = self.km.get_feature_concept(ev_id)
            supporting_concepts.append(concept)

        concept_str = (
            ", ".join(supporting_concepts)
            if supporting_concepts
            else "various features"
        )

        summary = (
            f"**Possible fraud pattern:** {top_hyp.name}. "
            f"**Why this hypothesis was generated:** "
            f"Several highly influential model features ({concept_str}) "
            f"deviated significantly from the historical profile, aligning with historical patterns associated with this typology."
        )

        return summary
