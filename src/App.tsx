import { useMemo, useRef, useState } from 'react'
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
import { InfoStage } from './infographics'
import type {
  ChartConfig,
  ChartType,
  ComparisonRow,
  Dataset,
  GlossaryItem,
  InfoMeta,
  InfoTemplate,
  ProcessStep,
  TimelineItem,
  WorkspaceMode,
} from './types'

const sampleCsv = `Category,Metric A,Metric B,Metric C
Alpha,22,14,9
Beta,28,19,12
Gamma,34,21,15
Delta,42,25,18`

const sampleJson = JSON.stringify(buildSampleDataset(), null, 2)

const timelineSample = `March 7, 2024 | Draft consultation opens | Regulators publish the first public consultation note.
April 22, 2024 | Industry feedback arrives | Platforms, startups, and civil society submit comments.
June 10, 2024 | Revised proposal circulated | The ministry narrows the compliance scope.
August 1, 2024 | Final rules notified | Enforcement shifts from consultation to implementation.`

const comparisonSample = `Scope | Covers all intermediaries | Applies only above a revenue threshold
Data retention | 180 days | 90 days unless a regulator order applies
Disclosures | Quarterly transparency note | Monthly dashboard with incident counts
Enforcement | Civil penalty pathway | Mixed civil and licensing consequences`

const processSample = `Receive complaint | User submits a formal complaint with supporting evidence.
Classify issue | The team assigns the issue to policy, legal, or trust and safety review.
Request clarification | Additional information is collected from the user or the platform.
Publish outcome | The newsroom explains what changed, what did not, and why it matters.`

const listSample = `Intermediary | A platform or service that transmits or hosts user activity.
Significant platform | A service that crosses a policy-defined scale threshold.
Due diligence | The operational steps required to remain compliant.
Safe harbour | A liability protection that can weaken if obligations are not met.`

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

const infoTemplateOptions: Array<{
  value: InfoTemplate
  label: string
  description: string
}> = [
  {
    value: 'timeline',
    label: 'Timeline',
    description: 'Chronology for rules, cases, product changes, and key milestones.',
  },
  {
    value: 'comparison',
    label: 'Comparison',
    description: 'Side-by-side contrasts for drafts, laws, products, or claims.',
  },
  {
    value: 'process',
    label: 'Process',
    description: 'Step-by-step explainer for workflows and operational systems.',
  },
  {
    value: 'list',
    label: 'List / Glossary',
    description: 'Scannable cards for terms, facts, and issue explainers.',
  },
  {
    value: 'statistical',
    label: 'Statistical',
    description: 'Editorial explainer shell around the current chart and dataset.',
  },
]

type InputMode = 'paste' | 'upload-csv' | 'upload-json'

type RenderedInfo = {
  template: InfoTemplate
  meta: InfoMeta
  raw: string
  dataset: Dataset
  chartConfig: ChartConfig
}

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
    return `${rule.min} numeric series required`
  }

  return `${rule.min}-${rule.max} numeric series`
}

function getChartConstraintHint(chartType: ChartType): string {
  switch (chartType) {
    case 'bar-single':
    case 'line':
    case 'pie':
      return 'This chart uses one numeric column at a time.'
    case 'bar-dual':
      return 'This chart compares exactly two numeric columns.'
    case 'multi-line':
    case 'stacked-bar':
    case 'area-stacked':
      return 'This chart can combine several numeric columns from the same dataset.'
    default:
      return 'Use any numeric columns from your dataset.'
  }
}

function splitStructuredLines(raw: string): string[][] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter((parts) => parts.some(Boolean))
}

function parseTimeline(raw: string): TimelineItem[] {
  return splitStructuredLines(raw)
    .filter((parts) => parts.length >= 3)
    .map(([date, title, note]) => ({
      date,
      title,
      note,
    }))
}

function parseComparison(raw: string): ComparisonRow[] {
  return splitStructuredLines(raw)
    .filter((parts) => parts.length >= 3)
    .map(([criterion, left, right]) => ({
      criterion,
      left,
      right,
    }))
}

function parseProcess(raw: string): ProcessStep[] {
  return splitStructuredLines(raw)
    .filter((parts) => parts.length >= 2)
    .map(([title, detail]) => ({
      title,
      detail,
    }))
}

