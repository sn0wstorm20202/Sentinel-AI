from dataclasses import dataclass
from typing import List


@dataclass
class Hypothesis:
    """
    Represents a probabilistic inference linking statistical evidence to a known fraud typology.
    """

    name: str
    confidence: float
    supporting_evidence_ids: List[str]
