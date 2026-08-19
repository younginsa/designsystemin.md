#!/usr/bin/env python3
# 365 카탈로그 렌더 크롭 — 손 좌표 금지, 콘텐츠 bbox를 측정해 흰 캔버스 정중앙에 배치한다.
# (rest/hover 슬롯 세로 어긋남 재발 방지 — 슬롯 쌍은 같은 캔버스 크기를 공유)
#
# 사용법:
#   python3 scripts/crop-center.py pair   <캡처.png> <상단블록출력.png> <하단블록출력.png>
#   python3 scripts/crop-center.py single <캡처.png> <출력.png> [최소W 최소H]
#     최소W/H: 캔버스 하한(px) — 작은 콘텐츠가 카드에서 과확대되지 않게 이웃 카드와 축척을 맞출 때 사용
#
# pair: 세로로 쌓인 두 변형(상단=원형 스톡, 하단=365 조정판)을 각각 잘라
#       두 슬롯이 동일한 캔버스 크기·정중앙 배치를 갖게 한다.
# single: 페이지 전체 콘텐츠 bbox 하나를 중앙 배치(단일 렌더 카드용).

from PIL import Image
import sys

THR = 250          # 이 값 미만 밝기 = 콘텐츠 픽셀 (흰 배경 대비)
MIN_GAP = 60       # 블록을 가르는 최소 세로 공백(px, 캡처 원본 스케일) — 표 셀 패딩 밴드(~40px@2x)보다 커야 함
MARGIN = 96        # 캔버스 여백 (2x 캡처 기준 → 표시 48px 상당)
MIN_ASPECT = 0.25  # 캔버스 H ≥ W*0.25 (과도하게 납작한 캔버스 방지)


def row_profile(gray):
    w, h = gray.size
    px = gray.load()
    prof = []
    for y in range(h):
        has = False
        # 스트라이드 금지 — 1px 테두리(2px@2x)를 건너뛰면 블록이 패딩 밴드에서 쪼개진다
        for x in range(w):
            if px[x, y] < THR:
                has = True
                break
        prof.append(has)
    return prof


def find_blocks(gray):
    prof = row_profile(gray)
    h = len(prof)
    blocks = []
    y = 0
    while y < h:
        if prof[y]:
            y0 = y1 = y
            gap = 0
            while y < h:
                if prof[y]:
                    y1 = y
                    gap = 0
                else:
                    gap += 1
                    if gap > MIN_GAP:
                        break
                y += 1
            if y1 - y0 >= 6:
                blocks.append((y0, y1))
        y += 1
    return blocks


def bbox_of(img, y0, y1):
    band = img.crop((0, y0, img.width, y1 + 1)).convert("L")
    mask = band.point(lambda p: 255 if p < THR else 0)
    bb = mask.getbbox()
    if not bb:
        return None
    return (bb[0], y0 + bb[1], bb[2], y0 + bb[3])


def center_on_canvas(img, bb, W, H, out):
    content = img.crop(bb)
    canvas = Image.new("RGB", (W, H), (255, 255, 255))
    canvas.paste(content, ((W - content.width) // 2, (H - content.height) // 2))
    canvas.save(out)
    print(f"{out}  canvas {W}x{H}  content {content.width}x{content.height}")


def run_pair(src, out_top, out_bottom):
    img = Image.open(src).convert("RGB")
    blocks = find_blocks(img.convert("L"))
    if len(blocks) != 2:
        sys.exit(f"{src}: 블록 2개 기대, {len(blocks)}개 감지 → {blocks}")
    bbs = [bbox_of(img, b[0], b[1]) for b in blocks]
    W = max(b[2] - b[0] for b in bbs) + MARGIN
    H = max(max(b[3] - b[1] for b in bbs) + MARGIN, int(W * MIN_ASPECT))
    center_on_canvas(img, bbs[0], W, H, out_top)
    center_on_canvas(img, bbs[1], W, H, out_bottom)


def run_single(src, out, min_w=0, min_h=0):
    img = Image.open(src).convert("RGB")
    mask = img.convert("L").point(lambda p: 255 if p < THR else 0)
    bb = mask.getbbox()
    if not bb:
        sys.exit(f"{src}: 콘텐츠 없음(전부 흰색)")
    W = max(bb[2] - bb[0] + MARGIN, min_w)
    H = max(bb[3] - bb[1] + MARGIN, int(W * MIN_ASPECT), min_h)
    center_on_canvas(img, bb, W, H, out)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "pair" and len(sys.argv) == 5:
        run_pair(sys.argv[2], sys.argv[3], sys.argv[4])
    elif mode == "single" and len(sys.argv) in (4, 6):
        run_single(sys.argv[2], sys.argv[3],
                   int(sys.argv[4]) if len(sys.argv) == 6 else 0,
                   int(sys.argv[5]) if len(sys.argv) == 6 else 0)
    else:
        sys.exit(__doc__)
