import os
import re

docs = [
    "01_PROJECT_OVERVIEW.md",
    "02_SYSTEM_ARCHITECTURE.md",
    "03_DATA_PIPELINE.md",
    "04_AI_PIPELINE.md",
    "05_GRAPH_PIPELINE.md",
    "06_MLOPS_PIPELINE.md",
    "07_API_REFERENCE.md",
    "08_FRONTEND_INTEGRATION.md",
    "09_DEPLOYMENT.md",
    "10_EXPERIMENTS.md",
    "DECISIONS.md"
]

for i, doc in enumerate(docs):
    path = f"docs/{doc}"
    if not os.path.exists(path):
        continue
        
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove old navigation if any
    content = re.sub(r'\n*---\n\n## Navigation\n.*', '', content, flags=re.DOTALL)
    
    nav_links = []
    nav_links.append("[🏠 Home](../README.md)")
    if i > 0:
        nav_links.append(f"[⬅️ Previous]({docs[i-1]})")
    if i < len(docs) - 1:
        nav_links.append(f"[Next ➡️]({docs[i+1]})")
        
    nav_block = f"\n\n---\n\n## Navigation\n\n" + " | ".join(nav_links) + "\n"
    
    # Specific fixes
    if doc == "02_SYSTEM_ARCHITECTURE.md":
        content = content.replace("*(See `architecture/SYSTEM_ARCHITECTURE.png` for a visual diagram)*", "*(See [System Architecture Diagram](architecture/SYSTEM_ARCHITECTURE.png) for a visual diagram)*")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content + nav_block)

# Fix README.md
with open("README.md", "r", encoding="utf-8") as f:
    readme = f.read()

# Only replace if not already replaced
replacements = {
    "- `docs/01_PROJECT_OVERVIEW.md`": "- [Project Overview](docs/01_PROJECT_OVERVIEW.md)",
    "- `docs/02_SYSTEM_ARCHITECTURE.md`": "- [System Architecture](docs/02_SYSTEM_ARCHITECTURE.md)",
    "- `docs/03_DATA_PIPELINE.md`": "- [Data Pipeline](docs/03_DATA_PIPELINE.md)",
    "- `docs/04_AI_PIPELINE.md`": "- [AI Pipeline](docs/04_AI_PIPELINE.md)",
    "- `docs/05_GRAPH_PIPELINE.md`": "- [Graph Pipeline](docs/05_GRAPH_PIPELINE.md)",
    "- `docs/06_MLOPS_PIPELINE.md`": "- [MLOps Pipeline](docs/06_MLOPS_PIPELINE.md)",
    "- `docs/07_API_REFERENCE.md`": "- [API Reference](docs/07_API_REFERENCE.md)",
    "- `docs/08_FRONTEND_INTEGRATION.md`": "- [Frontend Integration](docs/08_FRONTEND_INTEGRATION.md)",
    "- `docs/09_DEPLOYMENT.md`": "- [Deployment](docs/09_DEPLOYMENT.md)",
    "- `docs/10_EXPERIMENTS.md`": "- [Experiments](docs/10_EXPERIMENTS.md)",
    "- `docs/DECISIONS.md`": "- [Decisions Log](docs/DECISIONS.md)",
    "docs/01_PROJECT_OVERVIEW.md.": "[docs/01_PROJECT_OVERVIEW.md](docs/01_PROJECT_OVERVIEW.md)."
}

for old, new in replacements.items():
    readme = readme.replace(old, new)

with open("README.md", "w", encoding="utf-8") as f:
    f.write(readme)
