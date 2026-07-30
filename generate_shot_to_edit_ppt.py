#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《试听课_从景别到剪辑》电影杂志风 PPT（python-pptx）。"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from lxml import etree

# ── 设计令牌 ──────────────────────────────────────────────
BG = RGBColor(0x1A, 0x1A, 0x2E)
GOLD = RGBColor(0xD4, 0xAF, 0x37)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0xAA, 0xAA, 0xAA)
PHONE_BG = RGBColor(0x22, 0x22, 0x33)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL_PAGES = 14

FONT_TITLE = "Arial Black"
FONT_BODY = "Arial"
FOOTER_TEXT = "光影盟特训营"


def set_run_font(run, name, size_pt, color, bold=False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color
    run.font.bold = bold
    rPr = run._r.get_or_add_rPr()
    ea = rPr.find(qn("a:ea"))
    if ea is None:
        ea = etree.SubElement(rPr, qn("a:ea"))
    ea.set("typeface", name)
    latin = rPr.find(qn("a:latin"))
    if latin is None:
        latin = etree.SubElement(rPr, qn("a:latin"))
    latin.set("typeface", name)


def set_slide_bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_textbox(slide, left, top, width, height, text, font_name, size_pt,
                color, align=PP_ALIGN.LEFT, bold=False, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    try:
        tf._txBody.bodyPr.set("anchor", {
            MSO_ANCHOR.TOP: "t",
            MSO_ANCHOR.MIDDLE: "ctr",
            MSO_ANCHOR.BOTTOM: "b",
        }.get(anchor, "t"))
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run_font(run, font_name, size_pt, color, bold=bold)
    return box


def add_multiline(slide, left, top, width, height, lines, font_name, size_pt,
                  color, align=PP_ALIGN.LEFT, bold=False, size_list=None):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(10)
        run = p.add_run()
        run.text = line
        sz = size_list[i] if size_list else size_pt
        set_run_font(run, font_name, sz, color, bold=bold)
    return box


def add_gold_rule(slide, left, top, width, thickness=Pt(2)):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, thickness)
    shape.fill.solid()
    shape.fill.fore_color.rgb = GOLD
    shape.line.fill.background()
    return shape


def add_placeholder(slide, left, top, width, height, label, phone=False):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if phone else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = PHONE_BG if phone else RGBColor(0x20, 0x20, 0x35)

    spPr = shape._element.spPr
    for node in list(spPr.findall(qn("a:ln"))):
        spPr.remove(node)
    ln = etree.SubElement(spPr, qn("a:ln"))
    ln.set("w", str(2 * 12700))
    ln.set("cap", "flat")
    sf = etree.SubElement(ln, qn("a:solidFill"))
    srgb = etree.SubElement(sf, qn("a:srgbClr"))
    srgb.set("val", "666666")
    prstDash = etree.SubElement(ln, qn("a:prstDash"))
    prstDash.set("val", "dash")

    if phone:
        try:
            shape.adjustments[0] = 0.12
        except Exception:
            pass
        bar_h = min(Inches(0.28), int(height * 0.08))
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, bar_h)
        bar.fill.solid()
        bar.fill.fore_color.rgb = RGBColor(0x18, 0x18, 0x28)
        bar.line.fill.background()

    tf = shape.text_frame
    tf.word_wrap = True
    try:
        tf._txBody.bodyPr.set("anchor", "ctr")
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    set_run_font(run, FONT_BODY, 13 if len(label) > 28 else 14, MUTED)
    return shape


def add_footer(slide, page_num):
    add_textbox(
        slide, Inches(8.5), Inches(7.05), Inches(4.5), Inches(0.35),
        f"{FOOTER_TEXT}  ·  {page_num}/{TOTAL_PAGES}",
        FONT_BODY, 10, MUTED, align=PP_ALIGN.RIGHT,
    )
    add_gold_rule(slide, Inches(0.5), Inches(7.0), Inches(12.3), Pt(1))


def add_notes(slide, notes_text):
    slide.notes_slide.notes_text_frame.text = notes_text


def add_page_title(slide, title, size=36):
    add_textbox(
        slide, Inches(0.6), Inches(0.32), Inches(12.0), Inches(0.7),
        title, FONT_TITLE, size, GOLD, align=PP_ALIGN.LEFT, bold=True,
    )
    add_gold_rule(slide, Inches(0.6), Inches(1.02), Inches(2.2), Pt(2.5))


def add_bottom_text(slide, text, top=Inches(6.2)):
    add_textbox(
        slide, Inches(0.6), top, Inches(12.0), Inches(0.55),
        text, FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER,
    )


