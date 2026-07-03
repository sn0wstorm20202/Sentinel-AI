import pytest
import tempfile
from src.graph_learning.model_registry.ModelRegistry import ModelRegistry, ModelRegistration

def test_model_registry():
    with tempfile.TemporaryDirectory() as tmpdir:
        registry = ModelRegistry(registry_dir=tmpdir)
        reg = ModelRegistration(
            model_name="TestModel",
            experiment_id="Exp1",
            dataset_hash="hash123",
            metrics={"auc": 0.99}
        )
        record = registry.register_model(reg)
        
        assert record["model_name"] == "TestModel"
        assert record["metrics"]["auc"] == 0.99
        assert record["status"] == "Staging"
        
        # Verify persistence
        registry2 = ModelRegistry(registry_dir=tmpdir)
        assert len(registry2.models) == 1
        assert registry2.models[0]["metrics"]["auc"] == 0.99
