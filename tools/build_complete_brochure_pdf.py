import os
import subprocess
import markdown
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
MD_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Product_Brochure.md")
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Product_Brochure.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Complete_Product_Brochure.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Complete_Product_Brochure.pdf")

def build_complete_brochure():
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_raw = f.read()

    html_body = markdown.markdown(md_raw, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS Complete Enterprise Product Brochure</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    font-size: 8.6pt;
    line-height: 1.46;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }}
  
  .header-strip {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 2.5mm;
    margin-bottom: 5mm;
  }}
  .brand-title {{
    font-size: 9pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .brand-meta {{
    font-size: 7.5pt;
    font-weight: 600;
    color: #2563eb;
    background: #eff6ff;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #bfdbfe;
  }}

  /* Typography */
  h1 {{
    font-size: 16pt;
    font-weight: 900;
    color: #0f172a;
    margin: 4mm 0 2mm 0;
    letter-spacing: -0.3px;
  }}
  h1[id^="section"] {{
    background: linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 3mm 5mm;
    border-radius: 5px;
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 7mm;
    margin-bottom: 3.5mm;
    page-break-before: auto;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h2 {{
    font-size: 11pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 1.5mm;
    margin-top: 4mm;
    margin-bottom: 2mm;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h3 {{
    font-size: 9.6pt;
    font-weight: 750;
    color: #0f172a;
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    padding: 2mm 3.5mm;
    margin-top: 3.5mm;
    margin-bottom: 1.5mm;
    page-break-after: avoid;
    break-after: avoid;
    border-radius: 0 4px 4px 0;
  }}
  p {{
    margin: 1.5mm 0 2.5mm 0;
  }}
  ul, ol {{
    margin: 1.5mm 0 2.5mm 0;
    padding-left: 18px;
  }}
  li {{
    margin-bottom: 1mm;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 3mm 0 4.5mm 0;
    font-size: 7.8pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 2.5mm 3.5mm;
    border: 1px solid #0f172a;
  }}
  td {{
    padding: 2.2mm 3.5mm;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  /* ASCII Diagram Boxes */
  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 3mm 4mm;
    border-radius: 5px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 7.2pt;
    line-height: 1.35;
    overflow-x: auto;
    margin: 2.5mm 0 3.5mm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 4.5mm 0;
  }}

  .contact-footer {{
    background: #0f172a;
    color: #ffffff;
    padding: 4mm 6mm;
    border-radius: 6px;
    margin-top: 6mm;
  }}
</style>
</head>
<body>

<div class="header-strip">
  <div class="brand-title">Mobius Bloom Venture | MobiusEMS Product Feature Catalog</div>
  <div class="brand-meta">Enterprise Edition v2.0-PROD | employee.whalexy.com</div>
</div>

{html_body}

</body>
</html>
"""

    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Written HTML: {HTML_PATH}")

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=4000",
        f"--print-to-pdf={PDF_PATH}",
        HTML_PATH
    ]

    print("Compiling Complete Product Brochure PDF via Edge...")
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
        print(f"Total Pages in Complete Brochure PDF: {len(reader.pages)}")
        return True
    else:
        print("PDF was not created.")
        return False

if __name__ == "__main__":
    build_complete_brochure()
