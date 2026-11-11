import { useEffect, useState } from 'react'
import './Performance.css'

const metricInfo = [
  {
    key: 'accuracy',
    label: 'Accuracy',
    description: 'Overall correct predictions',
  },
  {
    key: 'precision',
    label: 'Precision',
    description: 'How many predicted fires were correct',
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'How many actual fires were detected',
  },
  {
    key: 'f1_score',
    label: 'F1-score',
    description: 'Balance between precision and recall',
  },
]

function percentage(value) {
  return `${(value * 100).toFixed(2)}%`
}

function Performance() {
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState(null)
  const [comparisonError, setComparisonError] = useState('')

  useEffect(() => {
    let active = true

    async function loadEvaluation() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/evaluation')

        if (!response.ok) {
          throw new Error('Could not load model evaluation data.')
        }

        const data = await response.json()

        if (active) {
          setEvaluation(data)
          setError('')
        }
      } catch {
        if (active) {
          setError('Unable to connect to the evaluation API. Make sure the backend server is running.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    async function loadComparison() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/model-comparison')

        if (!response.ok) {
          throw new Error('Could not load model comparison data.')
        }

        const data = await response.json()

        if (active) {
          setComparison(data)
          setComparisonError('')
        }
      } catch {
        if (active) {
          setComparisonError('Model comparison is currently unavailable. Please check the backend server.')
        }
      }
    }

    loadEvaluation()
    loadComparison()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <main className="page-content performance-page">
        <p className="eyebrow">MODEL EVALUATION</p>
        <h1 className="performance-title">Model performance</h1>
        <p className="performance-message">Loading evaluation results...</p>
      </main>
    )
  }

  if (error || !evaluation) {
    return (
      <main className="page-content performance-page">
        <p className="eyebrow">MODEL EVALUATION</p>
        <h1 className="performance-title">Model performance</h1>
        <div className="performance-error">
          <p>{error || 'Evaluation data is unavailable.'}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    )
  }

  const { metrics, confusion_matrix: matrix, classification_report: report } = evaluation

  const matrixCells = [
    { label: 'True Negative', value: matrix.true_negative, detail: 'Correctly predicted no fire' },
    { label: 'False Positive', value: matrix.false_positive, detail: 'No fire predicted as fire' },
    { label: 'False Negative', value: matrix.false_negative, detail: 'Fire predicted as no fire' },
    { label: 'True Positive', value: matrix.true_positive, detail: 'Correctly predicted fire' },
  ]

  const aucMetrics = [
    { label: 'ROC-AUC', value: metrics.roc_auc, description: 'Ability to distinguish between the two classes' },
    { label: 'PR-AUC', value: metrics.pr_auc, description: 'Precision-recall performance across thresholds' },
    { label: 'Balanced accuracy', value: metrics.balanced_accuracy, description: 'Average recall across both classes' },
  ]

  return (
    <main className="page-content performance-page">
      <section className="performance-intro">
        <p className="eyebrow">BEHIND THE PREDICTIONS</p>
        <h1 className="performance-title">Model performance</h1>
        <p>
          A closer look at how the trained Random Forest model performed on
          historical data it was not trained on.
        </p>
      </section>

      <section className="evaluation-meta" aria-label="Evaluation details">
        <div>
          <span>MODEL</span>
          <strong>{evaluation.model}</strong>
        </div>
        <div>
          <span>TEST RECORDS</span>
          <strong>{evaluation.test_rows.toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <span>TEST PERIOD</span>
          <strong>{evaluation.test_date_start} to {evaluation.test_date_end}</strong>
        </div>
        <div>
          <span>DECISION THRESHOLD</span>
          <strong>{percentage(evaluation.threshold)}</strong>
        </div>
      </section>

      <section className="performance-section">
        <div className="performance-section-heading">
          <div>
            <p className="eyebrow">CORE METRICS</p>
            <h2>How well did it perform?</h2>
          </div>
          <span className="section-side-note">Held-out test data</span>
        </div>

        <div className="metric-grid">
          {metricInfo.map((metric) => (
            <article className="metric-item" key={metric.key}>
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{percentage(metrics[metric.key])}</strong>
              <p>{metric.description}</p>
              <div className="metric-track">
                <span style={{ width: `${metrics[metric.key] * 100}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="performance-section">
        <div className="performance-section-heading">
          <div>
            <p className="eyebrow">CLASSIFICATION RESULTS</p>
            <h2>Confusion matrix</h2>
            <p className="section-description">
              A comparison of actual labels with the model's predicted labels.
            </p>
          </div>
        </div>

        <div className="matrix-wrap">
          <div className="matrix-axis-label">Predicted label</div>
          <div className="matrix-content">
            <div className="matrix-y-label">Actual label</div>
            <div className="matrix-table">
              <div className="matrix-column-head">
                <span />
                <span>No Fire</span>
                <span>Fire</span>
              </div>
              <div className="matrix-row">
                <strong>No Fire</strong>
                <div className="matrix-cell correct">
                  <strong>{matrix.true_negative}</strong>
                  <span>True Negative</span>
                </div>
                <div className="matrix-cell incorrect">
                  <strong>{matrix.false_positive}</strong>
                  <span>False Positive</span>
                </div>
              </div>
              <div className="matrix-row">
                <strong>Fire</strong>
                <div className="matrix-cell incorrect">
                  <strong>{matrix.false_negative}</strong>
                  <span>False Negative</span>
                </div>
                <div className="matrix-cell correct">
                  <strong>{matrix.true_positive}</strong>
                  <span>True Positive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="matrix-explanation">
          {matrixCells.map((cell) => (
            <div key={cell.label}>
              <strong>{cell.value.toLocaleString('en-IN')}</strong>
              <span>{cell.label}</span>
              <p>{cell.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="performance-section">
        <div className="performance-section-heading">
          <div>
            <p className="eyebrow">ADDITIONAL MEASURES</p>
            <h2>Looking beyond accuracy</h2>
          </div>
        </div>

        <div className="auc-list">
          {aucMetrics.map((item) => (
            <div className="auc-item" key={item.label}>
              <div className="auc-heading">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                <strong>{percentage(item.value)}</strong>
              </div>
              <div className="metric-track">
                <span style={{ width: `${item.value * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="performance-section report-section">
        <div className="performance-section-heading">
          <div>
            <p className="eyebrow">CLASS-WISE BREAKDOWN</p>
            <h2>Classification report</h2>
            <p className="section-description">
              Precision, recall and F1-score for each predicted class.
            </p>
          </div>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-score</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'No Fire', data: report.no_fire },
                { label: 'Fire', data: report.fire },
                { label: 'Macro average', data: report.macro_avg },
                { label: 'Weighted average', data: report.weighted_avg },
              ].map((item) => (
                <tr key={item.label}>
                  <th>{item.label}</th>
                  <td>{percentage(item.data.precision)}</td>
                  <td>{percentage(item.data.recall)}</td>
                  <td>{percentage(item.data['f1-score'])}</td>
                  <td>{item.data.support.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {comparison && (
        <section className="performance-section comparison-section">
          <div className="performance-section-heading">
            <div>
              <p className="eyebrow">MODEL COMPARISON</p>
              <h2>Logistic Regression vs Random Forest</h2>
              <p className="section-description">
                Both models were tested on the same historical records, features
                and decision threshold.
              </p>
            </div>
          </div>

          <div className="comparison-meta">
            <span>Training cutoff: <strong>{comparison.training_cutoff}</strong></span>
            <span>Test records: <strong>{comparison.test_rows.toLocaleString('en-IN')}</strong></span>
            <span>Threshold: <strong>{percentage(comparison.threshold)}</strong></span>
          </div>

          <div className="report-table-wrap comparison-table-wrap">
            <table className="report-table comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {comparison.models.map((model) => (
                    <th key={model.name}>{model.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'accuracy', label: 'Accuracy' },
                  { key: 'balanced_accuracy', label: 'Balanced accuracy' },
                  { key: 'precision', label: 'Precision' },
                  { key: 'recall', label: 'Recall' },
                  { key: 'f1_score', label: 'F1-score' },
                  { key: 'pr_auc', label: 'PR-AUC' },
                  { key: 'roc_auc', label: 'ROC-AUC' },
                ].map((metric) => (
                  <tr key={metric.key}>
                    <th>{metric.label}</th>
                    {comparison.models.map((model) => (
                      <td key={model.name}>
                        {percentage(model.metrics[metric.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="comparison-bars">
            {[
              { key: 'accuracy', label: 'Accuracy' },
              { key: 'balanced_accuracy', label: 'Balanced accuracy' },
              { key: 'precision', label: 'Precision' },
              { key: 'recall', label: 'Recall' },
              { key: 'f1_score', label: 'F1-score' },
              { key: 'pr_auc', label: 'PR-AUC' },
              { key: 'roc_auc', label: 'ROC-AUC' },
            ].map((metric) => (
              <div className="comparison-bar-item" key={metric.key}>
                <strong>{metric.label}</strong>
                {comparison.models.map((model) => (
                  <div className="comparison-bar-row" key={model.name}>
                    <span>{model.name === 'Logistic Regression' ? 'LR' : 'RF'}</span>
                    <div className="comparison-bar-track">
                      <div
                        className={`comparison-bar-fill ${model.name === 'Random Forest' ? 'forest-fill' : 'logistic-fill'}`}
                        style={{ width: `${model.metrics[metric.key] * 100}%` }}
                      />
                    </div>
                    <span>{percentage(model.metrics[metric.key])}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="comparison-matrices">
            {comparison.models.map((model) => (
              <div className="comparison-matrix" key={model.name}>
                <h3>{model.name}</h3>
                <div className="comparison-matrix-grid">
                  <div>
                    <strong>{model.confusion_matrix.true_negative}</strong>
                    <span>True Negative</span>
                  </div>
                  <div>
                    <strong>{model.confusion_matrix.false_positive}</strong>
                    <span>False Positive</span>
                  </div>
                  <div>
                    <strong>{model.confusion_matrix.false_negative}</strong>
                    <span>False Negative</span>
                  </div>
                  <div>
                    <strong>{model.confusion_matrix.true_positive}</strong>
                    <span>True Positive</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="comparison-insight">
            Random Forest performs better on 6 of the 7 metrics. Logistic
            Regression has higher recall, detecting more actual fire cases
            at the selected threshold.
          </p>

          <p className="comparison-disclaimer">{comparison.note}</p>
        </section>
      )}

      {comparisonError && (
        <p className="performance-message">{comparisonError}</p>
      )}

      <section className="evaluation-note">
        <strong>How to read these results</strong>
        <p>
          The model was trained using data before {evaluation.training_cutoff}
          {' '}and evaluated on later historical records. These metrics describe
          performance on this particular dataset and test period. They are not
          verified real-world wildfire probabilities or official fire warnings.
        </p>
      </section>
    </main>
  )
}

export default Performance
