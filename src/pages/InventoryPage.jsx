import { useMemo, useState } from 'react'
import { useStore } from '../App'
import { formatCurrency } from '../lib/format'

const CATEGORY_OPTIONS = [
  'Carnes',
  'Molhos',
  'Bebidas',
  'Hortifruti',
  'Laticínios',
  'Pães',
  'Embalagens',
  'Congelados',
  'Diversos',
]

const UNIT_OPTIONS = [
  { value: 'g', label: 'Grama (g)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'fatia', label: 'Fatia' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'cx', label: 'Caixa (cx)' },
]

const blank = { name: '', category: 'Diversos', unit: 'un', stock_qty: '', min_qty: '', cost_per_unit: '' }

function normalizeForm(form) {
  return {
    ...form,
    name: String(form.name || '').trim(),
    category: String(form.category || '').trim() || 'Diversos',
    unit: String(form.unit || '').trim() || 'un',
    stock_qty: Number(form.stock_qty || 0),
    min_qty: Number(form.min_qty || 0),
    cost_per_unit: Number(form.cost_per_unit || 0),
  }
}

function optionValue(value, options) {
  return options.includes(value) ? value : '__custom'
}

function unitValue(value) {
  return UNIT_OPTIONS.some((item) => item.value === value) ? value : '__custom'
}

function InfoBadge() {
  return <span className="info-badge" aria-hidden="true">i</span>
}

function IngredientFields({ form, setForm }) {
  const categorySelectValue = optionValue(form.category, CATEGORY_OPTIONS)
  const unitSelectValue = unitValue(form.unit)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="form-grid two">
      <label>
        <span className="label-line">Nome <InfoBadge /></span>
        <input
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Ex.: Baconaise, Hambúrguer bovino 120g, Coca-Cola lata"
          required
        />
        <small className="field-help">Use o nome que facilita a conferência no estoque.</small>
      </label>

      <label>
        <span className="label-line">Categoria <InfoBadge /></span>
        <select
          value={categorySelectValue}
          onChange={(e) => update('category', e.target.value === '__custom' ? '' : e.target.value)}
        >
          {CATEGORY_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
          <option value="__custom">Digitar manualmente</option>
        </select>
        {categorySelectValue === '__custom' && (
          <input
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="Ex.: Temperos, Limpeza, Hambúrgueres"
          />
        )}
        <small className="field-help">Escolha da lista ou digite uma categoria própria.</small>
      </label>

      <label>
        <span className="label-line">Unidade de controle <InfoBadge /></span>
        <select
          value={unitSelectValue}
          onChange={(e) => update('unit', e.target.value === '__custom' ? '' : e.target.value)}
        >
          {UNIT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
          <option value="__custom">Digitar manualmente</option>
        </select>
        {unitSelectValue === '__custom' && (
          <input
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
            placeholder="Ex.: bandeja, porção, hambúrguer"
          />
        )}
        <small className="field-help">Prefira <strong>g</strong>, <strong>kg</strong>, <strong>ml</strong> ou <strong>un</strong> para cálculos mais confiáveis.</small>
      </label>

      <label>
        <span className="label-line">Estoque atual <InfoBadge /></span>
        <input
          type="number"
          min="0"
          step="0.001"
          value={form.stock_qty}
          onChange={(e) => update('stock_qty', e.target.value)}
          placeholder="Ex.: 2200"
          required
        />
        <small className="field-help">Informe a quantidade disponível agora, na mesma unidade escolhida acima.</small>
      </label>

      <label>
        <span className="label-line">Estoque mínimo <InfoBadge /></span>
        <input
          type="number"
          min="0"
          step="0.001"
          value={form.min_qty}
          onChange={(e) => update('min_qty', e.target.value)}
          placeholder="Ex.: 700"
          required
        />
        <small className="field-help">Quando o restante chegar perto desse número, o sistema alerta em amarelo ou vermelho.</small>
      </label>

      <label>
        <span className="label-line">Custo por unidade <InfoBadge /></span>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={form.cost_per_unit}
          onChange={(e) => update('cost_per_unit', e.target.value)}
          placeholder="Ex.: 0.016"
          required
        />
        <small className="field-help">Exemplo: se 1 g custa R$ 0,016, cadastre exatamente esse valor para o custo ficar correto.</small>
      </label>
    </div>
  )
}

export default function InventoryPage() {
  const { ingredients, saveIngredient, report, flash } = useStore()
  const [createForm, setCreateForm] = useState(blank)
  const [editingItem, setEditingItem] = useState(null)
  const [editingForm, setEditingForm] = useState(blank)

  const rows = useMemo(() => report.inventory, [report])

  async function handleCreate(event) {
    event.preventDefault()
    await saveIngredient(normalizeForm(createForm))
    flash('Ingrediente cadastrado com sucesso.')
    setCreateForm(blank)
  }

  async function handleEdit(event) {
    event.preventDefault()
    if (!editingItem) return
    await saveIngredient({ id: editingItem.id, ...normalizeForm(editingForm) })
    flash('Ingrediente atualizado com sucesso.')
    setEditingItem(null)
    setEditingForm(blank)
  }

  function edit(item) {
    setEditingItem(item)
    setEditingForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock_qty: item.stock_qty,
      min_qty: item.min_qty,
      cost_per_unit: item.cost_per_unit,
    })
  }

  function closeModal() {
    setEditingItem(null)
    setEditingForm(blank)
  }

  return (
    <div className="page-grid">
      <section className="card two-col inventory-top-card">
        <div>
          <h3>Cadastrar ingrediente</h3>
          <div className="tip-box inventory-tip-box">
            <strong>Como preencher sem confusão</strong>
            <span>1. Escolha a categoria.</span>
            <span>2. Defina a unidade de controle.</span>
            <span>3. Cadastre o estoque atual, o mínimo e o custo por unidade.</span>
          </div>
          <form onSubmit={handleCreate}>
            <IngredientFields form={createForm} setForm={setCreateForm} />
            <div className="row gap wrap">
              <button className="primary-button" type="submit">Salvar ingrediente</button>
              <button className="secondary-button" type="button" onClick={() => setCreateForm(blank)}>Limpar</button>
            </div>
          </form>
        </div>
        <div>
          <h3>Legenda do status</h3>
          <ul className="legend-list">
            <li><span className="pill green">Verde</span> Estoque saudável</li>
            <li><span className="pill yellow">Amarelo</span> Atenção / perto do mínimo</li>
            <li><span className="pill red">Vermelho</span> Precisa comprar</li>
          </ul>
          <div className="tip-box compact-tip-box">
            <strong>Dica de unidade</strong>
            <span>Molhos e carnes costumam funcionar melhor em <strong>g</strong> ou <strong>kg</strong>.</span>
            <span>Bebidas e embalagens costumam funcionar melhor em <strong>un</strong>.</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header-split">
          <div>
            <h3>Estoque atual</h3>
            <p className="section-helper">Clique em <strong>Editar</strong> para abrir uma tela de edição sem misturar com o cadastro de ingrediente novo.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ingrediente</th><th>Categoria</th><th>Estoque</th><th>Consumido</th><th>Restante</th><th>Comprar</th><th>Custo</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className={`row-${item.status}`}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.stock_qty} {item.unit}</td>
                  <td>{item.used} {item.unit}</td>
                  <td>{item.remaining} {item.unit}</td>
                  <td>{item.suggested_buy} {item.unit}</td>
                  <td>{formatCurrency(item.cost_per_unit)}</td>
                  <td><span className={`pill ${item.status}`}>{item.status.toUpperCase()}</span></td>
                  <td><button className="ghost-button" onClick={() => edit(item)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingItem && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-ingredient-title" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 id="edit-ingredient-title">Editar ingrediente</h3>
                <p className="section-helper">Atualize as informações sem mexer no cadastro novo que está na tela principal.</p>
              </div>
              <button className="ghost-button" type="button" onClick={closeModal}>Fechar</button>
            </div>
            <form onSubmit={handleEdit}>
              <IngredientFields form={editingForm} setForm={setEditingForm} />
              <div className="row gap wrap modal-actions">
                <button className="primary-button" type="submit">Atualizar</button>
                <button className="secondary-button" type="button" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
