"""
Sentinel AI — Alert Engine

Generates structured MLOps alerts based on severity.
Severities: INFO, WARNING, HIGH, CRITICAL.
"""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


class AlertEngine:
    """Manages MLOps alerts and escalation routing."""

    def __init__(self, output_dir: str = "reports/phase_09"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.alerts: List[Dict] = []

    def trigger_alert(
        self,
        severity: str,
        category: str,
        message: str,
        metric_value: float,
        threshold: float,
    ) -> None:
        """Triggers and logs an alert."""
        alert = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "severity": severity.upper(),
            "category": category,
            "message": message,
            "metric_value": round(metric_value, 4),
            "threshold": threshold,
        }
        self.alerts.append(alert)

    def evaluate_psi(self, psi_value: float, feature: str) -> None:
        """Standard PSI alert thresholds."""
        if psi_value > 0.2:
            self.trigger_alert(
                "CRITICAL",
                "Data Drift",
                f"Extreme PSI shift in {feature}",
                psi_value,
                0.2,
            )
        elif psi_value > 0.1:
            self.trigger_alert(
                "WARNING",
                "Data Drift",
                f"Moderate PSI shift in {feature}",
                psi_value,
                0.1,
            )

    def evaluate_concept_drift(self, pr_auc_drop: float) -> None:
        """Standard PR-AUC degradation thresholds."""
        if pr_auc_drop > 0.1:
            self.trigger_alert(
                "CRITICAL", "Concept Drift", "PR-AUC degraded by >10%", pr_auc_drop, 0.1
            )
        elif pr_auc_drop > 0.05:
            self.trigger_alert(
                "WARNING", "Concept Drift", "PR-AUC degraded by >5%", pr_auc_drop, 0.05
            )

    def export(self) -> None:
        """Exports alerts to JSON and CSV."""
        if not self.alerts:
            return

        with open(self.output_dir / "alert_log.json", "w") as f:
            json.dump(self.alerts, f, indent=2)

        keys = self.alerts[0].keys()
        with open(self.output_dir / "alert_log.csv", "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(self.alerts)
