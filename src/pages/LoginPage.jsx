import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { login } from '../lib/auth'

export default function LoginPage({ session, onLogin }) {
  const [username, setUsername] = useState('Kevin')
  const [password, setPassword] = useState('Kevin2236')
  const [error, setError] = useState('')

  if (session) return <Navigate to="/" replace />

  function handleSubmit(event) {
    event.preventDefault()
    try {
      login(username, password)
      onLogin()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="screen-center login-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Speed Estoque</h1>
        <p>CSV/Excel + ficha técnica + fornecedores + relatório em PDF.</p>
        <div className="tip-box">
          <strong>Acesso inicial</strong>
          <span>Usuário: Kevin</span>
          <span>Senha: Kevin2236</span>
        </div>
        <label>
          Usuário
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button" type="submit">Entrar</button>
      </form>
    </div>
  )
}
