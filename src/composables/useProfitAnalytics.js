import { ref } from 'vue'
import { ordersApi, productsApi } from '@/api'

// ──────────────────────────────────────────────────────────────────────────
//  Profit analytics engine
//
//  The old dashboard trusted opaque /stats/* shapes that nobody could verify,
//  which is why its numbers were wrong. This engine instead DERIVES every
//  figure from source data the admin can audit:
//
//    • the live product catalog   → price (sotuv narxi) + cost_price (tannarx)
//    • the live orders in range   → line items actually sold
//
//  For each sold line we compute  revenue = sell × qty,  cost = tannarx × qty,
//  profit = revenue − cost. When a line has no resolvable cost we fall back to
//  the catalogue-wide cost ratio and FLAG the order as "estimated" so the UI
//  can be honest about coverage. Nothing is hidden, nothing is guessed
//  silently — that is the "calculate it, then check it" the dashboard needs.
// ──────────────────────────────────────────────────────────────────────────

const PAGE = 100          // server page size while sweeping
const MAX_PAGES = 200     // hard safety cap (≈20k rows) so a bad range can't hang

const num = v => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function unwrap(data) {
  const d = data?.data ?? data
  const items = d?.items ?? (Array.isArray(d) ? d : [])
  const total = num(d?.total) || items.length
  return { items, total }
}

async function sweep(apiFn, params) {
  const all = []
  let page = 1
  let total = Infinity
  while (all.length < total && page <= MAX_PAGES) {
    const { data } = await apiFn({ ...params, per_page: PAGE, page })
    const { items, total: t } = unwrap(data)
    total = t
    all.push(...items)
    if (!items.length) break
    page++
  }
  return all
}

// Build productId → { sell, cost, name, category } and a catalogue cost ratio.
function indexProducts(products) {
  const map = new Map()
  let costSum = 0
  let sellSum = 0
  for (const p of products) {
    const sell = num(p.price)
    const cost = num(p.cost_price)
    map.set(p.id, {
      id: p.id,
      name: p.name || p.name_uz || p.name_ru || `#${p.id}`,
      sell,
      cost,
      categoryId: p.category_id ?? p.category?.id ?? null,
      categoryName: p.category?.name || p.category_name || null,
      unit: p.unit || null,
    })
  }
  for (const p of map.values()) {
    if (p.sell > 0 && p.cost > 0) { costSum += p.cost; sellSum += p.sell }
  }
  const ratio = sellSum > 0 ? costSum / sellSum : null   // tannarx / sotuv
  return { map, ratio }
}

// Resolve the staff member an order's earnings are attributed to. In this
// delivery business the courier who fulfils the order is the closest proxy
// for "who made this sale"; we fall back to any explicit creator field.
function resolveStaff(order) {
  const c = order.courier || order.assigned_courier || order.created_by_user || order.staff
  const id = order.courier_id ?? order.assigned_courier_id ?? order.created_by ?? c?.id ?? null
  let name = null
  if (c && typeof c === 'object') {
    name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || c.name || null
  }
  if (!name && typeof c === 'string') name = c
  if (id == null && !name) return { id: null, name: null }
  return { id: id ?? name, name: name || `#${id}` }
}

// Per-order revenue / cost / profit from its line items (or an estimate).
function computeOrder(order, map, ratio) {
  const lines = Array.isArray(order.items) ? order.items : []
  let revenue = 0
  let cost = 0
  let units = 0
  let estimated = false
  const breakdown = []

  if (lines.length) {
    for (const it of lines) {
      const qty = num(it.quantity ?? it.qty) || 1
      const unitPrice = num(it.unit_price ?? it.price)
      const lineRevenue = num(it.total ?? it.total_price) || unitPrice * qty
      const prod = map.get(it.product_id ?? it.product?.id)
      const directCost = num(it.cost_price ?? it.unit_cost ?? prod?.cost)

      let lineCost
      if (directCost > 0) {
        lineCost = directCost * qty
      } else if (ratio != null) {
        lineCost = lineRevenue * ratio
        estimated = true
      } else {
        lineCost = 0
        estimated = true
      }

      revenue += lineRevenue
      cost += lineCost
      units += qty
      breakdown.push({
        productId: it.product_id ?? it.product?.id ?? null,
        name: it.product_name || it.name_uz || prod?.name || 'Mahsulot',
        categoryId: prod?.categoryId ?? null,
        categoryName: prod?.categoryName ?? null,
        qty,
        revenue: lineRevenue,
        cost: lineCost,
        profit: lineRevenue - lineCost,
      })
    }
  } else {
    // No line items exposed on the list row — estimate from the order subtotal.
    revenue = num(order.subtotal ?? order.total ?? order.total_price)
    if (ratio != null) { cost = revenue * ratio } else { cost = 0 }
    estimated = true
  }

  const profit = revenue - cost
  return {
    revenue,
    cost,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    units,
    estimated,
    breakdown,
    staff: resolveStaff(order),
  }
}

export function useProfitAnalytics() {
  const loading = ref(false)
  const error = ref(null)
  const orders = ref([])          // current range, each enriched with `_p`
  const prevTotals = ref({ revenue: 0, profit: 0, orders: 0 })
  const ratio = ref(null)         // catalogue cost ratio actually used
  const coverage = ref({ exact: 0, estimated: 0, items: 0 })

  function priorRange({ date_from, date_to }) {
    if (!date_from || !date_to) return null
    const from = new Date(date_from)
    const to = new Date(date_to)
    const span = Math.max(1, Math.round((to - from) / 86400000) + 1)
    const pTo = new Date(from); pTo.setDate(pTo.getDate() - 1)
    const pFrom = new Date(pTo); pFrom.setDate(pFrom.getDate() - (span - 1))
    const iso = d => d.toISOString().slice(0, 10)
    return { date_from: iso(pFrom), date_to: iso(pTo) }
  }

  async function load(range) {
    loading.value = true
    error.value = null
    try {
      const products = await sweep(productsApi.list, {})
      const { map, ratio: r } = indexProducts(products)
      ratio.value = r

      const prev = priorRange(range)
      const [curRaw, prevRaw] = await Promise.all([
        sweep(ordersApi.list, { ...range, order_by: '-created_at' }),
        prev ? sweep(ordersApi.list, prev) : Promise.resolve([]),
      ])

      let exact = 0, estimated = 0, items = 0
      orders.value = curRaw.map(o => {
        const _p = computeOrder(o, map, r)
        if (_p.estimated) estimated++; else exact++
        items += _p.units
        // Flat fields so v-data-table can sort by them (it sorts on the key path,
        // not on a header value getter, so nested `_p.*` would not sort).
        return {
          ...o, _p,
          revenue: _p.revenue, cost: _p.cost, profit: _p.profit,
          margin: _p.margin, staff_name: _p.staff.name || '',
        }
      })
      coverage.value = { exact, estimated, items }

      const pt = { revenue: 0, profit: 0, orders: prevRaw.length }
      for (const o of prevRaw) {
        const c = computeOrder(o, map, r)
        pt.revenue += c.revenue
        pt.profit += c.profit
      }
      prevTotals.value = pt
    } catch (e) {
      error.value = e
      orders.value = []
      prevTotals.value = { revenue: 0, profit: 0, orders: 0 }
    } finally {
      loading.value = false
    }
  }

  return { loading, error, orders, prevTotals, ratio, coverage, load }
}
