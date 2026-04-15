import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

import './App.css'
import { ChartStage } from './charts'
import {
  buildSampleDataset,
  formatValue,
  getNumericColumns,
  parseCsvText,
  parseJsonText,
} from './data-utils'
import type { ChartConfig, ChartType, Dataset } from './types'

const sampleCsv = `Quarter,Revenue,Profit,Costs
Q1,22,8,14
Q2,28,10,18
Q3,34,13,21
Q4,42,16,26`

const sampleJson = JSON.stringify(buildSampleDataset(), null, 2)

const chartOptions: Array<{
  value: ChartType
  label: string
  description: string
}> = [
  {
    value: 'bar-single',
    label: 'Bar Chart (Single)',
    description: 'One mustard series with direct labels.',
  },
  {
    value: 'bar-dual',
    label: 'Bar Chart (Dual)',
    description: 'Two bars per category with negative support.',
  },
  {
    value: 'stacked-bar',
    label: 'Stacked Bar',
    description: 'Stacked categories with fixed palette layers.',
  },
  {
    value: 'line',
    label: 'Line Chart',
    description: 'One straight line with circular markers.',
  },
  {
    value: 'multi-line',
    label: 'Multi-line',
    description: 'Two to six series with fixed color ordering.',
  },
  {
    value: 'pie',
    label: 'Pie',
    description: 'Clean circle with outside labels.',
  },
  {
    value: 'area-stacked',
    label: 'Area (Stacked)',
    description: 'Time-based stacked areas with opacity variation.',
  },
]

type InputMode = 'paste' | 'upload-csv' | 'upload-json'

function getRequiredSeriesCount(chartType: ChartType): { min: number; max: number } {
  switch (chartType) {
    case 'bar-single':
    case 'line':
    case 'pie':
      return { min: 1, max: 1 }
    case 'bar-dual':
      return { min: 2, max: 2 }
    case 'multi-line':
      return { min: 2, max: 6 }
    case 'stacked-bar':
    case 'area-stacked':
      return { min: 2, max: 6 }
    default:
      return { min: 1, max: 1 }
  }
}

function fitSeriesToChart(chartType: ChartType, currentSelection: string[], numericColumns: string[]) {
  const rule = getRequiredSeriesCount(chartType)
  const filtered = currentSelection.filter((column) => numericColumns.includes(column))
  const unique = Array.from(new Set(filtered))
  const fallback = numericColumns.slice(0, rule.max)

  let next = unique.length ? unique.slice(0, rule.max) : fallback

  if (next.length < rule.min) {
    next = numericColumns.slice(0, Math.max(rule.min, Math.min(rule.max, numericColumns.length)))
  }

  return next
}

function getChartConstraintCopy(chartType: ChartType): string {
  const rule = getRequiredSeriesCount(chartType)

  if (rule.min === rule.max) {
    return `${rule.min} numeric ${rule.min === 1 ? 'series' : 'series'} required`
  }

  return `${rule.min}-${rule.max} numeric series`
}

function App() {
  const sampleDataset = buildSampleDataset()
  const sampleNumericColumns = getNumericColumns(sampleDataset)

  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [rawInput, setRawInput] = useState(sampleCsv)
  const [dataset, setDataset] = useState<Dataset>(sampleDataset)
  const [title, setTitle] = useState('Quarterly Performance')
  const [subtitle, setSubtitle] = useState('Paste data, map fields, and export publication-grade PNG.')
  const [xKey, setXKey] = useState(sampleDataset.columns[0] ?? '')
  const [yKeys, setYKeys] = useState<string[]>(sampleNumericColumns.slice(0, 1))
  const [chartType, setChartType] = useState<ChartType>('bar-single')
  const [status, setStatus] = useState('Sample data loaded. Replace it with CSV or JSON when ready.')
  const [error, setError] = useState('')
  const [sourceLabel, setSourceLabel] = useState('Sample CSV')
  const [renderedConfig, setRenderedConfig] = useState<ChartConfig>({
    title: 'Quarterly Performance',
    subtitle: 'Paste data, map fields, and export publication-grade PNG.',
    chartType: 'bar-single',
    xKey: sampleDataset.columns[0] ?? '',
    yKeys: sampleNumericColumns.slice(0, 1),
  })

  const chartRef = useRef<HTMLDivElement | null>(null)
  const numericColumns = getNumericColumns(dataset)
  const seriesRule = getRequiredSeriesCount(chartType)
  const activeConfig: ChartConfig = {
    title,
    subtitle,
    chartType,
    xKey,
    yKeys,
  }

  function applyDataset(nextDataset: Dataset, nextSourceLabel: string, nextRawInput?: string) {
    const nextX = nextDataset.columns[0] ?? ''
    const nextNumericColumns = getNumericColumns(nextDataset)
    const nextY = fitSeriesToChart(chartType, yKeys, nextNumericColumns)
    const nextConfig: ChartConfig = {
      title,
      subtitle,
      chartType,
      xKey: nextX,
      yKeys: nextY,
    }

    setDataset(nextDataset)
    setXKey(nextX)
    setYKeys(nextY)
    setRenderedConfig(nextConfig)
    setSourceLabel(nextSourceLabel)
    setError('')
    setStatus(`Imported ${nextDataset.rows.length} rows and ${nextDataset.columns.length} columns from ${nextSourceLabel}.`)

    if (typeof nextRawInput === 'string') {
      setRawInput(nextRawInput)
    }
  }

  function parseCurrentInput() {
    try {
      const nextDataset = inputMode === 'upload-json' ? parseJsonText(rawInput) : parseCsvText(rawInput)
      applyDataset(nextDataset, inputMode === 'upload-json' ? 'JSON text' : 'pasted text')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to parse the provided input.')
    }
  }

  async function importFile(file: File, nextMode: InputMode) {
    try {
      const text = await file.text()
      const nextDataset = nextMode === 'upload-json' ? parseJsonText(text) : parseCsvText(text)
      setInputMode(nextMode)
      applyDataset(nextDataset, file.name, text)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to import the selected file.')
    }
  }

  function toggleSeries(column: string) {
    const exists = yKeys.includes(column)
    const tentative = exists ? yKeys.filter((item) => item !== column) : [...yKeys, column]
    const nextSelection = fitSeriesToChart(chartType, tentative, numericColumns)
    setYKeys(nextSelection)
  }

  function changeChartType(nextChartType: ChartType) {
    const nextY = fitSeriesToChart(nextChartType, yKeys, numericColumns)
    setChartType(nextChartType)
    setYKeys(nextY)
    setStatus(`Chart type set to ${chartOptions.find((option) => option.value === nextChartType)?.label}.`)
  }

  function validateConfig(config: ChartConfig) {
    if (!config.xKey) {
      return 'Choose an X-axis field before rendering.'
    }

    if (!dataset.columns.includes(config.xKey)) {
      return 'The current X-axis field is not present in the dataset.'
    }

    if (!numericColumns.length) {
      return 'This dataset does not contain numeric columns for charting.'
    }

    if (config.yKeys.some((key) => !numericColumns.includes(key))) {
      return 'All Y-series must come from numeric columns.'
    }

    if (config.yKeys.length < seriesRule.min || config.yKeys.length > seriesRule.max) {
      return `This chart type requires ${getChartConstraintCopy(config.chartType)}.`
    }

    return ''
  }

  function renderChart() {
    const validationError = validateConfig(activeConfig)

    if (validationError) {
      setError(validationError)
      return
    }

    setRenderedConfig(activeConfig)
    setError('')
    setStatus(`Rendered ${chartOptions.find((option) => option.value === chartType)?.label} from ${sourceLabel}.`)
  }

  async function downloadPng() {
    if (!chartRef.current) {
      return
    }

    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `chartnama-${renderedConfig.chartType}.png`
      link.click()
      setStatus('PNG exported at 2x resolution.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'PNG export failed.')
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ChartNama</p>
          <h1>Strict charts for editorial-grade output.</h1>
        </div>
        <p className="hero-copy">
          Load structured data, map axes explicitly, choose a chart family, and export a publication-ready PNG with no styling drift.
        </p>
      </header>

      <section className="workspace-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Left</p>
              <h2>Input + Preview</h2>
            </div>
            <span className="badge">{sourceLabel}</span>
          </div>

          <div className="input-mode-row" role="tablist" aria-label="Input modes">
            <button
              type="button"
              className={inputMode === 'paste' ? 'chip active' : 'chip'}
              onClick={() => setInputMode('paste')}
            >
              Paste CSV
            </button>
            <button
              type="button"
              className={inputMode === 'upload-csv' ? 'chip active' : 'chip'}
              onClick={() => setInputMode('upload-csv')}
            >
              Upload CSV
            </button>
            <button
              type="button"
              className={inputMode === 'upload-json' ? 'chip active' : 'chip'}
              onClick={() => setInputMode('upload-json')}
            >
              Upload JSON
            </button>
          </div>

          {inputMode === 'paste' && (
            <div className="input-stack">
              <label className="stack-label" htmlFor="raw-input">
                Paste CSV-like rows
              </label>
              <textarea
                id="raw-input"
                className="data-textarea"
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                spellCheck={false}
              />
              <div className="action-row">
                <button type="button" className="primary-button" onClick={parseCurrentInput}>
                  Import pasted data
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setRawInput(sampleCsv)
                    setInputMode('paste')
                    applyDataset(buildSampleDataset(), 'Sample CSV', sampleCsv)
                  }}
                >
                  Load sample CSV
                </button>
              </div>
            </div>
          )}

          {inputMode !== 'paste' && (
            <div className="upload-card">
              <label className="upload-button">
                <input
                  type="file"
                  accept={inputMode === 'upload-json' ? '.json,application/json' : '.csv,text/csv'}
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                      void importFile(file, inputMode)
                    }
                  }}
                />
                Select {inputMode === 'upload-json' ? 'JSON' : 'CSV'} file
              </label>
              <p className="support-copy">
                {inputMode === 'upload-json'
                  ? 'Upload an array of objects or a { columns, rows } payload.'
                  : 'Upload a header-based CSV file for automatic column detection.'}
              </p>
              <div className="action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setInputMode('upload-json')
                    setRawInput(sampleJson)
                    applyDataset(buildSampleDataset(), 'Sample JSON', sampleJson)
                  }}
                >
                  Use sample JSON
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setInputMode('paste')
                    setRawInput(sampleCsv)
                  }}
                >
                  Switch to paste
                </button>
              </div>
            </div>
          )}

          <div className="preview-block">
            <div className="preview-meta">
              <strong>{dataset.rows.length}</strong> rows
              <strong>{dataset.columns.length}</strong> columns
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {dataset.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.rows.slice(0, 6).map((row, index) => (
                    <tr key={`${String(row[xKey] ?? 'row')}-${index}`}>
                      {dataset.columns.map((column) => (
                        <td key={`${column}-${index}`}>{String(row[column] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Middle</p>
              <h2>Mapping</h2>
            </div>
            <span className="badge">{numericColumns.length} numeric fields</span>
          </div>

          <div className="form-stack">
            <label className="stack-label" htmlFor="chart-title">
              Title
            </label>
            <input id="chart-title" value={title} onChange={(event) => setTitle(event.target.value)} />

            <label className="stack-label" htmlFor="chart-subtitle">
              Subtitle
            </label>
            <input
              id="chart-subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
            />

            <label className="stack-label" htmlFor="x-key">
              X-axis field
            </label>
            <select id="x-key" value={xKey} onChange={(event) => setXKey(event.target.value)}>
              {dataset.columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          <div className="series-panel">
            <div className="series-heading">
              <div>
                <h3>Y-series</h3>
                <p>{getChartConstraintCopy(chartType)}</p>
              </div>
            </div>

            {numericColumns.length ? (
              <div className="series-list">
                {numericColumns.map((column) => (
                  <label key={column} className={yKeys.includes(column) ? 'series-option active' : 'series-option'}>
                    <input
                      type="checkbox"
                      checked={yKeys.includes(column)}
                      onChange={() => toggleSeries(column)}
                    />
                    <span>{column}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="chart-empty-state compact">Numeric columns will appear here after import.</div>
            )}
          </div>

          <div className="mapping-summary">
            <p>
              <strong>Internal format:</strong> columns + row records.
            </p>
            <code>{`{ columns: [${dataset.columns.slice(0, 3).join(', ')}], rows: [...] }`}</code>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Right</p>
              <h2>Chart Selector</h2>
            </div>
            <span className="badge">{chartOptions.length} types</span>
          </div>

          <div className="chart-selector-grid">
            {chartOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={chartType === option.value ? 'chart-option active' : 'chart-option'}
                onClick={() => changeChartType(option.value)}
              >
                <span className="chart-option-title">{option.label}</span>
                <span className="chart-option-copy">{option.description}</span>
              </button>
            ))}
          </div>

          <div className="selector-footnote">
            <p>Current series selection</p>
            <strong>{yKeys.map((column) => `${column}${numericColumns.includes(column) ? '' : ' (missing)'}`).join(', ') || 'None selected'}</strong>
          </div>
        </article>
      </section>

      <section className="chart-section">
        <div className="chart-panel" ref={chartRef}>
          {renderedConfig ? (
            <ChartStage dataset={dataset} config={renderedConfig} />
          ) : (
            <div className="chart-empty-state">Render a chart to preview it here.</div>
          )}
        </div>
      </section>

      <footer className="action-bar">
        <div className="status-block" aria-live="polite">
          <strong>Status</strong>
          <span>{error || status}</span>
        </div>
        <div className="action-row">
          <button type="button" className="primary-button" onClick={renderChart}>
            Render chart
          </button>
          <button type="button" className="secondary-button" onClick={downloadPng} disabled={!renderedConfig}>
            Download PNG
          </button>
        </div>
      </footer>

      <section className="summary-strip">
        <div>
          <span>Mapped X</span>
          <strong>{xKey || 'Not selected'}</strong>
        </div>
        <div>
          <span>Mapped Y</span>
          <strong>{yKeys.join(', ') || 'Not selected'}</strong>
        </div>
        <div>
          <span>Top numeric field</span>
          <strong>
            {numericColumns[0]
              ? `${numericColumns[0]} · ${formatValue(Number(dataset.rows[0]?.[numericColumns[0]] ?? 0))}`
              : 'None'}
          </strong>
        </div>
      </section>
    </main>
  )
}

export default App
