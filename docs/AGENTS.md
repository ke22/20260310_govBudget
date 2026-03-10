## Purpose

This repo is a static, client-side budget dashboard (HTML/CSS/JS + Chart.js) undergoing an information-architecture refactor from an in-page “virtual pages” pattern (via `showPage(...)`) to **real multi-page navigation**.

The target IA and implementation notes live in `docs/split-pages-plan.md`.

## Repo-specific AI skills (project level)

These are checked into the repo under `.cursor/skills/` so anyone working in this project gets consistent guidance.

- **`frontend-design`** (`.cursor/skills/frontend-design/`)
  - Use when: adjusting layout, typography, nav/CTA hierarchy, page polish after the split.
  - Output expectation: production-grade, distinctive UI (not generic templates).

## Recommended skills to install (user/global level)

These are best installed in your personal Cursor skills directory so they can be reused across projects.

- **Vercel Web Design Guidelines**
  - Use when: after splitting pages, run a whole-site UI/UX + accessibility audit (semantic HTML, labels, keyboard/focus, nav consistency).
- **AccessLint**
  - Use when: you want deeper WCAG-focused checks (contrast, link purpose, “color-only” cues).

Optional (methodology / design-system oriented; less tied to this repo’s code structure):

- **Bencium UX Designer**
- **UI/UX Pro Max**

## IA (MECE) page responsibilities

Target pages (see `docs/split-pages-plan.md` for details):

- **`index.html` (總覽)**: overview storytelling and top-level insights.
  - Includes Hero (with “查預算 / 立委把關” CTA), overall review progress, Top 5 rankings, allocations, comparisons, ministry analysis.
  - Excludes: search result lists, legislator detail flows, “more info” static docs.
- **`budget.html` (查預算)**: search/filter/browse budget plans and agency review results.
  - Includes: ministry/unit filters, budget search, pagination, plan detail modal (`unifiedModal`).
  - Excludes: overview sections and legislator flows.
- **`legislators.html` (立委把關)**: legislator browsing and detail modal.
  - Includes: party filters, legislator cards, legislator detail modal (`detailModalC`).
  - Excludes: budget search and overview charts.
- **`other.html` (更多資訊)**: static “about/faq/data sources” content only.
  - Excludes: charts, search, and modals.

## Working conventions (for agents)

- **Do not reintroduce SPA-style page switching** once the multi-page split is complete. Prefer `<a href="...">` navigation.
- **Guard all JS initializers by DOM existence** so shared JS can be loaded on all pages without errors.
- **Prefer URL params for cross-page handoff**, e.g. `budget.html?q=...` or `budget.html?plan=...` (if implemented).
- **Keep nav minimal**: 4 links (總覽 / 查預算 / 立委把關 / 更多資訊), with an active state per page.

## Quick QA checklist (after changes)

- Each page loads without console errors and without requiring hidden sections to exist.
- Nav links work and active state is correct on all 4 pages.
- Budget deep links work: `budget.html?q=...` (and `?plan=...` if supported).
- Modals work on their owning pages only (`unifiedModal` on budget; `detailModalC` on legislators).
- Keyboard focus is visible; forms have labels; interactive elements are reachable by keyboard.

