import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function LoginPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('login') // 'login' или 'register'

  // Поля для входа
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Поля для регистрации
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regError, setRegError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await axios.post('http://localhost:8002/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    try {
      await axios.post('http://localhost:8002/auth/register', {
        username: regName,
        email: regEmail,
        password: regPassword
      })
      // После успешной регистрации сразу авторизуемся и переходим в дашборд
      const loginRes = await axios.post('http://localhost:8002/auth/login', { email: regEmail, password: regPassword })
      localStorage.setItem('token', loginRes.data.access_token)
      localStorage.setItem('user', JSON.stringify(loginRes.data.user))
      navigate('/dashboard')
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Ошибка регистрации')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Левая панель */}
        <div className="auth-left">
          <h1 className="auth-logo">ДАЛЬ</h1>
          <p className="auth-subtitle">Умный штаб путешествий по России</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-icon"></span>
              <span>Маршруты оптимизированы AI</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon"></span>
              <span>Готовые подборки по России</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon"></span>
              <span>Делитесь маршрутами с друзьями</span>
            </div>
          </div>
          {/* Декоративные элементы (прозрачные круги и линии) будут через CSS */}
        </div>

        {/* Правая панель с формой */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {/* Переключатель вкладок */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Вход
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Регистрация
              </button>
            </div>

            {/* Форма входа */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                {/* Кнопки соцсетей (декоративные) */}
                <button type="button" className="social-btn">Продолжить с Google</button>
                <button type="button" className="social-btn vk-btn">Продолжить с ВКонтакте</button>

                <div className="divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">или</span>
                  <span className="divider-line"></span>
                </div>

                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan@example.com"
                  required
                />

                <label className="input-label">Пароль</label>
                <div className="password-wrapper">
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                  />
                  <span className="eye-icon">👁</span>
                </div>

                <div className="forgot-password">
                  <a href="/forgot" onClick={(e) => e.preventDefault()}>Забыли пароль?</a>
                </div>

                <button type="submit" className="auth-submit">Войти</button>

                {error && <p className="error-msg">{error}</p>}

                <div className="switch-text">
                  <span>Нет аккаунта? </span>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('register')}>
                    Зарегистрироваться
                  </button>
                </div>
              </form>
            )}

            {/* Форма регистрации */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <label className="input-label">Имя</label>
                <input
                  type="text"
                  className="auth-input"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ваше имя"
                  required
                />

                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />

                <label className="input-label">Пароль</label>
                <input
                  type="password"
                  className="auth-input"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  required
                />

                <button type="submit" className="auth-submit">Зарегистрироваться</button>

                {regError && <p className="error-msg">{regError}</p>}

                <div className="switch-text">
                  <span>Уже есть аккаунт? </span>
                  <button type="button" className="link-btn" onClick={() => setActiveTab('login')}>
                    Войти
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage