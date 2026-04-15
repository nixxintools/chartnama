import Papa from 'papaparse'

import type { DataRow, Dataset } from './types'

const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/

function normalizeCell(value: unknown): string | number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const text = String(value ?? '').trim()

  if (text === '') {
    return ''
  }

  const compact = text.replace(/,/g, '')

  if (NUMERIC_PATTERN.test(compact)) {
    return Number(compact)
  }

  return text
}

function buildDataset(rows: Record<string, unknown>[]): Dataset {
  if (!rows.length) {
    throw new Error('No rows were found in the uploaded data.')
  }

  const columnSet = new Set<string>()

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const cleanKey = key.trim()

      if (cleanKey) {
        columnSet.add(cleanKey)
      }
    })
  })

  const columns = Array.from(columnSet)

  if (!columns.length) {
    throw new Error('No columns were found in the uploaded data.')
  }

  const normalizedRows: DataRow[] = rows.map((row) => {
    const normalized: DataRow = {}

    columns.forEach((column) => {
      normalized[column] = normalizeCell(row[column])
    })

    return normalized
  })

  return { columns, rows: normalizedRows }
}

export function parseCsvText(text: string): Dataset {
  const result = Papa.parse<Record<string, unknown>>(text.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (header: string) => header.trim(),
  })

  if (result.errors.length) {
    throw new Error(result.errors[0]?.message ?? 'CSV parsing failed.')
  }

  return buildDataset(result.data)
}

export function parseJsonText(text: string): Dataset {
  const parsed = JSON.parse(text)

  if (Array.isArray(parsed)) {
    return buildDataset(parsed as Record<string, unknown>[])
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as Dataset).columns) &&
    Array.isArray((parsed as Dataset).rows)
  ) {
    const dataset = parsed as Dataset

    return {
      columns: dataset.columns.map((column) => column.trim()).filter(Boolean),
      rows: dataset.rows.map((row) => {
        const normalized: DataRow = {}

        Object.entries(row).forEach(([key, value]) => {
          normalized[key.trim()] = normalizeCell(value)
        })

        return normalized
      }),
    }
  }

  throw new Error('JSON must be an array of objects or { columns, rows }.')
}

export function getNumericColumns(dataset: Dataset): string[] {
  return dataset.columns.filter((column) =>
    dataset.rows.some((row) => typeof row[column] === 'number'),
  )
}

export function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim()

  if (!text) {
    return null
  }

  const number = Number(text)

  return Number.isFinite(number) ? number : null
}

export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value
  }

  const text = String(value ?? '').trim()

  if (!text) {
    return null
  }

  const parsed = new Date(text)

  return Number.isNaN(parsed.valueOf()) ? null : parsed
}

export function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: Math.abs(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

export function buildSampleDataset(): Dataset {
  return parseCsvText(`Quarter,Revenue,Profit,Costs
Q1,22,8,14
Q2,28,10,18
Q3,34,13,21
Q4,42,16,26`)
}
