import { useEffect, useState } from 'react'
import './Weather.css'

const locations = [
  'Los Angeles',
  'San Francisco',
  'Sacramento',
  'San Diego',
  'Redding',
]

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function Weather() {
  const [location, setLocation] = useState('Los Angeles')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeather() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/weather?location=${encodeURIComponent(location)}`,
          { signal: controller.signal }
        )

        let data

        try {
          data = await response.json()
        } catch {
          throw new Error(
            'The weather service returned an invalid response. Please try again later.'
          )
        }

        if (!response.ok) {
          throw new Error(
            typeof data.detail === 'string'
              ? data.detail
              : 'Unable to load weather data. Please try again.'
          )
        }

        if (!data || !data.current || !Array.isArray(data.history)) {
          throw new Error('The weather service returned incomplete data.')
        }

        setWeather(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Could not connect to the weather service.')
          setWeather(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadWeather()

    return () => controller.abort()
  }, [location, refreshKey])

  const current = weather?.current
  const history = weather?.history || []

  return (
    <main className="page-content weather-page">
      <section className="weather-intro">
        <p className="eyebrow">CALIFORNIA WEATHER EXPLORER</p>
        <h1 className="weather-title">Weather, right now.</h1>
        <p>
          Explore current weather conditions and recent daily observations
          across selected locations in California.
        </p>
      </section>

      <section className="weather-controls">
        <div className="weather-location-control">
          <label htmlFor="weather-location">SELECT LOCATION</label>
          <select
            id="weather-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            {locations.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <button
          className="weather-refresh"
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh weather'}
        </button>
      </section>

      {loading && (
        <p className="weather-message">Fetching the latest weather data...</p>
      )}

      {!loading && error && (
        <div className="weather-error">
          <p>{error}</p>
          <button onClick={() => setRefreshKey((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && weather && (
        <>
          <section className="current-weather">
            <div className="current-weather-main">
              <p className="weather-small-label">CURRENT CONDITIONS</p>
              <h2>{weather.location}</h2>
              <p className="current-condition">{current.condition}</p>
              <strong className="current-temperature">
                {current.temperature ?? '--'}°F
              </strong>
              <p className="feels-like">
                Feels like {current.feels_like ?? '--'}°F
              </p>
            </div>

            <div className="current-weather-details">
              <div>
                <span>Humidity</span>
                <strong>{current.humidity ?? '--'}%</strong>
              </div>
              <div>
                <span>Wind speed</span>
                <strong>{current.wind_speed ?? '--'} mph</strong>
              </div>
              <div>
                <span>Precipitation</span>
                <strong>{current.precipitation ?? '--'} in</strong>
              </div>
            </div>
          </section>

          <section className="weather-history">
            <div className="weather-section-heading">
              <div>
                <p className="eyebrow">RECENT OBSERVATIONS</p>
                <h2>Last 7 complete days</h2>
              </div>
              <span>Daily weather</span>
            </div>

            <div className="weather-table-wrap">
              <table className="weather-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Conditions</th>
                    <th>Max temp.</th>
                    <th>Min temp.</th>
                    <th>Rainfall</th>
                    <th>Max wind</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((day) => (
                    <tr key={day.date}>
                      <td>{formatDate(day.date)}</td>
                      <td>{day.condition}</td>
                      <td>{day.max_temperature ?? '--'}°F</td>
                      <td>{day.min_temperature ?? '--'}°F</td>
                      <td>{day.precipitation ?? '--'} in</td>
                      <td>{day.max_wind_speed ?? '--'} mph</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="weather-source">
            Weather source: {weather.source} · Time zone: {weather.timezone}
          </p>
          <p className="weather-disclaimer">
            This page is for weather exploration only. These observations are
            not connected to the ForestWatch fire prediction model and should
            not be used for emergency decisions.
          </p>
        </>
      )}
    </main>
  )
}

export default Weather
