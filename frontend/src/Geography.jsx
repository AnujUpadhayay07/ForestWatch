import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Geography.css'
import { API_URL } from './api'

function formatDate(timestamp) {
  if (!timestamp) return 'Not available'

  return new Date(Number(timestamp)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}



function MapBounds({ features }) {
  const map = useMap()

  useEffect(() => {
    if (!features || features.length === 0) return

    const featureCollection = {
      type: 'FeatureCollection',
      features,
    }

    const bounds = L.geoJSON(featureCollection).getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 9,
      })
    }
  }, [features, map])

  return null
}
function Geography() {
  const [fireData, setFireData] = useState(null)
  const [selectedFire, setSelectedFire] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFireData() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `${API_URL}/api/fire-perimeters`,
          { signal: controller.signal }
        )

        let data

        try {
          data = await response.json()
        } catch {
          throw new Error('The fire perimeter service returned an invalid response.')
        }

        if (!response.ok) {
          throw new Error(
            typeof data.detail === 'string'
              ? data.detail
              : 'Unable to load fire perimeter data.'
          )
        }

        if (!data || !Array.isArray(data.features)) {
          throw new Error('The fire perimeter service returned incomplete data.')
        }

        setFireData(data)
        setSelectedFire(null)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Could not connect to the fire perimeter service.')
          setFireData(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadFireData()

    return () => controller.abort()
  }, [refreshKey])

  const filteredFeatures = useMemo(() => {
    if (!fireData) return []

    const query = search.trim().toLowerCase()

    if (!query) return fireData.features

    return fireData.features.filter((feature) =>
      (feature.properties.FIRE_NAME || '').toLowerCase().includes(query)
    )
  }, [fireData, search])

  const visibleData = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredFeatures,
  }), [filteredFeatures])

  const selectedProperties = selectedFire?.properties

  function fireStyle(feature) {
    const isSelected =
      selectedFire &&
      (feature.properties.IRWINID
        ? feature.properties.IRWINID === selectedFire.properties.IRWINID
        : feature.properties.FIRE_NAME === selectedFire.properties.FIRE_NAME)

    return {
      color: isSelected ? '#8f321e' : '#a34f37',
      weight: isSelected ? 3.5 : 2,
      opacity: 1,
      fillColor: isSelected ? '#e87942' : '#d58a55',
      fillOpacity: isSelected ? 0.55 : 0.35,
    }
  }

  function handleEachFeature(feature, layer) {
    const name = feature.properties.FIRE_NAME || 'Unnamed fire'

    layer.bindTooltip(name, {
      sticky: true,
      direction: 'top',
    })

    layer.on({
      click: () => setSelectedFire(feature),
    })
  }

  return (
    <main className="page-content geography-page">
      <section className="geography-intro">
        <p className="eyebrow">CALIFORNIA FIRE PERIMETER EXPLORER</p>
        <h1 className="geography-title">Explore the fire landscape.</h1>
        <p>
          Explore recorded wildfire boundaries across California using
          historical CAL FIRE perimeter records.
        </p>
      </section>

      {loading && (
        <p className="geography-message">Loading California fire boundaries...</p>
      )}

      {!loading && error && (
        <div className="geography-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && fireData && (
        <>
          <section className="geography-toolbar">
            <div className="geography-search">
              <label htmlFor="fire-search">SEARCH FIRE NAME</label>
              <input
                id="fire-search"
                type="search"
                placeholder="e.g. PARK, POND, RIDGE"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSelectedFire(null)
                }}
              />
            </div>

            <div className="geography-count">
              <strong>{filteredFeatures.length}</strong>
              <span>of {fireData.total_features} fire records</span>
            </div>
          </section>

          <section className="geography-map-section">
            <div className="geography-map-heading">
              <div>
                <p className="eyebrow">HISTORICAL GEOGRAPHIC DATA</p>
                <h2>California - 2024</h2>
              </div>
              <span className="map-year-label">CAL FIRE</span>
            </div>

            <div className="geography-map">
              <MapContainer
                center={[37.2, -119.5]}
                zoom={5.5}
                scrollWheelZoom
                className="fire-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBounds features={filteredFeatures} />

                <GeoJSON
                  key={`${search}-${selectedProperties?.IRWINID || selectedProperties?.FIRE_NAME || 'all'}`}
                  data={visibleData}
                  style={fireStyle}
                  onEachFeature={handleEachFeature}
                />
              </MapContainer>
            </div>

            <div className="geography-legend">
              <span className="legend-item">
                <span className="legend-swatch fire-swatch" />
                Recorded fire perimeter
              </span>
              <span className="legend-item">
                <span className="legend-swatch selected-swatch" />
                Selected fire
              </span>
            </div>
          </section>

          <section className="fire-details">
            <div className="fire-details-heading">
              <div>
                <p className="eyebrow">FIRE RECORD DETAILS</p>
                <h2>{selectedProperties?.FIRE_NAME || 'Select a fire perimeter'}</h2>
              </div>
              {selectedProperties && (
                <button
                  type="button"
                  className="clear-selection"
                  onClick={() => setSelectedFire(null)}
                >
                  Clear selection
                </button>
              )}
            </div>

            {selectedProperties ? (
              <div className="fire-detail-grid">
                <div>
                  <span>Acres burned</span>
                  <strong>
                    {Number(selectedProperties.GIS_ACRES || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 1,
                    })} acres
                  </strong>
                </div>
                <div>
                  <span>Alarm date</span>
                  <strong>{formatDate(selectedProperties.ALARM_DATE)}</strong>
                </div>
                <div>
                  <span>Containment date</span>
                  <strong>{formatDate(selectedProperties.CONT_DATE)}</strong>
                </div>
                <div>
                  <span>Record year</span>
                  <strong>{selectedProperties.YEAR_ || '2024'}</strong>
                </div>
              </div>
            ) : (
              <p className="fire-empty-state">
                Click any fire boundary on the map to inspect its recorded
                name, area and dates.
              </p>
            )}
          </section>

          <p className="geography-source">
            Source: {fireData.source} - Historical perimeter records - {fireData.year}
          </p>
          <p className="geography-disclaimer">
            These boundaries represent historical recorded fire perimeters.
            They do not show active fires, current danger zones or ForestWatch
            model predictions. This page is for educational exploration only.
          </p>
        </>
      )}
    </main>
  )
}

export default Geography
