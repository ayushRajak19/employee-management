import os
import re
import subprocess
import markdown
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
MD_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Detailed_Feature_Brochure.md")
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Detailed_Feature_Brochure.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Detailed_Feature_Brochure.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Detailed_Feature_Brochure.pdf")

def build_detailed_brochure():
    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_raw = f.read()

    # Pre-process markdown for math or callouts if needed
    html_body = markdown.markdown(md_raw, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS - Detailed Enterprise Feature Brochure</title>
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
    font-size: 8.8pt;
    line-height: 1.48;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }}
  
  .header-strip {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 3mm;
    margin-bottom: 6mm;
  }}
  .brand-title {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .brand-meta {{
    font-size: 7.8pt;
    font-weight: 600;
    color: #2563eb;
    background: #eff6ff;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #bfdbfe;
  }}

  /* Typography */
  h1 {{
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    margin: 4mm 0 2mm 0;
    letter-spacing: -0.3px;
  }}
  h2 {{
    font-size: 13pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 2mm;
    margin-top: 6mm;
    margin-bottom: 3mm;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h3 {{
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 4.5mm;
    margin-bottom: 2mm;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h4 {{
    font-size: 9.2pt;
    font-weight: 700;
    color: #2563eb;
    margin-top: 3.5mm;
    margin-bottom: 1.5mm;
    page-break-after: avoid;
    break-after: avoid;
  }}
  p {{
    margin: 2mm 0 3mm 0;
  }}
  ul, ol {{
    margin: 2mm 0 3mm 0;
    padding-left: 18px;
  }}
  li {{
    margin-bottom: 1.5mm;
  }}

  /* Feature Showcase Styling */
  h1[id^="feature-showcase"], h2[id^="feature-showcase"] {{
    background: linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%);
    border-left: 5px solid #16a34a;
    padding: 3mm 4mm;
    border-bottom: none;
    color: #0f172a;
    margin-top: 8mm;
    border-radius: 0 6px 6px 0;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 3.5mm 0 5mm 0;
    font-size: 8pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 3mm 3.5mm;
    border: 1px solid #0f172a;
  }}
  td {{
    padding: 2.8mm 3.5mm;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  /* Code & ASCII Boxes */
  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 3.5mm 4.5mm;
    border-radius: 6px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 7.6pt;
    line-height: 1.35;
    overflow-x: auto;
    margin: 3mm 0 4.5mm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  code {{
    font-family: 'Consolas', 'Courier New', monospace;
    background-color: #f1f5f9;
    color: #0369a1;
    padding: 1.5px 4px;
    border-radius: 3px;
    font-size: 8pt;
    border: 1px solid #e2e8f0;
  }}
  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }}

  /* Connect with Us Box */
  h1[id^="connect-with-us"] {{
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 4mm 6mm;
    border-radius: 8px;
    border-left: none;
    margin-top: 8mm;
  }}
  
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 5mm 0;
  }}
</style>
</head>
<body>

<div class="header-strip">
  <div class="brand-title">Mobius Bloom Venture | MobiusEMS Product Brochure & Capabilities</div>
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

    print("Compiling Detailed Brochure PDF via Edge...")
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
        print(f"Total Pages in Detailed Brochure PDF: {len(reader.pages)}")
        return True
    else:
        print("PDF was not created.")
        return False

if __name__ == "__main__":
    build_detailed_brochure()
