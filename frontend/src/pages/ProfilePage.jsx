import { useState, useEffect } from 'react'
import axios from 'axios'

function ProfilePage() {
  const token = localStorage.getItem('token')
  const [activeTab, setActiveTab] = useState('routes') // 'routes', 'reviews', 'subscriptions'

  // В реальном проекте эти данные можно загрузить с бэкенда
  const user = {
    name: 'Иван Крузенштерн',
    location: 'Москва',
    bio: 'Любитель горных маршрутов и озер Карелии',
    joinedYear: 2024,
    stats: {
      routes: 12,
      places: 48,
      followers: 156
    },
    routes: [
      {
        id: 1,
        title: 'Золотое кольцо: 7 дней',
        subtitle: 'Москва → Владимир → Суздаль → Ярославль → Кострома',
        dates: '12-19 августа',
        people: 2,
        budget: '45 000 ₽',
        status: 'finished', // 'finished' | 'draft'
        coverColor: '#E0E7FF'
      },
      {
        id: 2,
        title: 'Байкал: круговое путешествие',
        subtitle: 'Иркутск → Листвянка → Ольхон → Северобайкальск',
        dates: 'Черновик',
        people: 4,
        budget: '~120 000 ₽',
        status: 'draft',
        coverColor: '#DBEAFE'
      }
    ]
  }

  return (
    <div className="profile-page">
      {/* Верхняя панель (хедер) */}
      <header className="profile-header">
        <div className="header-logo">ДАЛЬ</div>
        <nav className="header-nav">
          <a href="/" className="header-link">Главная</a>
          <a href="/profile" className="header-link active">Профиль</a>
        </nav>
      </header>

      {/* Карточка профиля */}
      <section className="profile-card">
        <div className="profile-main">
          <div className="profile-avatar" />
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-location">📌 {user.location} • На сайте с {user.joinedYear}</p>
            <p className="profile-bio">{user.bio}</p>
          </div>
          <button className="profile-edit-btn">Редактировать</button>
        </div>

        {/* Статистика */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value" style={{ color: '#7C3AED' }}>{user.stats.routes}</span>
            <span className="stat-label">Маршрутов</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: '#2563EB' }}>{user.stats.places}</span>
            <span className="stat-label">Мест посещено</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: '#10B981' }}>{user.stats.followers}</span>
            <span className="stat-label">Подписчиков</span>
          </div>
        </div>
      </section>

      {/* Вкладки */}
      <nav className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          Мои маршруты
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Рецензии
        </button>
        <button
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Подписки
        </button>
      </nav>

      {/* Список маршрутов (показывается для вкладки "Мои маршруты") */}
      {activeTab === 'routes' && (
        <section className="routes-list">
          {user.routes.map(route => (
            <div key={route.id} className="route-card">
              <div className="route-cover" style={{ backgroundColor: route.coverColor }}>
                {route.status === 'draft' ? '🌊' : '📍'}
              </div>
              <div className="route-info">
                <h3 className="route-title">{route.title}</h3>
                <p className="route-subtitle">{route.subtitle}</p>
                <p className="route-meta">
                  📅 {route.dates} • 👥 {route.people} чел • 💰 {route.budget}
                </p>
                <span className={`route-status ${route.status}`}>
                  {route.status === 'finished' ? 'Готов' : 'Черновик'}
                </span>
              </div>
              <div className="route-actions">
                {route.status === 'finished' ? (
                  <>
                    <button className="route-btn">Открыть</button>
                    <button className="route-btn">Поделиться</button>
                  </>
                ) : (
                  <button className="route-btn route-btn-primary">Продолжить</button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Заглушки для других вкладок */}
      {activeTab === 'reviews' && <p className="empty-tab">Рецензии пока отсутствуют</p>}
      {activeTab === 'subscriptions' && <p className="empty-tab">Подписки пока отсутствуют</p>}
    </div>
  )
}

export default ProfilePage