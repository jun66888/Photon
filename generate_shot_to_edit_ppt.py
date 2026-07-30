#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成《试听课_从景别到剪辑》——电影杂志风 /《影》式墨金质感 PPT。"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from lxml import etree

# ── 设计令牌（《影》墨色 + 杂志金）────────────────────────
BG = RGBColor(0x1A, 0x1A, 0x2E)
INK = RGBColor(0x12, 0x12, 0x22)          # 更深墨底块
MIST = RGBColor(0x2A, 0x2A, 0x3E)         # 水墨雾灰
GOLD = RGBColor(0xD4, 0xAF, 0x37)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0xA8, 0xA8, 0xB0)
PHONE_BG = RGBColor(0x22, 0x22, 0x33)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 14

FONT_TITLE = "Arial Black"
FONT_BODY = "Arial"
FOOTER = "光影盟特训营"


def set_run_font(run, name, size_pt, color, bold=False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.color.rgb = color
    run.font.bold = bold
    rPr = run._r.get_or_add_rPr()
    for tag, face in (("a:ea", name), ("a:latin", name)):
        node = rPr.find(qn(tag))
        if node is None:
            node = etree.SubElement(rPr, qn(tag))
        node.set("typeface", face)


def set_slide_bg(slide, color=BG):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def solid_rect(slide, left, top, width, height, color, line=False):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    if line:
        shape.line.color.rgb = GOLD
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape


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
                  color, align=PP_ALIGN.LEFT, bold=False, space_after=10):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after)
        run = p.add_run()
        run.text = line
        set_run_font(run, font_name, size_pt, color, bold=bold)
    return box


def gold_rule(slide, left, top, width, thickness=Pt(2)):
    return solid_rect(slide, left, top, width, thickness, GOLD)


def vertical_ink_bar(slide, left=Inches(0.35), width=Inches(0.06)):
    """《影》式左侧竖墨条。"""
    solid_rect(slide, left, Inches(0.4), width, Inches(6.3), GOLD)
    solid_rect(slide, left + width + Inches(0.08), Inches(0.4),
               Pt(1), Inches(6.3), MIST)


def magazine_frame(slide):
    """电影海报细金框 + 雾墨底衬。"""
    # 四周极细金线
    gold_rule(slide, Inches(0.28), Inches(0.22), Inches(12.77), Pt(1))
    gold_rule(slide, Inches(0.28), Inches(7.18), Inches(12.77), Pt(1))
    solid_rect(slide, Inches(0.28), Inches(0.22), Pt(1), Inches(6.96), GOLD)
    solid_rect(slide, Inches(13.05), Inches(0.22), Pt(1), Inches(6.96), GOLD)


def add_placeholder(slide, left, top, width, height, label, phone=False):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if phone else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = PHONE_BG if phone else INK

    spPr = shape._element.spPr
    for node in list(spPr.findall(qn("a:ln"))):
        spPr.remove(node)
    ln = etree.SubElement(spPr, qn("a:ln"))
    ln.set("w", str(2 * 12700))  # 2px
    ln.set("cap", "flat")
    sf = etree.SubElement(ln, qn("a:solidFill"))
    srgb = etree.SubElement(sf, qn("a:srgbClr"))
    srgb.set("val", "666666")
    etree.SubElement(ln, qn("a:prstDash")).set("val", "dash")

    if phone:
        try:
            shape.adjustments[0] = 0.12
        except Exception:
            pass
        bar_h = min(Inches(0.26), int(height * 0.08))
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
    size = 12 if len(label) > 30 else (13 if len(label) > 22 else 14)
    set_run_font(run, FONT_BODY, size, MUTED)
    return shape


def add_footer(slide, page):
    gold_rule(slide, Inches(0.5), Inches(6.95), Inches(12.3), Pt(1))
    add_textbox(
        slide, Inches(8.3), Inches(7.02), Inches(4.7), Inches(0.32),
        f"{FOOTER}  ·  {page}/{TOTAL}",
        FONT_BODY, 10, MUTED, align=PP_ALIGN.RIGHT,
    )


def add_notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def add_page_title(slide, title, size=36):
    add_textbox(
        slide, Inches(0.7), Inches(0.32), Inches(11.8), Inches(0.65),
        title, FONT_TITLE, size, GOLD, bold=True,
    )
    gold_rule(slide, Inches(0.7), Inches(0.98), Inches(2.4), Pt(2.5))
    # 右侧细雾线，杂志分栏感
    gold_rule(slide, Inches(3.3), Inches(0.98), Inches(9.3), Pt(0.75))


def add_bottom(slide, text, top=Inches(6.15)):
    add_textbox(
        slide, Inches(0.7), top, Inches(11.9), Inches(0.55),
        text, FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER,
    )


def blank(prs, framed=True):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, BG)
    if framed:
        magazine_frame(slide)
        vertical_ink_bar(slide)
    return slide


# ── 备注话术（完整）──────────────────────────────────────
NOTES = {
    1: (
        "停2秒扫一眼全场。今天我想用一个小时，带大家过一遍——从拍摄到剪辑的完整流程。"
        "不讲理论，直接看案例、看画面、看操作。三个部分——景别：你离拍摄对象多远。"
        "运镜：你怎么移动手机。剪辑：把拍好的东西变成一条片子。"
        "从静态到动态到成片。一个小时。"
    ),
    2: (
        "景别——你刷到的每一条短视频远景全景中景近景特写全都有。"
        "你以为随便拍的其实已经在用景别了只是不知道它叫什么。"
        "运镜——推摇跟三招。剪辑——同样的素材不同的人剪出来完全不一样。进入第一部分。"
    ),
    3: (
        "远景肖申克。人物小环境大。交代背景营造氛围。远景看环境。"
        "全景功夫猪笼城寨。全身加环境谁在哪干什么。全景看全身。"
        "中景那些年教室对话。膝盖以上最自然最常用。中景讲故事。"
        "近景少年的你哭戏。胸部以上看清表情感受情绪。近景传情绪。"
        "特写泰坦尼克号手。只有一个局部放大最重要细节。特写放大招。"
        "口诀远全中近特越近代入越强。想让观众看环境拉远看情绪推近。"
    ),
    4: (
        "同一人左边远景很小很孤独右边近景能看到表情。"
        "同一个房间左边全景看到整个空间右边特写只看到桌上的杯子。"
        "口播博主中景拉近距离美食博主特写咬下去那一口。"
        "拍视频就是控制观众注意力。"
    ),
    5: (
        "每一条片子都在用景别。你以为拍得好的人有什么秘诀第一步就是选对了景别。"
        "接下来动态的——运镜。"
    ),
    6: (
        "运镜三招推摇跟。推手机靠近聚焦。摇原地转动环顾。跟跟着主体代入。"
        "三个字推摇跟。看实战。"
    ),
    7: (
        "沉默的羔羊推镜汉尼拔出场压迫感推镜作用聚焦。"
        "重庆森林摇镜现场感好像你站在那个房间里摇镜作用环顾。"
        "谍影重重跟拍代入感你就是追他的人或被追的人跟镜作用代入。"
        "推聚焦摇环顾跟代入三种完全不同的感觉。"
    ),
    8: (
        "运镜最重要的法则稳。晃不如不动走不稳就先站着拍。"
        "一个稳的固定镜头比十个晃的运镜强一百倍。"
        "初学者三个字慢稳别抖。你不需要拍出谍影重重只需要做到观众不晕。"
        "拍摄讲完了接下来剪辑。"
    ),
    9: "景别运镜是拍摄底层逻辑。接下来剪映实操。切到剪映投屏。",
    10: (
        "剪映投屏演示。分割剪刀图标切成两段。删除垃圾桶不要的删掉。"
        "排序长按拖动改变顺序。修剪拖两端手柄去头去尾。"
        "四个操作80%操作就这四个。不用学几百个功能先练熟。"
    ),
    11: (
        "转场两个镜头之间的过渡。最实用叠化前画面慢慢消失后画面慢慢出现。"
        "两个片段中间白色小方块点开选叠化拉时长。"
        "画面过渡很自然没有花里胡哨。"
        "什么时候用情绪切换现实切回忆现在切过去。"
        "不需要几十种转场叠化一个够了电影院一半转场都是叠化。"
    ),
    12: (
        "最重要段落多讲会儿。踩点画面跟着BGM鼓点走。"
        "两步：点自动踩点黄点出来每一个黄点就是一个重拍剪映帮你数好了。"
        "把画面拖到黄点上黄点在哪画面切到哪。播放卡上了。"
        "我第一次发现感觉自己白剪了两年。"
        "踩点不是天赋是你有没有点这个按钮。"
        "切太快手动拖黄点太碎删几个黄点完全可控。"
    ),
    13: (
        "从头完整做一条。导入素材分割删不要的排序调顺序转场加叠化"
        "BGM选鼓点清晰的音量30%。踩点自动踩点拉画面到黄点。预览导出。"
        "几分钟一条卡点视频。不需要会所有功能导入分割转场BGM踩点"
        "这几个就能独立做出一条完整片子。"
    ),
    14: (
        "一个小时三段。景别远全中近特镜头越近代入越强想让观众看什么就用什么景别。"
        "运镜推摇跟慢稳别抖不需要炫技。"
        "剪辑分割转场踩点软件帮你做了大部分工作你只需要知道什么时候切。"
        "拍摄和剪辑不是学软件是学什么时候用什么。"
        "景别什么时候推近运镜什么时候跟剪辑什么时候切。"
        "这个感觉多看多拍多剪没有捷径但有方法。今天讲的三段就是方法的起点。"
        "好谢谢。停2秒点头结束。"
    ),
}


# ── 各页 ─────────────────────────────────────────────────

def p01(prs):
    slide = blank(prs)
    # 《影》式大面积负空间 + 双金线
    gold_rule(slide, Inches(1.2), Inches(1.55), Inches(10.9), Pt(1))
    gold_rule(slide, Inches(1.2), Inches(5.85), Inches(10.9), Pt(1))

    add_textbox(
        slide, Inches(1.0), Inches(1.15), Inches(11.3), Inches(0.35),
        "GUANGYINGMENG  ·  CINEMA MASTERCLASS",
        FONT_BODY, 12, GOLD, align=PP_ALIGN.CENTER,
    )
    # 墨雾衬底
    solid_rect(slide, Inches(2.5), Inches(2.2), Inches(8.3), Inches(1.5), MIST)
    add_textbox(
        slide, Inches(0.8), Inches(2.35), Inches(11.7), Inches(1.1),
        "从景别到剪辑", FONT_TITLE, 48, GOLD,
        align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
    )
    add_textbox(
        slide, Inches(0.8), Inches(3.85), Inches(11.7), Inches(0.55),
        "一部手机拍出电影感", FONT_BODY, 24, WHITE, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(0.8), Inches(5.2), Inches(11.7), Inches(0.4),
        "主讲·李红星", FONT_BODY, 18, GOLD, align=PP_ALIGN.CENTER,
    )
    add_footer(slide, 1)
    add_notes(slide, NOTES[1])


def p02(prs):
    slide = blank(prs)
    add_page_title(slide, "今天讲什么", 36)
    items = [("①", "景别", "拍什么"), ("②", "运镜", "怎么动"), ("③", "剪辑", "怎么剪")]
    gap, w = Inches(0.5), Inches(3.5)
    start = (SLIDE_W - (w * 3 + gap * 2)) // 2
    for i, (n, t, s) in enumerate(items):
        x = start + i * (w + gap)
        solid_rect(slide, x, Inches(1.8), w, Inches(3.8), INK)
        gold_rule(slide, x, Inches(1.8), w, Pt(2))
        add_textbox(slide, x, Inches(2.3), w, Inches(0.55), n,
                    FONT_TITLE, 28, GOLD, align=PP_ALIGN.CENTER, bold=True)
        add_textbox(slide, x, Inches(3.2), w, Inches(0.7), t,
                    FONT_TITLE, 36, WHITE, align=PP_ALIGN.CENTER, bold=True)
        gold_rule(slide, x + Inches(1.1), Inches(4.05), Inches(1.3), Pt(1.5))
        add_textbox(slide, x, Inches(4.35), w, Inches(0.5), s,
                    FONT_BODY, 20, GOLD, align=PP_ALIGN.CENTER)
    add_footer(slide, 2)
    add_notes(slide, NOTES[2])


def p03(prs):
    slide = blank(prs)
    add_page_title(slide, "五大景别总览", 36)
    shots = [
        ("[图：远景-肖申克救赎安迪雨中]", "远景看环境"),
        ("[图：全景-功夫猪笼城寨]", "全景看全身"),
        ("[图：中景-那些年教室对话]", "中景讲故事"),
        ("[图：近景-少年的你周冬雨哭戏]", "近景传情绪"),
        ("[图：特写-泰坦尼克号手印车窗]", "特写放大招"),
    ]
    gap, w, h = Inches(0.16), Inches(2.3), Inches(3.35)
    start = (SLIDE_W - (w * 5 + gap * 4)) // 2
    top = Inches(1.3)
    for i, (lab, cap) in enumerate(shots):
        x = start + i * (w + gap)
        add_placeholder(slide, x, top, w, h, lab)
        add_textbox(slide, x - Inches(0.05), top + h + Inches(0.08),
                    w + Inches(0.1), Inches(0.38),
                    cap, FONT_BODY, 13, GOLD, align=PP_ALIGN.CENTER)
    add_bottom(slide, "远全中近特·越近代入越强", top=Inches(5.9))
    add_footer(slide, 3)
    add_notes(slide, NOTES[3])


def p04(prs):
    slide = blank(prs)
    add_page_title(slide, "景别案例", 36)
    items = [
        "[图：同一人远景vs近景对比]",
        "[图：同一房间全景vs特写对比]",
        "[图：短视频口播中景vs美食特写对比]",
    ]
    gap, w, h = Inches(0.35), Inches(3.7), Inches(3.55)
    start = (SLIDE_W - (w * 3 + gap * 2)) // 2
    for i, lab in enumerate(items):
        add_placeholder(slide, start + i * (w + gap), Inches(1.4), w, h, lab)
    add_bottom(slide, "景别决定了观众和角色的距离，决定了观众关注什么。",
               top=Inches(5.35))
    add_footer(slide, 4)
    add_notes(slide, NOTES[4])


def p05(prs):
    slide = blank(prs)
    add_page_title(slide, "景别小结", 36)
    solid_rect(slide, Inches(1.5), Inches(2.3), Inches(10.3), Inches(1.8), MIST)
    gold_rule(slide, Inches(1.5), Inches(2.3), Inches(10.3), Pt(2))
    add_textbox(
        slide, Inches(0.8), Inches(2.6), Inches(11.7), Inches(1.2),
        "远全中近特·越近代入越强", FONT_TITLE, 40, GOLD,
        align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
    )
    add_bottom(slide, "你刷的每一条短视频里景别无处不在。", top=Inches(5.0))
    add_footer(slide, 5)
    add_notes(slide, NOTES[5])


