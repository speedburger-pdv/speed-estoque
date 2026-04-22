import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'

const items = [
  ['/', 'Dashboard'],
  ['/imports', 'Importações'],
  ['/estoque', 'Estoque'],
  ['/fichas', 'Ficha técnica'],
  ['/fornecedores', 'Fornecedores'],
  ['/relatorios', 'Relatórios'],
]

export default function Layout({ session, status, onLogout, children }) {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    onLogout?.()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-block">
            <div className="brand-logo">📦</div>
            <div>
              <h1>Speed Estoque</h1>
              <p>Controle de estoque da Speed Burger</p>
            </div>
          </div>
          <div className="user-card">
            <span className="status-dot" />
            <div>
              <strong>{session?.name}</strong>
              <small>{session?.role}</small>
              <small>{status === 'supabase' ? 'Supabase conectado' : 'Modo local'}</small>
            </div>
          </div>
          <nav className="sidebar-nav">
            {items.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button className="danger-button" type="button" onClick={handleLogout}>Sair</button>
      </aside>
      <main className="content">{children || <Outlet />}</main>
    </div>
  )
}
