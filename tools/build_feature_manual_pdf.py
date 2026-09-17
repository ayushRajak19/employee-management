import os
import re
import subprocess
import markdown
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
MD_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Feature_Explanation_Manual.md")
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Feature_Explanation_Manual.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Feature_Explanation_Manual.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Complete_Feature_Explanation_Manual.pdf")

def convert_mermaid_and_math(text: str) -> str:
    # Convert Mermaid code blocks into styled mermaid pre tags
    def replace_mermaid(match):
        code = match.group(1).strip()
        return f'<div class="diagram-card"><div class="diagram-title">System Architecture / Workflow Diagram</div><pre class="mermaid">{code}</pre></div>'
    
    text = re.sub(r'```mermaid\s*([\s\S]*?)\s*```', replace_mermaid, text)
    
    # Convert github alerts like > [!NOTE] into callouts
    text = re.sub(r'>\s*\[!NOTE\]\s*(.*?)(?=\n\n|\n[^\>]|$)', r'<div class="callout callout-info"><div class="callout-title">NOTE</div><p>\1</p></div>', text, flags=re.DOTALL)
    text = re.sub(r'>\s*\[!IMPORTANT\]\s*(.*?)(?=\n\n|\n[^\>]|$)', r'<div class="callout callout-important"><div class="callout-title">IMPORTANT</div><p>\1</p></div>', text, flags=re.DOTALL)
    text = re.sub(r'>\s*\[!WARNING\]\s*(.*?)(?=\n\n|\n[^\>]|$)', r'<div class="callout callout-warning"><div class="callout-title">WARNING</div><p>\1</p></div>', text, flags=re.DOTALL)
    
    return text

def build_html():
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_raw = f.read()

    processed_md = convert_mermaid_and_math(md_raw)
    html_body = markdown.markdown(processed_md, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS Complete Enterprise Feature Explanation Manual v2.0</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({{
    startOnLoad: true,
    theme: 'neutral',
    securityLevel: 'loose',
    flowchart: {{ useMaxWidth: true, htmlLabels: true, curve: 'basis' }},
    sequence: {{ useMaxWidth: true, showSequenceNumbers: false }}
  }});
</script>
<style>
  @page {{
    size: A4 portrait;
    margin: 14mm 14mm 14mm 14mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.8pt;
    line-height: 1.48;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
  }}
  
  /* Running Header & Footer for printed pages */
  .doc-header {{
    border-bottom: 2px solid #2563eb;
    padding-bottom: 8px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }}
  .doc-header-title {{
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }}
  .doc-header-meta {{
    font-size: 7.5pt;
    font-weight: 600;
    color: #64748b;
  }}

  /* Typography */
  h1, h2, h3, h4, h5, h6 {{
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h1 {{
    font-size: 17pt;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-top: 26px;
    margin-bottom: 12px;
    page-break-before: always;
  }}
  h1:first-of-type {{
    page-break-before: avoid;
  }}
  h2 {{
    font-size: 12pt;
    color: #1e3a8a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 8px;
  }}
  h3 {{
    font-size: 10pt;
    color: #0f172a;
    margin-top: 14px;
    margin-bottom: 6px;
  }}
  h4 {{
    font-size: 9pt;
    margin-top: 10px;
    margin-bottom: 4px;
  }}
  p {{
    margin: 4px 0 8px 0;
  }}
  
  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 8.2pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #0f172a;
  }}
  td {{
    padding: 5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  
  /* Code & Pre */
  code {{
    font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
    font-size: 7.8pt;
    background-color: #f1f5f9;
    color: #094c99;
    padding: 1.5px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }}
  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 10px 12px;
    border-radius: 5px;
    font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
    font-size: 7.5pt;
    line-height: 1.35;
    overflow-x: auto;
    margin: 8px 0 12px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  pre code {{
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }}

  /* Diagram Cards */
  .diagram-card {{
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  .diagram-title {{
    font-size: 7.8pt;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 8px;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 4px;
  }}
  pre.mermaid {{
    background-color: transparent !important;
    color: #0f172a !important;
    padding: 4px 0 !important;
    margin: 0 !important;
    display: flex;
    justify-content: center;
    overflow: visible;
  }}

  /* Callouts & Badges */
  .callout {{
    border-left: 4px solid #2563eb;
    background-color: #eff6ff;
    padding: 8px 12px;
    margin: 10px 0 12px 0;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }}
  .callout-title {{
    font-weight: 700;
    font-size: 8pt;
    text-transform: uppercase;
    color: #1e3a8a;
    margin-bottom: 3px;
  }}
  .callout-important {{
    border-left-color: #f59e0b;
    background-color: #fffbeb;
  }}
  .callout-important .callout-title {{
    color: #b45309;
  }}
  .callout-warning {{
    border-left-color: #ef4444;
    background-color: #fef2f2;
  }}
  .callout-warning .callout-title {{
    color: #b91c1c;
  }}

  /* Lists */
  ul, ol {{
    margin: 4px 0 8px 0;
    padding-left: 20px;
  }}
  li {{
    margin-bottom: 2.5px;
  }}
  
  /* Horizontal Rules */
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
  }}
</style>
</head>
<body>

<div class="doc-header">
  <div class="doc-header-title">Mobius Bloom Venture | MobiusEMS Enterprise System Documentation</div>
  <div class="doc-header-meta">Platform: https://employee.whalexy.com | v2.0.0-PROD</div>
</div>

{html_body}

</body>
</html>
"""
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Generated HTML at: {HTML_PATH}")

def compile_pdf():
    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    
    if not os.path.exists(edge_exe):
        print(f"Edge executable not found at {edge_exe}")
        return False

    cmd = [
        edge_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=6000",
        f"--print-to-pdf={PDF_PATH}",
        HTML_PATH
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Edge error:", res.stderr)
        return False
    
    if os.path.exists(PDF_PATH):
        size_bytes = os.path.getsize(PDF_PATH)
        print(f"PDF generated: {PDF_PATH} ({size_bytes / 1024:.1f} KB)")
        
        # Copy to root
        with open(PDF_PATH, "rb") as src, open(ROOT_PDF_PATH, "wb") as dst:
            dst.write(src.read())
        print(f"Copied to workspace root: {ROOT_PDF_PATH}")
        
        reader = PdfReader(PDF_PATH)
        print(f"Total Pages in PDF: {len(reader.pages)}")
        return True
    else:
        print("PDF was not created.")
        return False

if __name__ == "__main__":
    build_html()
    compile_pdf()
