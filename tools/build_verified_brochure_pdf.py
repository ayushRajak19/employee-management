import os
import subprocess
import markdown
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
MD_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Verified_Product_Brochure.md")
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Verified_Product_Brochure.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Verified_Product_Brochure.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Verified_Product_Brochure.pdf")

def build_pdf():
    if not os.path.exists(MD_PATH):
        print(f"Error: {MD_PATH} does not exist.")
        return False

    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_raw = f.read()

    # Convert markdown with tables, fenced code, toc, and nl2br
    html_body = markdown.markdown(md_raw, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS - Official Enterprise Product Brochure</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
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
    line-height: 1.44;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }}
  
  .top-banner {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #2563eb;
    padding-bottom: 2.5mm;
    margin-bottom: 4mm;
  }}
  .brand-logo {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .brand-title {{
    font-size: 9.8pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .brand-meta {{
    font-size: 7.2pt;
    font-weight: 600;
    color: #1d4ed8;
    background: #eff6ff;
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid #bfdbfe;
    text-align: right;
  }}

  h1:first-of-type {{
    font-size: 17pt;
    font-weight: 900;
    color: #0f172a;
    margin: 2mm 0 1.2mm 0;
    letter-spacing: -0.4px;
    line-height: 1.2;
  }}

  h1[id^="1-"], h1[id^="2-"], h1[id^="3-"], h1[id^="4-"],
  h1[id^="5-"], h1[id^="6-"], h1[id^="7-"], h1[id^="8-"],
  h1[id^="9-"], h1[id^="10-"], h1[id^="11-"], h1[id^="12-"],
  h1[id^="13-"], h1[id^="14-"], h1[id^="15-"], h1[id^="16-"], h1[id^="17-"] {{
    background: linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 2.6mm 4.5mm;
    border-radius: 4px;
    font-size: 10.2pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 5mm;
    margin-bottom: 2.5mm;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h2 {{
    font-size: 10.5pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 1.2mm;
    margin-top: 3.5mm;
    margin-bottom: 1.6mm;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h3 {{
    font-size: 9.2pt;
    font-weight: 750;
    color: #0f172a;
    background: #f8fafc;
    border-left: 3.5px solid #2563eb;
    padding: 1.8mm 3.2mm;
    margin-top: 2.8mm;
    margin-bottom: 1.4mm;
    page-break-after: avoid;
    break-after: avoid;
    border-radius: 0 4px 4px 0;
  }}

  p {{
    margin: 1.2mm 0 1.8mm 0;
  }}

  strong {{
    color: #0f172a;
    font-weight: 700;
  }}

  ul, ol {{
    margin: 1.2mm 0 2mm 0;
    padding-left: 16px;
  }}

  li {{
    margin-bottom: 0.9mm;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 2.5mm 0 3.5mm 0;
    font-size: 7.6pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 2.2mm 3.2mm;
    border: 1px solid #0f172a;
  }}
  td {{
    padding: 2mm 3.2mm;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 3.5mm 0;
  }}

  code {{
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8pt;
  }}
</style>
</head>
<body>

<div class="top-banner">
  <div class="brand-logo">
    <div class="brand-title">MobiusEMS | Enterprise Operating System</div>
  </div>
  <div class="brand-meta">
    Mobius Bloom Venture Pvt Ltd &bull; employee.whalexy.com &bull; v2.0-PROD
  </div>
</div>

{html_body}

</body>
</html>
"""

    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"Generated HTML: {HTML_PATH}")

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    if not os.path.exists(edge_exe):
        print("Error: Microsoft Edge not found at standard paths.")
        return False

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

    print("Rendering PDF via headless Microsoft Edge...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Edge error:", res.stderr)
        return False

    if os.path.exists(PDF_PATH):
        size_kb = os.path.getsize(PDF_PATH) / 1024
        print(f"PDF Successfully Generated: {PDF_PATH} ({size_kb:.1f} KB)")

        with open(PDF_PATH, "rb") as src, open(ROOT_PDF_PATH, "wb") as dst:
            dst.write(src.read())
        print(f"Copied to workspace root: {ROOT_PDF_PATH}")

        reader = PdfReader(PDF_PATH)
        print(f"Total Page Count: {len(reader.pages)}")

        full_text = ""
        for p in reader.pages:
            full_text += p.extract_text() or ""

        forbidden = ["Node.js", "Express", "AsyncLocalStorage", "Mongoose", "TypeScript", "$$\\text", "OneToOne"]
        found_forbidden = [f for f in forbidden if f.lower() in full_text.lower()]
        if found_forbidden:
            print(f"WARNING: Forbidden terms found in PDF: {found_forbidden}")
        else:
            print("VERIFICATION PASSED: Zero forbidden architecture terms and zero unrendered LaTeX detected!")

        return True
    else:
        print("Error: PDF output was not created.")
        return False

if __name__ == "__main__":
    build_pdf()
