export const ORDER_STATUS = {
  pending:    { label: 'Kutilmoqda',    icon: 'mdi-clock-outline',         color: 'warning' },
  confirmed:  { label: 'Tasdiqlandi',   icon: 'mdi-check-circle-outline',  color: 'info' },
  preparing:  { label: 'Tayyorlanmoqda',icon: 'mdi-chef-hat',              color: 'info' },
  delivering: { label: 'Yetkazilmoqda', icon: 'mdi-moped-outline',         color: 'purple' },
  delivered:  { label: 'Yetkazildi',    icon: 'mdi-package-check',         color: 'success' },
  completed:  { label: 'Yakunlandi',    icon: 'mdi-check-all',             color: 'success' },
  cancelled:  { label: 'Bekor qilindi', icon: 'mdi-close-circle-outline',  color: 'error' },
}

export const PAYMENT_STATUS = {
  unpaid:   { label: "To'lanmagan", color: 'error' },
  pending:  { label: 'Kutilmoqda',  color: 'warning' },
  paid:     { label: "To'langan",   color: 'success' },
  refunded: { label: 'Qaytarildi',  color: 'info' },
}

export function useFormat() {
  function price(val) {
    if (!val && val !== 0) return '—'
    return Number(val).toLocaleString('ru-RU') + ' UZS'
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

  function initials(first, last) {
    return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
  }

  function cleanParams(p) {
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && v !== '' && v !== undefined))
  }

  return { price, date, datetime, initials, cleanParams }
}
