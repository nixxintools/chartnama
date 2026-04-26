import { ChartStage } from './charts'
import type {
  ChartConfig,
  ComparisonRow,
  Dataset,
  GlossaryItem,
  InfoMeta,
  InfoTemplate,
  ProcessStep,
  TimelineItem,
} from './types'

type InfoStageProps = {
  template: InfoTemplate
  meta: InfoMeta
  timelineItems: TimelineItem[]
  comparisonRows: ComparisonRow[]
  processSteps: ProcessStep[]
  glossaryItems: GlossaryItem[]
  dataset: Dataset
  chartConfig: ChartConfig
}

function InfoHeader({ meta }: { meta: InfoMeta }) {
  return (
    <header className="info-stage-header">
      <div>
        <p className="info-stage-kicker">Medianama explainer</p>
        <h2>{meta.title}</h2>
      </div>
      <p className="info-stage-subtitle">{meta.subtitle}</p>
      <div className="info-stage-takeaway">
        <strong>Takeaway</strong>
        <p>{meta.takeaway}</p>
      </div>
    </header>
  )
}

function InfoFooter({ meta }: { meta: InfoMeta }) {
  return (
    <footer className="info-stage-footer">
      <div>
        <span>Source</span>
        <strong>{meta.source}</strong>
      </div>
      <div>
        <span>Updated</span>
        <strong>{meta.updatedAt}</strong>
      </div>
      <div className="info-stage-brand">MEDIANAMA</div>
    </footer>
  )
}

function TimelineStage({ items }: { items: TimelineItem[] }) {
  return (
    <section className="info-content timeline-content">
      {items.map((item, index) => (
        <article key={`${item.date}-${item.title}-${index}`} className="timeline-item-card">
          <div className="timeline-marker">{index + 1}</div>
          <div>
            <p className="timeline-date">{item.date}</p>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

function ComparisonStage({ meta, rows }: { meta: InfoMeta; rows: ComparisonRow[] }) {
  return (
    <section className="info-content comparison-content">
      <div className="comparison-grid comparison-grid-header">
        <span>Criterion</span>
        <span>{meta.leftLabel || 'Left side'}</span>
        <span>{meta.rightLabel || 'Right side'}</span>
      </div>
      {rows.map((row, index) => (
        <div key={`${row.criterion}-${index}`} className="comparison-grid comparison-grid-row">
          <strong>{row.criterion}</strong>
          <p>{row.left}</p>
          <p>{row.right}</p>
        </div>
      ))}
    </section>
  )
}

function ProcessStage({ steps }: { steps: ProcessStep[] }) {
  return (
    <section className="info-content process-content">
      {steps.map((step, index) => (
        <article key={`${step.title}-${index}`} className="process-step-card">
          <div className="process-step-number">{index + 1}</div>
          <div>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

function GlossaryStage({ items }: { items: GlossaryItem[] }) {
  return (
    <section className="info-content glossary-content">
      {items.map((item, index) => (
        <article key={`${item.term}-${index}`} className="glossary-card">
          <h3>{item.term}</h3>
          <p>{item.explanation}</p>
        </article>
      ))}
    </section>
  )
}

function StatisticalStage({
  dataset,
  chartConfig,
}: {
  dataset: Dataset
  chartConfig: ChartConfig
}) {
  return (
    <section className="info-content statistical-content">
      <div className="statistical-lead">
        <span>Data-backed explainer</span>
        <strong>
          {chartConfig.chartType.replace('-', ' ')} using {chartConfig.yKeys.join(', ')}
        </strong>
      </div>
      <div className="statistical-chart-shell">
        <ChartStage dataset={dataset} config={chartConfig} />
      </div>
    </section>
  )
}

export function InfoStage({
  template,
  meta,
  timelineItems,
  comparisonRows,
  processSteps,
  glossaryItems,
  dataset,
  chartConfig,
}: InfoStageProps) {
  return (
    <section className="info-stage" aria-label={`${meta.title} infographic preview`}>
      <InfoHeader meta={meta} />
      {template === 'timeline' && <TimelineStage items={timelineItems} />}
      {template === 'comparison' && <ComparisonStage meta={meta} rows={comparisonRows} />}
      {template === 'process' && <ProcessStage steps={processSteps} />}
      {template === 'list' && <GlossaryStage items={glossaryItems} />}
      {template === 'statistical' && (
        <StatisticalStage dataset={dataset} chartConfig={chartConfig} />
      )}
      <InfoFooter meta={meta} />
    </section>
  )
}