function parseGlossary(raw: string): GlossaryItem[] {
  return splitStructuredLines(raw)
    .filter((parts) => parts.length >= 2)
    .map(([term, explanation]) => ({
      term,
      explanation,
    }))
}

function getInfographicDiscoveryPrompt() {
  return `You are helping an editor at Medianama or Reasoned.live decide what kind of infographic can be built from an article.

Analyze the article text provided after this prompt and identify which infographic types are possible using this taxonomy:
- timeline
- comparison
- process / how-it-works
- list / glossary
- statistical infographic
- hierarchy / policy stack
- geographic / regional
- flow infographic
- network / ecosystem map
- annotated document / screenshot
- decision tree / reader guide
- myth vs fact / claim vs evidence

Return your answer in this structure:
1. One-paragraph summary of the article's core story.
2. Candidate infographic types ranked from strongest to weakest.
3. For each candidate type:
   - why it fits the article
   - what information is already available in the text
   - what information is missing
   - whether it is supported in the current InfoNama builder:
     - supported now: timeline, comparison, process, list, statistical
     - not yet supported in product: hierarchy, geographic, flow, network, annotated document, decision tree, myth vs fact
4. Recommend the single best infographic type for immediate production in InfoNama.
5. If statistical is recommended, list every quantitative fact or table-like value found in the article.
6. If no good infographic is possible, say so clearly and explain why.

Be strict about editorial usefulness. Do not recommend a type unless the article actually contains enough material to support it.`
}

function getExtractionPrompt(template: InfoTemplate) {
  const commonIntro = `You are extracting structured information from a Medianama or Reasoned.live article for use in the InfoNama infographic builder.

Use only information present in the article unless the prompt explicitly allows inference.
Keep the language concise, editorial, and factual.
Do not add decorative copy.
If information is missing, leave the field blank or state "MISSING".
`

  switch (template) {
    case 'timeline':
      return `${commonIntro}
Choose the timeline format only if the article contains a sequence of dated or ordered developments.

Return exactly this structure:
TITLE: <headline>
SUBTITLE: <subtitle>
TAKEAWAY: <one-sentence takeaway>
SOURCE: <source line>
UPDATED_AT: <date string>

TIMELINE_ITEMS:
date | event title | note
date | event title | note
date | event title | note

Rules:
- provide at least 3 timeline items if possible
- use short event titles
- notes should explain why each event matters
- preserve chronology`
      case 'comparison':
      return `${commonIntro}
Choose the comparison format only if the article clearly contrasts two states, versions, entities, approaches, or outcomes.

Return exactly this structure:
TITLE: <headline>
SUBTITLE: <subtitle>
TAKEAWAY: <one-sentence takeaway>
SOURCE: <source line>
UPDATED_AT: <date string>
LEFT_LABEL: <label for left side>
RIGHT_LABEL: <label for right side>

COMPARISON_ROWS:
criterion | left side | right side
criterion | left side | right side
criterion | left side | right side

Rules:
- provide at least 3 comparison rows if possible
- each row should compare the same criterion across both sides
- keep each cell compact and specific`
    case 'process':
      return `${commonIntro}
Choose the process format only if the article explains how something works step by step.

Return exactly this structure:
TITLE: <headline>
SUBTITLE: <subtitle>
TAKEAWAY: <one-sentence takeaway>
SOURCE: <source line>
UPDATED_AT: <date string>

PROCESS_STEPS:
step title | detail
step title | detail
step title | detail

Rules:
- provide at least 3 steps if possible
- steps must be in logical order
- titles should be action-oriented
- details should explain what happens in that step`
    case 'list':
      return `${commonIntro}
Choose the list/glossary format only if the article is best summarized as key concepts, facts, or explainers.

Return exactly this structure:
TITLE: <headline>
SUBTITLE: <subtitle>
TAKEAWAY: <one-sentence takeaway>
SOURCE: <source line>
UPDATED_AT: <date string>

LIST_ITEMS:
term | explanation
term | explanation
term | explanation

Rules:
- provide at least 3 items if possible
- terms should be scannable
- explanations should be simple enough for a general reader`
    case 'statistical':
      return `${commonIntro}
Choose the statistical format only if the article contains enough quantitative information for a chart or numerical explainer.

Return exactly this structure:
TITLE: <headline>
SUBTITLE: <subtitle>
TAKEAWAY: <one-sentence takeaway>
SOURCE: <source line>
UPDATED_AT: <date string>
CHART_RECOMMENDATION: <one of bar-single, bar-dual, stacked-bar, line, multi-line, pie, area-stacked>
X_FIELD: <field name>
Y_FIELDS: <comma-separated field names>

CSV_DATA:
<header row>
<data row>
<data row>
<data row>

Rules:
- only include a chart recommendation if the article has enough usable quantitative data
- normalize numbers into a clean CSV
- if data is insufficient, say CHART_RECOMMENDATION: MISSING and explain why below the CSV section`
    default:
      return commonIntro
  }
}

async function exportSurface(
  node: HTMLElement | null,
  filename: string,
  setStatus: (message: string) => void,
  setError: (message: string) => void,
) {
  if (!node) {
    return
  }

  try {
    const dataUrl = await toPng(node, {
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 2,
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
    setStatus('PNG exported at 2x resolution.')
    setError('')
  } catch (caught) {
    setError(caught instanceof Error ? caught.message : 'PNG export failed.')
  }
}

function App() {
  const sampleDataset = buildSampleDataset()
  const sampleNumericColumns = getNumericColumns(sampleDataset)

  const [workspace, setWorkspace] = useState<WorkspaceMode>('chartnama')

  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [rawInput, setRawInput] = useState(sampleCsv)
  const [dataset, setDataset] = useState<Dataset>(sampleDataset)
  const [title, setTitle] = useState('Sample Comparison')
  const [subtitle, setSubtitle] = useState(
    'Any numeric columns work. The selected chart type controls how many series are shown.',
  )
  const [xKey, setXKey] = useState(sampleDataset.columns[0] ?? '')
  const [yKeys, setYKeys] = useState<string[]>(sampleNumericColumns.slice(0, 3))
  const [chartType, setChartType] = useState<ChartType>('multi-line')
  const [chartStatus, setChartStatus] = useState(
    'Generic sample data loaded. Replace it with your own CSV or JSON when ready.',
  )
  const [chartError, setChartError] = useState('')
  const [sourceLabel, setSourceLabel] = useState('Sample dataset')
  const [renderedConfig, setRenderedConfig] = useState<ChartConfig>({
    title: 'Sample Comparison',
    subtitle: 'Any numeric columns work. The selected chart type controls how many series are shown.',
    chartType: 'multi-line',
    xKey: sampleDataset.columns[0] ?? '',
    yKeys: sampleNumericColumns.slice(0, 3),
  })

  const [infoTemplate, setInfoTemplate] = useState<InfoTemplate>('timeline')
  const [infoMeta, setInfoMeta] = useState<InfoMeta>({
    title: 'How the policy moved from draft to enforcement',
    subtitle: 'A newsroom explainer template for policy, platforms, telecom, and digital markets.',
    takeaway: 'Readers should be able to understand the sequence, tradeoffs, and final effect in one scan.',
    source: 'Medianama reporting, public filings, ministry notifications',
    updatedAt: 'April 26, 2026',
    leftLabel: 'Draft',
    rightLabel: 'Final',
  })
  const [timelineRaw, setTimelineRaw] = useState(timelineSample)
  const [comparisonRaw, setComparisonRaw] = useState(comparisonSample)
  const [processRaw, setProcessRaw] = useState(processSample)
  const [listRaw, setListRaw] = useState(listSample)
  const [infoStatus, setInfoStatus] = useState(
    'InfoNama is ready. Choose a template, shape the explainer, and export a newsroom graphic.',
  )
  const [infoError, setInfoError] = useState('')
  const [promptTemplate, setPromptTemplate] = useState<InfoTemplate>('timeline')
  const [renderedInfo, setRenderedInfo] = useState<RenderedInfo>({
    template: 'timeline',
    meta: {
      title: 'How the policy moved from draft to enforcement',
      subtitle: 'A newsroom explainer template for policy, platforms, telecom, and digital markets.',
      takeaway:
        'Readers should be able to understand the sequence, tradeoffs, and final effect in one scan.',
      source: 'Medianama reporting, public filings, ministry notifications',
      updatedAt: 'April 26, 2026',
      leftLabel: 'Draft',
      rightLabel: 'Final',
    },
    raw: timelineSample,
    dataset: sampleDataset,
    chartConfig: {
      title: 'Sample Comparison',
      subtitle: 'Any numeric columns work. The selected chart type controls how many series are shown.',
      chartType: 'multi-line',
      xKey: sampleDataset.columns[0] ?? '',
      yKeys: sampleNumericColumns.slice(0, 3),
    },
  })

  const chartRef = useRef<HTMLDivElement | null>(null)
  const infoRef = useRef<HTMLDivElement | null>(null)

  const numericColumns = getNumericColumns(dataset)
  const seriesRule = getRequiredSeriesCount(chartType)
  const activeConfig: ChartConfig = {
    title,
    subtitle,
    chartType,
    xKey,
    yKeys,
  }

  const currentInfoRaw = useMemo(() => {
    switch (infoTemplate) {
      case 'timeline':
        return timelineRaw
      case 'comparison':
        return comparisonRaw
      case 'process':
        return processRaw
      case 'list':
        return listRaw
      case 'statistical':
        return ''
      default:
        return ''
    }
  }, [comparisonRaw, infoTemplate, listRaw, processRaw, timelineRaw])

  const renderedTimeline = useMemo(() => parseTimeline(renderedInfo.raw), [renderedInfo.raw])
  const renderedComparison = useMemo(() => parseComparison(renderedInfo.raw), [renderedInfo.raw])
  const renderedProcess = useMemo(() => parseProcess(renderedInfo.raw), [renderedInfo.raw])
  const renderedGlossary = useMemo(() => parseGlossary(renderedInfo.raw), [renderedInfo.raw])
  const infographicDiscoveryPrompt = useMemo(() => getInfographicDiscoveryPrompt(), [])
  const extractionPrompt = useMemo(() => getExtractionPrompt(promptTemplate), [promptTemplate])

  function updateInfoMeta<K extends keyof InfoMeta>(key: K, value: InfoMeta[K]) {
    setInfoMeta((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function getTemplateInputLabel(template: InfoTemplate) {
    switch (template) {
      case 'timeline':
        return 'Use: date | event title | note'
      case 'comparison':
        return 'Use: criterion | left side | right side'
      case 'process':
        return 'Use: step title | detail'
      case 'list':
        return 'Use: term | explanation'
      case 'statistical':
        return 'This mode uses the current chart and dataset.'
      default:
        return ''
    }
  }

  function getTemplateChecklist(template: InfoTemplate) {
    switch (template) {
      case 'timeline':
        return ['At least 3 events', 'Dates in order', 'Each event has a note']
      case 'comparison':
        return ['At least 3 rows', 'Clear left/right labels', 'Short row text']
      case 'process':
        return ['At least 3 steps', 'Action-oriented step titles', 'One direction of flow']
      case 'list':
        return ['At least 3 cards', 'Short explainers', 'Beginner-readable language']
      case 'statistical':
        return ['Current chart rendered', 'Takeaway sentence set', 'Source line present']
      default:
        return []
    }
  }

  function setRawForTemplate(template: InfoTemplate, value: string) {
    switch (template) {
      case 'timeline':
        setTimelineRaw(value)
        return
      case 'comparison':
        setComparisonRaw(value)
        return
      case 'process':
        setProcessRaw(value)
        return
      case 'list':
        setListRaw(value)
        return
      default:
        return
    }
  }

  function changeInfoTemplate(nextTemplate: InfoTemplate) {
    setInfoTemplate(nextTemplate)
    setPromptTemplate(nextTemplate)
  }

  async function copyPrompt(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setInfoStatus('Prompt copied to clipboard.')
      setInfoError('')
    } catch (caught) {
      setInfoError(caught instanceof Error ? caught.message : 'Could not copy prompt.')
    }
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
    setChartError('')
    setChartStatus(
      `Imported ${nextDataset.rows.length} rows and ${nextDataset.columns.length} columns from ${nextSourceLabel}.`,
    )

    if (typeof nextRawInput === 'string') {
      setRawInput(nextRawInput)
    }
  }

  function parseCurrentInput() {
    try {
      const nextDataset = inputMode === 'upload-json' ? parseJsonText(rawInput) : parseCsvText(rawInput)
      applyDataset(nextDataset, inputMode === 'upload-json' ? 'JSON text' : 'pasted text')
    } catch (caught) {
      setChartError(caught instanceof Error ? caught.message : 'Unable to parse the provided input.')
    }
  }

  async function importFile(file: File, nextMode: InputMode) {
    try {
      const text = await file.text()
      const nextDataset = nextMode === 'upload-json' ? parseJsonText(text) : parseCsvText(text)
      setInputMode(nextMode)
      applyDataset(nextDataset, file.name, text)
    } catch (caught) {
      setChartError(caught instanceof Error ? caught.message : 'Unable to import the selected file.')
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
    setChartStatus(
      `Chart type set to ${chartOptions.find((option) => option.value === nextChartType)?.label}.`,
    )
  }

  function validateChartConfig(config: ChartConfig) {
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
    const validationError = validateChartConfig(activeConfig)

    if (validationError) {
      setChartError(validationError)
      return
    }

    setRenderedConfig(activeConfig)
    setChartError('')
    setChartStatus(
      `Rendered ${chartOptions.find((option) => option.value === chartType)?.label} from ${sourceLabel}.`,
    )
  }

  function validateInfographic(template: InfoTemplate, raw: string, meta: InfoMeta) {
    if (!meta.title.trim()) {
      return 'InfoNama exports need a title.'
    }

    if (!meta.source.trim()) {
      return 'InfoNama exports need a source line.'
    }

    if (template === 'statistical') {
      return validateChartConfig(activeConfig)
    }

    if (template === 'timeline' && parseTimeline(raw).length < 3) {
      return 'Timeline mode needs at least 3 well-formed entries.'
    }

    if (template === 'comparison' && parseComparison(raw).length < 3) {
      return 'Comparison mode needs at least 3 comparison rows.'
    }

    if (template === 'process' && parseProcess(raw).length < 3) {
      return 'Process mode needs at least 3 steps.'
    }

    if (template === 'list' && parseGlossary(raw).length < 3) {
      return 'List mode needs at least 3 cards.'
    }

    return ''
  }

  function renderInfographic() {
    const validationError = validateInfographic(infoTemplate, currentInfoRaw, infoMeta)

    if (validationError) {
      setInfoError(validationError)
      return
    }

    setRenderedInfo({
      template: infoTemplate,
      meta: infoMeta,
      raw: currentInfoRaw,
      dataset,
      chartConfig: activeConfig,
    })
    setInfoError('')
    setInfoStatus(
      `Rendered ${infoTemplateOptions.find((option) => option.value === infoTemplate)?.label} explainer.`,
    )
  }

  function renderChartWorkspace() {
    return (
      <>
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
                      applyDataset(buildSampleDataset(), 'Sample dataset', sampleCsv)
                    }}
                  >
                    Load sample data
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
                      applyDataset(buildSampleDataset(), 'Sample dataset', sampleJson)
                    }}
                  >
                    Use sample data
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
              <p className="series-help">
                Any numeric columns in your dataset can be charted here. {getChartConstraintHint(chartType)}
              </p>

              {numericColumns.length ? (
                <div className="series-list">
                  {numericColumns.map((column) => (
                    <label
                      key={column}
                      className={yKeys.includes(column) ? 'series-option active' : 'series-option'}
                    >
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
              <strong>
                {yKeys
                  .map((column) => `${column}${numericColumns.includes(column) ? '' : ' (missing)'}`)
                  .join(', ') || 'None selected'}
              </strong>
            </div>
            <p className="selector-explainer">
              The series limit changes with the chart type. Single bar, line, and pie use one series; dual bar uses
              two; multi-line and stacked charts can use several.
            </p>
          </article>
        </section>

        <section className="chart-section">
          <div className="chart-panel" ref={chartRef}>
            <ChartStage dataset={dataset} config={renderedConfig} />
          </div>
        </section>

        <footer className="action-bar">
          <div className="status-block" aria-live="polite">
            <strong>Status</strong>
            <span>{chartError || chartStatus}</span>
          </div>
          <div className="action-row">
            <button type="button" className="primary-button" onClick={renderChart}>
              Render chart
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                void exportSurface(chartRef.current, `chartnama-${renderedConfig.chartType}.png`, setChartStatus, setChartError)
              }
            >
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
                ? `${numericColumns[0]} - ${formatValue(Number(dataset.rows[0]?.[numericColumns[0]] ?? 0))}`
                : 'None'}
            </strong>
          </div>
        </section>
      </>
    )
  }

  function renderInfoWorkspace() {
    return (
      <>
        <section className="workspace-grid info-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Left</p>
                <h2>Info Inputs</h2>
              </div>
              <span className="badge">{infoTemplate}</span>
            </div>

            <div className="form-stack">
              <label className="stack-label" htmlFor="info-title">
                Headline
              </label>
              <input
                id="info-title"
                value={infoMeta.title}
                onChange={(event) => updateInfoMeta('title', event.target.value)}
              />

              <label className="stack-label" htmlFor="info-subtitle">
                Subtitle
              </label>
              <input
                id="info-subtitle"
                value={infoMeta.subtitle}
                onChange={(event) => updateInfoMeta('subtitle', event.target.value)}
              />

              <label className="stack-label" htmlFor="info-takeaway">
                Takeaway
              </label>
              <textarea
                id="info-takeaway"
                className="data-textarea info-textarea compact"
                value={infoMeta.takeaway}
                onChange={(event) => updateInfoMeta('takeaway', event.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="info-meta-grid">
              <div>
                <label className="stack-label" htmlFor="info-source">
                  Source line
                </label>
                <input
                  id="info-source"
                  value={infoMeta.source}
                  onChange={(event) => updateInfoMeta('source', event.target.value)}
                />
              </div>
              <div>
                <label className="stack-label" htmlFor="info-updated">
                  Updated date
                </label>
                <input
                  id="info-updated"
                  value={infoMeta.updatedAt}
                  onChange={(event) => updateInfoMeta('updatedAt', event.target.value)}
                />
              </div>
            </div>

            {infoTemplate === 'comparison' && (
              <div className="info-meta-grid">
                <div>
                  <label className="stack-label" htmlFor="info-left-label">
                    Left column label
                  </label>
                  <input
                    id="info-left-label"
                    value={infoMeta.leftLabel}
                    onChange={(event) => updateInfoMeta('leftLabel', event.target.value)}
                  />
                </div>
                <div>
                  <label className="stack-label" htmlFor="info-right-label">
                    Right column label
                  </label>
                  <input
                    id="info-right-label"
                    value={infoMeta.rightLabel}
                    onChange={(event) => updateInfoMeta('rightLabel', event.target.value)}
                  />
                </div>
              </div>
            )}

            {infoTemplate !== 'statistical' ? (
              <div className="input-stack">
                <label className="stack-label" htmlFor="info-raw">
                  Structured content
                </label>
                <p className="support-copy">{getTemplateInputLabel(infoTemplate)}</p>
                <textarea
                  id="info-raw"
                  className="data-textarea info-textarea"
                  value={currentInfoRaw}
                  onChange={(event) => setRawForTemplate(infoTemplate, event.target.value)}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="mapping-summary">
                <p>
                  <strong>Statistical mode uses the shared chart workspace.</strong>
                </p>
                <p>
                  It will embed the current chart settings, dataset, and editorial framing into a larger explainer
                  surface.
                </p>
                <code>{`chart: ${activeConfig.chartType} | x: ${activeConfig.xKey} | y: ${activeConfig.yKeys.join(', ')}`}</code>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Middle</p>
                <h2>Template Notes</h2>
              </div>
              <span className="badge">v1 MVP</span>
            </div>

            <div className="info-template-guidance">
              <div className="mapping-summary">
                <p>
                  <strong>Current template</strong>
                </p>
                <p>{infoTemplateOptions.find((option) => option.value === infoTemplate)?.description}</p>
              </div>

              <div className="info-checklist">
                <h3>Validation checklist</h3>
                {getTemplateChecklist(infoTemplate).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>

              <div className="mapping-summary">
                <p>
                  <strong>Feature plan</strong>
                </p>
                <p>v1 ships timeline, comparison, process, list, and statistical explainers inside the same product shell.</p>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Right</p>
                <h2>Template Picker</h2>
              </div>
              <span className="badge">{infoTemplateOptions.length} modes</span>
            </div>

            <div className="chart-selector-grid">
              {infoTemplateOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={infoTemplate === option.value ? 'chart-option active' : 'chart-option'}
                  onClick={() => changeInfoTemplate(option.value)}
                >
                  <span className="chart-option-title">{option.label}</span>
                  <span className="chart-option-copy">{option.description}</span>
                </button>
              ))}
            </div>

            <div className="selector-footnote">
              <p>Current mode</p>
              <strong>{infoTemplateOptions.find((option) => option.value === infoTemplate)?.label}</strong>
            </div>
            <p className="selector-explainer">
              InfoNama is for multi-block editorial explainers. Use ChartNama when you only need a single chart export.
            </p>
          </article>
        </section>

        <section className="chart-section">
          <div className="chart-panel info-preview-shell" ref={infoRef}>
            <InfoStage
              template={renderedInfo.template}
              meta={renderedInfo.meta}
              timelineItems={renderedTimeline}
              comparisonRows={renderedComparison}
              processSteps={renderedProcess}
              glossaryItems={renderedGlossary}
              dataset={renderedInfo.dataset}
              chartConfig={renderedInfo.chartConfig}
            />
          </div>
        </section>

        <footer className="action-bar">
          <div className="status-block" aria-live="polite">
            <strong>Status</strong>
            <span>{infoError || infoStatus}</span>
          </div>
          <div className="action-row">
            <button type="button" className="primary-button" onClick={renderInfographic}>
              Render infographic
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                void exportSurface(infoRef.current, `infonama-${renderedInfo.template}.png`, setInfoStatus, setInfoError)
              }
            >
              Download PNG
            </button>
          </div>
        </footer>

        <section className="summary-strip">
          <div>
            <span>Template</span>
            <strong>{renderedInfo.template}</strong>
          </div>
          <div>
            <span>Source</span>
            <strong>{renderedInfo.meta.source || 'Not set'}</strong>
          </div>
          <div>
            <span>Shared data</span>
            <strong>{`${dataset.rows.length} rows / ${dataset.columns.length} columns`}</strong>
          </div>
        </section>

        <section className="workspace-grid prompt-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Prompt 1</p>
                <h2>Find Infographic Types</h2>
              </div>
              <span className="badge">Article analysis</span>
            </div>
            <p className="support-copy">
              Paste a Medianama or Reasoned.live article into an AI system with this prompt to identify which infographic types are actually possible from the text.
            </p>
            <textarea className="data-textarea prompt-textarea" value={infographicDiscoveryPrompt} readOnly />
            <div className="action-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyPrompt(infographicDiscoveryPrompt)}
              >
                Copy prompt
              </button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Prompt 2</p>
                <h2>Extract Structured Input</h2>
              </div>
              <span className="badge">{promptTemplate}</span>
            </div>
            <p className="support-copy">
              After choosing the infographic type, use this prompt to turn the article into structured content that can be pasted directly into the InfoNama editor.
            </p>
            <label className="stack-label" htmlFor="prompt-template">
              Extraction template
            </label>
            <select
              id="prompt-template"
              value={promptTemplate}
              onChange={(event) => setPromptTemplate(event.target.value as InfoTemplate)}
            >
              {infoTemplateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea className="data-textarea prompt-textarea" value={extractionPrompt} readOnly />
            <div className="action-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyPrompt(extractionPrompt)}
              >
                Copy prompt
              </button>
            </div>
          </article>
        </section>
      </>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ChartNama + InfoNama</p>
          <h1>Editorial visuals for charts and explainers.</h1>
        </div>
        <p className="hero-copy">
          Build single-chart exports in ChartNama or switch to InfoNama for timelines, comparisons, process diagrams,
          glossary explainers, and statistical editorial layouts.
        </p>
      </header>

      <section className="workspace-tabs" aria-label="Workspace mode">
        <button
          type="button"
          className={workspace === 'chartnama' ? 'workspace-tab active' : 'workspace-tab'}
          onClick={() => setWorkspace('chartnama')}
        >
          ChartNama
        </button>
        <button
          type="button"
          className={workspace === 'infonama' ? 'workspace-tab active' : 'workspace-tab'}
          onClick={() => setWorkspace('infonama')}
        >
          InfoNama
        </button>
      </section>

      {workspace === 'chartnama' ? renderChartWorkspace() : renderInfoWorkspace()}
    </main>
  )
}

export default App
