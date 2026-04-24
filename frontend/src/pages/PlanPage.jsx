import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'
import axios from 'axios'

function PlanPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [places, setPlaces] = useState([])
  const [planName, setPlanName] = useState('Новый план')
  const [mapState, setMapState] = useState({ center: [56.838, 60.603], zoom: 12 })
  const [selectedCoords, setSelectedCoords] = useState(null)
  const [newPlaceName, setNewPlaceName] = useState('')
  const token = localStorage.getItem('token')

  // Состояния для поиска мест
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Загрузка плана
  useEffect(() => {
    if (planId) {
      axios.get(`http://localhost:8002/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setPlanName(res.data.name)
        setPlaces(res.data.places)
      }).catch(() => alert('План не найден'))
    } else {
      axios.post('http://localhost:8002/plans', { name: 'Новый план' }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        navigate(`/plan/${res.data.plan_id}`, { replace: true })
      })
    }
  }, [planId])

  const addPlace = async () => {
    if (!selectedCoords || !newPlaceName.trim()) return
    const [lat, lng] = selectedCoords
    try {
      await axios.post(`http://localhost:8002/plans/${planId}/places`, {
        name: newPlaceName,
        lat,
        lng
      }, { headers: { Authorization: `Bearer ${token}` } })
      const updated = await axios.get(`http://localhost:8002/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlaces(updated.data.places)
      setNewPlaceName('')
      setSelectedCoords(null)
    } catch (err) {
      console.error('Ошибка добавления места:', err)
      alert('Не удалось добавить место')
    }
  }

  const optimize = async () => {
    console.log('Оптимизация запрошена, planId:', planId)
    try {
      const res = await axios.post(`http://localhost:8002/plans/${planId}/optimize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Ответ оптимизации:', res.data)
      setPlaces(res.data.optimized_route)
    } catch (err) {
      console.error('Ошибка оптимизации:', err)
      alert('Не удалось оптимизировать маршрут')
    }
  }

  const onMapClick = (e) => {
    const coords = e.get('coords')
    setSelectedCoords(coords)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await axios.get('http://localhost:8002/places/search', {
        params: { q: searchQuery }
      })
      setSearchResults(res.data)
    } catch (err) {
      console.error('Ошибка поиска мест:', err)
      alert('Ошибка поиска мест')
    }
  }

  return (
    <div>
      <h2>{planName}</h2>
      <div style={{display: 'flex'}}>
        <div style={{width: '70%'}}>
          <YMaps query={{ apikey: '8240c0ae-a29d-4c72-b396-fd7631b79bc7' }}>
            <Map
              state={mapState}
              width="100%"
              height="500px"
              onClick={onMapClick}
            >
              {places.map((p, i) => (
                <Placemark key={i} geometry={[p.lat, p.lng]} properties={{balloonContent: p.name}} />
              ))}
              {selectedCoords && <Placemark geometry={selectedCoords} properties={{balloonContent: 'Новое место'}} />}
            </Map>
          </YMaps>
        </div>
        <div style={{width: '30%', paddingLeft: '10px'}}>
          <button onClick={optimize}>Оптимизировать маршрут</button>
          
          {/* Блок поиска мест */}
          <h3>Поиск мест</h3>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск места" />
          <button onClick={handleSearch}>Искать</button>
          <div style={{maxHeight: '150px', overflowY: 'auto', marginTop: '5px'}}>
            {searchResults.map((place, idx) => (
              <div key={idx} style={{margin: '5px 0', padding: '5px', border: '1px solid #ddd'}}>
                <b>{place.name}</b> ({place.category})
                <button onClick={() => {
                  axios.post(`http://localhost:8002/plans/${planId}/places`, {
                    name: place.name,
                    lat: place.lat,
                    lng: place.lng
                  }, { headers: { Authorization: `Bearer ${token}` } })
                  .then(() => {
                    return axios.get(`http://localhost:8002/plans/${planId}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                  })
                  .then(res => setPlaces(res.data.places))
                  .catch(err => console.error(err))
                }}>Добавить</button>
              </div>
            ))}
          </div>

          <h3>Места в плане</h3>
          <ul>
            {places.map((p,i) => <li key={i}>{p.name} ({p.lat.toFixed(3)}, {p.lng.toFixed(3)})</li>)}
          </ul>
          {selectedCoords && (
            <div>
              <input value={newPlaceName} onChange={e => setNewPlaceName(e.target.value)} placeholder="Название места" />
              <button onClick={addPlace}>Добавить</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanPage