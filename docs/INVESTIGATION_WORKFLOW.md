# Sentinel Investigator: Banking Investigation Workflow

This document maps the exact human-in-the-loop lifecycle of a flagged transaction within the Sentinel AI platform.

## 1. Trigger (The Event)
1. **Transaction Arrives**: A customer initiates a transfer, payment, or withdrawal.
2. **Feature Pipeline Execution**: Temporal, behavioral, and velocity features are computed in real-time (Phase 3/4).
3. **Fraud Decision Engine Scoring**: The `FraudDecisionEngine` ingests the feature vector.
4. **Risk Tier Assignment**: Evaluated against the Business Cost Curve threshold (`threshold_policy.json`).
   - If `Approve` or `Elevated` -> Transaction proceeds (perhaps logged for offline monitoring).
   - If `High` or `Critical` -> Transaction is suspended, and an Alert is generated.

## 2. Case Creation & Assignment
1. **Alert Queueing**: A new `case_id` is minted and pushed to the Sentinel Dashboard's "Pending Review" queue.
2. **Analyst Selection**: A Level-1 or Level-2 investigator claims the case from the queue based on Priority and Escalation routing.

## 3. Sentinel Investigator Execution (The Copilot)
When the investigator opens the case, the Sentinel Investigator API executes:
1. **Probability Retrieval**: Fetches the 98% risk score.
2. **Explainability Extraction**: Triggers the SHAP Engine to isolate the top 5 driving features.
3. **Knowledge Base Retrieval**: Matches the feature vector against institutional Fraud Patterns (e.g., *Synthetic Identity*, *Account Takeover*).
4. **NLG Translation**: Converts mathematical tensors into readable English bullet points.
5. **Recommendation Formulation**: Uses Bank Policies to recommend a specific action (e.g., "Request KYC", "Freeze Account").

## 4. Human Decision (The Verdict)
The Analyst reviews the Sentinel Investigator payload on their dashboard:
1. **Context Assessment**: Reads the NLG summary, fraud typology, and SHAP reasons.
2. **Verification**: Checks offline systems or contacts the customer if required.
3. **Action Execution**:
   - **False Alarm**: Mark as False Positive -> Releases funds -> Feeds back into Phase 9 MLOps for retraining.
   - **Confirmed Fraud**: Mark as True Positive -> Freezes account -> Initiates recovery -> Feeds into Phase 7 Graph Engine to flag associated IPs/Devices.
   - **Escalation**: Pushes to Level-2 Analyst or AML Compliance Officer.

## 5. Audit & Closure
1. **Audit Logging**: The entire JSON payload, timestamp, and Analyst ID are permanently stored in PostgreSQL for regulatory compliance.
2. **Case Closed**: Removed from the active queue.
