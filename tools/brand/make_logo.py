"""BizVoice logo 產生器：公事包 + 對話框 + 聲波。字體轉成曲線，輸出 SVG 到 public/brand/。

用法（在專案根目錄）：
    python3 -m venv tools/brand/.venv
    tools/brand/.venv/bin/pip install uharfbuzz fonttools
    tools/brand/.venv/bin/python tools/brand/make_logo.py

字體 Bricolage Grotesque 為 SIL Open Font License，可商用；第一次執行會自動下載到 tools/brand/。
"""
import os, sys, urllib.request
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, '..', '..', 'public', 'brand'))
os.makedirs(OUT, exist_ok=True)

INK, MARK, PAPER = '#1a2430', '#f5d368', '#f2f3ef'

# ---------- 字體：Bricolage Grotesque（OFL），轉成曲線 ----------
FONT_PATH = os.path.join(HERE, 'bricolage.ttf')
FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf'
if not os.path.exists(FONT_PATH):
    urllib.request.urlretrieve(FONT_URL, FONT_PATH)
blob = hb.Blob.from_file_path(FONT_PATH)
face = hb.Face(blob)
font = hb.Font(face)
UPEM = face.upem

def text_path(text, size, weight, x, baseline, tracking=0.0):
    """回傳 (path d, 寬度)。tracking 以 em 為單位。"""
    font.set_variations({'wght': weight, 'wdth': 100, 'opsz': 96})
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': True})
    s = size / UPEM
    pen = SVGPathPen(None, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    cx = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        tp = TransformPen(pen, (s, 0, 0, -s, x + (cx + pos.x_offset) * s, baseline - pos.y_offset * s))
        font.draw_glyph_with_pen(info.codepoint, tp)
        cx += pos.x_advance + tracking * UPEM
    return pen.getCommands(), cx * s

# ---------- 圖形：公事包形的對話框 + 五條聲波 ----------
BARS = [(36, 14), (48, 30), (60, 42), (72, 26), (84, 16)]  # (中心 x, 高度)
BAR_W, BAR_CY = 7, 62

def icon_group(body, bars, uid, knockout=False):
    """120x120 座標的圖形。knockout=True 時聲波是鏤空（單色版用 mask）。"""
    bar_rects = ''.join(
        f'<rect x="{cx - BAR_W / 2}" y="{BAR_CY - h / 2}" width="{BAR_W}" height="{h}" rx="{BAR_W / 2}"/>'
        for cx, h in BARS
    )
    if knockout:
        mask = (f'<mask id="k{uid}"><rect width="120" height="120" fill="#fff"/>'
                f'<g fill="#000">{bar_rects}</g></mask>')
        return (mask + f'<g mask="url(#k{uid})" fill="{body}" stroke="{body}">' + _shape(body) + '</g>')
    return (f'<g fill="{body}" stroke="{body}">' + _shape(body) + '</g>'
            + f'<g fill="{bars}">{bar_rects}</g>')

SIMPLE_BARS = [(42, 22), (60, 46), (78, 30)]
SIMPLE_BAR_W = 13

def simple_group(body, bars):
    bar_rects = ''.join(
        f'<rect x="{cx - SIMPLE_BAR_W / 2}" y="{BAR_CY - h / 2}" width="{SIMPLE_BAR_W}" height="{h}" rx="{SIMPLE_BAR_W / 2}"/>'
        for cx, h in SIMPLE_BARS
    )
    shape = (
        '<rect x="10" y="32" width="100" height="64" rx="16" stroke="none"/>'
        '<path d="M26 92 L26 112 L50 92 Z" stroke-width="8" stroke-linejoin="round"/>'
        '<path d="M42 36 V28 Q42 18 52 18 H68 Q78 18 78 28 V36" fill="none" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
    )
    return f'<g fill="{body}" stroke="{body}">{shape}</g><g fill="{bars}">{bar_rects}</g>'

def _shape(body):
    return (
        '<rect x="10" y="32" width="100" height="64" rx="16" stroke="none"/>'
        '<path d="M29 92 L29 106 L45 92 Z" stroke-width="6" stroke-linejoin="round"/>'
        '<path d="M42 34 V27 Q42 19 50 19 H70 Q78 19 78 27 V34" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
    )

def svg(w, h, inner, title, bg=None):
    bgr = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{bgr}{inner}</svg>\n')

def wordmark(size, x, baseline, c1, c2):
    d1, w1 = text_path('Biz', size, 800, x, baseline, tracking=-0.01)
    d2, w2 = text_path('Voice', size, 500, x + w1 + size * 0.015, baseline, tracking=-0.005)
    return f'<path d="{d1}" fill="{c1}"/><path d="{d2}" fill="{c2}"/>', w1 + size * 0.015 + w2

def write(name, content):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        f.write(content)

# ---------- 橫式 logo（圖形 + 字標） ----------
def lockup(body, bars, c1, c2, name, title, uid, knockout=False, bg=None):
    S = 0.62                                  # 圖形縮放
    pad = 14
    icon_w, icon_h = 120 * S, 120 * S
    size = 58
    base = pad + (62 * S) + size * 0.7 / 2    # 字的大寫高度置中於聲波中線
    wm, ww = wordmark(size, 0, base, c1, c2)
    gap = 14
    W = pad + icon_w + gap + ww + pad
    H = pad * 2 + icon_h
    icon = f'<g transform="translate({pad} {pad}) scale({S})">{icon_group(body, bars, uid, knockout)}</g>'
    wm = wordmark(size, pad + icon_w + gap, base, c1, c2)[0]
    write(name, svg(W, H, icon + wm, title, bg))
    return W, H

lockup(INK, MARK, INK, INK, 'bizvoice-logo.svg', 'BizVoice', 'a')
lockup(PAPER, INK, PAPER, PAPER, 'bizvoice-logo-dark.svg', 'BizVoice', 'b')
lockup(INK, None, INK, INK, 'bizvoice-logo-mono.svg', 'BizVoice', 'c', knockout=True)

# ---------- 圖示（App icon / favicon）：螢光黃底 + 墨水色圖形 ----------
def tile(bg, body, bars, name, uid, radius=26):
    inner = (f'<rect width="120" height="120" rx="{radius}" fill="{bg}"/>'
             f'<g transform="translate(60 60) scale(0.78) translate(-60 -60)">{icon_group(body, bars, uid)}</g>')
    write(name, svg(120, 120, inner, 'BizVoice'))

tile(MARK, INK, MARK, 'bizvoice-icon.svg', 'd')
tile(INK, PAPER, INK, 'bizvoice-icon-dark.svg', 'e')
# iOS 的 apple-touch-icon 要滿版方形（圓角由系統處理）
tile(MARK, INK, MARK, 'bizvoice-icon-square.svg', 'g', radius=0)

# 小尺寸（瀏覽器分頁小圖示 16/32px）：簡化版，黃底
write('bizvoice-favicon.svg', svg(120, 120,
    f'<rect width="120" height="120" rx="26" fill="{MARK}"/>'
    f'<g transform="translate(60 60) scale(0.84) translate(-60 -60)">{simple_group(INK, MARK)}</g>', 'BizVoice'))

# 圖形本體（無底色，供各種用途）
write('bizvoice-symbol.svg', svg(120, 120, icon_group(INK, MARK, 'f'), 'BizVoice'))
print('已輸出到', OUT)
