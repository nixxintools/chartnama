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
