# Bazar Market — Admin Panel: Pages, Modals & Fields

This document is a structural inventory of the admin panel. It lists every page, every modal/dialog, and every field, filter, and action. No design, styling, or layout details are included.

---

## Overview

The app has **24 routed pages** plus **1 shared layout** (sidebar + topbar) that wraps all authenticated pages.

| # | Route | Page | Purpose |
|---|-------|------|---------|
| 1 | `/login` | Login | Admin authentication |
| 2 | `/dashboard` | Financial Dashboard | Real-time profit dashboard |
| 3 | `/orders` | Orders | Order list |
| 4 | `/orders/:id` | Order Detail | Single order management |
| 5 | `/courier` | Courier Mode | Mobile courier delivery interface |
| 6 | `/payments` | Payments | Payment transaction list |
| 7 | `/payments/:id` | Payment Detail | Single payment management |
| 8 | `/analytics` | Analytics | Sales & profit analysis |
| 9 | `/products` | Products | Product catalog |
| 10 | `/categories` | Categories | Category catalog |
| 11 | `/discounts` | Discounts | Discount management |
| 12 | `/coupons` | Coupons | Coupon codes |
| 13 | `/banners` | Banners | Promotional banners |
| 14 | `/referral-rewards` | Referral Rewards | Referral reward configuration |
| 15 | `/customers` | Customers | Customer list |
| 16 | `/customers/:id` | Customer Detail | Single customer profile |
| 17 | `/users` | Admins / Staff | Staff user management |
| 18 | `/roles` | Roles & Permissions | RBAC matrix |
| 19 | `/reviews` | Reviews | Review moderation |
| 20 | `/notifications` | Notifications | View / send notifications |
| 21 | `/delivery-zones` | Delivery Zones | Map-based delivery zones |
| 22 | `/settings` | Settings | App & system settings |
| 23 | `/profile` | Profile | Logged-in user profile |
| 24 | `/` | Redirect | Redirects to `/dashboard` |

**Modal count summary:** Pages containing true modal dialogs: Order Detail, Courier Mode, Products, Categories, Users, Roles, Discounts, Coupons, Banners, Referral Rewards, Reviews, Payment Detail, Delivery Zones, Settings.

---

## Shared Layout (Admin Layout)

Wraps all authenticated pages. Not a page itself.

**Sidebar navigation groups & items** (each item is permission-gated):
- (Top): Dashboard, Buyurtmalar (Orders), Kuryer rejimi (Courier), To'lovlar (Payments), Tahlil (Analytics)
- **Katalog:** Mahsulotlar (Products), Kategoriyalar (Categories), Chegirmalar (Discounts), Kuponlar (Coupons), Bannerlar (Banners), Referral
- **Foydalanuvchilar:** Mijozlar (Customers), Adminlar (Admins), Rollar (Roles)
- **Aloqa:** Sharhlar (Reviews), Bildirishnomalar (Notifications)
- **Tizim:** Yetkazib berish (Delivery zones), Sozlamalar (Settings)

**Topbar controls:**
- Breadcrumbs
- Search button ("Qidirish", ⌘K) → opens command palette
- Theme toggle (light / dark)
- Notifications bell → links to `/orders?status=pending`
- User avatar

**User menu (sidebar footer):** Profil, Chiqish (Logout), Barcha qurilmalardan (Logout all devices)

---

## 1. Login (`/login`)

**Purpose:** Admin authentication screen.

**Fields:**
- Login (username) — text, required, autofocus
- Parol (password) — password with show/hide toggle, required

**Actions:**
- Kirish (Login) — submit
- Show/hide password toggle

**Other:** Conditional error message block; footer copyright.

**Modals:** None.

---

## 2. Financial Dashboard (`/dashboard`)

**Purpose:** Real-time financial dashboard with computed net profit over a date range.

**KPI tiles:**
- Sof foyda (Net profit) — with delta + sparkline; sub: margin %
- Sotuv / tushum (Revenue) — delta + sparkline; sub: cost
- Buyurtmalar (Orders count) — delta + sparkline; sub: units sold
- O'rtacha foyda (Avg profit) — sub: avg order
- To'langan tushum (Paid revenue) — sub: % covered
- (Deltas shown only when no filters active)

