import os
import zipfile
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def create_xlsx(filepath, sheets):
    """
    sheets: list of (sheet_name, headers, rows)
    """
    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml
        types_elem = ET.Element('Types', xmlns="http://schemas.openxmlformats.org/package/2006/content-types")
        ET.SubElement(types_elem, 'Default', Extension="rels", ContentType="application/vnd.openxmlformats-package.relationships+xml")
        ET.SubElement(types_elem, 'Default', Extension="xml", ContentType="application/xml")
        ET.SubElement(types_elem, 'Override', PartName="/xl/workbook.xml", ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
        for i in range(1, len(sheets) + 1):
            ET.SubElement(types_elem, 'Override', PartName=f"/xl/worksheets/sheet{i}.xml", ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml")
        z.writestr('[Content_Types].xml', ET.tostring(types_elem, encoding='utf-8', xml_declaration=True))

        # _rels/.rels
        rels_elem = ET.Element('Relationships', xmlns="http://schemas.openxmlformats.org/package/2006/relationships")
        ET.SubElement(rels_elem, 'Relationship', Id="rId1", Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", Target="xl/workbook.xml")
        z.writestr('_rels/.rels', ET.tostring(rels_elem, encoding='utf-8', xml_declaration=True))

        # xl/workbook.xml
        wb_elem = ET.Element('workbook', xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main", attrib={'xmlns:r': "http://schemas.openxmlformats.org/officeDocument/2006/relationships"})
        sheets_elem = ET.SubElement(wb_elem, 'sheets')
        for i, (name, _, _) in enumerate(sheets, 1):
            ET.SubElement(sheets_elem, 'sheet', name=name, sheetId=str(i), attrib={'r:id': f"rId{i}"})
        z.writestr('xl/workbook.xml', ET.tostring(wb_elem, encoding='utf-8', xml_declaration=True))

        # xl/_rels/workbook.xml.rels
        wb_rels_elem = ET.Element('Relationships', xmlns="http://schemas.openxmlformats.org/package/2006/relationships")
        for i in range(1, len(sheets) + 1):
            ET.SubElement(wb_rels_elem, 'Relationship', Id=f"rId{i}", Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", Target=f"worksheets/sheet{i}.xml")
        z.writestr('xl/_rels/workbook.xml.rels', ET.tostring(wb_rels_elem, encoding='utf-8', xml_declaration=True))

        # Sheets
        for i, (name, headers, rows) in enumerate(sheets, 1):
            ws_elem = ET.Element('worksheet', xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main")
            sd_elem = ET.SubElement(ws_elem, 'sheetData')
            
            # Header row
            header_row = ET.SubElement(sd_elem, 'row', r="1")
            for c_idx, h_text in enumerate(headers):
                col_letter = chr(ord('A') + c_idx)
                c_elem = ET.SubElement(header_row, 'c', r=f"{col_letter}1", t="inlineStr")
                is_elem = ET.SubElement(c_elem, 'is')
                t_elem = ET.SubElement(is_elem, 't')
                t_elem.text = str(h_text)

            # Data rows
            for r_idx, row_data in enumerate(rows, 2):
                row_elem = ET.SubElement(sd_elem, 'row', r=str(r_idx))
                for c_idx, val in enumerate(row_data):
                    col_letter = chr(ord('A') + c_idx)
                    c_elem = ET.SubElement(row_elem, 'c', r=f"{col_letter}{r_idx}", t="inlineStr")
                    is_elem = ET.SubElement(c_elem, 'is')
                    t_elem = ET.SubElement(is_elem, 't')
                    t_elem.text = str(val) if val is not None else ""

            z.writestr(f"xl/worksheets/sheet{i}.xml", ET.tostring(ws_elem, encoding='utf-8', xml_declaration=True))

def generate_fixtures():
    os.makedirs(BASE_DIR, exist_ok=True)

    # 1. Valid Complete Writing Test (8 questions: 5 P1, 2 P2, 1 P3)
    manifest_headers = ["TestCode", "Title", "Description"]
    manifest_rows = [["WT-FULL-01", "TOEIC Writing Full Test 01", "Complete 8-question exam test"]]

    p1_headers = ["SequenceNumber", "ImageAssetId", "ImageAlt", "KeywordOne", "KeywordTwo", "RubricNotes", "ModelAnswer"]
    p1_rows = [
        ["1", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "A man at desk", "man", "laptop", "Check grammar", "The man is working on his laptop."],
        ["2", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Two people walking", "people", "park", "Check grammar", "Two people are walking through the park."],
        ["3", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Woman on phone", "woman", "call", "Check grammar", "A woman is talking on the telephone."],
        ["4", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Chef cooking", "chef", "kitchen", "Check grammar", "The chef is preparing food in the kitchen."],
        ["5", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Meeting room", "colleagues", "discuss", "Check grammar", "Several colleagues are discussing a project."],
    ]

    p2_headers = ["SequenceNumber", "Sender", "Recipient", "Subject", "EmailBody", "Directions", "RubricNotes", "ModelAnswer"]
    p2_rows = [
        ["6", "boss@corp.com", "staff@corp.com", "Annual Meeting", "Please confirm attendance.", "Respond with 2 questions.", "Politeness & accuracy", "Dear Boss, I will attend..."],
        ["7", "support@vendor.com", "buyer@corp.com", "Order Update", "Order is delayed.", "Acknowledge and request ETA.", "Tone & questions", "Dear Support, Thank you..."]
    ]

    p3_headers = ["SequenceNumber", "Prompt", "MinimumWordCount", "Outline", "RubricNotes", "ModelAnswer"]
    p3_rows = [
        ["8", "Do you agree or disagree with working from home?", "300", "Intro, Pros, Cons, Conclusion", "Organization & syntax", "In my opinion, working from home provides flexibility..."]
    ]

    create_xlsx(os.path.join(BASE_DIR, "valid-complete-test.xlsx"), [
        ("Manifest", manifest_headers, manifest_rows),
        ("Part1", p1_headers, p1_rows),
        ("Part2", p2_headers, p2_rows),
        ("Part3", p3_headers, p3_rows)
    ])

    # 2. Invalid Writing Test (Missing sheets - only Manifest & Part1)
    create_xlsx(os.path.join(BASE_DIR, "invalid-missing-sheets-test.xlsx"), [
        ("Manifest", manifest_headers, manifest_rows),
        ("Part1", p1_headers, p1_rows)
    ])

    # 3. Invalid Writing Test (Wrong questions count: 2 in P1 instead of 5)
    create_xlsx(os.path.join(BASE_DIR, "invalid-counts-test.xlsx"), [
        ("Manifest", manifest_headers, manifest_rows),
        ("Part1", p1_headers, p1_rows[:2]),
        ("Part2", p2_headers, p2_rows),
        ("Part3", p3_headers, p3_rows)
    ])

    # 4. Valid Part 1 Exercise Bank
    p1_ex_headers = ["Code", "Topic", "Difficulty", "Status", "ImageAssetId", "ImageAlt", "KeywordOne", "KeywordTwo", "RubricNotes", "ModelAnswer"]
    p1_ex_rows = [
        ["WP1-BANK-01", "Office Work", "MEDIUM", "PUBLISHED", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Man typing", "man", "computer", "Note", "A man types on a computer."],
        ["WP1-BANK-02", "Travel", "EASY", "DRAFT", "4d6b63f5-7f3e-46cf-a19a-9426f8d16790", "Airport hall", "traveler", "luggage", "Note", "A traveler pulls luggage."]
    ]
    create_xlsx(os.path.join(BASE_DIR, "valid-part1-exercise.xlsx"), [
        ("Sheet1", p1_ex_headers, p1_ex_rows)
    ])

    # 5. Invalid Part 1 Exercise Bank (Missing required columns)
    create_xlsx(os.path.join(BASE_DIR, "invalid-part1-missing-cols.xlsx"), [
        ("Sheet1", ["Code", "Topic"], [["WP1-ERR-01", "Invalid"]])
    ])

    # 6. Valid Part 2 Exercise Bank
    p2_ex_headers = ["Code", "Topic", "Difficulty", "Status", "Sender", "Recipient", "Subject", "EmailBody", "Directions"]
    p2_ex_rows = [
        ["WP2-BANK-01", "Client Email", "MEDIUM", "PUBLISHED", "client@corp.com", "service@corp.com", "Invoice Inquiry", "Can you send the invoice?", "Reply with amount."]
    ]
    create_xlsx(os.path.join(BASE_DIR, "valid-part2-exercise.xlsx"), [
        ("Sheet1", p2_ex_headers, p2_ex_rows)
    ])

    # 7. Valid Part 3 Exercise Bank
    p3_ex_headers = ["Code", "Topic", "Difficulty", "Status", "Prompt", "MinimumWordCount"]
    p3_ex_rows = [
        ["WP3-BANK-01", "Education", "HARD", "PUBLISHED", "Do you prefer studying alone or in a group?", "300"]
    ]
    create_xlsx(os.path.join(BASE_DIR, "valid-part3-exercise.xlsx"), [
        ("Sheet1", p3_ex_headers, p3_ex_rows)
    ])

    # 8. Files for Image Upload Testing:
    # 8a. Valid tiny PNG (1x1 pixel)
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    with open(os.path.join(BASE_DIR, "valid-sample.png"), "wb") as f:
        f.write(png_bytes)

    # 8b. Invalid file format (.txt)
    with open(os.path.join(BASE_DIR, "invalid-format.txt"), "w", encoding="utf-8") as f:
        f.write("This is a text file, not an image.")

    # 8c. Oversized file (> 5MB, e.g. 5.2 MB)
    with open(os.path.join(BASE_DIR, "oversized-image.png"), "wb") as f:
        f.write(png_bytes)
        f.write(b'\x00' * (5 * 1024 * 1024 + 200 * 1024))

    print("All fixtures generated successfully in:", BASE_DIR)

if __name__ == "__main__":
    generate_fixtures()
