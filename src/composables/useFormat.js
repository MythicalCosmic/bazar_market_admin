export const ORDER_STATUS = {
  pending:    { label: 'Kutilmoqda',     icon: 'mdi-clock-outline',         color: 'warning' },
  confirmed:  { label: 'Tasdiqlandi',    icon: 'mdi-check-circle-outline',  color: 'info' },
  preparing:  { label: 'Tayyorlanmoqda', icon: 'mdi-chef-hat',              color: 'info' },
  delivering: { label: 'Yetkazilmoqda',  icon: 'mdi-moped-outline',         color: 'purple' },
  delivered:  { label: 'Yetkazildi',     icon: 'mdi-package-check',         color: 'success' },
  completed:  { label: 'Yakunlandi',     icon: 'mdi-check-all',             color: 'success' },
  cancelled:  { label: 'Bekor qilindi',  icon: 'mdi-close-circle-outline',  color: 'error' },
}

export const PAYMENT_STATUS = {
  unpaid:    { label: "To'lanmagan", color: 'error',   icon: 'mdi-credit-card-off-outline' },
  pending:   { label: 'Kutilmoqda',  color: 'warning', icon: 'mdi-clock-outline' },
  paid:      { label: "To'langan",   color: 'success', icon: 'mdi-credit-card-check-outline' },
  refunded:  { label: 'Qaytarildi',  color: 'info',    icon: 'mdi-undo-variant' },
  processing:{ label: 'Jarayonda',   color: 'warning', icon: 'mdi-progress-helper' },
  completed: { label: 'Tugatildi',   color: 'success', icon: 'mdi-check-circle-outline' },
  failed:    { label: 'Xato',        color: 'error',   icon: 'mdi-alert-circle-outline' },
}

export const MODERATION_STATUS = {
  pending:  { label: 'Tekshirilmoqda', color: 'warning', icon: 'mdi-clock-outline' },
  approved: { label: 'Tasdiqlandi',    color: 'success', icon: 'mdi-check-circle-outline' },
  rejected: { label: 'Rad etildi',     color: 'error',   icon: 'mdi-close-circle-outline' },
}

export const ROLE_LABELS = {
  admin: 'Admin', superadmin: 'Superadmin', manager: 'Menejer',
  courier: 'Kuryer', client: 'Mijoz',
}
export const ROLE_COLORS = {
  admin: 'error', superadmin: 'error', manager: 'primary',
  courier: 'info', client: 'secondary',
}

export function useFormat() {
  function price(val, currency = 'UZS') {
    if (val === null || val === undefined || val === '') return '—'
    const n = Number(val)
    if (Number.isNaN(n)) return '—'
    return n.toLocaleString('ru-RU') + ' ' + currency
  }

  function compact(val) {
    if (val === null || val === undefined || val === '') return '—'
    const n = Number(val)
    if (Number.isNaN(n)) return '—'
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1).replace('.0', '') + 'K'
    return n.toLocaleString('ru-RU')
  }

  function date(val) {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function datetime(val) {
    if (!val) return '—'
    return new Date(val).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function relativeTime(val) {
    if (!val) return '—'
    const ms = new Date(val).getTime() - Date.now()
    const abs = Math.abs(ms)
    const sec = abs / 1000
    if (sec < 60) return ms < 0 ? 'hozirgina' : 'hozir'
    const min = sec / 60
    if (min < 60) return Math.round(min) + ' min ' + (ms < 0 ? 'oldin' : 'keyin')
    const hr = min / 60
    if (hr < 24) return Math.round(hr) + ' soat ' + (ms < 0 ? 'oldin' : 'keyin')
    const d = hr / 24
    if (d < 30) return Math.round(d) + ' kun ' + (ms < 0 ? 'oldin' : 'keyin')
    return date(val)
  }

  function initials(first, last) {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
  }

  function cleanParams(p) {
    return Object.fromEntries(
      Object.entries(p).filter(([, v]) => v !== null && v !== '' && v !== undefined)
    )
  }

  function fullName(u) {
    if (!u) return '—'
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || '—'
  }

  function isoDateOnly(val) {
    if (!val) return ''
    return String(val).split('T')[0]
  }

  return { price, compact, date, datetime, relativeTime, initials, cleanParams, fullName, isoDateOnly }
}
