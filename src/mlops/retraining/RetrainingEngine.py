"""
Sentinel AI — Retraining Engine

Responsible for evaluating drift reports and generating a human-readable
recommendation for retraining. Never automatically retrains.
"""

import json
from datetime import datetime, timezone
from typing import Dict


class RetrainingEngine:
    """Recommends model retraining based on drift alerts and rules."""

    def evaluate_retraining_need(self, alerts: list) -> dict:
        """Analyzes alerts to recommend action."""

        critical_alerts = [a for a in alerts if a["severity"] == "CRITICAL"]
        warning_alerts = [a for a in alerts if a["severity"] == "WARNING"]

        recommendation = "NONE"
        reason = "System is stable."

        if len(critical_alerts) > 0:
            recommendation = "IMMEDIATE_RETRAINING"
            reason = f"Detected {len(critical_alerts)} CRITICAL alerts (e.g. {critical_alerts[0]['message']})."
        elif len(warning_alerts) >= 3:
            recommendation = "SCHEDULE_RETRAINING"
            reason = f"Detected {len(warning_alerts)} WARNING alerts indicating gradual drift."

        report = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "recommendation": recommendation,
            "reason": reason,
            "human_approval_required": True if recommendation != "NONE" else False,
        }
        return report
