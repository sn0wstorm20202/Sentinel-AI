# Data contract

- `raw/`: immutable source files only.
- `processed/`: generated cleaned and feature datasets.
- `external/`: third-party reference data with source and license recorded.
- `backup/`: manually retained checkpoints and historical artifacts.

For every added dataset, record its filename, source, acquisition date, version, license, row count, schema reference, and SHA-256 checksum in `manifest.csv`. Raw CSV files are versioned through Git LFS; Git tracks their lightweight pointers while LFS stores the content.
