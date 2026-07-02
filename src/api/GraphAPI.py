"""
Sentinel AI — Graph Intelligence API Routes

Implements the REST endpoints for graph queries: network subgraphs,
entity profiles, community listings, and global statistics.
Loads pre-computed artifacts from the reports directory.
"""

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/graph", tags=["Graph Intelligence"])

REPORTS_DIR = Path("reports/phase_07")
VIZ_DIR = REPORTS_DIR / "visualization"


def _load_json(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Artifact not found: {path.name}. Run the Phase 7 notebook first.",
        )
    with open(path, "r") as f:
        return json.load(f)


def _load_csv_as_dicts(path: Path) -> list:
    import csv

    if not path.exists():
        raise HTTPException(status_code=503, detail=f"Artifact not found: {path.name}.")
    with open(path, "r") as f:
        return list(csv.DictReader(f))


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------


@router.get("/statistics")
def graph_statistics():
    """Returns global graph topology and quality metrics."""
    return _load_json(REPORTS_DIR / "network_statistics.json")


@router.get("/metadata")
def graph_metadata():
    """Returns graph versioning and build provenance."""
    return _load_json(REPORTS_DIR / "graph_metadata.json")


@router.get("/communities")
def list_communities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    risk: Optional[str] = Query(
        None, description="Filter by risk tier: Critical, High, Elevated, Low"
    ),
):
    """Lists all communities with risk tiers (paginated, filterable)."""
    records = _load_csv_as_dicts(REPORTS_DIR / "community_registry.csv")

    if risk:
        records = [r for r in records if r.get("risk_tier", "").lower() == risk.lower()]

    total = len(records)
    start = (page - 1) * limit
    page_records = records[start : start + limit]

    return {
        "communities": page_records,
        "pagination": {"page": page, "limit": limit, "total": total},
    }


@router.get("/community/{community_id}")
def get_community(community_id: int):
    """Deep-dive into a specific community."""
    records = _load_csv_as_dicts(REPORTS_DIR / "community_registry.csv")
    for r in records:
        if int(r.get("community_id", -1)) == community_id:
            return r
    raise HTTPException(status_code=404, detail=f"Community {community_id} not found.")


@router.get("/entity/{entity_id}")
def get_entity(entity_id: str):
    """Full profile of a single entity (risk, community, centrality)."""
    # Entity registry
    entity_records = _load_csv_as_dicts(REPORTS_DIR / "entity_registry.csv")
    entity = None
    for r in entity_records:
        if r.get("entity_id") == entity_id:
            entity = r
            break

    if entity is None:
        raise HTTPException(status_code=404, detail=f"Entity {entity_id} not found.")

    # Centrality
    centrality_records = _load_csv_as_dicts(REPORTS_DIR / "centrality_scores.csv")
    centrality = {}
    for r in centrality_records:
        if r.get("node_id") == entity_id:
            centrality = {k: v for k, v in r.items() if k != "node_id"}
            break

    entity["centrality"] = centrality
    return entity


@router.get("/entity/{entity_id}/neighbors")
def get_entity_neighbors(entity_id: str):
    """1-hop neighbourhood of an entity from the exported edge list."""
    edges = _load_json(VIZ_DIR / "edges.json")
    neighbor_ids = set()
    for e in edges:
        if e["source"] == entity_id:
            neighbor_ids.add(e["target"])
        elif e["target"] == entity_id:
            neighbor_ids.add(e["source"])

    if not neighbor_ids:
        raise HTTPException(
            status_code=404, detail=f"Entity {entity_id} not found in graph."
        )

    nodes = _load_json(VIZ_DIR / "nodes.json")
    neighbor_nodes = [n for n in nodes if n["id"] in neighbor_ids]
    return {
        "entity_id": entity_id,
        "neighbor_count": len(neighbor_nodes),
        "neighbors": neighbor_nodes,
    }


@router.get("/network/{case_id}")
def get_case_network(case_id: str):
    """Returns the subgraph (nodes + edges) surrounding a transaction case.
    Formatted for React Flow / Cytoscape.js consumption."""
    all_nodes = _load_json(VIZ_DIR / "nodes.json")
    all_edges = _load_json(VIZ_DIR / "edges.json")

    # Map case_id to transaction_id (since case_id is CASE_XXX and nodes are TXN_XXX)
    # The nodes are indexed by transaction id.
    txn_id = case_id.replace("CASE_", "TXN_")
    
    # Find the transaction node
    txn_node = None
    for n in all_nodes:
        if n["id"] == txn_id:
            txn_node = n
            break
    if txn_node is None:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found.")

    # Collect 1-hop and 2-hop neighbours
    hop1_ids = set()
    for e in all_edges:
        if e["source"] == txn_id:
            hop1_ids.add(e["target"])
        elif e["target"] == txn_id:
            hop1_ids.add(e["source"])

    hop2_ids = set()
    for e in all_edges:
        if e["source"] in hop1_ids:
            hop2_ids.add(e["target"])
        elif e["target"] in hop1_ids:
            hop2_ids.add(e["source"])

    all_relevant_ids = {txn_id} | hop1_ids | hop2_ids
    subgraph_nodes = [n for n in all_nodes if n["id"] in all_relevant_ids]
    subgraph_edges = [
        e
        for e in all_edges
        if e["source"] in all_relevant_ids and e["target"] in all_relevant_ids
    ]

    # Map to React Flow schema
    rf_nodes = []
    for n in subgraph_nodes:
        rf_nodes.append({
            "id": n["id"],
            "type": "custom",
            "data": {
                "label": n["label"],
                "type": n["type"],
                "risk_score": n.get("risk", 0) * 100,
                "community": n.get("community"),
                "pagerank": n.get("pagerank")
            }
        })
        
    rf_edges = []
    for idx, e in enumerate(subgraph_edges):
        rf_edges.append({
            "id": f"edge_{idx}",
            "source": e["source"],
            "target": e["target"],
            "label": e.get("type", "")
        })

    return {"nodes": rf_nodes, "edges": rf_edges}
