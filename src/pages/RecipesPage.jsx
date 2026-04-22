import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../App'
import { formatCurrency } from '../lib/format'

const blankProduct = { name: '', category: 'Hambúrgueres', price: '' }

export default function RecipesPage() {
  const { products, ingredients, recipes, saveRecipeLines, saveProduct, flash } = useStore()
  const [selectedId, setSelectedId] = useState(products[0]?.id || '')
  const [productDraft, setProductDraft] = useState(blankProduct)
  const [newProduct, setNewProduct] = useState(blankProduct)

  const selectedProduct = useMemo(() => products.find((item) => item.id === selectedId) || products[0], [products, selectedId])
  const lines = useMemo(
    () => recipes.filter((item) => item.product_id === selectedProduct?.id).map((item) => ({ ...item })),
    [recipes, selectedProduct],
  )
  const [draftLines, setDraftLines] = useState(lines)

  useEffect(() => {
    setDraftLines(lines)
    if (selectedProduct) {
      setProductDraft({
        name: selectedProduct.name,
        category: selectedProduct.category,
        price: selectedProduct.price,
      })
    }
  }, [selectedProduct?.id, recipes.length])

  if (!selectedProduct) return <div className="card">Sem produtos.</div>

  async function saveAll() {
    await saveRecipeLines(selectedProduct.id, draftLines)
    flash('Ficha técnica salva.')
  }

  async function saveProductMeta(event) {
    event.preventDefault()
    await saveProduct({
      id: selectedProduct.id,
      name: productDraft.name,
      category: productDraft.category,
      price: Number(productDraft.price || 0),
      source: selectedProduct.source || 'Cardápio',
    })
    flash('Produto atualizado.')
  }

  async function createProduct(event) {
    event.preventDefault()
    if (!newProduct.name.trim()) return
    await saveProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price || 0),
      source: 'Manual',
    })
    flash('Produto cadastrado. Ele já pode receber ficha técnica.')
    setNewProduct(blankProduct)
  }

  const recipeCost = draftLines.reduce((acc, line) => {
    const ingredient = ingredients.find((item) => item.id === line.ingredient_id)
    return acc + Number(ingredient?.cost_per_unit || 0) * Number(line.quantity || 0)
  }, 0)

  return (
    <div className="page-grid">
      <section className="card two-col">
        <div>
          <h3>Produto</h3>
          <select value={selectedProduct.id} onChange={(e) => setSelectedId(e.target.value)}>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <div className="compact-summary">
            <span>Categoria: {selectedProduct.category}</span>
            <span>Preço de venda: {formatCurrency(selectedProduct.price)}</span>
            <span>Custo teórico da ficha: {formatCurrency(recipeCost)}</span>
          </div>
        </div>
        <div>
          <h3>Como usar</h3>
          <p>Selecione o lanche e informe quanto de cada ingrediente ele consome. Se vier item novo no CSV, você pode cadastrar o produto aqui também.</p>
        </div>
      </section>

      <section className="card two-col">
        <form onSubmit={saveProductMeta}>
          <h3>Editar produto selecionado</h3>
          <div className="form-grid two">
            <label>Nome<input value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></label>
            <label>Categoria<input value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })} /></label>
            <label>Preço<input value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })} /></label>
          </div>
          <button className="primary-button" type="submit">Salvar produto</button>
        </form>
        <form onSubmit={createProduct}>
          <h3>Cadastrar produto novo</h3>
          <div className="form-grid two">
            <label>Nome<input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></label>
            <label>Categoria<input value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} /></label>
            <label>Preço<input value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></label>
          </div>
          <button className="secondary-button" type="submit">Cadastrar produto</button>
        </form>
      </section>

      <section className="card">
        <h3>Ficha técnica de {selectedProduct.name}</h3>
        <div className="simple-list">
          {draftLines.map((line, index) => (
            <div key={index} className="inline-edit-row">
              <select value={line.ingredient_id} onChange={(e) => setDraftLines((prev) => prev.map((item, i) => i === index ? { ...item, ingredient_id: e.target.value } : item))}>
                {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
              </select>
              <input value={line.quantity} onChange={(e) => setDraftLines((prev) => prev.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} />
              <button className="danger-soft-button" type="button" onClick={() => setDraftLines((prev) => prev.filter((_, i) => i !== index))}>Remover</button>
            </div>
          ))}
        </div>
        <div className="row gap wrap">
          <button className="secondary-button" type="button" onClick={() => setDraftLines((prev) => [...prev, { ingredient_id: ingredients[0]?.id || '', quantity: 1, notes: '' }])}>Adicionar ingrediente</button>
          <button className="primary-button" type="button" onClick={saveAll}>Salvar ficha técnica</button>
        </div>
      </section>

      <section className="card">
        <h3>Produtos sem ficha técnica</h3>
        <ul className="simple-list">
          {products
            .filter((product) => !recipes.some((item) => item.product_id === product.id))
            .slice(0, 20)
            .map((product) => (
              <li key={product.id}><span>{product.name}</span><small>{product.category}</small></li>
            ))}
        </ul>
      </section>
    </div>
  )
}
