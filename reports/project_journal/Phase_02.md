# Phase 02 — Data Cleaning

## Objective

Transform the audited raw banking fraud dataset into a clean, reproducible, model-ready dataset while preventing data leakage, preserving business information, and maintaining complete reproducibility.

## Methods

- Validated raw dataset integrity prior to any operations.
- Removed index artifact (`Unnamed: 0`) and target leakage (`F3912`).
- Removed entirely missing (100%) and highly missing (>95%) columns, reducing unneeded dimensionality dynamically.
- Extracted temporal features (`Account_Year`, `Account_Month`, `Account_Age_Days`, etc.) from raw datetime string `F3888` and subsequently dropped the raw field.
- Safely encoded categorical variables using `LabelEncoder`, with missing states deliberately mapped to 'Unknown' (particularly for `F3892`).
- Implemented a specialized `-999` imputation strategy for all numeric missing values. **Note**: This is an algorithm-specific design choice intended for tree models (XGBoost/LightGBM) to isolate missingness. Future deep learning or Graph Neural Network (GNN) pipelines will require a different approach (e.g., NaN masks or Median + Missing Indicator).
- Evaluated outlier distribution and skewness but intentionally preserved outliers to retain potential fraud signals.
- Optimized dataset memory footprint by safely downcasting float64 to float32 and int64 to int32.
- Automated the generation of comprehensive CSV logs, PNG visual reports, and data health summaries into `reports/phase_02/`.

## Observations

- The dataset contains highly skewed numerical variables and prevalent missingness across features.
- Outliers are significant in continuous columns, strongly correlating with potential fraudulent activity.
- The categorical variable `F3892` exhibited high missingness (28.6%), requiring a dedicated missing class strategy rather than naive imputation.
- A substantial memory footprint could be efficiently mitigated just by optimizing the variable types (downcasting) without any loss in precision.

## Challenges

- Naive missing value imputation (e.g., filling with mean or median) would destroy the valuable signal inherently linked to the missingness of variables in fraud data.
- The sheer number of near-empty features inflated the dimensionality and needed aggressive, programmatic pruning without hardcoding thresholds.
- Dealing with implicit string dates and parsing them to model-friendly numeric features.

## Fixes

- Dropped over 420 columns dynamically by scanning for >95% missing values, index artifacts, and leakage features.
- Retained outliers explicitly, avoiding scaling/transforming skewed features to preserve raw signal patterns.
- Created 'Unknown' categories for string features and utilized `-999` imputation for numeric columns. This imputation is tailored specifically for XGBoost / LightGBM split mechanics and should be adapted for future GNN pipelines.
- Captured preprocessing pipelines such as label encoders in `label_encoders.pkl` to guarantee reproducibility in downstream environments.

## Results

- Successfully processed and refined the raw data into `processed_dataset.csv` saved directly into the `data/processed/` folder.
- Reduced the dataset dimensionality substantially while engineering useful temporal features.
- Replaced all objects/datetime columns with fully numeric attributes, optimizing execution speed and lowering memory overhead efficiently.

## Validation

- Leakage checked: `F3912` absent.
- Artifacts checked: `Unnamed: 0` absent.
- Unhandled missing values: 0 remaining (all replaced by -999 or 'Unknown').
- Objects remaining: 0.
- Datetimes remaining: 0.
- Dimensions and memory reduced seamlessly, documented via automated reports in `reports/phase_02/`.

## Next Step

Execute Phase 3 Feature Selection (`03_Feature_Selection.ipynb`), applying statistical and model-based techniques to isolate the most predictive variables from the cleaned baseline.
