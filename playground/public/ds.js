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

  // ── 오버레이(다이얼로그·시트·드롭다운·팝오버·셀렉트): aria-haspopup 트리거 → aria-controls 콘텐츠 ──
  // 콘텐츠는 FE 스냅샷의 <!-- portal --> 블록(문서 끝)에 있고, 생성 시 hidden 으로 둔다. 없으면(닫힌 상태만 찍힌 스토리) 아무 일도 없다.
  function overlayFor(trigger) {
    var c = byId(trigger.getAttribute("aria-controls")); if (!c) return null;
    // 다이얼로그·시트는 형제 오버레이(data-slot=dialog-overlay 등)와 함께 움직인다
    var overlay = c.previousElementSibling && /overlay/.test(c.previousElementSibling.getAttribute("data-slot") || "") ? c.previousElementSibling : null;
    return { content: c, overlay: overlay };
  }
  function closeAll() {
    all('[data-ds-open="true"]').forEach(function (c) {
      c.hidden = true; setState(c, false); c.removeAttribute("data-ds-open");
      var o = c.previousElementSibling; if (o && /overlay/.test(o.getAttribute("data-slot") || "")) { o.hidden = true; setState(o, false); }
      all('[aria-controls="' + c.id + '"]').forEach(function (t) { t.setAttribute("aria-expanded", "false"); setState(t, false); });
    });
  }
  all("[aria-haspopup][aria-controls]").forEach(function (t) {
    var pair = overlayFor(t); if (!pair) return;
    pair.content.hidden = true; setState(pair.content, false); if (pair.overlay) { pair.overlay.hidden = true; setState(pair.overlay, false); }
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = pair.content.hidden;
      closeAll();
      if (open) {
        pair.content.hidden = false; setState(pair.content, true); pair.content.setAttribute("data-ds-open", "true");
        if (pair.overlay) { pair.overlay.hidden = false; setState(pair.overlay, true); }
        t.setAttribute("aria-expanded", "true"); setState(t, true);
      }
    });
    pair.content.addEventListener("click", function (e) { e.stopPropagation(); });
    if (pair.overlay) pair.overlay.addEventListener("click", closeAll);
  });
  // 닫기 버튼(다이얼로그 ✕ 등) — 콘텐츠 안의 [data-ds-close] 또는 aria-label 이 Close/닫기 인 버튼
  all('[data-ds-close], button[aria-label="Close"], button[aria-label="닫기"]').forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); closeAll(); }); });
  D.addEventListener("click", function () { closeAll(); });
  D.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });
})();
