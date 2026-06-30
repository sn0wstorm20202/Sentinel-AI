import json
from pathlib import Path
from typing import Dict, Any, List


class KnowledgeManager:
    """
    Acts as the database abstraction layer for institutional knowledge.
    Never performs inference. Only returns queried facts, policies, and typologies.
    """

    def __init__(self, knowledge_dir: str = "knowledge"):
        self.k_dir = Path(knowledge_dir)
        self.feature_metadata = self._load("feature_metadata.json").get(
            "feature_mapping", {}
        )
        self.typologies = self._load("fraud_typologies.json").get("typologies", [])
        self.policies = self._load("aml_policies.json").get("policies", [])

    def _load(self, filename: str) -> Dict[str, Any]:
        path = self.k_dir / filename
        if not path.exists():
            return {}
        with open(path, "r") as f:
            return json.load(f)

    def get_feature_concept(self, feature_id: str) -> str:
        """Returns the conceptual mapping of an anonymized feature."""
        from src.exceptions import KnowledgeBaseError
        if feature_id not in self.feature_metadata:
            raise KnowledgeBaseError(f"Unknown feature ID: {feature_id}")
        return self.feature_metadata.get(feature_id, {}).get("concept", feature_id)

    def get_feature_description(self, feature_id: str) -> str:
        return self.feature_metadata.get(feature_id, {}).get(
            "description", "Unknown feature."
        )

    def get_direction_meaning(self, feature_id: str, direction: str) -> str:
        return (
            self.feature_metadata.get(feature_id, {})
            .get("direction_meaning", {})
            .get(direction, "deviated")
        )

    def get_all_typologies(self) -> List[Dict[str, Any]]:
        """Returns all known fraud typologies."""
        return self.typologies

    def get_applicable_policies(
        self, risk_tier: str, fraud_typologies: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Returns policies that apply to the given risk tier and identified typologies.
        """
        applicable = []
        for policy in self.policies:
            cond = policy.get("condition", {})
            req_tier = cond.get("min_risk_tier")
            req_typology = cond.get("fraud_typology")

            # Simple policy match logic
            tier_match = False
            if req_tier == "Critical" and risk_tier == "Critical":
                tier_match = True
            elif req_tier == "High" and risk_tier in ["High", "Critical"]:
                tier_match = True

            typ_match = (req_typology in fraud_typologies) if req_typology else True

            if tier_match and typ_match:
                applicable.append(policy)

        return applicable