def p06(prs):
    slide = blank(prs)
    add_page_title(slide, "运镜三招总览", 36)
    items = [
        ("[图：推-箭头向内]", "推=靠近聚焦"),
        ("[图：摇-弧线箭头]", "摇=环顾四周"),
        ("[图：跟-虚线跟随]", "跟=代入跟踪"),
    ]
    gap, w, h = Inches(0.45), Inches(3.6), Inches(3.45)
    start = (SLIDE_W - (w * 3 + gap * 2)) // 2
    for i, (lab, cap) in enumerate(items):
        x = start + i * (w + gap)
        add_placeholder(slide, x, Inches(1.4), w, h, lab)
        add_textbox(slide, x, Inches(1.4) + h + Inches(0.12), w, Inches(0.4),
                    cap, FONT_BODY, 18, GOLD, align=PP_ALIGN.CENTER)
    add_footer(slide, 6)
    add_notes(slide, NOTES[6])


def p07(prs):
    slide = blank(prs)
    add_page_title(slide, "运镜案例", 36)
    items = [
        "[视频：推-沉默的羔羊汉尼拔出场15秒]",
        "[视频：摇-重庆森林手持摇镜10秒]",
        "[视频：跟-谍影重重巷战跟拍15秒]",
    ]
    gap, w, h = Inches(0.35), Inches(3.7), Inches(3.85)
    start = (SLIDE_W - (w * 3 + gap * 2)) // 2
    for i, lab in enumerate(items):
        add_placeholder(slide, start + i * (w + gap), Inches(1.4), w, h, lab)
    add_footer(slide, 7)
    add_notes(slide, NOTES[7])


def p08(prs):
    slide = blank(prs)
    add_page_title(slide, "运镜法则", 36)
    solid_rect(slide, Inches(2.0), Inches(1.7), Inches(9.3), Inches(1.2), MIST)
    add_textbox(
        slide, Inches(0.8), Inches(1.85), Inches(11.7), Inches(0.95),
        "稳永远排第一", FONT_TITLE, 44, GOLD,
        align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
    )
    gold_rule(slide, Inches(4.6), Inches(3.15), Inches(4.1), Pt(2))
    add_multiline(
        slide, Inches(2.5), Inches(3.5), Inches(8.3), Inches(2.2),
        ["晃不如不动。", "走不稳就先站着拍。", "慢、稳、别抖。"],
        FONT_BODY, 22, WHITE, align=PP_ALIGN.CENTER, space_after=14,
    )
    add_footer(slide, 8)
    add_notes(slide, NOTES[8])


def p09(prs):
    slide = blank(prs)
    add_textbox(
        slide, Inches(0.8), Inches(0.55), Inches(11.7), Inches(0.75),
        "从拍到剪", FONT_TITLE, 40, GOLD,
        align=PP_ALIGN.CENTER, bold=True,
    )
    gold_rule(slide, Inches(5.4), Inches(1.3), Inches(2.5), Pt(2.5))

    left, right = Inches(2.2), Inches(8.0)
    top, bw, bh = Inches(1.85), Inches(3.0), Inches(3.5)
    add_placeholder(slide, left, top, bw, bh, "[图：手机图标]", phone=True)
    add_textbox(slide, left, top + bh + Inches(0.1), bw, Inches(0.35),
                "拍摄", FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER)
    add_textbox(slide, Inches(5.6), Inches(3.15), Inches(2.0), Inches(0.6),
                "→", FONT_TITLE, 48, GOLD, align=PP_ALIGN.CENTER, bold=True)
    add_placeholder(slide, right, top, bw, bh, "[图：剪映图标]", phone=True)
    add_textbox(slide, right, top + bh + Inches(0.1), bw, Inches(0.35),
                "剪辑", FONT_BODY, 18, WHITE, align=PP_ALIGN.CENTER)
    add_footer(slide, 9)
    add_notes(slide, NOTES[9])


