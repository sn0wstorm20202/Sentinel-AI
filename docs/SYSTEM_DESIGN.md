# Sentinel AI: System Design & Architecture

## 1. High-Level Architecture Overview
Sentinel AI operates across three distinct macro-environments:
1. **Model R&D Pipeline (Offline)**
2. **Fraud Decision Engine (Inference)**
3. **Investigator Copilot (Application Layer)**

### 1.1 Data Flow
Raw Transactions -> Enterprise Preprocessing -> Feature Engineering -> Feature Governance Registry -> **FraudDecisionEngine** -> Copilot Output

### 1.2 The Fraud Decision Engine API
The core inference module is located at `src/engine/FraudDecisionEngine.py`. 
It executes the following sequence synchronously:
1. **Calibration**: Passes incoming features through the `CalibratedClassifierCV` (Isotonic).
2. **Policy Evaluation**: Evaluates the probability against the dynamic `threshold_policy.json`.
3. **Tiering**: Assigns a Risk Tier (`Critical`, `High`, `Elevated`, `Approve`).
4. **Explainability**: Triggers the `shap_explainer.pkl` exclusively for flagged transactions.
5. **NLG (Natural Language Generation)**: Translates SHAP tensors into human-readable investigator strings.

## 2. Infrastructure Stack (Target Deployment)
- **Backend API**: FastAPI (Python)
- **Model Registry**: MLflow / Local JSON Manifests
- **Monitoring**: Prometheus & Grafana (Drift Metrics)
- **Frontend**: React + TailwindCSS (Investigator Dashboard)
- **Database**: PostgreSQL (Audit Logs & Decisions)
- **Cache**: Redis (High-speed transaction matching)

## 3. Pending Architectural Diagrams (To Be Generated)
*Note: The `architecture/` directory will house the following visual diagrams in Phase 10.*
- `architecture/system_design.png`: Overall cloud/server architecture
- `architecture/data_flow.png`: ELT data flow and preprocessing pipeline
- `architecture/feature_pipeline.png`: Feature engineering & governance gates
- `architecture/decision_pipeline.png`: The logical flow inside FraudDecisionEngine
- `architecture/deployment.png`: Docker & Kubernetes deployment strategy
