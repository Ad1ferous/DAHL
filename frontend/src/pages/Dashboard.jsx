import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'   // ← добавьте этот импорт, если ещё нет

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [readyRoutes, setReadyRoutes] = useState([])   // ← состояние для готовых маршрутов

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [navigate])

  // Загрузка готовых маршрутов с бэкенда
  useEffect(() => {
    axios.get('http://localhost:8002/ready-routes')
      .then(res => setReadyRoutes(res.data))
      .catch(err => console.error('Ошибка загрузки готовых маршрутов:', err))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) return <div>Загрузка...</div>

  return (
    <div>
      <h1>Добро пожаловать, {user.username}!</h1>
      <p>Это ваш личный кабинет.</p>
      
      {/* Кнопка для создания нового плана */}
      <Link to="/new-plan">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>
          ✈️ Создать новый план
        </button>
      </Link>

      <hr />

      {/* Готовые маршруты */}
      <h2>Готовые маршруты</h2>
      {readyRoutes.length === 0 && <p>Загрузка готовых маршрутов...</p>}
      {readyRoutes.map(route => (
        <div key={route.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <h3>{route.name}</h3>
          <button onClick={() => {
            // создать план на основе этого маршрута
            axios.post('http://localhost:8002/plans', { name: route.name }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(res => {
              const planId = res.data.plan_id
              // добавить все места
              const promises = route.places.map(p => 
                axios.post(`http://localhost:8002/plans/${planId}/places`, p, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
              )
              Promise.all(promises).then(() => {
                navigate(`/plan/${planId}`)
              })
            }).catch(err => {
              console.error('Ошибка при создании плана из готового маршрута:', err)
              alert('Не удалось создать план')
            })
          }}>Выбрать</button>
        </div>
      ))}

      <hr />
      <button onClick={handleLogout}>Выйти</button>
    </div>
  )
}

export default Dashboard