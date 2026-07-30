#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《试听课_剪辑的节奏感》电影杂志风 PPT（python-pptx）。"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn, nsmap
from lxml import etree
import copy

# ── 设计令牌 ──────────────────────────────────────────────
BG = RGBColor(0x1A, 0x1A, 0x2E)
GOLD = RGBColor(0xD4, 0xAF, 0x37)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0xAA, 0xAA, 0xAA)
DASH = RGBColor(0x66, 0x66, 0x66)
PHONE_BG = RGBColor(0x22, 0x22, 0x33)
ACCENT_LINE = RGBColor(0xD4, 0xAF, 0x37)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

FONT_TITLE = "Arial Black"
FONT_BODY = "Arial"
FOOTER_TEXT = "光影盟特训营"


def set_run_font(run, name, size_pt, color, bold=False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color
    run.font.bold = bold
    # 东亚字体回退
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
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_textbox(slide, left, top, width, height, text, font_name, size_pt,
                color, align=PP_ALIGN.LEFT, bold=False, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
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
                  color, align=PP_ALIGN.LEFT, line_spacing=1.3, bold=False):
    """lines: list of str"""
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(6)
        try:
            p.line_spacing = line_spacing
        except Exception:
            pass
        run = p.add_run()
        run.text = line
        set_run_font(run, font_name, size_pt, color, bold=bold)
    return box


def _set_dash_line(spPr, color=DASH, width_pt=2.0):
    """给形状 spPr 设置 2px 灰色虚线描边、无填充。"""
    # 清除既有 ln / solidFill
    for tag in ("a:ln", "a:solidFill", "a:noFill"):
        for node in spPr.findall(qn(tag)):
            spPr.remove(node)

    no_fill = etree.SubElement(spPr, qn("a:noFill"))

    ln = etree.SubElement(spPr, qn("a:ln"))
    # 2px ≈ 2 * 12700 EMU
    ln.set("w", str(int(width_pt * 12700)))
    ln.set("cap", "flat")
    ln.set("cmpd", "sng")

    sf = etree.SubElement(ln, qn("a:solidFill"))
    srgb = etree.SubElement(sf, qn("a:srgbClr"))
    srgb.set("val", f"{color[0]:02X}{color[1]:02X}{color[2]:02X}")

    # 虚线：dash
    prstDash = etree.SubElement(ln, qn("a:prstDash"))
    prstDash.set("val", "dash")


def add_placeholder(slide, left, top, width, height, label, phone=False):
    """灰色虚线框占位符。phone=True 时用手机截图风格（圆角竖屏感）。"""
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if phone else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)

    # 半透明深底，增强杂志感
    shape.fill.solid()
    shape.fill.fore_color.rgb = PHONE_BG if phone else RGBColor(0x20, 0x20, 0x35)

    # 用 XML 改成虚线描边
    spPr = shape._element.spPr
    # 保留 fill，只替换线
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
        # 圆角更明显（手机感）
        try:
            shape.adjustments[0] = 0.12
        except Exception:
            pass
        # 顶部状态条装饰
        bar_h = min(Inches(0.28), int(height * 0.08))
        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, left, top, width, bar_h
        )
        bar.fill.solid()
        bar.fill.fore_color.rgb = RGBColor(0x18, 0x18, 0x28)
        bar.line.fill.background()

    # 居中标签
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
    set_run_font(run, FONT_BODY, 14, MUTED, bold=False)
    return shape


def add_gold_rule(slide, left, top, width, thickness=Pt(2)):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top, width, thickness
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = GOLD
    shape.line.fill.background()
    return shape


def add_footer(slide, page_num, total=12):
    # 右下角：光影盟特训营 + 页码
    text = f"{FOOTER_TEXT}  ·  {page_num}/{total}"
    add_textbox(
        slide,
        Inches(8.5),
        Inches(7.05),
        Inches(4.5),
        Inches(0.35),
        text,
        FONT_BODY,
        10,
        MUTED,
        align=PP_ALIGN.RIGHT,
    )
    # 左侧细金线
    add_gold_rule(slide, Inches(0.5), Inches(7.0), Inches(12.3), Pt(1))


