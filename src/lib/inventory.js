import { formatCurrency, normalizeText } from './format'

export function enrichProducts(products = []) {
  return products.map((product) => ({
    ...product,
    normalized_name: product.normalized_name || normalizeText(product.name),
  }))
}

export function buildRecipeMap(products = [], ingredients = [], recipes = []) {
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))
  const ingredientMap = Object.fromEntries(ingredients.map((i) => [i.id, i]))
  const recipeMap = new Map()

  for (const recipe of recipes) {
    if (!recipeMap.has(recipe.product_id)) recipeMap.set(recipe.product_id, [])
    recipeMap.get(recipe.product_id).push({
      ...recipe,
      product: productMap[recipe.product_id],
      ingredient: ingredientMap[recipe.ingredient_id],
    })
  }

  return recipeMap
}

export function aggregateSales(imports = []) {
  const items = imports.flatMap((batch) => batch.items || [])
  const grouped = new Map()

  for (const item of items) {
    const key = item.normalized_name || normalizeText(item.product_name)
    const current = grouped.get(key) || {
      normalized_name: key,
      product_name: item.product_name,
      quantity: 0,
      revenue: 0,
      sources: new Set(),
    }
    current.quantity += Number(item.quantity || 0)
    current.revenue += Number(item.line_total || 0)
    current.sources.add(item.source)
    grouped.set(key, current)
  }

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(2)),
    sources: Array.from(item.sources),
  }))
}

export function computeInventoryOverview({ products = [], ingredients = [], recipes = [], imports = [] }) {
  const recipeMap = buildRecipeMap(products, ingredients, recipes)
  const sales = aggregateSales(imports)
  const productByNorm = new Map(products.map((p) => [p.normalized_name || normalizeText(p.name), p]))
  const usageByIngredient = new Map()
  const missingRecipeProducts = []

  for (const sale of sales) {
    const product = productByNorm.get(sale.normalized_name)
    if (!product) {
      missingRecipeProducts.push({ ...sale, reason: 'Produto não cadastrado' })
      continue
    }

    const lines = recipeMap.get(product.id)
    if (!lines?.length) {
      missingRecipeProducts.push({ ...sale, reason: 'Sem ficha técnica' })
      continue
    }

    for (const line of lines) {
      const current = usageByIngredient.get(line.ingredient_id) || 0
      usageByIngredient.set(
        line.ingredient_id,
        Number((current + Number(line.quantity || 0) * Number(sale.quantity || 0)).toFixed(3)),
      )
    }
  }

  const inventory = ingredients.map((ingredient) => {
    const used = usageByIngredient.get(ingredient.id) || 0
    const remaining = Number((Number(ingredient.stock_qty || 0) - used).toFixed(3))
    const min = Number(ingredient.min_qty || 0)
    let status = 'green'
    if (remaining <= min) status = 'red'
    else if (remaining <= min * 1.3) status = 'yellow'
    return {
      ...ingredient,
      used,
      remaining,
      status,
      suggested_buy: Math.max(0, Number((min * 2 - remaining).toFixed(3))),
      theoretical_cost_used: Number((used * Number(ingredient.cost_per_unit || 0)).toFixed(2)),
    }
  })

  const revenueBySource = imports.reduce(
    (acc, batch) => {
      acc[batch.source] = Number((acc[batch.source] + Number(batch.revenue || 0)).toFixed(2))
      return acc
    },
    { Goomer: 0, Ceofood: 0 },
  )

  const totalRevenue = Number((revenueBySource.Goomer + revenueBySource.Ceofood).toFixed(2))
  const totalCost = Number(
    inventory.reduce((acc, item) => acc + Number(item.theoretical_cost_used || 0), 0).toFixed(2),
  )
  const grossProfit = Number((totalRevenue - totalCost).toFixed(2))

  return {
    inventory,
    sales,
    missingRecipeProducts,
    revenueBySource,
    totalRevenue,
    totalCost,
    grossProfit,
  }
}

export function buildSupplierMessage(supplier, neededItems = []) {
  const header = `Olá, ${supplier.name}. Gostaria de saber a cotação de hoje para estes produtos:`
  const lines = neededItems.length
    ? neededItems.map((item) => `- ${item.name}: ${item.suggested_buy} ${item.unit}`)
    : ['- No momento, sem itens críticos desta categoria.']
  return [header, '', ...lines, '', 'Obrigado!'].join('\n')
}

export function exportPrintableHtml(report) {
  return `
    <html>
      <head>
        <title>Relatório de estoque</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d0d0d0; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
          .green { color: #0a7d43; font-weight: bold; }
          .yellow { color: #a36b00; font-weight: bold; }
          .red { color: #b42318; font-weight: bold; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
        </style>
      </head>
      <body>
        <h1>Speed Estoque</h1>
        <p>Faturamento Goomer: ${formatCurrency(report.revenueBySource.Goomer)} | Faturamento Ceofood: ${formatCurrency(report.revenueBySource.Ceofood)} | Total: ${formatCurrency(report.totalRevenue)}</p>
        <div class="cards">
          <div class="card"><strong>Custo teórico</strong><br/>${formatCurrency(report.totalCost)}</div>
          <div class="card"><strong>Lucro bruto estimado</strong><br/>${formatCurrency(report.grossProfit)}</div>
          <div class="card"><strong>Itens críticos</strong><br/>${report.inventory.filter((item) => item.status === 'red').length}</div>
          <div class="card"><strong>Itens em atenção</strong><br/>${report.inventory.filter((item) => item.status === 'yellow').length}</div>
        </div>
        <table>
          <thead>
            <tr><th>Ingrediente</th><th>Estoque</th><th>Consumido</th><th>Restante</th><th>Status</th><th>Comprar</th></tr>
          </thead>
          <tbody>
            ${report.inventory
              .map(
                (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.stock_qty} ${item.unit}</td>
                  <td>${item.used} ${item.unit}</td>
                  <td>${item.remaining} ${item.unit}</td>
                  <td class="${item.status}">${item.status.toUpperCase()}</td>
                  <td>${item.suggested_buy} ${item.unit}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>`
}
