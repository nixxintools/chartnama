export type DataValue = string | number

export type DataRow = Record<string, DataValue>

export type Dataset = {
  columns: string[]
  rows: DataRow[]
}

export type ChartType =
  | 'bar-single'
  | 'bar-dual'
  | 'stacked-bar'
  | 'line'
  | 'multi-line'
  | 'pie'
  | 'area-stacked'

export type ChartConfig = {
  title: string
  subtitle: string
  chartType: ChartType
  xKey: string
  yKeys: string[]
}

export type WorkspaceMode = 'chartnama' | 'infonama'

export type InfoTemplate = 'timeline' | 'comparison' | 'process' | 'list' | 'statistical'

export type InfoMeta = {
  title: string
  subtitle: string
  takeaway: string
  source: string
  updatedAt: string
  leftLabel: string
  rightLabel: string
}

export type TimelineItem = {
  date: string
  title: string
  note: string
}

export type ComparisonRow = {
  criterion: string
  left: string
  right: string
}

export type ProcessStep = {
  title: string
  detail: string
}

export type GlossaryItem = {
  term: string
  explanation: string
}
