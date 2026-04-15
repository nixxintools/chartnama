import {
  arc,
  area,
  extent,
  line,
  max,
  min,
  pie,
  scaleBand,
  scaleLinear,
  scaleTime,
  stack,
} from 'd3'
import type { PieArcDatum, SeriesPoint } from 'd3'

import { coerceDate, coerceNumber, formatValue } from './data-utils'
import type { ChartConfig, ChartType, DataRow, Dataset } from './types'

type ChartStageProps = {
  dataset: Dataset
  config: ChartConfig
}

type PlotFrame = {
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

type ChartPoint = {
  label: string
  value: number
}

type StackedRow = Record<string, number | string>

const palette = ['#f4b400', '#e53935', '#cfcfcf', '#111111', '#f08f76', '#7286d3']
const svgWidth = 960
const svgHeight = 620
const chartFontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const frame: PlotFrame = {
  width: svgWidth,
  height: svgHeight,
  top: 124,
  right: 72,
  bottom: 88,
  left: 72,
}
const textStyles = {
  title: {
    fill: '#111111',
    fontFamily: chartFontFamily,
    fontSize: 34,
    fontWeight: 800,
    textAnchor: 'middle' as const,
  },
  subtitle: {
    fill: '#62594d',
    fontFamily: chartFontFamily,
    fontSize: 18,
    fontWeight: 500,
    textAnchor: 'middle' as const,
  },
  valueLabel: {
    fill: '#111111',
    fontFamily: chartFontFamily,
    fontSize: 13,
    fontWeight: 700,
    textAnchor: 'middle' as const,
  },
  axisLabel: {
    fill: '#111111',
    fontFamily: chartFontFamily,
    fontSize: 12,
    fontWeight: 700,
    textAnchor: 'middle' as const,
  },
  seriesLabel: {
    fill: '#111111',
    fontFamily: chartFontFamily,
    fontSize: 13,
    fontWeight: 700,
    textAnchor: 'start' as const,
  },
}

function clampLabelY(y: number): number {
  return Math.max(frame.top - 8, Math.min(y, frame.height - frame.bottom + 32))
}

function getPoints(dataset: Dataset, xKey: string, yKey: string): ChartPoint[] {
  return dataset.rows
    .map((row) => ({
      label: String(row[xKey] ?? '').trim(),
      value: coerceNumber(row[yKey]) ?? NaN,
    }))
    .filter((entry) => entry.label && Number.isFinite(entry.value))
}

function getSeriesRows(dataset: Dataset, config: ChartConfig): DataRow[] {
  return dataset.rows.filter((row) => {
    const label = String(row[config.xKey] ?? '').trim()

    if (!label) {
      return false
    }

    return config.yKeys.some((key) => coerceNumber(row[key]) !== null)
  })
}

function getChartNotice(chartType: ChartType, yCount: number): string | null {
  if (chartType === 'bar-dual' && yCount < 2) {
    return 'Dual bar charts require two numeric series.'
  }

  if (chartType === 'stacked-bar' && yCount < 2) {
    return 'Stacked bars need at least two numeric series.'
  }

  if (chartType === 'line' && yCount < 1) {
    return 'Line charts need one numeric series.'
  }

  if (chartType === 'multi-line' && (yCount < 2 || yCount > 6)) {
    return 'Multi-line charts support between two and six series.'
  }

  if (chartType === 'pie' && yCount < 1) {
    return 'Pie charts need one numeric series.'
  }

  if (chartType === 'area-stacked' && yCount < 2) {
    return 'Stacked area charts need at least two numeric series.'
  }

  return null
}

function renderBarSingle(points: ChartPoint[]) {
  const xScale = scaleBand()
    .domain(points.map((point) => point.label))
    .range([frame.left, frame.width - frame.right])
    .padding(0.26)

  const yExtent = [
    Math.min(0, min(points, (point) => point.value) ?? 0),
    Math.max(0, max(points, (point) => point.value) ?? 0),
  ]
  const yScale = scaleLinear()
    .domain(yExtent)
    .nice()
    .range([frame.height - frame.bottom, frame.top])

  const baseline = yScale(0)

  return (
    <>
      <line
        x1={frame.left}
        y1={baseline}
        x2={frame.width - frame.right}
        y2={baseline}
        stroke="#111111"
        strokeWidth="1.5"
      />
      {points.map((point) => {
        const x = xScale(point.label) ?? frame.left
        const barWidth = xScale.bandwidth()
        const y = point.value >= 0 ? yScale(point.value) : baseline
        const height = Math.abs(yScale(point.value) - baseline)
        const labelY = point.value >= 0 ? y - 12 : y + height + 20

        return (
          <g key={point.label}>
            <rect x={x} y={y} width={barWidth} height={height} fill="#f4b400" />
            <text
              x={x + barWidth / 2}
              y={clampLabelY(labelY)}
              className="chart-value-label"
              {...textStyles.valueLabel}
            >
              {formatValue(point.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={frame.height - frame.bottom + 32}
              className="chart-axis-label"
              {...textStyles.axisLabel}
            >
              {point.label}
            </text>
          </g>
        )
      })}
    </>
  )
}

function renderBarDual(dataset: Dataset, config: ChartConfig) {
  const rows = getSeriesRows(dataset, config)
  const keys = config.yKeys.slice(0, 2)

  const xScale = scaleBand()
    .domain(rows.map((row) => String(row[config.xKey])))
    .range([frame.left, frame.width - frame.right])
    .padding(0.24)

  const innerScale = scaleBand<string>()
    .domain(keys)
    .range([0, xScale.bandwidth()])
    .padding(0.16)

  const values = rows.flatMap((row) => keys.map((key) => coerceNumber(row[key]) ?? 0))
  const yScale = scaleLinear()
    .domain([Math.min(0, min(values) ?? 0), Math.max(0, max(values) ?? 0)])
    .nice()
    .range([frame.height - frame.bottom, frame.top])

  const baseline = yScale(0)

  return (
    <>
      <line
        x1={frame.left}
        y1={baseline}
        x2={frame.width - frame.right}
        y2={baseline}
        stroke="#111111"
        strokeWidth="1.5"
      />
      {rows.map((row) => {
        const bandX = xScale(String(row[config.xKey])) ?? frame.left

        return (
          <g key={String(row[config.xKey])}>
            {keys.map((key, index) => {
              const value = coerceNumber(row[key]) ?? 0
              const x = bandX + (innerScale(key) ?? 0)
              const y = value >= 0 ? yScale(value) : baseline
              const height = Math.abs(yScale(value) - baseline)

              return (
                <g key={key}>
                  <rect
                    x={x}
                    y={y}
                    width={innerScale.bandwidth()}
                    height={height}
                    fill={palette[index]}
                  />
                  <text
                    x={x + innerScale.bandwidth() / 2}
                    y={clampLabelY(value >= 0 ? y - 12 : y + height + 20)}
                    className="chart-value-label"
                    {...textStyles.valueLabel}
                  >
                    {formatValue(value)}
                  </text>
                </g>
              )
            })}
            <text
              x={bandX + xScale.bandwidth() / 2}
              y={frame.height - frame.bottom + 32}
              className="chart-axis-label"
              {...textStyles.axisLabel}
            >
              {String(row[config.xKey])}
            </text>
          </g>
        )
      })}
    </>
  )
}

function renderStackedBar(dataset: Dataset, config: ChartConfig) {
  const rows = getSeriesRows(dataset, config).map((row) => {
    const normalized: StackedRow = {
      [config.xKey]: String(row[config.xKey]),
    }

    config.yKeys.forEach((key) => {
      normalized[key] = coerceNumber(row[key]) ?? 0
    })

    return normalized
  })

  const layers = stack<StackedRow>()
    .keys(config.yKeys)
    .value((row, key) => Number(row[key] ?? 0))(rows)

  const totals = rows.map((row) =>
    config.yKeys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0),
  )

  const xScale = scaleBand()
    .domain(rows.map((row) => String(row[config.xKey])))
    .range([frame.left, frame.width - frame.right])
    .padding(0.26)

  const yScale = scaleLinear()
    .domain([0, max(totals) ?? 0])
    .nice()
    .range([frame.height - frame.bottom, frame.top])

  return (
    <>
      <line
        x1={frame.left}
        y1={frame.height - frame.bottom}
        x2={frame.width - frame.right}
        y2={frame.height - frame.bottom}
        stroke="#111111"
        strokeWidth="1.5"
      />
      {layers.map((layer, layerIndex) => (
        <g key={layer.key}>
          {layer.map((segment, index) => {
            const label = String(rows[index][config.xKey])
            const x = xScale(label) ?? frame.left
            const y = yScale(segment[1])
            const height = yScale(segment[0]) - yScale(segment[1])

            return (
              <rect
                key={`${layer.key}-${label}`}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={height}
                fill={palette[(layerIndex + 1) % palette.length]}
              />
            )
          })}
        </g>
      ))}
      {rows.map((row, index) => {
        const label = String(row[config.xKey])
        const total = totals[index]
        const x = xScale(label) ?? frame.left

        return (
          <g key={label}>
            <text
              x={x + xScale.bandwidth() / 2}
              y={yScale(total) - 12}
              className="chart-value-label"
              {...textStyles.valueLabel}
            >
              {formatValue(total)}
            </text>
            <text
              x={x + xScale.bandwidth() / 2}
              y={frame.height - frame.bottom + 32}
              className="chart-axis-label"
              {...textStyles.axisLabel}
            >
              {label}
            </text>
          </g>
        )
      })}
    </>
  )
}

function getLineScale(rows: DataRow[], config: ChartConfig) {
  const labels = rows.map((row) => String(row[config.xKey]))
  const parsedDates = rows.map((row) => coerceDate(row[config.xKey]))
  const hasDates = parsedDates.every((value) => value !== null)

  if (hasDates) {
    const domain = extent(parsedDates as Date[]) as [Date, Date]
    const xScale = scaleTime()
      .domain(domain)
      .range([frame.left, frame.width - frame.right])

    return {
      getX: (index: number) => xScale(parsedDates[index] as Date),
      labels,
    }
  }

  const xScale = scaleBand()
    .domain(labels)
    .range([frame.left, frame.width - frame.right])
    .padding(0.18)

  return {
    getX: (index: number) => (xScale(labels[index]) ?? frame.left) + xScale.bandwidth() / 2,
    labels,
  }
}

function renderLine(dataset: Dataset, config: ChartConfig, multi = false) {
  const rows = getSeriesRows(dataset, config)
  const { getX, labels } = getLineScale(rows, config)
  const values = rows.flatMap((row) => config.yKeys.map((key) => coerceNumber(row[key]) ?? 0))
  const yScale = scaleLinear()
    .domain([Math.min(0, min(values) ?? 0), Math.max(0, max(values) ?? 0)])
    .nice()
    .range([frame.height - frame.bottom, frame.top])

  return (
    <>
      <line
        x1={frame.left}
        y1={frame.height - frame.bottom}
        x2={frame.width - frame.right}
        y2={frame.height - frame.bottom}
        stroke="#111111"
        strokeWidth="1.5"
      />
      {config.yKeys.map((key, seriesIndex) => {
        const stroke = palette[seriesIndex]
        const lineGenerator = line<DataRow>()
          .x((_, index) => getX(index))
          .y((row) => yScale(coerceNumber(row[key]) ?? 0))
        const path = lineGenerator(rows) ?? ''

        return (
          <g key={key}>
            <path d={path} fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
            {rows.map((row, index) => {
              const x = getX(index)
              const value = coerceNumber(row[key]) ?? 0
              const y = yScale(value)

              return (
                <g key={`${key}-${labels[index]}`}>
                  <circle cx={x} cy={y} r="7" fill="#ffffff" stroke={stroke} strokeWidth="3" />
                  <text x={x} y={y - 14} className="chart-value-label" {...textStyles.valueLabel}>
                    {formatValue(value)}
                  </text>
                  {!multi && (
                    <text
                      x={x}
                      y={frame.height - frame.bottom + 32}
                      className="chart-axis-label"
                      {...textStyles.axisLabel}
                    >
                      {labels[index]}
                    </text>
                  )}
                </g>
              )
            })}
            {multi && (
              <text
                x={frame.width - frame.right + 8}
                y={yScale(coerceNumber(rows.at(-1)?.[key]) ?? 0)}
                className="chart-series-label"
                {...textStyles.seriesLabel}
                fill={stroke}
              >
                {key}
              </text>
            )}
          </g>
        )
      })}
      {multi &&
        labels.map((label, index) => (
          <text
            key={label}
            x={getX(index)}
            y={frame.height - frame.bottom + 32}
            className="chart-axis-label"
            {...textStyles.axisLabel}
          >
            {label}
          </text>
        ))}
    </>
  )
}

function renderPie(points: ChartPoint[]) {
  const centerX = frame.width / 2
  const centerY = frame.top + (frame.height - frame.top - frame.bottom) / 2
  const radius = Math.min(frame.width - frame.left - frame.right, frame.height - frame.top - frame.bottom) / 2.35
  const labelRadius = radius + 40
  const pieGenerator = pie<ChartPoint>()
    .value((point) => Math.max(point.value, 0))
    .sort(null)
  const arcGenerator = arc<PieArcDatum<ChartPoint>>().innerRadius(0).outerRadius(radius)
  const labelArc = arc<PieArcDatum<ChartPoint>>().innerRadius(labelRadius).outerRadius(labelRadius)

  return (
    <g transform={`translate(${centerX}, ${centerY})`}>
      {pieGenerator(points).map((slice, index) => {
        const [labelX, labelY] = labelArc.centroid(slice)
        const anchor: 'start' | 'end' = labelX >= 0 ? 'start' : 'end'
        const pieAxisLabelStyle = { ...textStyles.axisLabel, textAnchor: anchor }
        const pieValueLabelStyle = { ...textStyles.valueLabel, textAnchor: anchor }

        return (
          <g key={slice.data.label}>
            <path d={arcGenerator(slice) ?? ''} fill={palette[index % palette.length]} stroke="#ffffff" strokeWidth="4" />
            <path
              d={`M ${arcGenerator.centroid(slice)[0]} ${arcGenerator.centroid(slice)[1]} L ${labelX} ${labelY}`}
              fill="none"
              stroke="#111111"
              strokeWidth="1.2"
            />
            <text
              x={labelX + (labelX >= 0 ? 10 : -10)}
              y={labelY - 4}
              className="chart-axis-label"
              {...pieAxisLabelStyle}
            >
              {slice.data.label}
            </text>
            <text
              x={labelX + (labelX >= 0 ? 10 : -10)}
              y={labelY + 16}
              className="chart-value-label"
              {...pieValueLabelStyle}
            >
              {formatValue(slice.data.value)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function renderArea(dataset: Dataset, config: ChartConfig) {
  const rows = getSeriesRows(dataset, config)
  const timeline = rows.map((row, index) => coerceDate(row[config.xKey]) ?? new Date(2026, 0, index + 1))
  const normalized = rows.map((row, index) => {
    const item: Record<string, number | Date> = {
      x: timeline[index],
    }

    config.yKeys.forEach((key) => {
      item[key] = coerceNumber(row[key]) ?? 0
    })

    return item
  })

  const layers = stack<Record<string, number | Date>>()
    .keys(config.yKeys)
    .value((row, key) => Number(row[key] ?? 0))(normalized)

  const xScale = scaleTime()
    .domain(extent(timeline) as [Date, Date])
    .range([frame.left, frame.width - frame.right])

  const maxValue = max(layers, (layer) => max(layer, (segment) => segment[1]) ?? 0) ?? 0
  const yScale = scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([frame.height - frame.bottom, frame.top])

  const areaGenerator = area<SeriesPoint<Record<string, number | Date>>>()
    .x((_, index) => xScale(timeline[index]))
    .y0((segment) => yScale(segment[0]))
    .y1((segment) => yScale(segment[1]))

  return (
    <>
      <line
        x1={frame.left}
        y1={frame.height - frame.bottom}
        x2={frame.width - frame.right}
        y2={frame.height - frame.bottom}
        stroke="#111111"
        strokeWidth="1.5"
      />
      {layers.map((layer, index) => (
        <g key={layer.key}>
          <path
            d={areaGenerator(layer) ?? ''}
            fill={palette[index % palette.length]}
            fillOpacity={0.18 + index * 0.12}
            stroke={palette[index % palette.length]}
            strokeWidth="2"
          />
          <text
            x={frame.width - frame.right + 8}
            y={yScale(layer.at(-1)?.[1] ?? 0)}
            className="chart-series-label"
            {...textStyles.seriesLabel}
            fill={palette[index % palette.length]}
          >
            {layer.key}
          </text>
        </g>
      ))}
      {rows.map((row, index) => (
        <text
          key={`${String(row[config.xKey])}-${index}`}
          x={xScale(timeline[index])}
          y={frame.height - frame.bottom + 32}
          className="chart-axis-label"
          {...textStyles.axisLabel}
        >
          {String(row[config.xKey])}
        </text>
      ))}
    </>
  )
}

export function ChartStage({ dataset, config }: ChartStageProps) {
  const notice = getChartNotice(config.chartType, config.yKeys.length)

  if (notice) {
    return <div className="chart-empty-state">{notice}</div>
  }

  const primaryPoints = getPoints(dataset, config.xKey, config.yKeys[0])

  if (!primaryPoints.length) {
    return <div className="chart-empty-state">This chart needs at least one labeled numeric row.</div>
  }

  return (
    <svg
      className="chart-stage-svg"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      role="img"
      aria-label={`${config.title || 'ChartNama chart'} rendered as ${config.chartType}`}
    >
      <rect width={svgWidth} height={svgHeight} fill="#ffffff" rx="32" />
      <text x={svgWidth / 2} y="58" className="chart-title" {...textStyles.title}>
        {config.title || 'ChartNama'}
      </text>
      <text x={svgWidth / 2} y="86" className="chart-subtitle" {...textStyles.subtitle}>
        {config.subtitle || 'Publication-grade chart preview'}
      </text>
      {config.chartType === 'bar-single' && renderBarSingle(primaryPoints)}
      {config.chartType === 'bar-dual' && renderBarDual(dataset, config)}
      {config.chartType === 'stacked-bar' && renderStackedBar(dataset, config)}
      {config.chartType === 'line' && renderLine(dataset, config)}
      {config.chartType === 'multi-line' && renderLine(dataset, config, true)}
      {config.chartType === 'pie' && renderPie(primaryPoints)}
      {config.chartType === 'area-stacked' && renderArea(dataset, config)}
    </svg>
  )
}
