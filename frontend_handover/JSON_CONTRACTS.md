# Sentinel Investigator: JSON Contracts

This document strictly defines the exact JSON Request and Response schemas utilized by the Sentinel Investigator API.

## 1. Input: Client Request
```json
{
  "request_id": "REQ_99210",
  "case_id": "CASE_48193",
  "transaction_id": "TXN_884910",
  "timestamp": "2026-06-30T10:45:00Z"
}
```

## 2. Internal Sub-Contracts (FIE Modules)

### 2.1 Evidence Engine Output
```json
{
  "evidence": [
    {
      "feature_id": "F1863",
      "mapped_concept": "Transaction Velocity",
      "importance_score": 0.41,
      "direction": "increased",
      "historical_deviation_zscore": 4.2
    },
    {
      "feature_id": "F921",
      "mapped_concept": "Geographical Risk",
      "importance_score": 0.28,
      "direction": "increased",
      "historical_deviation_zscore": 2.1
    }
  ]
}
```

### 2.2 Hypothesis Generator Output
```json
{
  "fraud_hypotheses": [
    {
      "name": "Dormant Account Abuse",
      "confidence": 0.73,
      "supporting_evidence_ids": ["F1863", "F921"]
    },
    {
      "name": "Account Takeover (ATO)",
      "confidence": 0.42,
      "supporting_evidence_ids": ["F921"]
    }
  ]
}
```

## 3. Output: The Sentinel Investigator Payload (Final Contract)
This is the comprehensive payload delivered to the Analyst Dashboard.

```json
{
  "metadata": {
    "case_id": "CASE_48193",
    "transaction_id": "TXN_884910",
    "generated_at": "2026-06-30T10:45:02Z",
    "engine_version": "4.0"
  },
  
  "risk_assessment": {
    "probability": 0.9824,
    "risk_score": 98.2,
    "risk_tier": "Critical"
  },
  
  "intelligence": {
    "fraud_hypotheses": [
      {
        "name": "Dormant Account Abuse",
        "confidence": 0.73,
        "supporting_features": ["Transaction Velocity", "Geographical Risk"]
      },
      {
        "name": "Account Takeover (ATO)",
        "confidence": 0.42,
        "supporting_features": ["Geographical Risk"]
      }
    ],
    
    "natural_language_summary": {
      "hypothesis_explanation": "Possible fraud pattern: Dormant account abuse. This hypothesis was generated because several highly influential model features (Transaction Velocity, Geographical Risk) deviated significantly from the historical customer profile, combined with a Critical risk score."
    }
  },
  
  "action_engine": {
    "recommended_actions": [
      {
        "priority": 1,
        "action": "Temporary Hold",
        "reason": "Critical risk score and strong supporting evidence for account abuse."
      },
      {
        "priority": 2,
        "action": "Enhanced KYC Verification",
        "reason": "Standard protocol for suspected Account Takeover."
      },
      {
        "priority": 3,
        "action": "Escalate to Tier-2 Investigator",
        "reason": "Required for cases with risk scores exceeding 95%."
      }
    ]
  }
}
```
