"""
Sentinel AI — Graph Learning Orchestrator

Coordinates the entire Phase 8 Graph Learning pipeline:
1. Loads Phase 7 Graph Features & Base Tabular Features
2. Generates Node Embeddings (Node2Vec-Lite, DeepWalk)
3. Fuses features using the FeatureFusionEngine
4. Trains Classical Classifiers and logs to ExperimentRegistry
5. Extracts Ablation Studies
"""

import logging
from pathlib import Path
from typing import Dict, Tuple

import networkx as nx
import pandas as pd

from .embedding.Node2VecEngine import Node2VecLiteEngine
from .embedding.DeepWalkEngine import DeepWalkEngine
from .fusion.FeatureFusionEngine import FeatureFusionEngine
from .classical.EmbeddingClassifier import EmbeddingClassifier
from .evaluation.ExperimentRegistry import ExperimentRegistry

logger = logging.getLogger(__name__)


class GraphLearningOrchestrator:
    """Orchestrates the Graph Learning Engine experiments."""

    def __init__(self, output_dir: str = "reports/phase_08"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.registry = ExperimentRegistry(output_dir)
        self.fusion_engine = FeatureFusionEngine()

        # Meta tracking
        self.dataset_hash = "unknown"
        self.graph_version = "1.0"

    def set_metadata(self, dataset_hash: str, graph_version: str = "1.0"):
        self.dataset_hash = dataset_hash
        self.graph_version = graph_version

    def run_embedding_pipeline(
        self, G: nx.DiGraph
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Generates and saves Node2Vec-Lite and DeepWalk embeddings."""
        logger.info("Generating Node2Vec-Lite embeddings...")
        n2v = Node2VecLiteEngine(dimensions=64, walk_length=30, num_walks=10)
        n2v.fit(G)
        n2v.save(str(self.output_dir))
        df_n2v = n2v.to_dataframe()

        logger.info("Generating DeepWalk embeddings...")
        dw = DeepWalkEngine(dimensions=64, walk_length=30, num_walks=10)
        dw.fit(G)
        dw.save(str(self.output_dir))
        df_dw = dw.to_dataframe()

        return df_n2v, df_dw

    def run_ablation_study(
        self,
        df_tabular: pd.DataFrame,
        df_graph: pd.DataFrame,
        df_embeddings: pd.DataFrame,
        target_col: str,
    ) -> pd.DataFrame:
        """Runs the ablation study and records to the Experiment Registry."""
        y = df_tabular[target_col]
        X_tab_only = df_tabular.drop(columns=[target_col])
        clf = EmbeddingClassifier(model_type="xgboost")

        experiments = [
            ("1_Baseline_Tabular", X_tab_only),
            (
                "2_Baseline_Plus_Graph",
                self.fusion_engine.fuse(X_tab_only, df_graph=df_graph),
            ),
            (
                "3_Baseline_Plus_Embeddings",
                self.fusion_engine.fuse(X_tab_only, df_embeddings=df_embeddings),
            ),
            (
                "4_Full_Fusion",
                self.fusion_engine.fuse(
                    X_tab_only, df_graph=df_graph, df_embeddings=df_embeddings
                ),
            ),
        ]

        for exp_id, X_data in experiments:
            if len(X_data) == len(y):
                logger.info(f"Training: {exp_id}...")
                res = clf.train_and_evaluate(X_data, y, exp_id)

                self.registry.log_experiment(
                    experiment_id=exp_id,
                    model_type=clf.model_type,
                    graph_version=self.graph_version,
                    dataset_hash=self.dataset_hash,
                    metrics=res["metrics"],
                    training_time=res["training_time_seconds"],
                    inference_time=res["inference_time_seconds"],
                    memory_mb=res["memory_mb_estimate"],
                    n_features=res["n_features"],
                )

                # Save full fused dataset for the winner
                if exp_id == "4_Full_Fusion":
                    X_data[target_col] = y
                    X_data.to_parquet(
                        self.output_dir / "fusion_dataset.parquet", index=False
                    )

        # Export Leaderboard and Registry
        leaderboard_df = self.registry.export()

        # Save ablation study separately for paper/documentation
        leaderboard_df.to_csv(self.output_dir / "ablation_results.csv", index=False)

        return leaderboard_df
