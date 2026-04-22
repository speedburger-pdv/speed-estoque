import { supabase, hasSupabase } from './supabase'
import { PRODUCT_SEEDS, INGREDIENT_SEEDS, RECIPE_SEEDS, SUPPLIER_CATEGORY_OPTIONS, withNorm } from './seeds'
import { normalizeText } from './format'

const STORAGE_KEY = 'speed_estoque_data'

const TABLES = {
  ingredients: 'ingredients',
  products: 'products',
  recipes: 'recipes',
  suppliers: 'suppliers',
  import_batches: 'import_batches',
  import_items: 'import_items',
}

function now() {
  return new Date().toISOString()
}

function createFallbackData() {
  const products = withNorm(PRODUCT_SEEDS).map((item) => ({
    id: crypto.randomUUID(),
    created_at: now(),
    ...item,
  }))

  const ingredients = INGREDIENT_SEEDS.map((item) => ({
    id: crypto.randomUUID(),
    created_at: now(),
    ...item,
  }))

  const productByName = Object.fromEntries(products.map((item) => [normalizeText(item.name), item]))
  const ingredientByName = Object.fromEntries(ingredients.map((item) => [normalizeText(item.name), item]))

  const recipes = RECIPE_SEEDS.flatMap((recipe) => {
    const product = productByName[normalizeText(recipe.productName)]
    if (!product) return []
    return recipe.lines.flatMap(([ingredientName, quantity]) => {
      const ingredient = ingredientByName[normalizeText(ingredientName)]
      if (!ingredient) return []
      return {
        id: crypto.randomUUID(),
        created_at: now(),
        product_id: product.id,
        ingredient_id: ingredient.id,
        quantity,
        notes: '',
      }
    })
  })

  return {
    ingredients,
    products,
    recipes,
    suppliers: [],
    import_batches: [],
    import_items: [],
  }
}

function getLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = createFallbackData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    return JSON.parse(raw)
  } catch {
    const seeded = createFallbackData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function setLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

async function ensureRemoteSeed() {
  if (!hasSupabase()) return false
  try {
    const { count } = await supabase.from(TABLES.products).select('*', { count: 'exact', head: true })
    if (count > 0) return true

    const products = withNorm(PRODUCT_SEEDS).map((item) => ({ ...item }))
    const { data: insertedProducts, error: productError } = await supabase
      .from(TABLES.products)
      .insert(products)
      .select('*')
    if (productError) throw productError

    const ingredients = INGREDIENT_SEEDS.map((item) => ({ ...item }))
    const { data: insertedIngredients, error: ingredientError } = await supabase
      .from(TABLES.ingredients)
      .insert(ingredients)
      .select('*')
    if (ingredientError) throw ingredientError

    const productByName = Object.fromEntries(insertedProducts.map((item) => [normalizeText(item.name), item]))
    const ingredientByName = Object.fromEntries(insertedIngredients.map((item) => [normalizeText(item.name), item]))
    const recipeRows = RECIPE_SEEDS.flatMap((recipe) => {
      const product = productByName[normalizeText(recipe.productName)]
      if (!product) return []
      return recipe.lines.flatMap(([ingredientName, quantity]) => {
        const ingredient = ingredientByName[normalizeText(ingredientName)]
        if (!ingredient) return []
        return {
          product_id: product.id,
          ingredient_id: ingredient.id,
          quantity,
          notes: '',
        }
      })
    })

    if (recipeRows.length) {
      const { error: recipeError } = await supabase.from(TABLES.recipes).insert(recipeRows)
      if (recipeError) throw recipeError
    }

    return true
  } catch {
    return false
  }
}

export async function loadData() {
  if (hasSupabase()) {
    const ok = await ensureRemoteSeed()
    if (ok) {
      try {
        const [productsRes, ingredientsRes, recipesRes, suppliersRes, batchRes, itemRes] = await Promise.all([
          supabase.from(TABLES.products).select('*').order('name'),
          supabase.from(TABLES.ingredients).select('*').order('name'),
          supabase.from(TABLES.recipes).select('*'),
          supabase.from(TABLES.suppliers).select('*').order('name'),
          supabase.from(TABLES.import_batches).select('*').order('imported_at', { ascending: false }),
          supabase.from(TABLES.import_items).select('*'),
        ])

        const batchItemsMap = itemRes.data.reduce((acc, item) => {
          if (!acc[item.batch_id]) acc[item.batch_id] = []
          acc[item.batch_id].push(item)
          return acc
        }, {})

        return {
          products: productsRes.data || [],
          ingredients: ingredientsRes.data || [],
          recipes: recipesRes.data || [],
          suppliers: suppliersRes.data || [],
          import_batches: (batchRes.data || []).map((batch) => ({ ...batch, items: batchItemsMap[batch.id] || [] })),
          import_items: itemRes.data || [],
          mode: 'supabase',
        }
      } catch {
        // fallback below
      }
    }
  }

  return {
    ...getLocalData(),
    mode: 'local',
  }
}

function updateLocalCollection(key, rows) {
  const data = getLocalData()
  data[key] = rows
  setLocalData(data)
  return rows
}

async function upsertRemote(table, row) {
  const payload = { ...row }
  if (!payload.id) delete payload.id
  const { data, error } = await supabase.from(table).upsert(payload).select('*').single()
  if (error) throw error
  return data
}

async function deleteRemote(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function saveProduct(product, current) {
  const row = {
    ...product,
    normalized_name: normalizeText(product.name),
  }
  if (hasSupabase()) {
    try {
      return await upsertRemote(TABLES.products, row)
    } catch {
      // fallback
    }
  }
  const rows = [...current]
  const index = rows.findIndex((item) => item.id === row.id)
  if (index >= 0) rows[index] = { ...rows[index], ...row }
  else rows.push({ id: crypto.randomUUID(), created_at: now(), ...row })
  updateLocalCollection('products', rows)
  return rows[rows.findIndex((item) => normalizeText(item.name) === normalizeText(row.name))]
}

export async function saveIngredient(ingredient, current) {
  const row = { ...ingredient }
  if (hasSupabase()) {
    try {
      return await upsertRemote(TABLES.ingredients, row)
    } catch {}
  }
  const rows = [...current]
  const index = rows.findIndex((item) => item.id === row.id)
  if (index >= 0) rows[index] = { ...rows[index], ...row }
  else rows.push({ id: crypto.randomUUID(), created_at: now(), ...row })
  updateLocalCollection('ingredients', rows)
  return rows[rows.findIndex((item) => item.id === row.id) || rows.length - 1]
}

export async function saveRecipeLines(productId, lines, currentRecipes) {
  if (hasSupabase()) {
    try {
      await supabase.from(TABLES.recipes).delete().eq('product_id', productId)
      if (lines.length) {
        const payload = lines.map((line) => ({
          product_id: productId,
          ingredient_id: line.ingredient_id,
          quantity: Number(line.quantity || 0),
          notes: line.notes || '',
        }))
        const { error } = await supabase.from(TABLES.recipes).insert(payload)
        if (error) throw error
      }
      return true
    } catch {
      // fallback below
    }
  }

  const filtered = currentRecipes.filter((item) => item.product_id !== productId)
  const additions = lines.map((line) => ({
    id: crypto.randomUUID(),
    created_at: now(),
    product_id: productId,
    ingredient_id: line.ingredient_id,
    quantity: Number(line.quantity || 0),
    notes: line.notes || '',
  }))
  updateLocalCollection('recipes', [...filtered, ...additions])
  return true
}

export async function saveSupplier(supplier, currentSuppliers) {
  const row = { ...supplier }
  if (hasSupabase()) {
    try {
      return await upsertRemote(TABLES.suppliers, row)
    } catch {}
  }
  const rows = [...currentSuppliers]
  const index = rows.findIndex((item) => item.id === row.id)
  if (index >= 0) rows[index] = { ...rows[index], ...row }
  else rows.push({ id: crypto.randomUUID(), created_at: now(), ...row })
  updateLocalCollection('suppliers', rows)
  return rows[index >= 0 ? index : rows.length - 1]
}

export async function deleteSupplier(id, currentSuppliers) {
  if (hasSupabase()) {
    try {
      await deleteRemote(TABLES.suppliers, id)
      return true
    } catch {}
  }
  updateLocalCollection(
    'suppliers',
    currentSuppliers.filter((item) => item.id !== id),
  )
  return true
}

export async function saveImportBatch(batch, items, currentBatches) {
  const payloadBatch = {
    source: batch.source,
    file_name: batch.file_name,
    imported_at: batch.imported_at || now(),
    revenue: Number(batch.revenue || 0),
    orders: Number(batch.orders || 0),
  }

  if (hasSupabase()) {
    try {
      const { data: insertedBatch, error: batchError } = await supabase
        .from(TABLES.import_batches)
        .insert(payloadBatch)
        .select('*')
        .single()
      if (batchError) throw batchError

      const payloadItems = items.map((item) => ({
        batch_id: insertedBatch.id,
        source: item.source,
        file_name: item.file_name,
        product_name: item.product_name,
        normalized_name: item.normalized_name,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.line_total || 0),
        raw: item.raw || {},
      }))
      if (payloadItems.length) {
        const { error: itemError } = await supabase.from(TABLES.import_items).insert(payloadItems)
        if (itemError) throw itemError
      }
      return { ...insertedBatch, items: payloadItems }
    } catch {
      // fallback below
    }
  }

  const localBatch = {
    id: crypto.randomUUID(),
    ...payloadBatch,
    items,
  }
  const data = getLocalData()
  data.import_batches = [localBatch, ...data.import_batches]
  data.import_items = [...data.import_items, ...items.map((item) => ({ ...item, batch_id: localBatch.id }))]
  setLocalData(data)
  return localBatch
}

export { SUPPLIER_CATEGORY_OPTIONS }
