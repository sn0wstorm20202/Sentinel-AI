# Sentinel AI: Graph Schema Design

This document defines the entity-relationship topology utilized by the Sentinel AI Graph Intelligence Engine (Phase 7).

## Dataset Context & Synthetic Modeling
Due to strict institutional anonymization of the raw Bank of India dataset (features labeled F1...F4000), explicit primary keys for customers and devices are hidden. To demonstrate enterprise graph intelligence without fabricating scientific claims, the Sentinel Graph Engine generates a **Deterministic Synthetic Topology Layer** that simulates realistic banking structures on top of the existing transactions.

## 1. Node Types (Entities)
The graph consists of the following distinct entities:

| Node Type | Description | Risk Propagation Priority |
|---|---|---|
| `Transaction` | The core event (linked to our dataset rows). | Low (Static) |
| `Customer` | The initiator of the transaction. | High |
| `Device` | The hardware used to initiate the transaction. | Critical |
| `IP_Address` | The network origin. | Medium |
| `Merchant` | The recipient of the funds. | High |

## 2. Edge Types (Relationships)
Edges are purely directional and represent the flow of interaction.

| Source Node | Edge Label | Target Node | Semantics |
|---|---|---|---|
| `Customer` | `INITIATED` | `Transaction` | Customer executed the transaction. |
| `Transaction` | `SENT_TO` | `Merchant` | Funds were directed to the merchant. |
| `Transaction` | `EXECUTED_ON` | `Device` | The transaction used a specific device. |
| `Device` | `CONNECTED_VIA` | `IP_Address` | The device routed through this IP. |

## 3. Entity Risk Propagation Logic
Risk does not exist in a vacuum. In Phase 7, risk flows retroactively through the graph:
1. **Transaction Risk**: Inherited directly from the Phase 5 Fraud Decision Engine (or True Labels).
2. **Device Risk**: Computed based on the ratio of fraudulent transactions executed on it. If a device has a 90% fraud ratio, it becomes "Tainted."
3. **Customer Risk**: If a Customer initiates a new, seemingly benign transaction, but uses a "Tainted" Device, the Customer Risk spikes via graph proximity.
4. **Community Risk**: Detected Louvain communities containing high concentrations of Tainted Devices and High-Risk Customers are flagged for immediate macro-investigation.

## 4. Derived Graph Features (Phase 8 Inputs)
By analyzing this schema, we extract topological features for the GNN:
- `PageRank_Centrality`: Is this device a central hub for many transactions?
- `Community_Size`: How large is the localized sub-graph?
- `Neighbor_Fraud_Ratio`: What percentage of 1-hop and 2-hop neighbors are fraudulent?
