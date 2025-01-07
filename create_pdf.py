from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)

content = """This is a test document for Claude AI.

Key Points:
1. Testing knowledge base integration
2. Verifying file upload functionality
3. Checking context window display
4. Ensuring chat maintains file context

This document should be included in the chat context when starting new conversations."""

for line in content.split('\n'):
    pdf.cell(200, 10, line.strip(), ln=True)

pdf.output("test_document.pdf")
