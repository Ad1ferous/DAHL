import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Directions } from '@2gis/mapgl-directions'

function PlanPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const apiKey = import.meta.env.VITE_MAPGL_API_KEY
  const directionsApiKey = import.meta.env.VITE_DIRECTIONS_API_KEY || apiKey

  const mapContainer = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const directionsRef = useRef(null)

  const [places, setPlaces] = useState([])
  const [currentPlanId, setCurrentPlanId] = useState(planId || null)

  const [aiPrompt, setAiPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const [suggestedPlaces, setSuggestedPlaces] = useState([])

  // Инициализация карты с проверкой доступности mapgl
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return
    if (typeof window.mapgl === 'undefined') {
      console.warn('mapgl ещё не загружен, ждём...')
      return
    }

    const map = new window.mapgl.Map(mapContainer.current, {
      center: [60.603, 56.838],
      zoom: 12,
      key: apiKey,
    })
    mapInstance.current = map

    try {
      const directions = new Directions(map, {
        directionsApiKey: directionsApiKey,
      })
      directionsRef.current = directions
    } catch (err) {
      console.error('Не удалось инициализировать Directions API:', err)
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
        directionsRef.current = null
      }
    }
  }, [apiKey, directionsApiKey])

  // Создание или загрузка плана
  useEffect(() => {
    if (currentPlanId) {
      axios.get(`http://localhost:8002/plans/${currentPlanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setPlaces(res.data.places))
        .catch(err => console.error(err))
    } else {
      axios.post('http://localhost:8002/plans', { name: 'Новый план' }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setCurrentPlanId(res.data.plan_id)
        navigate(`/plan/${res.data.plan_id}`, { replace: true })
      }).catch(err => console.error(err))
    }
  }, [currentPlanId, token, navigate])

  // Обновление маркеров и маршрута через Directions
  useEffect(() => {
    if (!mapInstance.current || !directionsRef.current) return

    markersRef.current.forEach(m => m.destroy())
    markersRef.current = []
    directionsRef.current.clear()

    if (places.length === 0) return

    places.forEach((place, idx) => {
      const marker = new window.mapgl.Marker(mapInstance.current, {
        coordinates: [place.lng, place.lat],
        label: { text: String(idx + 1) },
      })
      markersRef.current.push(marker)
    })

    if (places.length >= 2) {
      const points = places.map(p => [p.lng, p.lat])
      directionsRef.current.pedestrianRoute({
        points,
        routeMarker: false,
        style: { haloLineWidth: 0, substrateLineWidth: 0, routeLineWidth: 4, routeLineColor: '#007AFF' },
      }).catch(err => console.warn('Маршрут не построен:', err))
    }

    // Подгонка карты
    if (places.length > 0) {
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90
      places.forEach(p => {
        if (p.lng < minLng) minLng = p.lng
        if (p.lng > maxLng) maxLng = p.lng
        if (p.lat < minLat) minLat = p.lat
        if (p.lat > maxLat) maxLat = p.lat
      })
      const centerLng = (minLng + maxLng) / 2
      const centerLat = (minLat + maxLat) / 2
      const latDiff = maxLat - minLat
      const lngDiff = maxLng - minLng
      let zoom = 15
      if (latDiff > 0.02 || lngDiff > 0.02) zoom = 13
      if (latDiff > 0.05 || lngDiff > 0.05) zoom = 11
      if (latDiff > 0.2 || lngDiff > 0.2) zoom = 8
      mapInstance.current.setCenter([centerLng, centerLat])
      mapInstance.current.setZoom(zoom)
    }
  }, [places])

  // Добавление места в план (с проверкой на дубликат)
  const addPlaceDirectly = async (name, lat, lng) => {
    if (!currentPlanId) return
    // Проверка на дубликат по имени и близким координатам
    if (places.some(p => p.name === name &&
      Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001)) return
    try {
      await axios.post(`http://localhost:8002/plans/${currentPlanId}/places`, {
        name, lat, lng
      }, { headers: { Authorization: `Bearer ${token}` } })
      const updated = await axios.get(`http://localhost:8002/plans/${currentPlanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlaces(updated.data.places)
    } catch (err) {
      console.error('Ошибка добавления места:', err)
    }
  }

  // Отправка запроса AI (с автоматическим добавлением мест)
  const askAssistant = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    const userMessage = { role: 'user', text: aiPrompt }
    const newHistory = [...chatHistory, userMessage]
    setChatHistory(newHistory)
    setAiPrompt('')

    try {
      const res = await axios.post('http://localhost:8002/ai-assistant', {
        prompt: aiPrompt
      }, { headers: { Authorization: `Bearer ${token}` } })

      const aiMessage = { role: 'ai', text: res.data.answer }
      setChatHistory([...newHistory, aiMessage])

      if (res.data.places && res.data.places.length > 0) {
        // Сохраняем предложенные места (для отображения)
        setSuggestedPlaces(prev => {
          const existingNames = new Set(prev.map(p => p.name))
          const newUnique = res.data.places.filter(p => !existingNames.has(p.name))
          return [...prev, ...newUnique]
        })
        // Автоматически добавляем их в маршрут (на карту)
        for (const place of res.data.places) {
          await addPlaceDirectly(place.name, place.lat, place.lng)
        }
      }
    } catch (err) {
      console.error(err)
      setChatHistory([...newHistory, { role: 'ai', text: 'Ошибка запроса к ассистенту' }])
    } finally {
      setAiLoading(false)
    }
  }

  const optimizeRoute = async () => {
    if (!currentPlanId) return
    try {
      const res = await axios.post(`http://localhost:8002/plans/${currentPlanId}/optimize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlaces(res.data.optimized_route)
    } catch (err) {
      console.error('Ошибка оптимизации:', err)
    }
  }

  const clearPlaces = async () => {
    setPlaces([])
    setChatHistory([])
    setSuggestedPlaces([])
  }

  const showSummary = places.length > 0
  const totalCost = places.length * 1500 + ' ₽'

  return (
    <div className="new-plan-page">
      <header className="plan-header">
        <div className="header-logo">ДАЛЬ</div>
        <div className="header-back"><span onClick={() => navigate('/dashboard')}>← Назад к маршруту</span></div>
        <div className="header-profile"><span>👤 Иван К.</span></div>
      </header>
      <div className="plan-content">
        <div className="plan-main">
          <div className="ai-generator">
            <h2>✨ AI-генератор маршрута</h2>
            <p>Опишите, что хотите увидеть, и мы подберём оптимальный маршрут</p>
            <input type="text" className="ai-input" placeholder="Хочу поехать на 5 дней в Карелию..."
              value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAssistant()} />
            <button className="btn btn-primary ai-submit" onClick={askAssistant} disabled={aiLoading}>
              {aiLoading ? 'Думаю...' : 'Отправить'}
            </button>
            <div className="ai-tags">
              <span>+ Природа</span><span>+ Еда</span><span>+ Водопады</span><span>+ Заправки</span><span>+ Достопримечательности</span>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <div className="chat-history">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <strong>{msg.role === 'user' ? 'Вы' : 'Ассистент'}:</strong> {msg.text}
                </div>
              ))}
            </div>
          )}
          {suggestedPlaces.length > 0 && (
            <div className="suggested-places">
              <h3>Предложенные места</h3>
              {suggestedPlaces.map((place, idx) => {
                const alreadyAdded = places.some(p => p.name === place.name)
                return (
                  <div key={idx} className="place-card">
                    <div className="place-icon">📍</div>
                    <div className="place-info">
                      <h4>{place.name}</h4>
                      <p>{place.address || 'Адрес не указан'}</p>
                      <p>★ 4.9 • Бесплатно</p>
                      <span className="badge badge-success">✓ Включено</span>
                    </div>
                    {alreadyAdded ? (
                      <button className="btn btn-secondary" disabled>✓ Уже в маршруте</button>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => addPlaceDirectly(place.name, place.lat, place.lng)}>
                        Добавить в маршрут
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="plan-sidebar">
          <div className="map-wrapper"><div ref={mapContainer} className="map-container"></div></div>
          {showSummary && (
            <div className="summary-panel">
              <div className="summary-info">
                <span>Итого по маршруту:</span>
                <span className="summary-places">{places.length} мест • 2 города • Оптимизированный порядок</span>
              </div>
              <div className="summary-cost">{totalCost}</div>
              <button className="btn btn-gradient" onClick={optimizeRoute}>Оптимизировать</button>
              <button className="btn btn-primary" onClick={clearPlaces}>Очистить маршрут</button>
              <button className="btn btn-primary">Сохранить маршрут</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanPage