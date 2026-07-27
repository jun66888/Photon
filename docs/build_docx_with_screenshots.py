#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build complete Word DOC with website screenshots for 中推网自助建站说明书."""

from pathlib import Path
import re

from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = Path("/workspace/docs")
MD = ROOT / "自助建站网站说明书.md"
SHOTS = ROOT / "screenshots" / "opt"
OUT = ROOT / "中推网自助建站网站说明书_完整版.docx"
ARTIFACT = Path("/opt/cursor/artifacts/中推网自助建站网站说明书_完整版.docx")

# Insert screenshots after these page titles
SHOT_MAP = {
    "第 2 页 · 项目背景": [
        ("中推网官网首页（https://zgpptg.com/）", "00_zhongtui_home_a.jpg"),
    ],
    "第 14 页 · 首页-页面结构": [
        ("自助建站频道首页 · 首屏", "01_jianzhan_home_a.jpg"),
        ("自助建站频道首页 · 模板推荐区", "01_jianzhan_home_b.jpg"),
    ],
    "第 19 页 · 模板页-概述": [
        ("网站模板页 · 首屏", "02_templates_a.jpg"),
        ("网站模板页 · 模板列表", "02_templates_b.jpg"),
    ],
    "第 24 页 · 设计页-概述": [
        ("高端设计页 · 首屏", "03_design_a.jpg"),
        ("高端设计页 · 服务内容", "03_design_b.jpg"),
        ("高端设计页 · 套餐与案例", "03_design_c.jpg"),
    ],
    "第 29 页 · 营销页-概述": [
        ("营销网站页 · 首屏", "04_market_a.jpg"),
        ("营销网站页 · 卖点模块", "04_market_b.jpg"),
        ("营销网站页 · 服务保障", "04_market_c.jpg"),
    ],
    "第 34 页 · 商城页-概述": [
        ("建站商城页 · 首屏", "05_shangcheng_a.jpg"),
        ("建站商城页 · 营销方案", "05_shangcheng_b.jpg"),
        ("建站商城页 · O2O与保障", "05_shangcheng_c.jpg"),
    ],
    "第 39 页 · 移动页-概述": [
        ("移动营销网站页 · 首屏", "06_mobile_market_a.jpg"),
        ("移动营销网站页 · 功能展示", "06_mobile_market_b.jpg"),
        ("移动营销网站页 · 下部内容", "06_mobile_market_c.jpg"),
    ],
    "第 43 页 · 定制页-概述": [
        ("定制服务页 · 首屏", "07_personal_a.jpg"),
        ("定制服务页 · 服务流程", "07_personal_b.jpg"),
    ],
    "第 47 页 · 标准页-概述": [
        ("标准建站页 · 首屏", "08_standard_a.jpg"),
        ("标准建站页 · 套餐标准", "08_standard_b.jpg"),
    ],
}


def set_run_font(run, size=11, bold=False, color=None, name="微软雅黑"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)


def add_page_number(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("中推网 · 自助建站频道网站说明书  ·  第 ")
    set_run_font(run, 9, color=(120, 120, 120))

    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run2 = p.add_run()
    run2._r.append(fld1)
    run2._r.append(instr)
    run2._r.append(fld2)
    set_run_font(run2, 9, color=(120, 120, 120))

    run3 = p.add_run(" 页")
    set_run_font(run3, 9, color=(120, 120, 120))


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    if level == 0:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        set_run_font(run, 22, True, (25, 25, 25))
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(14)
    elif level == 1:
        run = p.add_run(text)
        set_run_font(run, 16, True, (30, 30, 30))
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(8)
    elif level == 2:
        run = p.add_run(text)
        set_run_font(run, 13, True, (45, 45, 45))
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(6)
    else:
        run = p.add_run(text)
        set_run_font(run, 12, True, (60, 60, 60))
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
    return p


def add_para(doc, text, bold=False, center=False, italic=False, size=11, color=None):
    p = doc.add_paragraph()
    if center:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    set_run_font(run, size, bold, color)
    run.italic = italic
    p.paragraph_format.space_after = Pt(4)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"【截图】{text}")
    set_run_font(run, 9, False, (90, 90, 90))
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    return p


