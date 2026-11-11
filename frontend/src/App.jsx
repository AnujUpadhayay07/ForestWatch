
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import Predictor from './Predictor.jsx'
import Performance from './Performance.jsx'
import Weather from './Weather.jsx'
import Geography from './Geography.jsx'
import './App.css'

function Home() {
  const steps = [
    {
      number: '01',
      title: 'Choose weather conditions',
      description:
        'Enter temperature, precipitation and wind information for the day you want to explore.',
    },
    {
      number: '02',
      title: 'Add recent weather context',
      description:
        'Include recent precipitation and average wind speed to provide additional context to the model.',
    },
    {
      number: '03',
      title: 'Run the prediction',
      description:
        'The trained Random Forest model analyses the inputs and estimates the likelihood of a fire-start label.',
    },
    {
      number: '04',
      title: 'Explore the result',
      description:
        'Review the model score and predicted class. Use the result for learning and experimentation, not as an official fire warning.',
    },
  ]

  return (
    <main className="page-content home-page">
      <section className="hero-section">
        <p className="eyebrow">A MACHINE LEARNING PROJECT</p>
        <h1>
          Understanding wildfire risk,
          <br />
          <span>one forecast at a time.</span>
        </h1>
        <p className="hero-description">
          Explore how weather conditions relate to fire-start predictions
          using a machine learning model trained on historical California data.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/predict">
            Try the prediction tool <span aria-hidden="true"></span>
          </Link>
          <a className="text-link" href="#how-it-works">
            See how it works 
          </a>
        </div>

        <div className="hero-note">
          <span className="status-dot" />
          Historical weather data · Random Forest model · Educational use
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">FROM INPUT TO INSIGHT</p>
          <h2>How it works</h2>
          <p>Four simple steps explain what happens behind a prediction.</p>
        </div>

        <div className="steps-list">
          {steps.map((step) => (
            <article className="step-item" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-bottom">
        <div>
          <p className="eyebrow">READY TO EXPLORE?</p>
          <h2>Put the weather inputs to the test.</h2>
          <p>Change the conditions and compare the model's output.</p>
        </div>
        <Link className="primary-button" to="/predict">
          Open predictor <span aria-hidden="true"></span>
        </Link>
      </section>
    </main>
  )
}

function FutureUpdates() {
  const plannedFeatures = [
    {
      title: 'Model improvement',
      description:
        'Evaluate additional data sources and validation methods to improve reliability.',
    },
    {
      title: 'Historical trend analysis',
      description:
        'Compare weather patterns and recorded fire activity across different years.',
    },
  ]

  return (
    <main className="page-content updates-page">
      <section className="updates-intro">
        <p className="eyebrow">THE ROAD AHEAD</p>
        <h1>Future updates</h1>
        <p>
          Ideas for the next versions of ForestWatch. These are planned
          improvements, not features currently available in the application.
        </p>
      </section>

      <section className="roadmap-list" aria-label="Planned features">
        {plannedFeatures.map((feature, index) => (
          <article className="roadmap-item" key={feature.title}>
            <span className="roadmap-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
            <span className="planned-label">Planned</span>
          </article>
        ))}
      </section>

      <Link className="text-link back-link" to="/">
        ← Back to home
      </Link>
    </main>
  )
}

function NotFound() {
  return (
    <main className="page-content not-found">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>This trail ends here.</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="primary-button" to="/">
        Return home
      </Link>
    </main>
  )
}

function SiteLayout() {
  const location = useLocation()
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="ForestWatch home">
          <span className="brand-mark" aria-hidden="true">FW</span>
          <span>ForestWatch<span className="brand-period">.</span></span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Home
          </NavLink>
          <NavLink to="/predict" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Predict
          </NavLink>
          <NavLink to="/performance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Performance
          </NavLink>
          <NavLink to="/weather" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Live Weather
          </NavLink>
          <NavLink to="/geography" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Geographic Exploration
          </NavLink>
          <NavLink to="/future-updates" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Future Updates
          </NavLink>
        </nav>

        {location.pathname !== '/predict' && (
          <Link className="header-cta" to="/predict">
            Try predictor
          </Link>
        )}
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<Predictor />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/geography" element={<Geography />} />
        <Route path="/future-updates" element={<FutureUpdates />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <footer className="site-footer">
        <Link to="/" className="footer-brand">forestwatch.</Link>
        <p>A student ML project exploring weather and wildfire data.</p>
        <Link to="/future-updates" className="footer-link">
          Future Updates <span aria-hidden="true"></span>
        </Link>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteLayout />
    </BrowserRouter>
  )
}
