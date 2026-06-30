from dataclasses import dataclass


@dataclass
class Recommendation:
    """
    Represents a prioritized, policy-driven action for the investigator.
    """

    priority: int
    action: str
    reason: str