def add_image(doc, path: Path, caption: str):
    if not path.exists():
        add_para(doc, f"（截图缺失：{path.name}）", italic=True, color=(180, 0, 0))
        return
    add_caption(doc, caption)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    # fit to page width ~15.5cm
    run.add_picture(str(path), width=Cm(15.5))
    p.paragraph_format.space_after = Pt(10)


def add_table(doc, rows):
    if not rows:
        return
    cols = max(len(r) for r in rows)
    table = doc.add_table(rows=len(rows), cols=cols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(rows):
        for j in range(cols):
            cell = table.rows[i].cells[j]
            cell.text = row[j] if j < len(row) else ""
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    set_run_font(run, 9, bold=(i == 0))
            # header bg
            if i == 0:
                shading = OxmlElement("w:shd")
                shading.set(qn("w:fill"), "F2F2F2")
                cell._tePr = cell._tc.get_or_add_tcPr()
                cell._tc.get_or_add_tcPr().append(shading)
    doc.add_paragraph()


def parse_table_block(lines):
    rows = []
    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells if c):
            continue
        rows.append(cells)
    return rows


def strip_md(s):
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"`([^`]+)`", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", s)
    return s


def maybe_insert_shots(doc, heading_text):
    key = heading_text.strip()
    # normalize fullwidth spaces etc
    shots = SHOT_MAP.get(key)
    if not shots:
        # fuzzy: match by page number prefix
        for k, v in SHOT_MAP.items():
            if key.startswith(k.split("·")[0].strip()) or k in key or key in k:
                shots = v
                break
    if not shots:
        return
    add_para(doc, "页面截图示意（参照自助建站频道实际页面）", bold=True, size=10, color=(80, 80, 80))
    for caption, fname in shots:
        add_image(doc, SHOTS / fname, caption)


