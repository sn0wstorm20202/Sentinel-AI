import os
from pathlib import Path
try:
    from graphviz import Digraph
    HAS_GRAPHVIZ = True
except ImportError:
    HAS_GRAPHVIZ = False

mermaid_content = """# Artifact Dependency Graph

```mermaid
graph TD
    A[data/raw/dataset.csv] --> B[data/processed/pipeline_data.csv]
    B --> C[data/processed/engineered_features.csv]
    C --> D[data/selected/approved_features.csv]
    D --> E[models/champion_model.pkl]
    D --> F[data/processed/transaction_graph.graphml]
    F --> G[data/processed/graph_feature_store.parquet]
    D --> H[data/processed/fusion_dataset.csv]
    G --> H
    H --> I[models/registry/graph_model_registry.json]
    H --> J[Drift Reference Data]
```
"""

out = Path("reports/ARTIFACT_DEPENDENCY_GRAPH.md")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(mermaid_content, encoding='utf-8')
print("Mermaid diagram written to reports/ARTIFACT_DEPENDENCY_GRAPH.md")

if HAS_GRAPHVIZ:
    try:
        dot = Digraph(comment='Artifact Dependency Graph', format='png')
        dot.node('A', 'Raw Dataset')
        dot.node('B', 'Processed Dataset')
        dot.node('C', 'Feature Engineered Dataset')
        dot.node('D', 'Approved Features')
        dot.node('E', 'Champion Model')
        dot.node('F', 'Graph Network (GraphML)')
        dot.node('G', 'Graph Feature Store')
        dot.node('H', 'Fusion Dataset')
        dot.node('I', 'Model Registry')
        dot.node('J', 'Drift Reference')

        dot.edges(['AB', 'BC', 'CD', 'DE', 'DF', 'FG', 'DH', 'GH', 'HI', 'HJ'])
        
        dot.render('reports/architecture/ARTIFACT_DEPENDENCY_GRAPH', view=False)
        print("PNG diagram generated at reports/architecture/ARTIFACT_DEPENDENCY_GRAPH.png")
    except Exception as e:
        print(f"Graphviz failed (dot executable might be missing): {e}")
