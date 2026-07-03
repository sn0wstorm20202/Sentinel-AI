from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime

from .evidence import Evidence
from .hypothesis import Hypothesis
from .recommendation import Recommendation


@dataclass
class InvestigationCase:
    """
    The master object consolidating all FIE outputs for the Investigator Dashboard.
    """

    case_id: str
    transaction_id: str
    probability: float
    risk_score: float
    risk_tier: str

    evidence: List[Evidence] = field(default_factory=list)
    hypotheses: List[Hypothesis] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)

    natural_language_summary: Optional[str] = None
    engine_version: str = "4.0"
    generated_at: str = field(
        default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )

    def to_dict(self) -> dict:
        from src.common.json_utils import sanitize_for_json
        d = {
            "metadata": {
                "case_id": self.case_id,
                "transaction_id": self.transaction_id,
                "generated_at": self.generated_at,
                "engine_version": self.engine_version,
            },
            "risk_assessment": {
                "probability": self.probability,
                "risk_score": self.risk_score,
                "risk_tier": self.risk_tier,
            },
            "intelligence": {
                "evidence": [e.__dict__ for e in self.evidence],
                "hypotheses": [h.__dict__ for h in self.hypotheses],
                "natural_language_summary": self.natural_language_summary,
            },
            "action_engine": {
                "recommendations": [r.__dict__ for r in self.recommendations]
            },
        }
        return sanitize_for_json(d)
