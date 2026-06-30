"""
Sentinel AI — Graph Learning Model Registry

Tracks approved and deployed graph models.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import pandas as pd
from dataclasses import dataclass, asdict


@dataclass
class ModelRegistration:
    model_name: str
    experiment_id: str
    dataset_hash: str
    metrics: Dict[str, float]
    validation_status: str = "PASS"
    deployment_ready: str = "YES"
    status: str = "Staging"
    notes: str = ""


class ModelRegistry:
    """Enterprise Model Registry mimicking MLflow's registry layer."""

    def __init__(self, registry_dir: str = "models/registry"):
        self.registry_dir = Path(registry_dir)
        self.registry_dir.mkdir(parents=True, exist_ok=True)
        self.registry_file = self.registry_dir / "graph_model_registry.json"
        self._load_registry()

    def _load_registry(self) -> None:
        if self.registry_file.exists():
            with open(self.registry_file, "r") as f:
                self.models = json.load(f)
        else:
            self.models = []

    def _save_registry(self) -> None:
        with open(self.registry_file, "w") as f:
            json.dump(self.models, f, indent=2)

    def register_model(self, registration: ModelRegistration) -> Dict:
        """Registers a new model to the registry."""
        record = asdict(registration)
        record["model_id"] = (
            f"{registration.model_name}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        )
        record["registration_date"] = datetime.now(timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

        self.models.append(record)
        self._save_registry()
        return record

    def promote_to_champion(self, model_id: str) -> None:
        """Promotes a model to Champion, demoting the previous one."""
        for m in self.models:
            if m["status"] == "Champion":
                m["status"] = "Archived"
            if m["model_id"] == model_id:
                m["status"] = "Champion"
        self._save_registry()

    def get_champion(self) -> Optional[Dict]:
        """Returns the current Champion model."""
        for m in self.models:
            if m["status"] == "Champion":
                return m
        return None

    def list_models(self) -> pd.DataFrame:
        """Returns all models as a DataFrame."""
        return pd.DataFrame(self.models)
