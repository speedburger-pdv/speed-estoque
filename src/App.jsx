import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ImportsPage from './pages/ImportsPage'
import InventoryPage from './pages/InventoryPage'
import RecipesPage from './pages/RecipesPage'
import SuppliersPage from './pages/SuppliersPage'
import ReportsPage from './pages/ReportsPage'
import LoginPage from './pages/LoginPage'
import { getSession } from './lib/auth'
import { computeInventoryOverview } from './lib/inventory'
import {
  deleteSupplier,
  loadData,
  saveImportBatch,
  saveIngredient,
  saveProduct,
  saveRecipeLines,
  saveSupplier,
} from './lib/data'

const StoreContext = createContext(null)

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore precisa estar dentro do provider')
  return context
}

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(() => getSession())
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('local')
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [recipes, setRecipes] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [imports, setImports] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      const data = await loadData()
      setProducts(data.products || [])
      setIngredients(data.ingredients || [])
      setRecipes(data.recipes || [])
      setSuppliers(data.suppliers || [])
      setImports(data.import_batches || [])
      setMode(data.mode || 'local')
      setLoading(false)
    }
    bootstrap()
  }, [])

  function flash(message) {
    setToast(message)
    window.clearTimeout(window.__speedToastTimer)
    window.__speedToastTimer = window.setTimeout(() => setToast(''), 3200)
  }

  const report = useMemo(
    () => computeInventoryOverview({ products, ingredients, recipes, imports }),
    [products, ingredients, recipes, imports],
  )

  const refresh = async () => {
    const data = await loadData()
    setProducts(data.products || [])
    setIngredients(data.ingredients || [])
    setRecipes(data.recipes || [])
    setSuppliers(data.suppliers || [])
    setImports(data.import_batches || [])
    setMode(data.mode || 'local')
  }

  const value = useMemo(
    () => ({
      mode,
      products,
      ingredients,
      recipes,
      suppliers,
      imports,
      report,
      toast,
      flash,
      setSession,
      async saveProduct(product) {
        await saveProduct(product, products)
        await refresh()
      },
      async saveIngredient(ingredient) {
        await saveIngredient(ingredient, ingredients)
        await refresh()
      },
      async saveRecipeLines(productId, lines) {
        await saveRecipeLines(productId, lines, recipes)
        await refresh()
      },
      async saveSupplier(supplier) {
        await saveSupplier(supplier, suppliers)
        await refresh()
      },
      async deleteSupplier(id) {
        await deleteSupplier(id, suppliers)
        await refresh()
      },
      async addImportBatch(batch, items) {
        await saveImportBatch(batch, items, imports)
        await refresh()
      },
    }),
    [mode, products, ingredients, recipes, suppliers, imports, report, toast],
  )

  if (loading) {
    return <div className="screen-center">Carregando Speed Estoque…</div>
  }

  return (
    <StoreContext.Provider value={value}>
      {toast && <div className="toast">{toast}</div>}
      <Routes>
        <Route
          path="/login"
          element={<LoginPage session={session} onLogin={() => setSession(getSession())} />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute session={session}>
              <Layout session={session} status={mode} onLogout={() => setSession(null)} />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="estoque" element={<InventoryPage />} />
          <Route path="fichas" element={<RecipesPage />} />
          <Route path="fornecedores" element={<SuppliersPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
        </Route>
      </Routes>
    </StoreContext.Provider>
  )
}