def blank_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    return slide


# ── 各页 ─────────────────────────────────────────────────

def build_p01(prs):
    slide = blank_slide(prs)
    add_gold_rule(slide, Inches(0.8), Inches(1.4), Inches(11.7), Pt(1))
    add_gold_rule(slide, Inches(0.8), Inches(5.9), Inches(11.7), Pt(1))
    add_textbox(
        slide, Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.35),
        "GUANGYINGMENG  ·  MASTERCLASS", FONT_BODY, 12, GOLD, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(0.8), Inches(2.4), Inches(11.7), Inches(1.0),
        "从景别到剪辑", FONT_TITLE, 48, GOLD,
        align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
    )
    add_textbox(
        slide, Inches(0.8), Inches(3.6), Inches(11.7), Inches(0.55),
        "一部手机拍出电影感", FONT_BODY, 24, WHITE, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(0.8), Inches(5.2), Inches(11.7), Inches(0.45),
        "主讲·李红星", FONT_BODY, 18, GOLD, align=PP_ALIGN.CENTER,
    )
    add_footer(slide, 1)
    add_notes(
        slide,
        '停10秒。🗣️"今天用一个小时，从拍摄到剪辑的完整流程。不讲理论，直接看案例看操作。"',
    )


def build_p02(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "今天讲什么", 36)

    items = [
        ("①", "景别", "拍什么"),
        ("②", "运镜", "怎么动"),
        ("③", "剪辑", "怎么剪"),
    ]
    gap = Inches(0.5)
    card_w = Inches(3.5)
    total = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total) // 2
    top = Inches(2.2)

    for i, (num, title, sub) in enumerate(items):
        x = start_x + i * (card_w + gap)
        add_textbox(
            slide, x, top, card_w, Inches(0.6),
            num, FONT_TITLE, 28, GOLD, align=PP_ALIGN.CENTER, bold=True,
        )
        add_textbox(
            slide, x, top + Inches(0.9), card_w, Inches(0.7),
            title, FONT_TITLE, 36, WHITE, align=PP_ALIGN.CENTER, bold=True,
        )
        add_gold_rule(slide, x + Inches(1.0), top + Inches(1.7), Inches(1.5), Pt(2))
        add_textbox(
            slide, x, top + Inches(2.0), card_w, Inches(0.5),
            sub, FONT_BODY, 20, GOLD, align=PP_ALIGN.CENTER,
        )

    add_footer(slide, 2)
    add_notes(slide, "1分钟。三段预告：①景别-拍什么 ②运镜-怎么动 ③剪辑-怎么剪。")


def build_p03(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "五大景别总览", 36)

    shots = [
        ("[图：远景-肖申克救赎安迪雨中]", "远景看环境"),
        ("[图：全景-功夫猪笼城寨]", "全景看全身"),
        ("[图：中景-那些年教室对话]", "中景讲故事"),
        ("[图：近景-少年的你哭戏]", "近景传情绪"),
        ("[图：特写-泰坦尼克号手印车窗]", "特写放大招"),
    ]
    gap = Inches(0.18)
    card_w = Inches(2.3)
    card_h = Inches(3.4)
    total = card_w * 5 + gap * 4
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.3)

    for i, (label, cap) in enumerate(shots):
        x = start_x + i * (card_w + gap)
        add_placeholder(slide, x, top, card_w, card_h, label, phone=False)
        add_textbox(
            slide, x - Inches(0.05), top + card_h + Inches(0.1),
            card_w + Inches(0.1), Inches(0.4),
            cap, FONT_BODY, 14, GOLD, align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "远全中近特·越近代入越强", top=Inches(5.95))
    add_footer(slide, 3)
    add_notes(
        slide,
        '🗣️指着每张图说一句。每句1分钟。"远景看环境，全景看全身，中景讲故事，近景传情绪，特写放大招。记住口诀。"',
    )


def build_p04(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "景别案例", 36)

    items = [
        "[图：同一人远景vs近景对比]",
        "[图：同一房间全景vs特写对比]",
        "[图：短视频口播中景vs美食特写对比]",
    ]
    gap = Inches(0.35)
    card_w = Inches(3.7)
    card_h = Inches(3.6)
    total = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.4)

    for i, label in enumerate(items):
        x = start_x + i * (card_w + gap)
        add_placeholder(slide, x, top, card_w, card_h, label, phone=False)

    add_bottom_text(
        slide,
        "景别决定了观众和角色的距离，决定了观众关注什么。",
        top=Inches(5.4),
    )
    add_footer(slide, 4)
    add_notes(
        slide,
        '🗣️"同一个场景不同景别感觉完全不同。拍视频就是控制观众注意力。"',
    )


