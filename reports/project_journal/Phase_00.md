# Phase 00 — Enterprise Project Initialization

## Objective

Create a production-oriented, reproducible project foundation before ML implementation begins.

## Methods

- Created the standard directory structure and numbered notebook plan.
- Added environment, Git, artifact, data-integrity, and experiment-recording conventions.
- Verified the local GPU through the NVIDIA driver.
- Refined the repository into domain-based source packages and dedicated documentation, model, artifact, test, report, and presentation-asset areas.
- Registered the raw bank-fraud dataset in the data manifest and configured Git LFS for raw CSV versioning.

## Observations

- Host interpreter at initialization: Python 3.14.4.
- Project environment: Python 3.13.14, selected because `ydata-profiling` does not support Python 3.14.
- GPU detected: NVIDIA GeForce RTX 5050 Laptop GPU with 8,151 MiB reported memory.
- No source dataset, checkpoint notebook, MI score file, or architecture PDF was present in the parent workspace.

## Challenges

- The host's Python 3.14 interpreter was incompatible with `ydata-profiling`.
- CUDA availability inside PyTorch cannot be tested until PyTorch is introduced in a later phase.

## Fixes

- Created `.venv` with a project-local Python 3.13.14 runtime and recorded the interpreter in `.python-version`.
- Installed the requested dependency set and froze all resolved packages in `requirements.txt`.
- Expected asset locations are documented without creating synthetic substitutes.

## Results

Project scaffold created. The environment contains the requested Phase 0 packages, all requested imports succeed, `pip check` reports no broken requirements, and all ten notebooks pass the nbformat schema validator.

## Validation

- Python: 3.13.14
- Dependency lock: 154 exact package pins in `requirements.txt`
- Requested library imports: passed
- Dependency consistency (`pip check`): passed
- Notebook count/schema/seed: 10/10 passed
- NVIDIA driver check: RTX 5050 detected
- PyTorch CUDA check: deferred because PyTorch is intentionally not installed in Phase 0
- Raw dataset: `bank_fraud_dataset.csv`, 9,082 records, SHA-256 `c6181fa1ae9aecc899ca17d2223e3ef1ce9f64fd2b6b1f3e252ee13b6cf07915`
- Raw CSV Git attribute: LFS tracking enabled

## Next Step

Supply and checksum `data/raw/fraud_dataset.csv`, then begin `01_Data_Audit.ipynb`.
