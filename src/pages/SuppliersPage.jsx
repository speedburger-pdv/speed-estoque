import { useMemo, useState } from 'react'
import { useStore } from '../App'
import { buildSupplierMessage } from '../lib/inventory'
import { formatUnit, toWhatsappLink } from '../lib/format'
import { SUPPLIER_CATEGORY_OPTIONS } from '../lib/data'

const blank = { name: '', category: 'Carnes', whatsapp: '', city: 'Taquaritinga/SP', notes: '', supplies: [] }

export default function SuppliersPage() {
  const { suppliers, saveSupplier, deleteSupplier, report, flash } = useStore()
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)

  async function submit(event) {
    event.preventDefault()
    await saveSupplier({ ...form, id: editingId || undefined })
    flash(editingId ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.')
    setEditingId(null)
    setForm(blank)
  }

  const neededByCategory = useMemo(() => {
    const map = {}
    for (const item of report.inventory.filter((item) => item.suggested_buy > 0)) {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    }
    return map
  }, [report])

  return (
    <div className="page-grid">
      <section className="card two-col">
        <form onSubmit={submit}>
          <h3>{editingId ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h3>
          <div className="form-grid two">
            <label>Nome<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>WhatsApp<input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required /></label>
            <label>Setor principal
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {SUPPLIER_CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Cidade<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          </div>
          <label>Observações<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="row gap">
            <button className="primary-button" type="submit">{editingId ? 'Atualizar fornecedor' : 'Salvar fornecedor'}</button>
            {editingId && <button className="secondary-button" type="button" onClick={() => { setEditingId(null); setForm(blank) }}>Cancelar</button>}
          </div>
        </form>
        <div>
          <h3>Como funciona a cotação</h3>
          <p>Cadastre o fornecedor com WhatsApp. O sistema monta uma mensagem automática com os itens críticos da categoria dele.</p>
        </div>
      </section>

      <section className="card">
        <h3>Fornecedores</h3>
        {suppliers.length ? (
          <div className="supplier-grid">
            {suppliers.map((supplier) => {
              const needed = report.inventory.filter((item) => item.suggested_buy > 0 && item.category === supplier.category)
              const message = buildSupplierMessage(supplier, needed.map((item) => ({ ...item, unit: formatUnit(item.unit) })))
              return (
                <div className="supplier-card" key={supplier.id}>
                  <strong>{supplier.name}</strong>
                  <span>{supplier.category} • {supplier.city}</span>
                  <small>{supplier.whatsapp}</small>
                  <div className="row gap wrap">
                    <a className="primary-button link-button" target="_blank" rel="noreferrer" href={toWhatsappLink(supplier.whatsapp, message)}>Pedir cotação</a>
                    <button className="ghost-button" onClick={() => { setEditingId(supplier.id); setForm(supplier) }}>Editar</button>
                    <button className="danger-soft-button" onClick={() => deleteSupplier(supplier.id)}>Excluir</button>
                  </div>
                  <small>{needed.length ? `${needed.length} item(ns) para cotar.` : 'Sem itens críticos desta categoria no momento.'}</small>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="empty">Cadastre fornecedores para gerar mensagens de cotação.</p>
        )}
      </section>
    </div>
  )
}