def build_p05(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "景别小结", 36)
    add_textbox(
        slide, Inches(0.8), Inches(2.6), Inches(11.7), Inches(1.2),
        "远全中近特·越近代入越强",
        FONT_TITLE, 40, GOLD, align=PP_ALIGN.CENTER, bold=True,
        anchor=MSO_ANCHOR.MIDDLE,
    )
    add_gold_rule(slide, Inches(4.0), Inches(3.9), Inches(5.3), Pt(2))
    add_bottom_text(
        slide, "你刷的每一条短视频里景别无处不在。", top=Inches(5.0),
    )
    add_footer(slide, 5)
    add_notes(
        slide,
        '🗣️"景别就这一句口诀。接下来动态的——运镜。"',
    )


def build_p06(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "运镜三招总览", 36)

    items = [
        ("[图：推-箭头向内]", "推=靠近聚焦"),
        ("[图：摇-弧线箭头]", "摇=环顾四周"),
        ("[图：跟-虚线跟随]", "跟=代入跟踪"),
    ]
    gap = Inches(0.45)
    card_w = Inches(3.6)
    card_h = Inches(3.5)
    total = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.4)

    for i, (label, cap) in enumerate(items):
        x = start_x + i * (card_w + gap)
        add_placeholder(slide, x, top, card_w, card_h, label, phone=False)
        add_textbox(
            slide, x, top + card_h + Inches(0.15), card_w, Inches(0.4),
            cap, FONT_BODY, 18, GOLD, align=PP_ALIGN.CENTER,
        )

    add_footer(slide, 6)
    add_notes(
        slide,
        '🗣️"运镜三招：推摇跟。推靠近，摇环顾，跟代入。"',
    )


def build_p07(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "运镜案例", 36)

    items = [
        "[视频：推-沉默的羔羊汉尼拔出场15秒]",
        "[视频：摇-重庆森林手持摇镜10秒]",
        "[视频：跟-谍影重重巷战跟拍15秒]",
    ]
    gap = Inches(0.35)
    card_w = Inches(3.7)
    card_h = Inches(3.8)
    total = card_w * 3 + gap * 2
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.4)

    for i, label in enumerate(items):
        x = start_x + i * (card_w + gap)
        add_placeholder(slide, x, top, card_w, card_h, label, phone=False)

    add_footer(slide, 7)
    add_notes(
        slide,
        '🗣️每段播放后说一句。"推=压迫感，摇=现场感，跟=代入感。"',
    )


def build_p08(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "运镜法则", 36)

    add_textbox(
        slide, Inches(0.8), Inches(1.8), Inches(11.7), Inches(1.0),
        "稳永远排第一", FONT_TITLE, 44, GOLD,
        align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
    )
    add_gold_rule(slide, Inches(4.5), Inches(2.9), Inches(4.3), Pt(2.5))

    lines = ["晃不如不动。", "走不稳就先站着拍。", "慢、稳、别抖。"]
    add_multiline(
        slide, Inches(2.5), Inches(3.4), Inches(8.3), Inches(2.2),
        lines, FONT_BODY, 22, WHITE, align=PP_ALIGN.CENTER, bold=False,
    )
    add_footer(slide, 8)
    add_notes(
        slide,
        '🗣️"运镜最重要的法则。一个稳的固定镜头比十个晃的运镜强。"',
    )


def build_p09(prs):
    slide = blank_slide(prs)

    add_textbox(
        slide, Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.8),
        "从拍到剪", FONT_TITLE, 40, GOLD,
        align=PP_ALIGN.CENTER, bold=True,
    )
    add_gold_rule(slide, Inches(5.4), Inches(1.3), Inches(2.5), Pt(2.5))

    left_x, right_x = Inches(2.2), Inches(8.0)
    top = Inches(1.8)
    box_w, box_h = Inches(3.0), Inches(3.5)

    add_placeholder(slide, left_x, top, box_w, box_h, "[图：手机图标]", phone=True)
    add_textbox(
        slide, left_x, top + box_h + Inches(0.12), box_w, Inches(0.4),
        "拍摄", FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER,
    )

    add_textbox(
        slide, Inches(5.6), Inches(3.1), Inches(2.0), Inches(0.6),
        "→", FONT_TITLE, 48, GOLD, align=PP_ALIGN.CENTER, bold=True,
    )

    add_placeholder(slide, right_x, top, box_w, box_h, "[图：剪映图标]", phone=True)
    add_textbox(
        slide, right_x, top + box_h + Inches(0.12), box_w, Inches(0.4),
        "剪辑", FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER,
    )

    add_footer(slide, 9)
    add_notes(slide, '🗣️"拍摄讲完了。接下来剪映实操。"')