def p10(prs):
    slide = blank(prs)
    add_page_title(slide, "基础剪辑", 36)
    shots = [
        ("[截图：底部工具栏-分割按钮-剪刀图标]", "分割"),
        ("[截图：选中片段-删除按钮-垃圾桶图标]", "删除"),
        ("[截图：长按拖动片段调整顺序]", "拖拽排序"),
        ("[截图：拖动片段两端白色手柄-修剪]", "修剪"),
    ]
    gap, w, h = Inches(0.28), Inches(2.65), Inches(3.45)
    start = (SLIDE_W - (w * 4 + gap * 3)) // 2
    for i, (lab, cap) in enumerate(shots):
        x = start + i * (w + gap)
        add_placeholder(slide, x, Inches(1.3), w, h, lab, phone=True)
        add_textbox(slide, x, Inches(1.3) + h + Inches(0.1), w, Inches(0.35),
                    cap, FONT_BODY, 16, WHITE, align=PP_ALIGN.CENTER)
    add_bottom(slide, "所有复杂剪辑从这四个操作开始。", top=Inches(5.85))
    add_footer(slide, 10)
    add_notes(slide, NOTES[10])


def p11(prs):
    slide = blank(prs)
    add_page_title(slide, "转场", 36)
    add_placeholder(
        slide, Inches(2.4), Inches(1.4), Inches(8.5), Inches(3.8),
        "[截图：两片段中间白色方块→转场菜单→叠化]",
    )
    add_bottom(slide, "叠化最自然。电影一半转场都是它。", top=Inches(5.5))
    add_footer(slide, 11)
    add_notes(slide, NOTES[11])


def p12(prs):
    slide = blank(prs)
    add_page_title(slide, "踩点", 36)
    shots = [
        "[截图：选中BGM→底部踩点→自动踩点按钮]",
        "[截图：黄点出现在BGM轨道上]",
        "[截图：手指把画面拖到黄点位置]",
    ]
    gap, w, h = Inches(0.32), Inches(3.65), Inches(3.15)
    start = (SLIDE_W - (w * 3 + gap * 2)) // 2
    for i, lab in enumerate(shots):
        add_placeholder(slide, start + i * (w + gap), Inches(1.25), w, h, lab, phone=True)
    add_textbox(
        slide, Inches(0.6), Inches(4.65), Inches(12.1), Inches(0.4),
        "①点自动踩点→②黄点出现→③画面拉到黄点→④卡上了",
        FONT_BODY, 16, GOLD, align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide, Inches(0.6), Inches(5.2), Inches(12.1), Inches(0.7),
        "踩点不是天赋", FONT_TITLE, 36, GOLD,
        align=PP_ALIGN.CENTER, bold=True,
    )
    add_footer(slide, 12)
    add_notes(slide, NOTES[12])


def p13(prs):
    slide = blank(prs)
    add_page_title(slide, "完整演示", 36)
    add_placeholder(
        slide, Inches(1.15), Inches(1.45), Inches(11.0), Inches(4.1),
        "[截图：8步流程-导入→分割→排序→转场→BGM→踩点→预览→导出]",
    )
    add_footer(slide, 13)
    add_notes(slide, NOTES[13])


def p14(prs):
    slide = blank(prs)
    add_page_title(slide, "总结", 36)
    lines = [
        "景别·远全中近特",
        "运镜·推摇跟",
        "剪辑·分割转场踩点",
    ]
    # 三段墨块纵向
    for i, line in enumerate(lines):
        y = Inches(1.7) + i * Inches(1.15)
        solid_rect(slide, Inches(2.8), y, Inches(7.7), Inches(0.95), MIST)
        gold_rule(slide, Inches(2.8), y, Pt(4), Inches(0.95))
        add_textbox(
            slide, Inches(3.2), y, Inches(7.0), Inches(0.95),
            line, FONT_TITLE, 28, GOLD,
            align=PP_ALIGN.CENTER, bold=True, anchor=MSO_ANCHOR.MIDDLE,
        )
    add_bottom(slide, "拍摄和剪辑不是学软件，是学什么时候用什么。",
               top=Inches(5.5))
    add_footer(slide, 14)
    add_notes(slide, NOTES[14])


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    for fn in (p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14):
        fn(prs)
    out = "试听课_从景别到剪辑.pptx"
    prs.save(out)
    print(f"OK: {out} ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
