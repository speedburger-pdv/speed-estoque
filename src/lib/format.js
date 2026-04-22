export function formatCurrency(value = 0) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatUnit(unit = '') {
  const map = {
    un: 'un',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'mL',
    fatia: 'fatia',
    pacote: 'pacote',
    caixa: 'caixa',
  }
  return map[unit] || unit || 'un'
}

export function toWhatsappLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return '#'
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
