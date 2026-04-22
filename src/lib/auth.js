const STORAGE_KEY = 'speed_estoque_session'

const DEFAULT_USER = {
  username: 'Kevin',
  password: 'Kevin2236',
  name: 'Kevin',
  role: 'Administrador',
}

export function login(username, password) {
  const ok =
    String(username || '').trim().toLowerCase() === DEFAULT_USER.username.toLowerCase() &&
    String(password || '') === DEFAULT_USER.password

  if (!ok) {
    throw new Error('Usuário ou senha inválidos.')
  }

  const session = {
    loggedIn: true,
    name: DEFAULT_USER.name,
    role: DEFAULT_USER.role,
    username: DEFAULT_USER.username,
    loggedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}
