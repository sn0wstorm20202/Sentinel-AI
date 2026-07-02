import os
import re
from pathlib import Path
import urllib.parse

def validate_markdown_links():
    print("Starting Stage 10 - Documentation Validation...")
    
    docs_to_check = [
        Path("README.md"),
        Path("docs/01_PROJECT_OVERVIEW.md"),
        Path("docs/02_SYSTEM_ARCHITECTURE.md"),
        Path("docs/03_DATA_PIPELINE.md"),
        Path("docs/04_AI_PIPELINE.md"),
        Path("docs/05_GRAPH_PIPELINE.md"),
        Path("docs/06_MLOPS_PIPELINE.md"),
        Path("docs/07_API_REFERENCE.md"),
        Path("docs/08_FRONTEND_INTEGRATION.md"),
        Path("docs/09_DEPLOYMENT.md"),
        Path("docs/10_EXPERIMENTS.md"),
        Path("docs/DECISIONS.md")
    ]
    
    results = []
    failures = 0
    link_pattern = re.compile(r'\[.*?\]\((.*?)\)')
    
    for doc in docs_to_check:
        if not doc.exists():
            results.append((doc.name, "FAIL", "File does not exist"))
            failures += 1
            continue
            
        content = doc.read_text(encoding="utf-8")
        links = link_pattern.findall(content)
        
        broken_links = []
        for link in links:
            # ignore absolute URLs and anchors in same file
            if link.startswith("http") or link.startswith("#") or link.startswith("mailto:"):
                continue
            
            # strip anchor from file link
            file_link = link.split("#")[0]
            if not file_link:
                continue
                
            # url decode
            file_link = urllib.parse.unquote(file_link)
            
            target_path = (doc.parent / file_link).resolve()
            if not target_path.exists():
                broken_links.append(link)
                
        if broken_links:
            results.append((doc.name, "FAIL", f"Broken links: {', '.join(broken_links)}"))
            failures += 1
        else:
            results.append((doc.name, "PASS", "All relative links resolve correctly"))
            
    # Check old docs if they should be deleted or warn about them
    # But for now just output the report
    
    report_md = "# Stage 10 — Documentation Validation Report\n\n"
    report_md += "| Document | Status | Notes |\n"
    report_md += "| :--- | :--- | :--- |\n"
    
    for target, status, notes in results:
        icon = "✅ PASS" if status == "PASS" else "❌ FAIL"
        report_md += f"| **{target}** | {icon} | {notes} |\n"
        
    report_md += f"\n**Overall Verdict:** {'✅ PASS' if failures == 0 else '❌ FAIL'} ({failures} failures)\n"
    
    Path("reports/Documentation_Validation_Report.md").write_text(report_md, encoding="utf-8")
    print(f"\nValidation Complete. Failures: {failures}")
    print("Report written to reports/Documentation_Validation_Report.md")

if __name__ == "__main__":
    validate_markdown_links()
