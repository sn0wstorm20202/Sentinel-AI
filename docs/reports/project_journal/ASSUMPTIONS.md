# Assumptions Register

**Assumption 01**
- **Detail**: `F3888` likely represents Account Date or Date of Birth.
- **Confidence**: Medium
- **Validation**: Based on string distribution spanning from 1900-2025. Extracted lifecycle components (Age, Tenure) based on this.

**Assumption 02**
- **Detail**: Highly skewed continuous variables (e.g., `F1863`, `F1489`) represent financial transaction aggregates.
- **Confidence**: Medium
- **Validation**: High variance and wide distribution indicative of monetary value aggregates.

**Assumption 03**
- **Detail**: Missingness in categorical inputs like `F3892` represents systemic KYC omissions rather than random errors.
- **Confidence**: High
- **Validation**: Fraudsters often exploit systemic onboarding gaps; deliberately encoded as `Unknown`.
