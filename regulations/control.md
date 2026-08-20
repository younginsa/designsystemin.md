# HiNAS Control — 생성 규정

## 폰트 크기 — ISO 8468 6.3.4.1 (시거리 기반)

> "Character height in millimeters should be not less than three and a half
> times the reading distance in metres. Character width should be 0.7 times
> the character height."

- **높이(mm) ≥ 3.5 × 시거리(m)** · **폭 = 0.7 × 높이**
- 예: 시거리 2m → 글자 높이 ≥ 7mm, 폭 ≥ 5mm

### 생성 게이트 (self-check)

- Control 화면 생성 시 **지정 시거리의 스케일 세트(`dstk/typography.json`의 1M/2M)
  미만 크기 사용 금지** — self-check에서 차단한다.
- 실측 세트(4K 캔버스 기준): 2M = Caption 31px · Body1 34px · Body2 Bold Mono 38px ·
  Title1 Bold 44px / 1M = Caption 16px (나머지 1M 값 실측 대기).
- mm→px 환산표는 대상 디스플레이 스펙(인치·해상도) 확정 후 추가: **<추후 확정>**

## 조명 모드·색

- Control의 기본 조명 모드 축은 **dusk/night** (`dstk/products/control.json`).
- destructive 역할 페어: 면(배너·배경) = `red-100`, 강조(텍스트·카운트) = `red-anchor`
  — HiNAS Control DNV TA 2M Dusk 실물 검증(배너 #A50000 · 강조 #FF4141).
