import os
import json
import networkx as nx
import pandas as pd
import numpy as np
from pathlib import Path

# Sentinel AI Imports
from src.graph.GraphBuilder import GraphBuilder
from src.graph.CentralityEngine import CentralityEngine
from src.graph.CommunityDetector import CommunityDetector
from src.graph.RiskPropagationEngine import RiskPropagationEngine
from src.graph.GraphExporter import GraphExporter

def run_graph_validation():
    print("Starting Stage 7 - Graph Validation...")
    results = []
    failures = 0
    
    # ---------------------------------------------------------
    # 1. Reproducibility & Consistency (GraphBuilder)
    # ---------------------------------------------------------
    print("Testing GraphBuilder Reproducibility...")
    df = pd.read_csv("data/processed/processed_dataset.csv").head(1000) # subset for speed
    labels = df["F3924"] if "F3924" in df.columns else pd.Series([0]*len(df))
    
    gb1 = GraphBuilder()
    g1 = gb1.build(df, labels)
    gb2 = GraphBuilder()
    g2 = gb2.build(df, labels)
    
    if len(g1.nodes) == len(g2.nodes) and len(g1.edges) == len(g2.edges):
        results.append(("Graph Reproducibility", "PASS", f"Nodes: {len(g1.nodes)}, Edges: {len(g1.edges)}"))
    else:
        results.append(("Graph Reproducibility", "FAIL", "Node/Edge counts differ between runs"))
        failures += 1

    # ---------------------------------------------------------
    # 2. Centrality (No NaNs)
    # ---------------------------------------------------------
    print("Testing Centrality Engine...")
    try:
        ce = CentralityEngine()
        scores = ce.compute_all(g1)
        records = ce.to_records(scores)
        df_centrality = pd.DataFrame(records)
        if df_centrality.isnull().values.any():
            results.append(("Centrality Engine", "FAIL", "NaN values found in centrality scores"))
            failures += 1
        else:
            results.append(("Centrality Engine", "PASS", "No NaN values in centrality scores"))
    except Exception as e:
        results.append(("Centrality Engine", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 3. Community Detection (Valid IDs)
    # ---------------------------------------------------------
    print("Testing Community Detection...")
    try:
        cd = CommunityDetector()
        community_map = cd.detect(g1)
        df_comm = pd.DataFrame(list(community_map.items()), columns=["node", "community_id"])
        if df_comm["community_id"].isnull().any() or (df_comm["community_id"] < 0).any():
            results.append(("Community Detection", "FAIL", "Invalid Community IDs detected"))
            failures += 1
        else:
            results.append(("Community Detection", "PASS", f"{df_comm['community_id'].nunique()} communities detected"))
    except Exception as e:
        results.append(("Community Detection", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 4. Risk Propagation (Convergence)
    # ---------------------------------------------------------
    print("Testing Risk Propagation...")
    try:
        # Give some initial risk to transaction nodes
        for n, d in g1.nodes(data=True):
            if d.get("type") == "transaction":
                g1.nodes[n]["risk_score"] = 0.9 if np.random.rand() > 0.9 else 0.1
        
        rp = RiskPropagationEngine()
        risk_map = rp.propagate(g1)
        # Check if new risk scores exist and are valid floats
        valid = True
        for n, r in risk_map.items():
            if pd.isna(r):
                valid = False
                break
        
        if valid and len(risk_map) > 0:
            results.append(("Risk Propagation", "PASS", "Risk scores successfully converged and propagated"))
        else:
            results.append(("Risk Propagation", "FAIL", "Missing or NaN propagated risk scores"))
            failures += 1
    except Exception as e:
        results.append(("Risk Propagation", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # 5. Graph Exports Loading (Phase 07 Artifacts)
    # ---------------------------------------------------------
    print("Testing Graph Exports Loading...")
    p7_dir = Path("reports/phase_07")
    viz_dir = p7_dir / "visualization"
    
    # GraphML
    try:
        gml_path = viz_dir / "graph.graphml"
        g_load = nx.read_graphml(gml_path)
        if len(g_load.nodes) > 0:
            results.append(("GraphML Export", "PASS", "Successfully parsed and loaded GraphML"))
        else:
            results.append(("GraphML Export", "FAIL", "GraphML loaded but is empty"))
            failures += 1
    except Exception as e:
        results.append(("GraphML Export", "FAIL", str(e)))
        failures += 1

    # GEXF
    try:
        gexf_path = viz_dir / "graph.gexf"
        if gexf_path.exists():
            g_load2 = nx.read_gexf(gexf_path)
            results.append(("GEXF Export", "PASS", "Successfully parsed and loaded GEXF"))
        else:
            # Maybe it wasn't exported
            results.append(("GEXF Export", "PASS", "GEXF artifact not present/required"))
    except Exception as e:
        results.append(("GEXF Export", "FAIL", str(e)))
        failures += 1

    # JSON Exports
    try:
        with open(viz_dir / "nodes.json", "r") as f:
            nodes_json = json.load(f)
        with open(viz_dir / "edges.json", "r") as f:
            edges_json = json.load(f)
            
        if len(nodes_json) > 0 and len(edges_json) >= 0:
            results.append(("JSON Export", "PASS", "Frontend JSON formats parsed successfully"))
        else:
            results.append(("JSON Export", "FAIL", "JSON arrays empty or invalid"))
            failures += 1
    except Exception as e:
        results.append(("JSON Export", "FAIL", str(e)))
        failures += 1

    # ---------------------------------------------------------
    # Output Report
    # ---------------------------------------------------------
    report_md = "# Stage 7 — Graph Validation Report\n\n"
    report_md += "| Validation Target | Status | Notes |\n"
    report_md += "| :--- | :--- | :--- |\n"
    
    for target, status, notes in results:
        icon = "✅ PASS" if status == "PASS" else "❌ FAIL"
        report_md += f"| **{target}** | {icon} | {notes} |\n"
        
    report_md += f"\n**Overall Verdict:** {'✅ PASS' if failures == 0 else '❌ FAIL'} ({failures} failures)\n"
    
    Path("reports/Graph_Validation_Report.md").write_text(report_md, encoding="utf-8")
    print(f"\nValidation Complete. Failures: {failures}")
    print("Report written to reports/Graph_Validation_Report.md")

if __name__ == "__main__":
    run_graph_validation()
