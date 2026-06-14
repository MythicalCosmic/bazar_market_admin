# Bazar Admin — Redesign Implementation Notes

This document records the new "Crisp Modern" design (ported from the Claude Design
handoff `Bazar Admin.html`), what data/stats each part needs, which API endpoints
feed it, and the fields that are **missing or only approximated** versus the design.

---

## 1. Design system

The whole look flows from CSS tokens in `src/styles/_tokens.scss`:

- **6 themes** (`data-theme` on `<html>`): `light`, `slate`, `sand` (light) · `dark`,
  `midnight`, `forest` (dark). Dark themes also set `data-dark="1"`.
- **8 accents** (`data-accent`): `cobalt` (default), `emerald`, `indigo`, `ocean`,
  `plum`, `rose`, `amber`, `coral`.
- **2 type styles** (`data-style`): `modern` (Manrope) · `editorial` (Spectral serif).
- All three are chosen from the **Appearance popover** in the topbar (palette icon),
  persisted to `localStorage` (`bz-theme-id`, `bz-accent`, `bz-style`), applied with a
  no-flash bootstrap in `index.html`, and managed by `src/stores/theme.js`.
- Legacy `--bz-*` variables are **mapped onto the new tokens**, so all 24 pages and
  shared components inherit the redesign without per-page rewrites. Vuetify's
  `--v-theme-primary` is overridden per accent so `color="primary"` follows the accent.
- Sidebar is a **dark panel** in every theme (`--side-*` tokens); the main area follows
  the active theme.

Fonts are loaded from Google Fonts in `index.html` (Manrope 400–800, Spectral).

---

## 2. Dashboard — widgets & the data each needs

Route `/dashboard` (`src/pages/DashboardPage.vue`). All metrics are **computed
client-side** from the orders + product cost prices loaded by
`useProfitAnalytics.load({ date_from, date_to })`.

| Widget | Data needed | Source |
|---|---|---|
| 5 KPI cards | net profit, revenue, orders, avg profit, paid revenue (+ deltas vs previous period) | computed from `orders[]._p` (revenue/cost/profit/units) |
| **6 stat tiles** | avg order, items/order, fulfillment %, paid %, refund %, repeat-customer % | computed from orders |
| Trend line | daily revenue / cost / profit | per-day buckets over the range |
| Profit quality (radial + rows) | margin %, revenue, cost, profit, paid revenue | totals |
| Top products | profit, margin, qty per product | `order._p.breakdown[]` |
| By category | revenue, profit, margin per root category | `breakdown[].categoryName` |
| Payment donut | revenue per payment method | `payment_method` |
| Status donut | order count per status | `status` |
| Staff leaderboard | orders, revenue, profit, margin per staff | `order._p.staff` |
| **Weekday profit** (bar) | profit per weekday | `created_at` day-of-week |
| **Hourly revenue** (bar) | revenue per 2-hour bucket 08–22 | `created_at` hour |
| **Activity heatmap** | revenue per weekday × hour-bucket (7×7) | `created_at` |
| **Live orders feed** | 7 most recent orders (number, customer, amount, status, time) | orders |
| **Monthly targets** | revenue / profit / orders vs a target | derived target = `revenue × 1.25` |
| **Health gauges** | fulfillment %, paid %, cancel %, refund %, margin % | computed |
| Orders profit table | per-order revenue/cost/profit/margin/staff | `orders[]` |

Date control = `Bugun / 7 / 30 / 90 kun` presets + custom range; filters = status,
payment, staff, paid-only.

### Required API endpoints (already wired)
- `GET /orders` (paged, with `date_from`/`date_to`) — order list with items.
- `GET /products` (paged) — cost prices for profit (the slow part: ~800 products
  paginated; dashboard shows skeletons ~10 s on first load).
- `GET /auth-me` — current user.
- Order item shape must expose `product_id`, `qty`, `unit_price`, and the product's
  `cost_price` + `category` for category/profit breakdowns.

---

## 3. Fields the design assumes but the live API does **not** provide

These were **approximated or derived** so the widgets still render. If the backend can
expose them, the dashboard becomes exact:

| Design metric | Status now | What's needed to make it real |
|---|---|---|
| "New customers" stat tile | **dropped** (needs `/customers?registered_after=`) | a customers-in-range count or `registered_at` |
| "Active couriers" stat tile | **dropped** (needs `/users?role=courier&active`) | active courier count |
| Items per order | shows `units / count`; **0** when order items omit quantities | order items must carry `qty`/`units` |
| Refund %, cancel % | from `payment_status==='refunded'` / `status==='cancelled'` | only correct if refunded/cancelled orders are in the range payload |
| Repeat-customer % | from `user.id ?? customer_id ?? customer_phone` | a stable `customer_id` on every order |
| Period deltas (KPI ↑/↓) | needs previous-period totals | `useProfitAnalytics` already fetches the prior range |
| Monthly targets | **synthetic** (`revenue × 1.25`) | a real targets/goals endpoint (`/stats/targets`) |
| Profit / cost / margin | exact only when products have `cost_price`; otherwise **estimated** via category average margin (banner shown) | populate `cost_price` on products |

### Other fields worth adding to the API for the redesign
- `GET /stats/dashboard` returning pre-aggregated revenue/cost/profit/units per day
  would remove the heavy client-side product pagination (the ~10 s load).
- Order payload: `staff_id` + `staff_name` (for the staff leaderboard — currently read
  from `order._p.staff`, empty when orders have no assigned staff).
- Customer payload: `registered_at`, `last_seen_at`, `language` for the customers page
  and the "new customers" tile.

---

## 4. Not ported (intentionally deferred)

- **Trilingual i18n (UZ/EN/RU).** The design prototype is trilingual; the production app
  is Uzbek-only with hard-coded strings across 24 pages. Full i18n is a separate,
  large task and was **not** implemented — only the Uzbek UI is styled to the design.
- **Per-element accent recolouring.** A few pages still pass semantic hex colours
  (revenue=indigo, cost=amber) to KPI icons/sparklines instead of the single accent.
  These are harmonised via tokens but not forced to one accent like the prototype.

---

## 5. Verified

- `npm run build` passes clean.
- API login confirmed (`POST /admin-api/auth-login`).
- Dashboard loads real data (KPIs 51K / 1.1M / 22 / 2.3K / 180K UZS) and all new
  widgets render.
- **Scrolling** works on every page (the `.page-scroll` container is the single
  viewport-height scroller; `v-main` is a fixed-height flex column).
- Theme/accent/style switching works and persists.
