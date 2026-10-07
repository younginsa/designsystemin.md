/* ds.js — 생성 HTML 공통 인터랙션(2026-09-30 파일럿). "열고 닫고 바꾸기"만 한다. 데이터가 움직이는 동작(검색·정렬·페이지)은 없다 —
   그건 미리 그려 둔 상태(data-state · data-view)로 보여준다. FE(Radix) 마크업의 표식을 그대로 읽는다: role=tab/aria-controls, aria-haspopup, data-state.
   단독 HTML 은 <script src="https://designsystemin-md.vercel.app/ds.js" defer></script> 한 줄. 접근성 완전 구현이 아니라 보여주기용이다(포커스 가두기·키보드 순회 없음). */
(function () {
  "use strict";
  var D = document;
  function $(sel, root) { return (root || D).querySelector(sel); }
  function all(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
  function byId(id) { return id ? D.getElementById(id) : null; }
  function setState(el, open) { if (!el) return; el.setAttribute("data-state", open ? "open" : "closed"); }

  // ── 상태 알약 · 뷰 전환(ds-skill 3장·8장) ──
  function pick(state) {
    all("section[data-state]").forEach(function (s) { s.hidden = s.dataset.state !== state; });
    all("[data-pick]").forEach(function (b) {
      var on = b.dataset.pick === state;
      b.className = on ? "rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground" : "rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent";
    });
  }
  all("[data-pick]").forEach(function (b) { b.addEventListener("click", function () { pick(b.dataset.pick); }); });
  all("[data-view-pick]").forEach(function (b) {
    b.addEventListener("click", function () {
      var on = $('section[data-view="' + b.dataset.viewPick + '"]'); if (!on) return;
      var show = on.hidden;
      all("section[data-view]").forEach(function (s) { s.hidden = true; });
      on.hidden = !show;
      if (!show) { var d = $('section[data-view="default"]'); if (d) d.hidden = false; }
      // 알약 안의 「스펙」 버튼(2026-10-07 — 알약 마지막 자리)은 열려 있는 동안 활성 색. 알약 밖(구 우상단 고정)은 건드리지 않는다.
      all("[data-view-pick]").forEach(function (x) {
        if (!x.parentElement || !x.parentElement.querySelector("[data-pick]")) return;
        x.className = (x === b && show) ? "rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground" : "rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent";
      });
    });
  });

  // ── 탭(role=tab → aria-controls 패널) ──
  all('[role="tablist"]').forEach(function (list) {
    var tabs = all('[role="tab"]', list);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute("aria-selected", on ? "true" : "false");
          x.setAttribute("data-state", on ? "active" : "inactive");
          x.tabIndex = on ? 0 : -1;
          var p = byId(x.getAttribute("aria-controls"));
          if (p) { p.hidden = !on; p.setAttribute("data-state", on ? "active" : "inactive"); }
        });
      });
    });
  });

  // ── 아코디언 · 콜랩시블(트리거 data-state + aria-controls) ──
  all('[aria-expanded][aria-controls]').forEach(function (t) {
    if (t.getAttribute("role") === "tab" || t.getAttribute("aria-haspopup")) return;
    t.addEventListener("click", function () {
      var panel = byId(t.getAttribute("aria-controls")); if (!panel) return;
      var open = t.getAttribute("aria-expanded") !== "true";
      t.setAttribute("aria-expanded", open ? "true" : "false");
      setState(t, open); setState(panel, open); panel.hidden = !open;
    });
  });

  // ── 오버레이(다이얼로그·시트·드롭다운·팝오버·셀렉트): 트리거(aria-haspopup 또는 role=combobox) → aria-controls 콘텐츠 ──
  // 콘텐츠는 FE 스냅샷의 열린 상태(states/<스토리>--open.html)에 <!-- portal --> 뒤로 들어 있다. 팝오버류는 popper 감싸개
  // (data-radix-popper-content-wrapper)째 움직이고, 위치는 열 때 트리거 아래로 잡는다(스냅샷의 좌표는 스토리북 화면 기준이라 fe:sync 가 걷어냈다).
  // 다이얼로그·시트는 형제 오버레이(data-slot=*-overlay)와 함께 움직이고 위치는 클래스가 잡는다. 콘텐츠가 없으면(닫힌 사진만 있는 스토리) 아무 일도 없다.
  function boxOf(c) { return c.closest("[data-radix-popper-content-wrapper]") || c; }
  function overlayOf(c) { var o = boxOf(c).previousElementSibling; return o && /overlay/.test(o.getAttribute("data-slot") || "") ? o : null; }
  function place(box, c, t) {
    if (box === c && !c.hasAttribute("data-side")) return;
    var r = t.getBoundingClientRect(), side = c.getAttribute("data-side") || "bottom", align = c.getAttribute("data-align") || "start", gap = 4;
    ["--radix-popper-anchor-width", "--radix-select-trigger-width", "--radix-popover-trigger-width", "--radix-dropdown-menu-trigger-width"].forEach(function (v) { box.style.setProperty(v, r.width + "px"); c.style.setProperty(v, r.width + "px"); });
    box.style.position = "fixed"; box.style.zIndex = "50"; box.style.minWidth = "max-content"; box.style.left = "0px"; box.style.top = "0px";
    box.style.setProperty("--radix-popper-available-height", Math.max(120, window.innerHeight - r.bottom - gap - 8) + "px");
    // Radix Select 는 콘텐츠·뷰포트에 런타임 인라인 style 을 두는데 스냅샷에선 걷어냈고, 뷰포트 클래스 h-[trigger-height] 만 남아 첫 항목만 보인다 —
    // 뷰포트를 내용 높이로 풀고 콘텐츠가 스크롤하게 한다(콘텐츠의 max-h 는 클래스가 잡는다)
    if (c.getAttribute("data-slot") === "select-content" || c.getAttribute("role") === "listbox") {
      c.style.boxSizing = "border-box"; c.style.overflow = "hidden auto";
      var vp = c.querySelector("[data-radix-select-viewport]"); if (vp) { vp.style.height = "auto"; vp.style.overflow = "visible"; }
    }
    var w = box.offsetWidth, h = box.offsetHeight;
    var left = align === "end" ? r.right - w : align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
    var top = side === "top" ? r.top - h - gap : r.bottom + gap;
    box.style.left = Math.max(8, Math.min(left, window.innerWidth - w - 8)) + "px";
    box.style.top = Math.max(8, Math.min(top, window.innerHeight - h - 8)) + "px";
  }
  function hide(c) {
    var box = boxOf(c), o = overlayOf(c);
    box.hidden = true; setState(c, false); c.removeAttribute("data-ds-open");
    if (o) { o.hidden = true; setState(o, false); }
    all('[aria-controls="' + c.id + '"]').forEach(function (t) { t.setAttribute("aria-expanded", "false"); setState(t, false); });
  }
  function closeAll() { all('[data-ds-open="true"]').forEach(hide); }
  all('[aria-haspopup][aria-controls], [role="combobox"][aria-controls]').forEach(function (t) {
    var c = byId(t.getAttribute("aria-controls")); if (!c) return;
    hide(c);
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = boxOf(c).hidden;
      closeAll();
      if (open) {
        var box = boxOf(c), o = overlayOf(c);
        box.hidden = false; setState(c, true); c.setAttribute("data-ds-open", "true");
        if (o) { o.hidden = false; setState(o, true); }
        t.setAttribute("aria-expanded", "true"); setState(t, true);
        place(box, c, t);
      }
    });
    boxOf(c).addEventListener("click", function (e) { e.stopPropagation(); });
    var ov = overlayOf(c); if (ov) ov.addEventListener("click", closeAll);
  });
  // 닫기 버튼(다이얼로그 ✕ 등) — [data-ds-close], shadcn 의 data-slot="*-close", aria-label 이 Close/닫기 인 버튼
  all('[data-ds-close], [data-slot$="-close"], button[aria-label="Close"], button[aria-label="닫기"]').forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); closeAll(); }); });
  D.addEventListener("click", function () { closeAll(); });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });
})();
