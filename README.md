# Sentinel AI: Enterprise Fraud Intelligence Platform

Sentinel AI is an end-to-end financial fraud detection and intelligence platform. It bridges the gap between raw transaction data, advanced machine learning, and actionable human intelligence. 

Instead of acting as a black-box model, Sentinel AI operates as a **Backend Intelligence Platform**, exposing clear JSON contracts and REST APIs to fuel an Investigator Dashboard.

---

## The 10 Phases of Development

### Phase 1: Enterprise Data Audit
Established the data foundation. Explored the anonymized transaction dataset, assessing missingness, cardinality, and basic target distributions. Created the initial `docs/01_PROJECT_OVERVIEW.md`.

### Phase 2: Data Cleaning & Imputation
Implemented rigorous statistical imputation. Removed degenerate features (variance = 0), handled missing values using median/mode strategies, and aligned data types for model ingestion.

### Phase 3: Feature Engineering
Built the Feature Store. Engineered velocity metrics, transaction aggregations, and categorical encodings. Ranked feature importance using initial baseline models to select the Top 600 features.

### Phase 4: Fraud Intelligence Framework
Designed the business logic layer. Defined Risk Tiers (Low, Medium, High, Critical) and the foundational `InvestigationCase` JSON schema that standardizes how fraud is communicated to the front end.

### Phase 5: Hybrid Fraud Modeling
Trained the Champion tabular model. Evaluated XGBoost, LightGBM, and Random Forest. Selected XGBoost and applied Isotonic Calibration to ensure predicted probabilities match real-world fraud rates. 

### Phase 6: Fraud Intelligence Engine (FIE)
Decoupled ML from business logic. Built the `EvidenceEngine` (SHAP values to plain text), `HypothesisEngine`, `RecommendationEngine`, and `NaturalLanguageEngine` to autonomously draft case summaries.

### Phase 7: Graph Intelligence Layer
Introduced topology. Built the `GraphBuilder` using deterministic SHA-256 hashing to extract a synthetic network of Devices, Customers, IPs, and Merchants from tabular data. Extracted topological features (PageRank, Community Risk).

### Phase 8: Graph Learning Engine (GLE)
Orchestrated the scientific ablation study. Generated Node2Vec-Lite embeddings and fused them with Tabular and Graph features to explicitly measure the predictive uplift of graph intelligence over the baseline model.

### Phase 9: MLOps & Drift Monitoring
Made the platform "alive". Built independent engines to monitor Data Drift (PSI), Prediction Drift, Concept Drift, and Embedding Drift. Implemented an Alert Engine and a Shadow Deployment evaluator to safely govern model retraining.

### Phase 10: Production Deployment (Upcoming)
Packaging the backend with FastAPI and Docker. Developing the React/Vite Investigator Dashboard to consume the API contracts, visualize the Graph, and render the ML intelligence.

---

## 🚀 Quick Start & Initialization

To initialize the project, run the tests, and start the API server locally, follow these steps:

### 1. Environment Setup
Create a virtual environment and install the required dependencies:
```bash
# Create a virtual environment
python -m venv .venv

# Activate it (Windows)
.venv\Scripts\activate
# Activate it (Mac/Linux)
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 2. Run the RC-2 Master Validation Suite
To guarantee that the backend is functioning properly, run the overarching test script. This will systematically test the entire pipeline from package integrity to the E2E simulation.
```bash
python run_rc2_validation.py
```
*If everything is configured correctly, this will finish with a `9/9 stages passed` success message.*

### 3. Start the Sentinel API
Launch the FastAPI development server:
```bash
uvicorn src.api.InvestigatorAPI:app --reload
```
You can now navigate to **[http://localhost:8000/docs](http://localhost:8000/docs)** to view the interactive Swagger API documentation and submit test requests.

---

## Documentation
Please refer to the `docs/` directory for detailed architectural blueprints and API contracts:
- [Project Overview](docs/01_PROJECT_OVERVIEW.md)
- [System Architecture](docs/02_SYSTEM_ARCHITECTURE.md)
- [Data Pipeline](docs/03_DATA_PIPELINE.md)
- [AI Pipeline](docs/04_AI_PIPELINE.md)
- [Graph Pipeline](docs/05_GRAPH_PIPELINE.md)
- [MLOps Pipeline](docs/06_MLOPS_PIPELINE.md)
- [API Reference](docs/07_API_REFERENCE.md)
- [Frontend Integration](docs/08_FRONTEND_INTEGRATION.md)
- [Deployment](docs/09_DEPLOYMENT.md)
- [Experiments](docs/10_EXPERIMENTS.md)
- [Decisions Log](docs/DECISIONS.md)
- `docs/architecture/` (System Diagrams)
- `docs/reports/project_journal/` (Phase Notebook logs)
