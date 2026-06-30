from dataclasses import dataclass


@dataclass
class Evidence:
    """
    Represents a statistical fact derived from model explainability.
    Contains no business logic or linguistic assumptions.
    """

    feature_id: str
    importance_score: float
    direction: str  # e.g., "positive" or "negative" contribution
    rank: int  # Rank among top contributors
    confidence: float  # Associated statistical confidence in this feature's role
