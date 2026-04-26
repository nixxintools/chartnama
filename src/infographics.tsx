import { ChartStage } from './charts'
import type {
  ChartConfig,
  ComparisonRow,
  Dataset,
  DecisionBranch,
  GlossaryItem,
  HierarchyItem,
  ImpactCard,
  InfoMeta,
  InfoTemplate,
  OptionCard,
  OverlapZone,
  ProcessStep,
  QuadrantPoint,
  TimelineItem,
} from './types'

type InfoStageProps = {
  template: InfoTemplate
  meta: InfoMeta
  timelineItems: TimelineItem[]
  comparisonRows: ComparisonRow[]
  processSteps: ProcessStep[]
  glossaryItems: GlossaryItem[]
  overlapZones: OverlapZone[]
  optionCards: OptionCard[]
  impactCards: ImpactCard[]
  decisionBranches: DecisionBranch[]
  singleQuadrantPoints: QuadrantPoint[]
  fourQuadrantPoints: QuadrantPoint[]
  hierarchyItems: HierarchyItem[]
  dataset: Dataset
  chartConfig: ChartConfig
}

function InfoHeader({ meta }: { meta: InfoMeta }) {
  return (
    <header className="info-stage-header">
      <div className="info-stage-title-block">
        <h2>{meta.title}</h2>
        <div className="info-stage-brand">MEDIANAMA</div>
      </div>
      {meta.subtitle ? <p className="info-stage-subtitle">{meta.subtitle}</p> : null}
      {meta.takeaway ? (
        <div className="info-stage-takeaway">
          <p>{meta.takeaway}</p>
        </div>
      ) : null}
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
  const layoutClass = steps.length <= 4 ? 'process-content horizontal' : 'process-content vertical'

  return (
    <section className={`info-content ${layoutClass}`}>
      {steps.map((step, index) => (
        <div key={`${step.title}-${index}`} className="process-sequence-item">
          <article className="process-step-card">
            <div className="process-step-number">{index + 1}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
          </article>
          {index < steps.length - 1 ? <div className="sequence-arrow" aria-hidden="true" /> : null}
        </div>
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

function OverlapStage({ zones }: { zones: OverlapZone[] }) {
  const left = zones.find((zone) => zone.zone.toLowerCase() === 'left')
  const overlap = zones.find((zone) => zone.zone.toLowerCase() === 'overlap')
  const right = zones.find((zone) => zone.zone.toLowerCase() === 'right')
  const fallbackZones = zones.slice(0, 3)

  return (
    <section className="info-content overlap-content">
      <div className="overlap-visual">
        <div className="overlap-circle overlap-left">
          <strong>{left?.title ?? fallbackZones[0]?.title ?? 'Left'}</strong>
        </div>
        <div className="overlap-circle overlap-right">
          <strong>{right?.title ?? fallbackZones[2]?.title ?? 'Right'}</strong>
        </div>
        <div className="overlap-center">
          <strong>{overlap?.title ?? fallbackZones[1]?.title ?? 'Shared'}</strong>
        </div>
      </div>
      <div className="overlap-detail-grid">
        {zones.map((zone, index) => (
          <article key={`${zone.zone}-${index}`} className="overlap-detail-card">
            <span>{zone.zone}</span>
            <h3>{zone.title}</h3>
            <p>{zone.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function OptionStage({ items }: { items: OptionCard[] }) {
  return (
    <section className="info-content option-content">
      {items.map((item, index) => (
        <article key={`${item.option}-${index}`} className="option-card">
          <span>Option {index + 1}</span>
          <h3>{item.option}</h3>
          <p>{item.summary}</p>
          <strong>{item.implication}</strong>
        </article>
      ))}
    </section>
  )
}

function ImpactStage({ items }: { items: ImpactCard[] }) {
  return (
    <section className="info-content impact-content">
      {items.map((item, index) => (
        <article key={`${item.group}-${index}`} className="impact-card">
          <span>{item.group}</span>
          <h3>{item.impact}</h3>
          <p>{item.implication}</p>
        </article>
      ))}
    </section>
  )
}

function DecisionTreeStage({ items }: { items: DecisionBranch[] }) {
  return (
    <section className="info-content decision-tree-content">
      {items.map((item, index) => (
        <article key={`${item.question}-${index}`} className="decision-card">
          <div className="decision-question">
            <span>Decision point {index + 1}</span>
            <h3>{item.question}</h3>
          </div>
          <div className="decision-branches">
            <div className="decision-branch">
              <strong>Yes</strong>
              <p>{item.yes}</p>
            </div>
            <div className="decision-branch">
              <strong>No</strong>
              <p>{item.no}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

function SingleQuadrantStage({
  meta,
  points,
}: {
  meta: InfoMeta
  points: QuadrantPoint[]
}) {
  return (
    <section className="info-content quadrant-content">
      <div className="quadrant-shell single-quadrant-shell">
        <span className="quadrant-label quadrant-left-label">{meta.leftLabel || 'Lower'}</span>
        <span className="quadrant-label quadrant-right-label">{meta.rightLabel || 'Higher'}</span>
        <span className="quadrant-label quadrant-top-label">{meta.topLabel || 'Higher'}</span>
        <span className="quadrant-label quadrant-bottom-label">{meta.bottomLabel || 'Lower'}</span>
        <div className="quadrant-axis quadrant-axis-x" />
        <div className="quadrant-axis quadrant-axis-y" />
        {points.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
            className="quadrant-point single-point"
            style={{
              left: `${Math.max(0, Math.min(100, point.x))}%`,
              bottom: `${Math.max(0, Math.min(100, point.y))}%`,
            }}
          >
            <div className="quadrant-dot" />
            <div className="quadrant-point-card">
              <strong>{point.label}</strong>
              <p>{point.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FourQuadrantStage({
  meta,
  points,
}: {
  meta: InfoMeta
  points: QuadrantPoint[]
}) {
  return (
    <section className="info-content quadrant-content">
      <div className="quadrant-shell four-quadrant-shell">
        <span className="quadrant-label quadrant-left-label">{meta.leftLabel || 'Lower'}</span>
        <span className="quadrant-label quadrant-right-label">{meta.rightLabel || 'Higher'}</span>
        <span className="quadrant-label quadrant-top-label">{meta.topLabel || 'Higher'}</span>
        <span className="quadrant-label quadrant-bottom-label">{meta.bottomLabel || 'Lower'}</span>
        <div className="quadrant-axis quadrant-axis-mid-x" />
        <div className="quadrant-axis quadrant-axis-mid-y" />
        {points.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
            className="quadrant-point four-point"
            style={{
              left: `${Math.max(0, Math.min(100, point.x))}%`,
              bottom: `${Math.max(0, Math.min(100, point.y))}%`,
            }}
          >
            <div className="quadrant-dot" />
            <div className="quadrant-point-card">
              <strong>{point.label}</strong>
              <p>{point.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HierarchyStage({ items }: { items: HierarchyItem[] }) {
  const grouped = items.reduce<Array<{ level: string; entries: HierarchyItem[] }>>((acc, item) => {
    const existing = acc.find((group) => group.level === item.level)

    if (existing) {
      existing.entries.push(item)
      return acc
    }

    acc.push({ level: item.level, entries: [item] })
    return acc
  }, [])

  return (
    <section className="info-content hierarchy-content">
      {grouped.map((group) => (
        <div key={group.level} className="hierarchy-level">
          <div className="hierarchy-level-label">{group.level}</div>
          <div className="hierarchy-level-grid">
            {group.entries.map((item, index) => (
              <article key={`${item.title}-${index}`} className="hierarchy-card">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
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
  overlapZones,
  optionCards,
  impactCards,
  decisionBranches,
  singleQuadrantPoints,
  fourQuadrantPoints,
  hierarchyItems,
  dataset,
  chartConfig,
}: InfoStageProps) {
  return (
    <section className="info-stage" aria-label={`${meta.title} infographic preview`}>
      <InfoHeader meta={meta} />
      {template === 'timeline' && <TimelineStage items={timelineItems} />}
      {template === 'comparison' && <ComparisonStage meta={meta} rows={comparisonRows} />}
      {template === 'before-after' && <ComparisonStage meta={meta} rows={comparisonRows} />}
      {template === 'process' && <ProcessStage steps={processSteps} />}
      {template === 'list' && <GlossaryStage items={glossaryItems} />}
      {template === 'overlap' && <OverlapStage zones={overlapZones} />}
      {template === 'options' && <OptionStage items={optionCards} />}
      {template === 'impact' && <ImpactStage items={impactCards} />}
      {template === 'decision-tree' && <DecisionTreeStage items={decisionBranches} />}
      {template === 'single-quadrant' && (
        <SingleQuadrantStage meta={meta} points={singleQuadrantPoints} />
      )}
      {template === 'four-quadrant' && (
        <FourQuadrantStage meta={meta} points={fourQuadrantPoints} />
      )}
      {template === 'hierarchy' && <HierarchyStage items={hierarchyItems} />}
      {template === 'statistical' && <StatisticalStage dataset={dataset} chartConfig={chartConfig} />}
      <InfoFooter meta={meta} />
    </section>
  )
}