def build():
    text = MD.read_text(encoding="utf-8")
    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.2)
        add_page_number(section)

    style = doc.styles["Normal"]
    style.font.name = "微软雅黑"
    style.font.size = Pt(11)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE

    # Cover
    for _ in range(3):
        doc.add_paragraph()
    add_heading(doc, "中推网", 0)
    add_heading(doc, "自助建站频道网站说明书", 0)
    add_para(doc, "（含网站页面截图完整版）", center=True, size=14, color=(80, 80, 80))
    doc.add_paragraph()
    add_para(doc, "文档编号：JZ-SPEC-2026-001", center=True, size=11)
    add_para(doc, "版本号：V1.1", center=True, size=11)
    add_para(doc, "编制日期：2026年7月27日", center=True, size=11)
    add_para(doc, "参考站点：https://zgpptg.com/jianzhan/", center=True, size=11)
    add_para(doc, "官网：https://zgpptg.com/", center=True, size=11)
    add_para(doc, "编制单位：网站产品部", center=True, size=11)
    add_para(doc, "版权单位：中腾影视文化传媒（广州）有限公司", center=True, size=11)
    add_para(doc, "客服热线：13005182998", center=True, size=11)
    doc.add_page_break()

    # Screenshot album page
    add_heading(doc, "网站截图总览", 1)
    add_para(
        doc,
        "以下截图取自自助建站频道实际页面结构（功能演示站）及中推网官网首页，用于说明书可视化对照。正式上线后频道地址为 https://zgpptg.com/jianzhan/ 。",
        size=10,
        color=(90, 90, 90),
    )
    album = [
        ("中推网官网首页", "00_zhongtui_home_a.jpg"),
        ("自助建站 · 网站首页", "01_jianzhan_home_a.jpg"),
        ("自助建站 · 网站模板", "02_templates_a.jpg"),
        ("自助建站 · 高端设计", "03_design_a.jpg"),
        ("自助建站 · 营销网站", "04_market_a.jpg"),
        ("自助建站 · 建站商城", "05_shangcheng_a.jpg"),
        ("自助建站 · 移动营销", "06_mobile_market_a.jpg"),
        ("自助建站 · 定制服务", "07_personal_a.jpg"),
        ("自助建站 · 标准建站", "08_standard_a.jpg"),
    ]
    for cap, fn in album:
        add_image(doc, SHOTS / fn, cap)
    doc.add_page_break()

    lines = text.splitlines()
    i = 0
    in_code = False
    code_buf = []
    table_buf = []
    current_page_heading = ""

    while i < len(lines):
        line = lines[i]

        if line.strip() == "---":
            if table_buf:
                add_table(doc, parse_table_block(table_buf))
                table_buf = []
            # soft page break between sections
            doc.add_page_break()
            i += 1
            continue

        if line.strip().startswith("<!--"):
            i += 1
            continue

        if line.strip().startswith("```"):
            if table_buf:
                add_table(doc, parse_table_block(table_buf))
                table_buf = []
            if not in_code:
                in_code = True
                code_buf = []
            else:
                in_code = False
                p = doc.add_paragraph()
                run = p.add_run("\n".join(code_buf))
                set_run_font(run, 8, name="Consolas")
                run.font.name = "Consolas"
                p.paragraph_format.left_indent = Cm(0.3)
                code_buf = []
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if line.strip().startswith("|"):
            table_buf.append(line)
            i += 1
            continue
        else:
            if table_buf:
                add_table(doc, parse_table_block(table_buf))
                table_buf = []

        if not line.strip():
            i += 1
            continue

        if line.startswith(">"):
            content = strip_md(line.lstrip("> ").strip())
            if content:
                add_para(doc, content, italic=True, size=10, color=(90, 90, 90))
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            level = len(m.group(1))
            title = strip_md(m.group(2).strip())
            add_heading(doc, title, level - 1 if level else 0)
            if title.startswith("第 ") and "页" in title:
                current_page_heading = title
                maybe_insert_shots(doc, title)
            i += 1
            continue

        if re.match(r"^[-*]\s+\[[ xX]\]\s+", line):
            content = strip_md(re.sub(r"^[-*]\s+\[[ xX]\]\s+", "", line))
            add_para(doc, "☐ " + content)
            i += 1
            continue

        if re.match(r"^[-*]\s+", line) or re.match(r"^\d+\.\s+", line):
            content = strip_md(re.sub(r"^([-*]|\d+\.)\s+", "", line))
            style_name = "List Bullet" if re.match(r"^[-*]\s+", line) else "List Number"
            p = doc.add_paragraph(style=style_name)
            run = p.add_run(content)
            set_run_font(run, 11)
            i += 1
            continue

        add_para(doc, strip_md(line.strip()))
        i += 1

    if table_buf:
        add_table(doc, parse_table_block(table_buf))

    # Ending note
    doc.add_page_break()
    add_heading(doc, "截图说明与版权", 1)
    add_para(doc, "1. 说明书正文参照中推网自助建站频道产品规格编写。")
    add_para(doc, "2. 页面截图取自同架构自助建站频道演示站，用于版式与功能对照；品牌文案、域名、版权信息已统一为中推网 / zgpptg.com。")
    add_para(doc, "3. 中推网官网：https://zgpptg.com/")
    add_para(doc, "4. 自助建站频道：https://zgpptg.com/jianzhan/")
    add_para(doc, "5. 客服热线：13005182998")
    add_para(doc, "6. 版权所有 © 2026 中腾影视文化传媒（广州）有限公司")
    add_para(doc, "7. ICP：粤ICP备2026011802号-1")
    add_para(doc, "", center=True)
    add_para(doc, "— 完整版文档结束 —", center=True, bold=True)

    doc.save(OUT)
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT.write_bytes(OUT.read_bytes())
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"Artifact {ARTIFACT} ({ARTIFACT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
