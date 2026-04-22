import { useMemo, useState } from 'react'
import { useStore } from '../App'
import { parseSalesFile, summarizeImport } from '../lib/parser'
import { formatCurrency } from '../lib/format'

function DraftPanel({ title, draft, onFileChange }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} />
      {draft && (
        <div className="compact-summary">
          <strong>{draft.fileName}</strong>
          <span>Linhas detectadas: {draft.summary.orders}</span>
          <span>Quantidade total: {draft.summary.quantity}</span>
          <span>Faturamento: {formatCurrency(draft.summary.revenue)}</span>
        </div>
      )}
    </div>
  )
}

export default function ImportsPage() {
  const { addImportBatch, flash, imports } = useStore()
  const [drafts, setDrafts] = useState({ Goomer: null, Ceofood: null })
  const [busy, setBusy] = useState(false)

  async function handleFile(source, file) {
    if (!file) return
    const items = await parseSalesFile(file, source)
    const summary = summarizeImport(items)
    setDrafts((prev) => ({ ...prev, [source]: { fileName: file.name, items, summary } }))
  }

  const combined = useMemo(() => {
    const list = Object.values(drafts).filter(Boolean)
    const revenue = list.reduce((acc, item) => acc + item.summary.revenue, 0)
    const orders = list.reduce((acc, item) => acc + item.summary.orders, 0)
    return { revenue, orders }
  }, [drafts])

  async function saveImports() {
    setBusy(true)
    try {
      for (const source of ['Goomer', 'Ceofood']) {
        const draft = drafts[source]
        if (!draft) continue
        await addImportBatch(
          {
            source,
            file_name: draft.fileName,
            revenue: draft.summary.revenue,
            orders: draft.summary.orders,
            imported_at: new Date().toISOString(),
          },
          draft.items,
        )
      }
      setDrafts({ Goomer: null, Ceofood: null })
      flash('Arquivos importados com sucesso.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="page-header-card">
        <div>
          <h2>Importar Goomer e Ceofood</h2>
          <p>O sistema lê CSV ou Excel, contabiliza faturamento e usa a ficha técnica para baixar estoque.</p>
        </div>
      </section>

      <section className="metric-grid two">
        <DraftPanel title="Arquivo do Goomer" draft={drafts.Goomer} onFileChange={(e) => handleFile('Goomer', e.target.files?.[0])} />
        <DraftPanel title="Arquivo do Ceofood" draft={drafts.Ceofood} onFileChange={(e) => handleFile('Ceofood', e.target.files?.[0])} />
      </section>

      <section className="card">
        <h3>Prévia da importação</h3>
        <div className="metric-grid three">
          <Metric title="Arquivos prontos" value={Object.values(drafts).filter(Boolean).length} />
          <Metric title="Linhas detectadas" value={combined.orders} />
          <Metric title="Faturamento detectado" value={formatCurrency(combined.revenue)} />
        </div>
        <button className="primary-button" disabled={busy || !combined.orders} onClick={saveImports}>
          {busy ? 'Salvando...' : 'Salvar importações'}
        </button>
      </section>

      <section className="card">
        <h3>Histórico das importações</h3>
        {imports.length ? (
          <ul className="simple-list">
            {imports.map((batch) => (
              <li key={batch.id}>
                <span>{batch.source} • {batch.file_name}</span>
                <strong>{formatCurrency(batch.revenue)}</strong>
                <small>{batch.orders} linhas</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Ainda sem importações salvas.</p>
        )}
      </section>
    </div>
  )
}

function Metric({ title, value }) {
  return (
    <div className="metric-card">
      <span className="metric-title">{title}</span>
      <strong className="metric-value">{value}</strong>
    </div>
  )
}
