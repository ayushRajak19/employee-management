import os
import subprocess
import markdown
from pypdf import PdfReader

WORKSPACE = r"c:\Users\rainb\Desktop\employee-management"
MD_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Product_Brochure_Human.md")
HTML_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Product_Brochure_Human.html")
PDF_PATH = os.path.join(WORKSPACE, "docs", "MobiusEMS_Product_Brochure_Human.pdf")
ROOT_PDF_PATH = os.path.join(WORKSPACE, "MobiusEMS_Product_Brochure_Human.pdf")

def build_pdf():
    if not os.path.exists(MD_PATH):
        print(f"Error: {MD_PATH} does not exist.")
        return False

    with open(MD_PATH, "r", encoding="utf-8") as f:
        md_raw = f.read()

    html_body = markdown.markdown(md_raw, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MobiusEMS - The Smarter Way to Manage People, Work & Growth</title>
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
    font-size: 8.8pt;
    line-height: 1.48;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }}
  
  /* Top Corporate Header Strip */
  .brand-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #2563eb;
    padding-bottom: 2.8mm;
    margin-bottom: 4.5mm;
  }}
  .brand-logo-area {{
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .brand-badge {{
    background: #2563eb;
    color: #ffffff;
    font-weight: 900;
    font-size: 10pt;
    padding: 3px 8px;
    border-radius: 5px;
    letter-spacing: 0.5px;
  }}
  .brand-title {{
    font-size: 10.5pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.2px;
  }}
  .brand-sub {{
    font-size: 7.2pt;
    color: #64748b;
    font-weight: 500;
  }}
  .brand-meta-tag {{
    font-size: 7.4pt;
    font-weight: 600;
    color: #1d4ed8;
    background: #eff6ff;
    padding: 2.5px 8px;
    border-radius: 4px;
    border: 1px solid #bfdbfe;
    text-align: right;
  }}

  /* Headings & Section Banners */
  h1:first-of-type {{
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    margin: 2mm 0 1mm 0;
    letter-spacing: -0.4px;
    line-height: 1.25;
  }}

  /* Numbered section banners styled like Whalexy presentation slides */
  h1[id^="1-"], h1[id^="2-"], h1[id^="3-"], h1[id^="4-"],
  h1[id^="5-"], h1[id^="6-"], h1[id^="7-"], h1[id^="8-"],
  h1[id^="9-"], h1[id^="10-"], h1[id^="11-"], h1[id^="12-"],
  h1[id^="13-"], h1[id^="14-"], h1[id^="15-"], h1[id^="16-"],
  h1[id^="17-"], h1[id^="18-"], h1[id^="19-"], h1[id^="20-"] {{
    background: linear-gradient(90deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 2.8mm 4.5mm;
    border-radius: 5px;
    font-size: 10.5pt;
    font-weight: 800;
    letter-spacing: 0.3px;
    margin-top: 5.5mm;
    margin-bottom: 2.8mm;
    page-break-after: avoid;
    break-after: avoid;
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);
  }}

  h2 {{
    font-size: 10.8pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 1.2mm;
    margin-top: 3.5mm;
    margin-bottom: 2mm;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h3 {{
    font-size: 9.4pt;
    font-weight: 750;
    color: #0f172a;
    background: #f8fafc;
    border-left: 3.5px solid #2563eb;
    padding: 1.8mm 3.2mm;
    margin-top: 2.8mm;
    margin-bottom: 1.5mm;
    page-break-after: avoid;
    break-after: avoid;
    border-radius: 0 4px 4px 0;
  }}

  p {{
    margin: 1.2mm 0 1.8mm 0;
    color: #334155;
  }}

  strong {{
    color: #0f172a;
    font-weight: 700;
  }}

  ul, ol {{
    margin: 1.2mm 0 2mm 0;
    padding-left: 17px;
    color: #334155;
  }}

  li {{
    margin-bottom: 1mm;
  }}

  /* Whalexy-style clean tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 2.5mm 0 3.5mm 0;
    font-size: 7.8pt;
    page-break-inside: avoid;
    break-inside: avoid;
    border-radius: 4px;
    overflow: hidden;
  }}
  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 2.4mm 3.2mm;
    border: 1px solid #0f172a;
    font-size: 8pt;
  }}
  td {{
    padding: 2mm 3.2mm;
    border: 1px solid #cbd5e1;
    vertical-align: top;
    color: #1e293b;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 3.8mm 0;
  }}

  code {{
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.2pt;
  }}

  /* High-impact highlight callout */
  .highlight-card {{
    background: #f0f7ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 3mm 4mm;
    margin: 2.5mm 0;
    color: #1e3a8a;
    font-weight: 600;
  }}
</style>
</head>
<body>

<div class="brand-header">
  <div class="brand-logo-area">
    <div class="brand-badge">WHALEXY</div>
    <div>
      <div class="brand-title">MobiusEMS | Enterprise Operating System</div>
      <div class="brand-sub">Mobius Bloom Venture Pvt Ltd &bull; Raipur, India</div>
    </div>
  </div>
  <div class="brand-meta-tag">
    Official Product Brochure &bull; employee.whalexy.com
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

    print("Rendering Human-Styled PDF via headless Microsoft Edge...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Edge error:", res.stderr)
        return False

    if os.path.exists(PDF_PATH):
        size_kb = os.path.getsize(PDF_PATH) / 1024
        print(f"PDF Successfully Generated: {PDF_PATH} ({size_kb:.1f} KB)")

        # Copy to root
        with open(PDF_PATH, "rb") as src, open(ROOT_PDF_PATH, "wb") as dst:
            dst.write(src.read())
        print(f"Copied to workspace root: {ROOT_PDF_PATH}")

        reader = PdfReader(PDF_PATH)
        print(f"Total Page Count: {len(reader.pages)}")

        full_text = ""
        for p in reader.pages:
            full_text += p.extract_text() or ""

        # Verification checks
        forbidden = ["Node.js", "Express", "AsyncLocalStorage", "Mongoose", "TypeScript", "$$\\text", "OneToOne"]
        found_forbidden = [f for f in forbidden if f.lower() in full_text.lower()]
        if found_forbidden:
            print(f"WARNING: Forbidden terms found in PDF: {found_forbidden}")
        else:
            print("VERIFICATION PASSED: Zero code architecture terms, zero unrendered LaTeX!")

        return True
    else:
        print("Error: PDF output was not created.")
        return False

if __name__ == "__main__":
    build_pdf()