def add_notes(slide, notes_text):
    notes_slide = slide.notes_slide
    tf = notes_slide.notes_text_frame
    tf.text = notes_text


def add_page_title(slide, title, size=28):
    add_textbox(
        slide,
        Inches(0.6),
        Inches(0.35),
        Inches(12.0),
        Inches(0.7),
        title,
        FONT_TITLE,
        size,
        GOLD,
        align=PP_ALIGN.LEFT,
        bold=True,
    )
    add_gold_rule(slide, Inches(0.6), Inches(1.05), Inches(2.2), Pt(2.5))


def add_bottom_text(slide, text, top=Inches(6.35)):
    add_textbox(
        slide,
        Inches(0.6),
        top,
        Inches(12.0),
        Inches(0.5),
        text,
        FONT_BODY,
        18,
        WHITE,
        align=PP_ALIGN.CENTER,
    )


# ── 各页构建 ──────────────────────────────────────────────

def build_cover(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)

    # 装饰边框线（杂志封面感）
    add_gold_rule(slide, Inches(0.8), Inches(1.4), Inches(11.7), Pt(1))
    add_gold_rule(slide, Inches(0.8), Inches(5.9), Inches(11.7), Pt(1))

    add_textbox(
        slide,
        Inches(0.8),
        Inches(1.1),
        Inches(11.7),
        Inches(0.35),
        "GUANGYINGMENG  ·  MASTERCLASS",
        FONT_BODY,
        12,
        GOLD,
        align=PP_ALIGN.CENTER,
    )

    add_textbox(
        slide,
        Inches(0.8),
        Inches(2.4),
        Inches(11.7),
        Inches(1.0),
        "剪辑的节奏感",
        FONT_TITLE,
        48,
        GOLD,
        align=PP_ALIGN.CENTER,
        bold=True,
        anchor=MSO_ANCHOR.MIDDLE,
    )

    add_textbox(
        slide,
        Inches(0.8),
        Inches(3.6),
        Inches(11.7),
        Inches(0.55),
        "卡点剪辑与剪映全功能实操",
        FONT_BODY,
        24,
        WHITE,
        align=PP_ALIGN.CENTER,
    )

    add_textbox(
        slide,
        Inches(0.8),
        Inches(5.2),
        Inches(11.7),
        Inches(0.45),
        "主讲·李红星",
        FONT_BODY,
        18,
        GOLD,
        align=PP_ALIGN.CENTER,
    )

    add_footer(slide, 1)
    add_notes(
        slide,
        '停10秒翻页。🗣️"今天这一个小时，我不讲理论。我用一段素材带你把剪映核心功能全部过一遍。"',
    )


def build_material(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "我们的素材", 28)

    # 大视频占位
    add_placeholder(
        slide,
        Inches(2.2),
        Inches(1.5),
        Inches(8.9),
        Inches(4.2),
        "[视频：一段30秒街景素材-走路/天空/咖啡]",
        phone=False,
    )

    add_bottom_text(
        slide,
        "这段素材将贯穿整个课程。一条素材，一小时，一条成片。",
        top=Inches(6.0),
    )
    add_footer(slide, 2)
    add_notes(
        slide,
        '🗣️播放素材。🗣️"就这一段。接下来所有操作全部用这段素材演示。"',
    )


