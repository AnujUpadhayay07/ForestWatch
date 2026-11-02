
import { useEffect, useState } from 'react'
import './Predictor.css'

const API_URL = 'http://127.0.0.1:8000'

const initialForm = {
  previous_day_precipitation: '',
  previous_day_max_temp: '',
  previous_day_min_temp: '',
  previous_day_avg_wind_speed: '',
  previous_7d_precipitation_sum: '',
  previous_7d_wind_speed_mean: '',
  target_month: '',
  target_day_of_year: '',
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json()
      })
      .then((data) => {
        setApiStatus(data.model_file_exists ? 'connected' : 'model-missing')
      })
      .catch(() => setApiStatus('offline'))
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)

    const numericValues = Object.values(form).map(Number)
    if (numericValues.some((value) => !Number.isFinite(value))) {
      setError('Please enter a valid number in every field.')
      return
    }

    if (Number(form.previous_day_max_temp) < Number(form.previous_day_min_temp)) {
      setError('Maximum temperature must be greater than or equal to minimum temperature.')
      return
    }

    if (Number(form.previous_day_max_temp) === 0) {
      setError('Maximum temperature cannot be zero for this model.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previous_day_precipitation: Number(form.previous_day_precipitation),
          previous_day_max_temp: Number(form.previous_day_max_temp),
          previous_day_min_temp: Number(form.previous_day_min_temp),
          previous_day_avg_wind_speed: Number(form.previous_day_avg_wind_speed),
          previous_7d_precipitation_sum: Number(form.previous_7d_precipitation_sum),
          previous_7d_wind_speed_mean: Number(form.previous_7d_wind_speed_mean),
          target_month: Number(form.target_month),
          target_day_of_year: Number(form.target_day_of_year),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Please check your inputs and try again.',
        )
      }

      setResult(data)
    } catch (err) {
      setError(
        err.message.includes('fetch')
          ? 'Cannot reach the API. Check that FastAPI is running on port 8000.'
          : err.message,
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(initialForm)
    setResult(null)
    setError('')
  }

  const isFireLabel = result?.prediction === 1
  const score = result?.risk_score_percent ?? 0

  return (
    <div className="site-shell">


      <main id="home">
        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow"><span /> WEATHER-BASED ML PROJECT</p>
            <h1>Read the weather.<br /><em>Understand the risk.</em></h1>
            <p className="intro-text">
              Explore how recent weather conditions relate to the model prediction
              of a fire-start label for a selected day.
            </p>
            <a className="text-link" href="#predict">
              Try a prediction
            </a>
          </div>
          <div className="landscape" aria-label="Stylised forest landscape">
            <div className="sun" />
            <div className="ridge ridge-back" />
            <div className="ridge ridge-front" />
            <div className="tree-line">
              {Array.from({ length: 11 }, (_, index) => (
                <span
                  className={`tree tree-${index % 3}`}
                  key={index}
                  style={{ left: `${index * 9.5}%` }}
                />
              ))}
            </div>
            <div className="landscape-caption">
              <span>FIELD NOTES / 01</span>
              <span>Weather Â· California dataset</span>
            </div>
          </div>
        </section>

        <section className="project-strip" aria-label="Project details">
          <div><span className="strip-label">MODEL</span><strong>Random Forest</strong></div>
          <div><span className="strip-label">FORECAST TYPE</span><strong>Next-day label</strong></div>
          <div><span className="strip-label">INPUTS</span><strong>Weather + calendar</strong></div>
          <div><span className="strip-label">PURPOSE</span><strong>Educational research</strong></div>
        </section>

        <section className="workspace" id="predict">
          <div className="form-column">
            <div className="section-heading">
              <span className="section-number">01 / INPUT</span>
              <h2>Conditions to explore</h2>
              <p>Enter the previous day's weather and the rolling 7-day measurements.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <h3><span className="field-icon" aria-hidden="true"></span> Previous day</h3>
                <div className="form-grid">
                  <label>
                    Maximum temperature
                    <span className="input-wrap">
                      <input name="previous_day_max_temp" type="number" step="any" required value={form.previous_day_max_temp} onChange={handleChange} />
                      <span>°F</span>
                    </span>
                  </label>
                  <label>
                    Minimum temperature
                    <span className="input-wrap">
                      <input name="previous_day_min_temp" type="number" step="any" required value={form.previous_day_min_temp} onChange={handleChange} />
                      <span>°F</span>
                    </span>
                  </label>
                  <label>
                    Precipitation
                    <span className="input-wrap">
                      <input name="previous_day_precipitation" type="number" min="0" step="any" required value={form.previous_day_precipitation} onChange={handleChange} />
                      <span>in</span>
                    </span>
                  </label>
                  <label>
                    Average wind speed
                    <span className="input-wrap">
                      <input name="previous_day_avg_wind_speed" type="number" min="0" step="any" required value={form.previous_day_avg_wind_speed} onChange={handleChange} />
                      <span>mph</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="field-group">
                <h3><span className="field-icon" aria-hidden="true"></span> Previous 7 days</h3>
                <div className="form-grid">
                  <label>
                    Total precipitation
                    <span className="input-wrap">
                      <input name="previous_7d_precipitation_sum" type="number" min="0" step="any" required value={form.previous_7d_precipitation_sum} onChange={handleChange} />
                      <span>in</span>
                    </span>
                  </label>
                  <label>
                    Average wind speed
                    <span className="input-wrap">
                      <input name="previous_7d_wind_speed_mean" type="number" min="0" step="any" required value={form.previous_7d_wind_speed_mean} onChange={handleChange} />
                      <span>mph</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="field-group">
                <h3><span className="field-icon" aria-hidden="true"></span> Day being predicted</h3>
                <div className="form-grid">
                  <label>
                    Month
                    <select name="target_month" required value={form.target_month} onChange={handleChange}>
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December',
                      ].map((month, index) => (
                        <option value={index + 1} key={month}>{month}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Day of year
                    <span className="input-wrap">
                      <input name="target_day_of_year" type="number" min="1" max="366" required value={form.target_day_of_year} onChange={handleChange} />
                      <span>/ 366</span>
                    </span>
                  </label>
                </div>
                <p className="field-help">Day of year: 1 = January 1, 365 = December 31 (non-leap year).</p>
              </div>

              {error && <p className="error-message" role="alert">{error}</p>}

              <div className="form-actions">
                <button className="predict-button" type="submit" disabled={loading}>
                  {loading ? 'Running model...' : 'Run prediction'} 
                </button>
                <button className="reset-button" type="button" onClick={resetForm}>Reset values</button>
              </div>
            </form>
          </div>

          <aside className="result-column" aria-live="polite">
            <div className="result-topline">
              <span className="section-number">02 / OUTPUT</span>
              <span className="result-tag">MODEL RESULT</span>
            </div>

            {!result && !loading && (
              <div className="empty-result">
                <div className="empty-symbol"><span>F</span><span>?</span></div>
                <p className="result-kicker">YOUR RESULT WILL APPEAR HERE</p>
                <h2>Ready when<br />you are.</h2>
                <p>Adjust the weather values and run the model to see its output for the selected day.</p>
              </div>
            )}

            {loading && (
              <div className="empty-result loading-result">
                <div className="loader-mark" />
                <p className="result-kicker">PROCESSING INPUTS</p>
                <h2>Reading the<br />conditionsâ€¦</h2>
              </div>
            )}

            {result && (
              <div className="prediction-result">
                <p className="result-kicker">PREDICTED DATASET LABEL</p>
                <div className={`prediction-symbol ${isFireLabel ? 'fire' : 'clear'}`}>
                  {isFireLabel ? '!' : 'âœ“'}
                </div>
                <h2>{isFireLabel ? 'Fire-start label' : 'No fire-start label'}</h2>
                <p className="prediction-description">{result.predicted_label}</p>

                <div className="score-heading">
                  <span>Model score</span>
                  <strong>{Number(score).toFixed(2)}%</strong>
                </div>
                <div className="score-track" role="meter" aria-label="Model score" aria-valuemin="0" aria-valuemax="100" aria-valuenow={score}>
                  <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
                <div className="score-scale"><span>0%</span><span>100%</span></div>

                <div className="threshold-row">
                  <span>Classification threshold</span>
                  <strong>{(Number(result.threshold) * 100).toFixed(0)}%</strong>
                </div>
                <p className="result-note">{result.note}</p>
                <button className="reset-button result-reset" onClick={() => setResult(null)} type="button">
                  Run another test
                </button>
              </div>
            )}

            <div className="result-footnote">
              <span>i</span>
              <p>This is a classroom ML experiment, not an official fire alert or a verified real-world probability.</p>
            </div>
          </aside>
        </section>

        <section className="about-section" id="about">
          <div>
            <span className="section-number">03 / CONTEXT</span>
            <h2>A model is a tool<br />for asking better questions.</h2>
          </div>
          <div className="about-copy">
            <p>
              This project uses a Random Forest classifier trained on historical
              California weather and fire-start labels. It considers recent weather
              summaries and calendar features to estimate which label the dataset
              model would assign.
            </p>
            <p>
              Historical labels may be incomplete or inconsistent. The score shown
              here should not be interpreted as an operational wildfire forecast.
            </p>
          </div>
        </section>
      </main>

    </div>
  )
}

export default App








