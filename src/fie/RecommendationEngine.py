from typing import List
from ..models.recommendation import Recommendation
from ..models.hypothesis import Hypothesis
from ..knowledge.KnowledgeManager import KnowledgeManager


class RecommendationEngine:
    """
    Generates policy-driven investigator actions based on Hypotheses and Risk.
    """

    def __init__(self, knowledge_manager: KnowledgeManager):
        self.km = knowledge_manager

    def generate_recommendations(
        self, risk_tier: str, hypotheses: List[Hypothesis]
    ) -> List[Recommendation]:
        """
        Matches the case state against AML policies to return prioritized actions.
        """
        top_typologies = [h.name for h in hypotheses if h.confidence > 0.4]

        applicable_policies = self.km.get_applicable_policies(risk_tier, top_typologies)

        recommendations = []
        seen_actions = set()

        for policy in applicable_policies:
            actions = policy.get("recommended_actions", [])
            for act in actions:
                action_text = act.get("action")
                if action_text not in seen_actions:
                    seen_actions.add(action_text)
                    recommendations.append(
                        Recommendation(
                            priority=act.get("priority", 99),
                            action=action_text,
                            reason=act.get("reason", "Standard policy."),
                        )
                    )

        # If no policies hit, provide fallback
        if not recommendations:
            if risk_tier == "Critical":
                recommendations.append(
                    Recommendation(1, "Freeze Account", "Critical risk score flagged.")
                )
            elif risk_tier in ["High", "Elevated", "Medium"]:
                recommendations.append(
                    Recommendation(2, "Manual Review", "High/Elevated risk score flagged.")
                )
            else:
                recommendations.append(
                    Recommendation(99, "Auto-Approve", "Risk tier does not warrant manual escalation.")
                )

        # Sort by priority
        recommendations.sort(key=lambda x: x.priority)
        return recommendations