def build_basic_edit(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "基础剪辑·四个操作", 28)

    labels = ["分割", "删除", "排序", "裁剪"]
    shots = ["[截图：分割]", "[截图：删除]", "[截图：排序]", "[截图：裁剪]"]
    # 手机截图风格：竖向占位，四列并排
    gap = Inches(0.35)
    phone_w = Inches(2.4)
    phone_h = Inches(3.6)
    total_w = phone_w * 4 + gap * 3
    start_x = (SLIDE_W - total_w) // 2
    top = Inches(1.4)

    for i, (shot, lab) in enumerate(zip(shots, labels)):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, shot, phone=True)
        add_textbox(
            slide,
            x,
            top + phone_h + Inches(0.12),
            phone_w,
            Inches(0.35),
            lab,
            FONT_BODY,
            18,
            WHITE,
            align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "所有复杂剪辑都是从这四个操作开始的", top=Inches(6.15))
    add_footer(slide, 3)
    add_notes(
        slide,
        '🗣️剪映投屏演示。🗣️"分割：切成两段。删除：去掉不要的。排序：长按拖动。裁剪：两端往中间拖。四个操作，十几秒的事。"',
    )


def build_transition(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "转场·三种最实用的", 28)

    shots = ["[截图：叠化效果]", "[截图：闪白效果]", "[截图：模糊转场效果]"]
    caps = ["叠化→情绪过渡", "闪白→冲击力", "模糊→速度感"]
    gap = Inches(0.4)
    phone_w = Inches(3.2)
    phone_h = Inches(3.5)
    total_w = phone_w * 3 + gap * 2
    start_x = (SLIDE_W - total_w) // 2
    top = Inches(1.4)

    for i, (shot, cap) in enumerate(zip(shots, caps)):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, shot, phone=True)
        add_textbox(
            slide,
            x - Inches(0.1),
            top + phone_h + Inches(0.12),
            phone_w + Inches(0.2),
            Inches(0.4),
            cap,
            FONT_BODY,
            16,
            GOLD,
            align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "转场不是越多越好，是越合适越好", top=Inches(6.15))
    add_footer(slide, 4)
    add_notes(
        slide,
        '🗣️演示三种转场。🗣️"叠化最自然，闪白有冲击，模糊做速度。三种够用。好的转场是隐形的。"',
    )


def build_speed(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "调速·快慢之间全是情绪", 28)

    shots = ["[截图：0.5倍慢动作]", "[截图：2倍快进]", "[截图：曲线变速]"]
    caps = ["0.5倍→回忆感·仪式感", "2倍→幽默·紧迫", "曲线→抖音变速卡点"]
    gap = Inches(0.4)
    phone_w = Inches(3.2)
    phone_h = Inches(3.5)
    total_w = phone_w * 3 + gap * 2
    start_x = (SLIDE_W - total_w) // 2
    top = Inches(1.4)

    for i, (shot, cap) in enumerate(zip(shots, caps)):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, shot, phone=True)
        add_textbox(
            slide,
            x - Inches(0.15),
            top + phone_h + Inches(0.12),
            phone_w + Inches(0.3),
            Inches(0.4),
            cap,
            FONT_BODY,
            15,
            GOLD,
            align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "调速是剪辑里最好用的情绪工具", top=Inches(6.15))
    add_footer(slide, 5)
    add_notes(
        slide,
        '🗣️演示调速。🗣️"慢动作=回忆感动。快进=搞笑紧张。曲线变速最出效果——先慢再快再慢。"',
    )


def build_filter(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "滤镜+调色·给画面穿衣服", 28)

    # 左右两个手机截图
    left_x = Inches(1.5)
    right_x = Inches(7.2)
    top = Inches(1.4)
    phone_w = Inches(4.5)
    phone_h = Inches(4.0)

    add_placeholder(
        slide, left_x, top, phone_w, phone_h,
        "[截图：滤镜面板-日系滤镜]", phone=True,
    )
    add_placeholder(
        slide, right_x, top, phone_w, phone_h,
        "[截图：调色五滑块-亮度/对比度/饱和度/色温/色调]", phone=True,
    )

    add_bottom_text(slide, "滤镜打底，手动微调。五滑块就够了。", top=Inches(5.7))
    add_footer(slide, 6)
    add_notes(
        slide,
        '🗣️演示滤镜+调色。🗣️"滤镜一键套上，强度拉到40%。五滑块：亮度明暗、对比度立体、饱和度浓淡、色温暖冷。记住这四个。"',
    )


def build_subtitle(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "字幕·不是打字，是设计", 28)

    shots = ["[截图：自动字幕识别]", "[截图：文字模板库]", "[截图：片头大标题]"]
    caps = ["自动识别→省时间", "文字模板→综艺感/电影感", "片头标题→让片子有名字"]
    gap = Inches(0.4)
    phone_w = Inches(3.2)
    phone_h = Inches(3.5)
    total_w = phone_w * 3 + gap * 2
    start_x = (SLIDE_W - total_w) // 2
    top = Inches(1.4)

    for i, (shot, cap) in enumerate(zip(shots, caps)):
        x = start_x + i * (phone_w + gap)
        add_placeholder(slide, x, top, phone_w, phone_h, shot, phone=True)
        add_textbox(
            slide,
            x - Inches(0.1),
            top + phone_h + Inches(0.12),
            phone_w + Inches(0.2),
            Inches(0.4),
            cap,
            FONT_BODY,
            15,
            GOLD,
            align=PP_ALIGN.CENTER,
        )

    add_bottom_text(slide, "字幕是画面的延伸，不是附庸", top=Inches(6.15))
    add_footer(slide, 7)
    add_notes(
        slide,
        '🗣️演示字幕功能。🗣️"自动字幕最省事。文字模板几百个，选一个改文字。片头用大标题。位置别太靠边留呼吸。"',
    )


def build_bgm(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "BGM+音效·画面一半声音一半", 28)

    left_x = Inches(1.5)
    right_x = Inches(7.2)
    top = Inches(1.4)
    phone_w = Inches(4.5)
    phone_h = Inches(4.0)

    add_placeholder(
        slide, left_x, top, phone_w, phone_h,
        "[截图：BGM选择-音量30%]", phone=True,
    )
    add_placeholder(
        slide, right_x, top, phone_w, phone_h,
        "[截图：音效搜索-风声]", phone=True,
    )

    add_bottom_text(
        slide,
        "BGM音量别超过30%。音效是你的免费素材库。",
        top=Inches(5.7),
    )
    add_footer(slide, 8)
    add_notes(
        slide,
        '🗣️演示BGM+音效。🗣️"选鼓点清晰的歌。音量拉到30%别盖人声。音效库搜风声转场声什么都有。新手最容易犯的错就是BGM太大声。"',
    )


def build_beat(prs):
    """重点页：踩点卡点"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)

    # 标题更大
    add_textbox(
        slide,
        Inches(0.6),
        Inches(0.28),
        Inches(12.0),
        Inches(0.7),
        "🔥踩点·画面跟着鼓点走",
        FONT_TITLE,
        36,
        GOLD,
        align=PP_ALIGN.LEFT,
        bold=True,
    )
    add_gold_rule(slide, Inches(0.6), Inches(1.0), Inches(3.5), Pt(3))

    # 大占位符
    add_placeholder(
        slide,
        Inches(1.5),
        Inches(1.3),
        Inches(10.3),
        Inches(3.6),
        "[截图：剪映自动踩点按钮→黄点出现→画面拉到黄点]",
        phone=False,
    )

    # 步骤标注
    add_textbox(
        slide,
        Inches(0.6),
        Inches(5.15),
        Inches(12.0),
        Inches(0.45),
        "①点自动踩点  →  ②黄点出现  →  ③画面拉到黄点  →  ④卡上了",
        FONT_BODY,
        18,
        GOLD,
        align=PP_ALIGN.CENTER,
    )

    add_bottom_text(
        slide,
        "踩点不是天赋。是你有没有点这个按钮。",
        top=Inches(5.75),
    )
    add_footer(slide, 9)
    add_notes(
        slide,
        '🗣️重点段落10分钟。🗣️演示自动踩点全流程。🗣️"点自动踩点→黄点是重拍→拉画面到黄点→卡上了。我第一次发现这个功能感觉自己白剪了两年。"',
    )


def build_keyframe(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "关键帧·让画面动起来", 28)

    add_placeholder(
        slide,
        Inches(2.5),
        Inches(1.4),
        Inches(8.3),
        Inches(3.6),
        "[截图：开头打关键帧缩小→结尾打关键帧放大]",
        phone=False,
    )

    add_textbox(
        slide,
        Inches(0.6),
        Inches(5.2),
        Inches(12.0),
        Inches(0.45),
        "两个关键帧=一个动画。开头缩小，结尾放大，中间自动过渡。",
        FONT_BODY,
        18,
        GOLD,
        align=PP_ALIGN.CENTER,
    )

    add_bottom_text(slide, "关键帧是剪映最被低估的功能", top=Inches(5.8))
    add_footer(slide, 10)
    add_notes(
        slide,
        '🗣️演示关键帧。🗣️"开头设一个关键帧缩小，结尾设一个放大。中间自动过渡。呼吸感。缩放、旋转、位置都能做。"',
    )


def build_full_demo(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    add_page_title(slide, "从头做一条·完整流程", 28)

    add_placeholder(
        slide,
        Inches(1.2),
        Inches(1.4),
        Inches(10.9),
        Inches(3.8),
        "[截图：8步流程-导入→分割→转场→调速→调色→字幕→BGM→踩点→导出]",
        phone=False,
    )

    add_bottom_text(
        slide,
        "一条素材，8个步骤，6分钟，一条卡点视频。",
        top=Inches(5.6),
    )
    add_footer(slide, 11)
    add_notes(
        slide,
        '🗣️全程演示8分钟。🗣️"导入→粗剪→转场→调速→调色→字幕→BGM→踩点→导出。一条素材6分钟一条成片。"',
    )


def build_summary(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)

    add_textbox(
        slide,
        Inches(0.6),
        Inches(0.35),
        Inches(12.0),
        Inches(0.7),
        "总结",
        FONT_TITLE,
        36,
        GOLD,
        align=PP_ALIGN.CENTER,
        bold=True,
    )
    add_gold_rule(slide, Inches(5.5), Inches(1.05), Inches(2.3), Pt(2.5))

    keywords = ["导入", "分割", "转场", "调速", "调色", "字幕", "BGM", "踩点"]
    flow = "  →  ".join(keywords)

    # 纵向大字：用多行排列更有杂志感
    lines = []
    for i, kw in enumerate(keywords):
        if i < len(keywords) - 1:
            lines.append(f"{kw}  →")
        else:
            lines.append(kw)

    add_multiline(
        slide,
        Inches(3.5),
        Inches(1.3),
        Inches(6.3),
        Inches(4.4),
        lines,
        FONT_TITLE,
        26,
        GOLD,
        align=PP_ALIGN.CENTER,
        line_spacing=1.15,
        bold=True,
    )

    add_bottom_text(
        slide,
        "剪辑不是学软件。是学什么时候该切画面。",
        top=Inches(6.0),
    )
    add_footer(slide, 12)
    add_notes(
        slide,
        '🗣️收尾3分钟。🗣️"8个功能记住就够了。软件一周学会。什么时候切——打开剪映点自动踩点听一首歌你就知道了。好。谢谢。"',
    )


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    build_cover(prs)
    build_material(prs)
    build_basic_edit(prs)
    build_transition(prs)
    build_speed(prs)
    build_filter(prs)
    build_subtitle(prs)
    build_bgm(prs)
    build_beat(prs)
    build_keyframe(prs)
    build_full_demo(prs)
    build_summary(prs)

    out = "试听课_剪辑的节奏感.pptx"
    prs.save(out)
    print(f"OK: {out}  ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
