# Testing guide

This repo is a static, client-side multi-page dashboard (`index.html`, `budget.html`, `legislators.html`, `other.html`). Automated tests assume the site is served over HTTP (not `file://`), because it fetches `data_page_*.json`.

## Setup (once)

```bash
npm ci
npx playwright install
```

## E2E (user journey) tests

Runs Playwright E2E tests across desktop browsers + mobile emulation (mobile projects run `@smoke` only).

```bash
npm run test:e2e
```

Quick smoke (Chromium only):

```bash
npm run test:e2e:smoke
```

## Accessibility (a11y) smoke tests

These use axe to fail on **serious/critical** violations. (The `color-contrast` rule is disabled in smoke because it can be noisy in CI due to font rendering/subpixel rounding.)

```bash
npm run test:a11y
```

## Performance (Lighthouse CI)

Lighthouse CI does **not** start a local server automatically. Run the server in one terminal, then run LHCI in another.

Terminal A:

```bash
npm run serve
```

Terminal B:

```bash
BASE_URL=http://127.0.0.1:4173 npm run test:lighthouse
```

Notes:
- Assertions are currently set to **warn** (not fail) for performance/LCP/CLS budgets, to help you track regressions without blocking iteration.
- Lighthouse reports are written under `.lighthouseci/` and also uploaded in CI as artifacts.

## Stress / load test (k6)

This repository includes a k6 script that hits the 4 pages + shared assets + `data_page_*.json`.

### Install k6 locally

- macOS (Homebrew):

```bash
brew install k6
```

### Run against local server

Terminal A:

```bash
npm run serve
```

Terminal B:

```bash
BASE_URL=http://127.0.0.1:4173 npm run test:stress
```

### Run against a deployed site

```bash
BASE_URL=https://your-deployed-site.example npm run test:stress
```

## CI (GitHub Actions)

Workflow: `.github/workflows/test.yml`

- On **pull requests**: runs E2E + a11y + Lighthouse (against a local server).
- On **schedule** + **manual dispatch**: also runs the k6 stress script.
- Manual dispatch supports an optional `base_url` input to run against a deployed URL (tests will use that `BASE_URL`).