**Charts / widgets:**
- Trend (LineChart): Sotuv / sof foyda dynamics (series toggle Sotuv/Tannarx/Foyda)
- Foyda sifati (Profit quality): RadialChart + rows (Sotuv, Tannarx, Sof foyda, To'langan tushum)
- Eng foydali mahsulotlar (Top products, top 8): rank, name, profit bar, profit, margin %, qty
- Kategoriya bo'yicha foyda (By category, top 7): name, revenue bar, profit, margin %
- To'lov usullari (Payment methods): DonutChart by revenue
- Buyurtma holatlari (Order statuses): DonutChart by count
- Xodimlar reytingi (Staff leaderboard, top 6): avatar, name, orders, margin %, revenue, profit
- Data-quality banner (conditional)

**Orders table — "Buyurtmalar — foyda tahlili" columns:**
- Raqam (order_number, links to `/orders/:id`)
- Mijoz (customer name + phone)
- Sana (created_at)
- Holat (status chip)
- To'lov (payment method + payment status chip)
- Sotuv (revenue)
- Tannarx (cost)
- Foyda (profit)
- Marja (margin % + estimated icon)
- Xodim (staff name)

**Filters / controls:**
- Date preset toggle: Bugun, 7 kun, 30 kun, 90 kun
- Custom date range menu: Dan (date), Gacha (date), Tozalash, Qo'llash
- Refresh icon button
- Table search box: "Raqam, mijoz, telefon…"
- Holat (status select, clearable)
- To'lov (payment select, clearable)
- Xodim (staff select, clearable — only if staff exist)
- Faqat to'langan (paid-only switch)
- Trend series toggle: Sotuv / Tannarx / Foyda
- Column-header sorting

**Actions:**
- CSV export button
- Row link: order number → order detail

**Modals:** None.

---

## 3. Orders (`/orders`)

**Purpose:** Paginated, selectable order list with status tabs and bulk actions.

**Table columns:**
- Raqam (order_number, link to `/orders/:id`, shown as `#number`)
- Mijoz (customer name + phone)
- Holat (status chip)
- To'lov (payment status chip)
- Summa (total, formatted)
- Sana (created_at, relative)
- Actions (row action)
- Selection checkbox column

**Filters / search / tabs:**
- Search box: "Raqam, telefon, mijoz…"
- To'lov turi (payment_method select, clearable): Naqd (cash), Click, Payme
- To'lov holati (payment_status select, clearable): To'lanmagan (unpaid), Kutilmoqda (pending), To'langan (paid), Qaytarildi (refunded)
- Dan (date), Gacha (date)
- Status tabs (chips with live counts): "Barchasi" + one per order status
- Fixed sort: `-created_at`
- Pagination (default 20/page)

**Actions:**
- Yangilash (Refresh) — header
- Bulk bar (when rows selected): Tasdiqlash (bulk confirm), Yakunlash (bulk complete), Bekor (clear selection)
- Row: eye icon → order detail

**Modals:** None.

---

## 4. Order Detail (`/orders/:id`)

**Purpose:** Single-order detail: items, status & payment management, admin note, timeline, payments/refunds, customer info, courier assignment.

**Header:** title `#order_number`, created_at, order status chip, payment status chip.

**Tabs:** Tarkib (items), Tarix (timeline), To'lovlar (payments, with count).

**Items tab (per item):** image, product name, quantity + unit + unit price, line total.
**Order summary:** Mahsulotlar (subtotal), Yetkazib berish (delivery_fee), Chegirma (discount), Jami (total).

**Timeline tab (per log):** from_status chip, to_status chip, datetime, changed_by, note.

**Payments tab (per payment):** method icon, amount, status chip, method + datetime, refund button (only if completed).

**Customer card:** initials avatar, full name (link to `/customers/:id`), phone, address, payment_method, embedded read-only ZoneMap when coordinates exist.
**Courier card:** assigned courier (avatar, name, remove button) or "Tayinlanmagan".
**Customer note card:** shown if present.

**Inline controls (not modals):**
- Change status: one button per order status (current/cancelled disabled)
- Payment status: buttons for unpaid, pending, paid, refunded
- Admin izohi: textarea + "Izoh saqlash" button
- Courier assign: courier select (clearable) + "Tayinlash" button; remove (X) icon
- Payments tab: "Yangilash" button

**Header actions menu:** Chop etish (Print), Tasdiqlash + chop (Accept + Print), Bekor qilish (opens cancel dialog).

**Modals:**

1. **Cancel order dialog** — "Buyurtmani bekor qilish"
   - Field: reason (textarea), placeholder "Bekor qilish sababi…"
   - Buttons: Bekor qilish (confirm), dismiss

2. **Refund dialog** — "To'lovni qaytarish"
   - Field: reason (textarea), placeholder "Qaytarish sababi…"
   - Buttons: Qaytarish (confirm), dismiss

---

## 5. Courier Mode (`/courier`)

**Purpose:** Mobile courier interface — full-screen map with draggable bottom sheet listing orders or showing a selected order's detail and delivery-flow actions. Auto-polls every 30s.

**List fields (per order row):**
- Status icon
- `#order_number`, status chip, payment status chip
- Address (or "Manzil yo'q")
- Price, distance from courier (if position known), relative time
- "is-mine" indicator when assigned

**Selected order panel:**
- Avatar, customer name, phone, total
- Address row
- Item count, payment method label, customer note (if present)
- Items expander (per item: quantity, name, unit price, line total)

**Tabs:** Mening (mine), Mavjud (available), Yakunlangan (done) — each with count badge.
**Sort:** fixed `-created_at`. No search box.

**Top floating card (when selected):** order number, status chips, close (X), call button (tel: link).

**Action buttons (conditional on status/assignment):**
- Olib ketishni boshlash (Claim)
- Yo'lga chiqdim (→ delivering)
- Yetkazildi (→ delivered)
- Yakunlash (→ completed)
- To'landi (mark paid)
- Bekor qilish (opens cancel dialog)
- Boshqa buyurtmalar (back)
- List: refresh icon, tab buttons, row → select order

**Modals:**

1. **Cancel dialog** — "Buyurtmani bekor qilish"
   - Field: cancelReason (textarea, autofocus), placeholder "Bekor qilish sababi…"
   - Buttons: Yopish, Bekor qilish

---

## 6. Payments (`/payments`)

**Purpose:** Payment transaction list with KPI stats; rows link to detail.

**KPI tiles:** Tushum (revenue), O'rtacha (avg_payment), Kutilmoqda (pending_amount), Qaytarilgan (refunded_amount)

**Table columns:**
- Buyurtma (order, link to `/orders/:id`)
- Mijoz (customer name + phone)
- Usul (method chip)
- Summa (amount)
- Holat (status chip)
- Sana (created_at, relative)
- Actions (eye/view icon → `/payments/:id`)

**Filters:**
- Search box: "Buyurtma raqami, mijoz…"
- Holat (status select, clearable): Kutilmoqda, Jarayonda, Tugatildi, Xato, Qaytarildi
- Usul (method select, clearable): Naqd, Click, Payme
- Dan (date), Gacha (date)
- Fixed sort `-created_at`; pagination

**Actions:** Row view icon → payment detail.

**Modals:** None.

---

## 7. Payment Detail (`/payments/:id`)

**Purpose:** Single payment details, status transitions, and refund.

**Fields displayed:**
- Status chip (header)
- Summa (amount)
- Usul (method)
- UUID
- Yaratildi (created_at)
- To'landi (paid_at)
- Order card (if present): order number → `/orders/:id`; customer avatar, name, phone

**Actions:**
- Qaytarish (Refund) — header, only when status = completed
- Holatni o'zgartirish (Change status) buttons, dynamic by current status:
  - pending → processing, completed, failed
  - processing → completed, failed
  - completed → refunded
  - failed / refunded → (none)

**Modals:**

1. **Refund dialog** — "To'lovni qaytarish"
   - Field: refundReason (textarea), placeholder "Qaytarish sababi…"
   - Buttons: Qaytarish (confirm), dismiss

---

## 8. Analytics (`/analytics`)

**Purpose:** Client-computed sales/profit analytics (revenue, COGS, net profit) over a date range, with charts and leaderboards.

**KPI cells:**
- Sotuv / tushum (revenue) — hint: order count
- Tannarx (COGS) — hint: % of revenue
- Sof foyda (Net profit) — hint: margin %
- O'rtacha buyurtma (Avg order) — hint: avg profit
- Sotilgan birlik (Units sold) — hint: units/order
- To'langan tushum (Paid revenue) — hint: % covered

**Charts:**
- Trend (LineChart): Sotuv / tannarx / sof foyda (series toggle)
- Hafta kunlari bo'yicha foyda (BarChart): profit by weekday
- Soatlar bo'yicha sotuv (BarChart): revenue by hour
- Kategoriya bo'yicha foyda (BarChart, top 10)
- To'lov usullari: per method — name, share bar, revenue, profit, share %

**Products table columns:** Mahsulot (name), Sotildi (qty), Sotuv (revenue), Tannarx (cost), Foyda (profit), Marja (margin %). Default sort profit desc.
**Staff table columns:** Xodim (name + avatar), Buyurtma (orders), Sotuv (revenue), Foyda (profit), O'rt. foyda (avg), Marja (margin %). Default sort profit desc.

**Filters / controls:**
- Date preset toggle: Bugun, 7 kun, 30 kun, 90 kun
- Custom date range menu: Dan, Gacha, Tozalash, Qo'llash
- Refresh icon
- Holat (status select, clearable)
- To'lov (payment select, clearable)
- Xodim (staff select, clearable — only if staff exist)
- Faqat to'langan (paid-only switch)
- Filtrlarni tozalash (reset chip)
- Trend series toggle: Sotuv / Tannarx / Foyda
- Product search box: "Mahsulot qidirish…"
- Column-header sorting

**Actions:** CSV export (products table).

**Modals:** None.

---

## 9. Products (`/products`)

**Purpose:** Product catalog as a card grid with KPI stats; create/edit/reorder/toggle/delete.

**KPI tiles:** Jami (total), Faol (active), Omborda (in stock), Kam qolgan (low stock), Ombor qiymati (inventory value), Chegirmada (discounted)

**Card fields:** primary image, discount badge, Featured badge, low-stock badge, status pill (Faol/Nofaol), category name, product name, SKU, discounted/regular price + original + discount chip + discount name, cost price (Tannarx), stock chip (qty + unit), margin progress bar. Footer: "Jami: N ta".

**Filters / search / sort:**
- Search box: "Mahsulot nomi…"
- Kategoriya (select, clearable)
- Holat (Faol / Nofaol, clearable)
- Omborda (Bor / Yo'q, clearable)
- Chegirma (Bor / Yo'q, clearable)
- Pagination; per-page select (12 / 24 / 48)
- Default sort `-created_at`

**Page actions:** Tartib (Reorder), Mahsulot qo'shish (Add product), empty-state create button.
**Card actions:** open edit (image/overlay), toggle Featured, edit (pencil), toggle Active (pause/play), delete (trash).

**Modals:**

**A. Create/Edit Product** — "Yangi mahsulot" / "Mahsulotni tahrirlash"
Edit mode has 4 tabs: Ma'lumot, Rasmlar (with count), Ombor, Chegirmalar.

*Info tab / form fields:*
- Nomi (UZ) * — text (required)
- Nomi (RU) — text
- Kategoriya * — select (required)
- Birlik (Unit) * — select: kg / piece / liter / pack / bundle (required)
- Narxi (UZS) * — formatted numeric (required, > 0)
- Tannarx (Cost price) — formatted numeric
- SKU — text
- Shtrix-kod (Barcode) — text
- Min miqdor — number ("(g)" suffix when kg)
- Max miqdor — number (g suffix for kg)
- Qadam (Step) — number (g suffix for kg)
- Tavsif (UZ) — textarea
- *(Create mode only)* Ombor miqdori — number; Past chegara — number; Omborda bor — toggle
- Faol — toggle
- Featured — toggle
- *(Create mode only)* image upload + pending previews with remove

*Images tab (edit):* image upload; per image set-as-primary, delete, drag reorder, primary star badge.
*Stock tab (edit):* Ombor miqdori (number), Past chegara (number), Omborda bor (toggle), "Ombor saqlash" button.
*Discounts tab (edit):* list of discounts each with checkbox (name, value/type, date range); "Chegirma yaratish" empty-state link.

*Footer:* Yopish, Saqlash, header close (X).

**B. Reorder dialog** — "Tartibni o'zgartirish"
- Category filter select ("Barcha kategoriyalar" + list)
- Reorderable rows: position, image, name, price; move-up/move-down buttons; drag handle
- Footer: item count, Bekor, Tartibni saqlash, close (X)

**C. Confirm Delete** — "Mahsulotni o'chirish" → "'{name}' o'chirilsinmi?"

---

## 10. Categories (`/categories`)

**Purpose:** Root categories as a card grid with subcategory previews and KPI stats; create/edit, subcategory management, toggle, drag reorder, delete.

**KPI tiles:** Jami (total), Faol (active), Ota-kategoriyalar (root), Subkategoriyalar (subcategories)

**Card fields:** image, status chip (Faol/Nofaol), name, Russian name, products count ("N mahsulot"), subcategory count ("N sub"), first 4 child name chips + "+N" overflow.

**Filters / search / sort:** None on the page (drag-and-drop reorder only).

**Page actions:** Kategoriya qo'shish (Add category), empty-state create button.
**Card actions:** open edit, Sub (+) create child, toggle Active (pause/play), edit (pencil), delete (trash), click child chip → edit child, drag reorder.

**Modals:**

**A. Create/Edit Category** — "Yangi kategoriya" / (name in edit)
Edit mode has 2 tabs: Ma'lumot, Subkategoriyalar (with count).

*Info tab / form fields:*
- Nomi (UZ) * — text (required)
- Nomi (RU) — text
- Image upload (with preview + remove)
- Sort tartibi — number
- Ota-kategoriya (Parent) — select, clearable (shown when no parent; else shows parent name + remove X)
- Faol — toggle

*Subcategories tab (edit):*
- Add-subcategory text field "Yangi subkategoriya nomi…" + "Qo'shish" button
- Per subcategory row: avatar/image, name, ID, products count, status chip; actions: edit (pencil), toggle active (pause/play), delete (trash)

*Footer:* Yopish, Saqlash (info tab only), close (X).

**B. Confirm Delete** — "Kategoriyani o'chirish" → "'{name}' o'chirilsinmi?"

> Note: `_categoryRow.vue` is a recursive tree-row component (drag handle, expand/collapse, image, name, products/sub count, status chip; emits add-child / edit / toggle / del). It is **not currently used** by the Categories page (which uses a card grid).

---

## 11. Discounts (`/discounts`)

**Purpose:** List discounts (percent or fixed), KPI stats; create/edit/delete, activate/deactivate, assign to products and categories.

**KPI tiles:** Jami (total), Faol (active), Mahsulotlarda (with products), Kategoriyalarda (with categories)

**List fields (per row):** icon, name, value (`value%` or formatted price), date range (starts_at – expires_at), status chip (Faol/Nofaol).

**Filters:** "Faqat amal qiluvchi" switch (current-only). (Product search lives inside the dialog.)

**Page actions:** Chegirma yaratish (Create).
**Row actions:** toggle activate/deactivate, edit (pencil), delete (trash).

**Modals:**

**A. Create/Edit Discount** — "Yangi chegirma" / "Chegirmani tahrirlash"
Tabs: Ma'lumot, Mahsulotlar (edit only), Kategoriyalar (edit only).

*Info tab fields:*
- Nomi (UZ) * — text (required)
- Nomi (RU) — text
- Turi — select: Foiz (%) / Summa
- Miqdor * — number (required, > 0)
- Maksimal chegirma (foiz uchun) — number
- Boshlanish — date
- Tugash — date
- Faol — toggle

*Products tab (edit):* search "Mahsulot qidiring…"; product list with checkboxes (name + price); "{N} ta mahsulotni saqlash" button.
*Categories tab (edit):* category list with checkboxes; "{N} ta kategoriyani saqlash" button.

*Footer:* Yopish, Saqlash (info tab only), close (X).

**B. Confirm Delete** — "Chegirmani o'chirish" → "'{name}' o'chirilsinmi?"

---

## 12. Coupons (`/coupons`)

**Purpose:** Discount coupon codes with usage limits/tracking, KPI stats; create/edit/delete, activate/deactivate.

**KPI tiles:** Jami kuponlar (total), Faol (active), Ishlatilgan (total_uses), Chegirma summasi (total_discount_given)

**List fields (per row):** code, name, value (`value%` or price), min order, max discount, usage (`count/limit` or `count/∞`), expiry, usage progress bar, status chip.

**Filters:** "Faqat amal qiluvchi" switch (valid-only).

**Page actions:** Kupon yaratish (Create).
**Row actions:** toggle activate/deactivate, edit, delete.

**Modals:**

**A. Create/Edit Coupon** — "Yangi kupon" / "Kuponni tahrirlash"
*Fields:*
- Kupon kodi * — text (required)
- Turi — select: Foiz (%) / Summa
- Miqdor * — number (required, > 0)
- Min buyurtma — number
- Max chegirma — number
- Foydalanish limiti — number (placeholder ∞)
- Bir mijozga limit — number
- Boshlanish — date
- Tugash — date
- Faol — toggle

*Footer:* Bekor, Saqlash, close (X).

**B. Confirm Delete** — "Kuponni o'chirish" → "'{code}' o'chirilsinmi?"

---

## 13. Banners (`/banners`)

**Purpose:** Promotional banner cards with image/title/link/date range, KPI stats; create/edit/delete, activate/deactivate.

**KPI tiles:** Jami (total), Faol (active), Hozir ko'rinmoqda (currently showing), Muddati tugagan (expired)

**Card fields:** image, status chip (Faol/Nofaol), "Muddati tugagan" chip (if expired), title (or "Sarlavhasiz"), link info (type icon + label), date range.

**Filters / search / sort:** None.

**Page actions:** Banner qo'shish (Add), empty-state create button.
**Card actions:** toggle activate/deactivate, edit, delete.

**Modals:**

**A. Create/Edit Banner** — "Yangi banner" / "Bannerni tahrirlash"
*Fields:*
- Image upload (with preview)
- Sarlavha — text
- Havola turi — select: Yo'q / Kategoriya / Mahsulot / URL
- Havola qiymati — text (disabled when type = Yo'q)
- Boshlanish — date
- Tugash — date
- Sort tartibi — number
- Faol — toggle

*Footer:* Bekor, Saqlash, close (X).

**B. Confirm Delete** — "Bannerni o'chirish" → "'{title|id}' o'chirilsinmi?"

---

## 14. Referral Rewards (`/referral-rewards`)

**Purpose:** Referral reward configurations of three types (coupon / free delivery / bonus product). Only one reward may be active at a time.

**Active reward highlight card:** type icon, name, "Faol" chip, type label + reward summary, "Nofaollashtirish" (deactivate) button.
**List rows:** type icon, name, "Faol" chip (if active), type label · reward summary · created date.
**Reward summary by type:** coupon → `{value}% chegirma` or price; free_delivery → `{count} marta bepul`; bonus_product → `{quantity}x {product_name}`.

**Filters / search / sort:** None.

**Page actions:** Mukofot yaratish (Create).
**Row actions:** activate/deactivate, edit, delete.

**Modals:**

**A. Create/Edit Reward** — "Yangi mukofot" / "Tahrirlash"
*Always shown:*
- Nomi * — text (required)
- Turi * — select (required): Kupon (chegirma) / Bepul yetkazish / Bonus mahsulot
- Faol — toggle

*When Turi = Kupon:*
- Kupon turi — select: Foiz (%) / Summa
- Miqdor * — number (required, > 0)
- Max chegirma — number
- Min buyurtma — number
- Amal qilish muddati (kun) — number

*When Turi = Bepul yetkazish:*
- Bepul yetkazish soni * — number (required, > 0)

*When Turi = Bonus mahsulot:*
- Mahsulot * — select (required)
- Miqdor * — number, step 0.1 (required, > 0)

*Footer:* Bekor, Saqlash, close (X).

**B. Confirm Delete** — "Mukofotni o'chirish" → "'{name}' o'chirilsinmi?"

---

## 15. Customers (`/customers`)

**Purpose:** Registered customers as a paginated card grid with KPI stats; cards link to detail.

**KPI tiles:** Jami mijozlar (total), Yangi (new), Telegram (count), Faollik (activity %)

**Card fields:** avatar (initials), full name, Telegram icon (if telegram_id), phone, status chip (Faol/Blok), Oxirgi (last seen), Ro'yxatdan (registration date), Til (language, if present), ID, "Batafsil" indicator.

**Filters / sort:**
- Search box: "Ism, telefon, telegram…"
- Holat (Faol / Bloklangan, clearable)
- Tartiblash (sort): Yangi→eski, Eski→yangi, Ism A→Z, Ism Z→A, Oxirgi faol
- Pagination; per-page (12 / 24 / 48)

**Actions:** Card click → customer detail.

**Modals:** None.

---

## 16. Customer Detail (`/customers/:id`)

**Purpose:** Single customer's profile, computed order analytics, and tabbed lists.

**Profile hero:** initials avatar, full name, ID, status chip; quick stats — Buyurtma (total orders), Sarflagan (total spent), Sevimli (favorites count); contact rows — Phone, Telegram ID, Language, registration date, last seen.

**Insights cards (when totalOrders > 0):**
- Frequency label + sub, O'rtacha buyurtma (avg order), Chegirma (uses discounts Ha/Yo'q)
- Eng ko'p buyurtma (Top products): rank, name, count
- Buyurtma holatlari (Status breakdown): status chip + count
- To'lov usullari (Payment methods): method icon + name + %

**Tabs:** Buyurtmalar (Orders), Manzillar (Addresses), Sevimli (Favorites), Sharhlar (Reviews) — each with count.
- *Orders:* status icon, `#order_number`, status chip, payment status chip, created datetime, payment_method, total, discount (if > 0)
- *Addresses:* label, "Asosiy" (default) chip, address text; read-only ZoneMap if coords exist
- *Favorites:* product_name, product_id
- *Reviews:* linked `#order_number`, 5-star rating, relative time, comment

**Actions:**
- Back → `/customers`
- Bloklash (Block) — when active
- Faollashtirish (Activate) — when blocked
- Order card click → `/orders/:id`
- Review order link → `/orders/:id`

**Modals:** None.

---

## 17. Admins / Staff (`/users`)

**Purpose:** Manage staff users (admin/manager/courier) with KPI stats; create/edit (incl. per-user permission overrides) and delete.

**KPI tiles:** Jami xodimlar (total), Adminlar (admins), Menejerlar (managers), Kuryerlar (couriers)

**Table columns:** Foydalanuvchi (avatar, full name, @username), Rol (role chip), Oxirgi (last_seen_at), Holat (Faol/Nofaol), Sanasi (created_at), Actions.

**Filters:**
- Search box: "Ism, username, telefon…"
- Rol (Admin / Menejer / Kuryer, clearable)
- Holat (Faol / Nofaol, clearable)

**Page actions:** Foydalanuvchi qo'shish (Add user).
**Row actions:** edit (pencil), delete (trash).

**Modals:**

**A. Create/Edit dialog** — "Yangi foydalanuvchi" / "Tahrirlash"
Two tabs: Ma'lumot, Ruxsatlar (disabled unless editing existing user).

*Info tab fields:*
- Ism * — text (required)
- Familiya * — text (required)
- Username * — text (required)
- Telefon — text
- Telegram ID — number
- Rol * — select: Admin / Menejer / Kuryer (required)
- Til — select: uz / ru
- Parol * — password (required, create mode only)
- Yangi parol — password (edit mode only, optional)
- Faol — toggle

*Permissions tab (edit only):*
- Role info line (read-only)
- List of permission overrides: grant/deny icon, codename, "Qo'shilgan"/"Olib tashlangan", remove-override button
- Ruxsat kodi — text field (newPerm)
- Qo'shish (Grant) button
- Olib tashlash (Deny) button

*Footer:* Yopish, Saqlash (info tab only), close (X).

**B. Confirm Delete** — "Foydalanuvchini o'chirish" → "'@{username}' o'chirilsinmi?"

---

## 18. Roles & Permissions (`/roles`)

**Purpose:** RBAC matrix — assign permissions to each role.

**Left role list (per role):** icon, label, "{count} ruxsat" subtitle. Roles: admin, manager, courier, client.
**Right matrix:** selected role label + "{selected} ruxsat tanlangan / {total}"; permissions grouped by group label; per group a toggle-all button; per permission a checkbox, codename, human-readable name.

**Filters / search / sort:** None (role selector is the primary control; permissions sorted by codename).

**Actions:**
- Select role (left list click)
- Sync button
- Standartga qaytarish (Reset to default) — opens reset dialog (disabled for admin)
- Saqlash (Save) — disabled for admin
- Toggle-all per group — disabled for admin
- Toggle individual permission — disabled for admin

> The admin role is locked; all editing controls are disabled with an inline warning.

**Modals:**

1. **Reset confirm** — "Standartga qaytarish" → "'{role}' rolining ruxsatlari boshlang'ich qiymatlarga qaytariladi." Confirm label "Qaytarish".

---

## 19. Reviews (`/reviews`)

**Purpose:** Customer review moderation cards (approve/reject), admin replies, bulk moderation, deletion; KPI stats.

**KPI tiles:** Jami (total), O'rtacha (average_rating), Kutilmoqda (pending), Tasdiqlangan (approved)

**Card fields (per review):** selection checkbox, user avatar (initials), full name, star rating (1–5), moderation status chip, linked order number (`#number` → `/orders/:id`), relative time, comment text, admin reply block (if present). Footer total + pagination.

**Filters / search / sort:**
- Search box: "Sharh, mijoz, raqam…"
- Holat (moderation status): Kutilmoqda / Tasdiqlangan / Rad etilgan (clearable)
- Reyting (rating): 1–5 (clearable)
- Fixed sort `-created_at`; pagination (20/page)

**Actions:**
- Inline reply editor: "Javob…" textarea, Yuborish (send), Bekor (cancel)
- Row buttons (when not replying): Tasdiqlash (Approve, if not approved), Rad etish (Reject, if not rejected), Javob berish (Reply), delete icon
- Bulk bar (≥1 selected): Tasdiqlash (bulk approve), Rad etish (bulk reject), Bekor (clear selection)
- Per-row selection checkbox

**Modals:**

1. **Confirm Delete** — "Sharhni o'chirish" → "Bu amalni qaytarib bo'lmaydi"

---

## 20. Notifications (`/notifications`)

**Purpose:** Two tabs — view sent notifications (list/filter/delete) and compose/send a new notification.

**Tabs:** Yuborilganlar (Sent), Yangi yuborish (New).

**Sent tab list fields (per notification):** channel-icon avatar, title, type chip (Buyurtma/Promo/Tizim), channel chip, "O'qildi" indicator (if read), body text, user name, relative time. Footer total + pagination.

**Sent tab filters:**
- Search box: "Sarlavha, mijoz…"
- Turi (type): Buyurtma / Promo / Tizim (clearable)
- Kanal (channel): Telegram / SMS / Push (clearable)
- Fixed sort `-sent_at`; pagination (20/page)

**New tab form fields:**
- Sarlavha (Title) * — text (required)
- Matn (Body) * — textarea (required)
- Turi (Type) — select: Buyurtma / Promo / Tizim (default Promo)
- Kanal (Channel) — select: Telegram / SMS / Push (default Telegram)
- Kim uchun (Audience) — select: Barcha faol mijozlar / Rol bo'yicha / Aniq mijozlar (default All)
- Rol (Role) — select: client / manager / courier (only when audience = Rol)
- User ID lar (vergul bilan) — text, comma-separated, placeholder "7, 8, 9" (only when audience = Aniq)
- Yuborish (Send) button

**Actions:** Row (Sent tab) delete icon (no confirm); New tab Yuborish (Send).

**Modals:** None. (Delete is direct; the composer is an inline tab form.)

---

## 21. Delivery Zones (`/delivery-zones`)

**Purpose:** Manage delivery zones drawn as polygons on a map.

**Zone list (per item):** name, delivery_fee, estimated_minutes, status chip (Faol/Nofaol).
**Selected zone detail card:** name, Narx (delivery_fee), Min buyurtma (min_order), Vaqt (~estimated_minutes).
**Map panel:** ZoneMap rendering all zones, with draw/edit/select.

**Filters / search / sort:** None.

**Page actions:** Yangi zona chizish (Draw new zone) — starts polygon drawing.
**Row / selected-zone actions:** click to select, toggle active/inactive, edit (pencil), delete (trash); map draw opens form; map edit saves geometry.

**Modals:**

**A. Form dialog** — "Yangi zona" / "Zonani tahrirlash"
*Fields:*
- Nomi * — text (required)
- Yetkazib berish narxi * — number (required, ≥ 0)
- Min buyurtma — number
- Tahminiy daqiqa (estimated_minutes) — number
- Sort tartibi — number
- Faol — toggle
- Polygon status indicator (informational — point count / not-drawn warning)

*Buttons:* Bekor (clears pending polygon), Saqlash (disabled unless polygon exists), close (X).

**B. Confirm Delete** — "Zonani o'chirish" → "'{name}' o'chirilsinmi?"

---

## 22. Settings (`/settings`)

**Purpose:** Manage appearance, storefront minimum order amount, and arbitrary system key/value settings (grouped by key prefix).

**Sections / fields:**
- **Ko'rinish (Appearance):** Mavzu (Theme) toggle — Yorug' (light) / Qorong'u (dark); Effektlarni kamaytirish (Reduce effects / lite mode) toggle
- **Minimal buyurtma summasi:** minOrder — number (suffix UZS) + "Saqlash" button
- **Tizim sozlamalari (System settings):** settings grouped by prefix. Each row: key (monospace), optional description, value control by type (bool→switch, json→textarea, int→number, else→text), type chip; delete (trash) button

**Filters / search / sort:** None.

**Page actions:** Yangi sozlama (New setting); theme toggle; lite toggle; save min order; per-setting inline edit (on blur/toggle); per-setting delete.

**Modals:**

**A. New Setting dialog** — "Yangi sozlama"
*Fields:*
- Kalit (Key) * — text (required, monospace)
- Turi (Type) — select: string / int / bool / json
- Qiymat (Value) * — text (when type ≠ bool)
- Qiymat — toggle (when type = bool)
- Tavsif (Description) — text

*Buttons:* Bekor, Saqlash, close (X).

---

## 23. Profile (`/profile`)

**Purpose:** Display the logged-in user's profile, change password, manage sessions.

**Profile card:** avatar (initials), full name, @username, role chip, phone, language (default uz), session expiry (if present).

**Change password form (inline, no modal):**
- Yangi parol (New password) — password (required, min 6)
- Yangi parolni qayta kiriting (Confirm password) — password (must match)
- Parolni saqlash button

**Actions:** Parolni saqlash (Save password), Chiqish (Logout), Barcha qurilmalardan chiqish (Logout all devices).

**Modals:** None.

---

## Cross-Page Notes

- **Login, Dashboard, Orders, Payments, Analytics, Customers, Customer Detail, Banners, Referral Rewards, Profile** have no modal dialogs (Banners/Referral have create/edit + confirm dialogs; Login/Dashboard/Analytics/Customers/Customer Detail/Profile have none).
- **Dashboard** and **Analytics** share the same date-control pattern (preset toggle + custom range menu + refresh), client-side filters (status / payment / staff / paid-only), and CSV export.
- Most list/catalog pages share a common pattern: a header "create" button, a `BzConfirmDialog` for deletion, per-row activate/deactivate + edit + delete actions, and a Faol/Nofaol active-state model.
