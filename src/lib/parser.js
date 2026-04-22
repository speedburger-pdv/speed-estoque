import * as XLSX from 'xlsx'
import { normalizeText } from './format'

const NAME_KEYS = ['produto', 'item', 'nome', 'descricao', 'description', 'produto nome']
const QTY_KEYS = ['quantidade', 'qtd', 'qty', 'itens', 'item qty']
const TOTAL_KEYS = ['total', 'valor', 'valor total', 'subtotal', 'line total', 'preco', 'valor pago']
const UNIT_KEYS = ['unitario', 'valor unitario', 'preco unitario']

function findKey(row, acceptedKeys) {
  const entries = Object.keys(row || {})
  return entries.find((key) => acceptedKeys.includes(normalizeText(key)))
}

function toNumber(value) {
  if (typeof value === 'number') return value
  const text = String(value ?? '').trim()
  if (!text) return 0
  const normalized = text
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  return Number(normalized || 0)
}

function mapRows(rows, source, fileName) {
  const mapped = []

  for (const row of rows) {
    const nameKey = findKey(row, NAME_KEYS)
    if (!nameKey) continue
    const qtyKey = findKey(row, QTY_KEYS)
    const totalKey = findKey(row, TOTAL_KEYS)
    const unitKey = findKey(row, UNIT_KEYS)

    const productName = String(row[nameKey] ?? '').trim()
    if (!productName || productName.length < 2) continue

    const quantity = Math.max(1, Math.round(toNumber(row[qtyKey]) || 1))
    const lineTotal = toNumber(row[totalKey])
    const unitPrice = toNumber(row[unitKey]) || (quantity ? lineTotal / quantity : 0)

    mapped.push({
      id: crypto.randomUUID(),
      file_name: fileName,
      source,
      product_name: productName,
      normalized_name: normalizeText(productName),
      quantity,
      unit_price: Number(unitPrice.toFixed(2)),
      line_total: Number((lineTotal || unitPrice * quantity).toFixed(2)),
      raw: row,
    })
  }

  return mapped
}

function parseCsvText(text) {
  const workbook = XLSX.read(text, { type: 'string' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
}

export async function parseSalesFile(file, source) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const rows = workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(sheet, { defval: '' })
  })
  return mapRows(rows, source, file.name)
}

export function summarizeImport(items) {
  const summary = {
    items,
    orders: items.length,
    revenue: items.reduce((acc, item) => acc + Number(item.line_total || 0), 0),
    quantity: items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
  }
  summary.revenue = Number(summary.revenue.toFixed(2))
  return summary
}