def build_p10(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "基础剪辑", 36)

    shots = [
        ("[截图：底部工具栏-分割按钮-剪刀图标]", "分割"),
        ("[截图：选中片段-删除按钮-垃圾桶图标]", "删除"),
        ("[截图：长按拖动片段调整顺序]", "拖拽排序"),
        ("[截图：拖动片段两端白色手柄-修剪]", "修剪"),
    ]
    gap = Inches(0.3)
    phone_w = Inches(2.6)
    phone_h = Inches(3.5)
    total = phone_w * 4 + gap * 3
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.3)

    for i, (label, cap) in enumerate(shots):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, label, phone=True)
        add_textbox(
            slide, x, top + phone_h + Inches(0.1), phone_w, Inches(0.35),
            cap, FONT_BODY, 16, WHITE, align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "所有复杂剪辑从这四个操作开始。", top=Inches(5.9))
    add_footer(slide, 10)
    add_notes(
        slide,
        '🗣️剪映演示。"分割剪刀，删除垃圾桶，排序长按拖，修剪拖两端。"',
    )


def build_p11(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "转场", 36)

    add_placeholder(
        slide, Inches(2.5), Inches(1.4), Inches(8.3), Inches(3.8),
        "[截图：两片段中间白色方块→转场菜单→叠化]", phone=False,
    )
    add_bottom_text(
        slide, "叠化最自然。电影一半转场都是它。", top=Inches(5.5),
    )
    add_footer(slide, 11)
    add_notes(
        slide,
        '🗣️演示叠化。"不需要几十种转场，叠化一个够了。用在情绪切换。"',
    )


def build_p12(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "踩点", 36)

    shots = [
        "[截图：选中BGM→底部踩点→自动踩点按钮]",
        "[截图：黄点出现在BGM轨道上]",
        "[截图：手指把画面拖到黄点位置]",
    ]
    gap = Inches(0.35)
    phone_w = Inches(3.6)
    phone_h = Inches(3.2)
    total = phone_w * 3 + gap * 2
    start_x = (SLIDE_W - total) // 2
    top = Inches(1.25)

    for i, label in enumerate(shots):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, label, phone=True)

    add_textbox(
        slide, Inches(0.6), Inches(4.7), Inches(12.0), Inches(0.4),
        "①点自动踩点→②黄点出现→③画面拉到黄点→④卡上了",
        FONT_BODY, 16, GOLD, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(0.6), Inches(5.3), Inches(12.0), Inches(0.7),
        "踩点不是天赋", FONT_TITLE, 36, GOLD,
        align=PP_ALIGN.CENTER, bold=True,
    )
    add_footer(slide, 12)
    add_notes(
        slide,
        '🗣️重点10分钟。演示全流程。"点自动踩点→黄点是重拍→拉画面到黄点→卡上了。我第一次发现感觉自己白剪了两年。"',
    )


def build_p13(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "完整演示", 36)

    add_placeholder(
        slide, Inches(1.2), Inches(1.5), Inches(10.9), Inches(4.0),
        "[截图：8步流程-导入→分割→排序→转场→BGM→踩点→预览→导出]",
        phone=False,
    )
    add_footer(slide, 13)
    add_notes(slide, '🗣️全程演示8分钟。"从头做一条。几分钟。"')


def build_p14(prs):
    slide = blank_slide(prs)
    add_page_title(slide, "总结", 36)

    lines = [
        "景别·远全中近特",
        "运镜·推摇跟",
        "剪辑·分割转场踩点",
    ]
    add_multiline(
        slide, Inches(1.5), Inches(1.8), Inches(10.3), Inches(3.2),
        lines, FONT_TITLE, 32, GOLD, align=PP_ALIGN.CENTER, bold=True,
    )
    add_bottom_text(
        slide,
        "拍摄和剪辑不是学软件，是学什么时候用什么。",
        top=Inches(5.5),
    )
    add_footer(slide, 14)
    add_notes(
        slide,
        '🗣️收尾4分钟。"三段。没有捷径但有方法。好谢谢。"',
    )


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    builders = [
        build_p01, build_p02, build_p03, build_p04, build_p05,
        build_p06, build_p07, build_p08, build_p09, build_p10,
        build_p11, build_p12, build_p13, build_p14,
    ]
    for fn in builders:
        fn(prs)

    out = "试听课_从景别到剪辑.pptx"
    prs.save(out)
    print(f"OK: {out}  ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
