# PRODUCT REQUIREMENTS DOCUMENT (v1)

## Product Name

InfoNama

## 1. Product Definition

An editorial infographic builder for Medianama that:

- Accepts structured data, text, links, notes, screenshots, and source metadata
- Lets editors choose from a fixed set of infographic formats
- Combines charts with explanatory text, annotations, icons, diagrams, and branding
- Exports publication-grade static assets for articles, social posts, decks, and newsletters

This product extends the logic of ChartNama beyond charts. ChartNama is for single-chart outputs. InfoNama is for multi-block editorial explainers.

## 2. Why This Exists

Medianama covers technology, policy, telecom, AI, privacy, digital markets, platform governance, startups, and internet regulation in India. Many of these stories are only partly numeric. They often need visuals that explain:

- how a policy changed over time
- how a law, rule, or platform process works
- who the stakeholders are
- how money, data, or influence flows
- what changed between two versions of a proposal
- how a system is structured
- what readers should take away at a glance

The product therefore needs to support both:

- data-driven infographics
- information-driven explainers that are not primarily statistical

## 3. Core Principles

### Editorial First

- Built for newsroom clarity, not marketing decoration
- Prioritize understanding, sequence, and evidence over visual novelty

### Opinionated Design

- No fully freeform canvas in MVP
- Editors choose from predefined layouts and component types
- Strong defaults for typography, spacing, hierarchy, source labels, and branding

### Explainer Over Ornament

- Every infographic should communicate one main idea
- Visual blocks should support a clear reading path from headline to takeaway

### Structured Inputs

- Users should add information as blocks, fields, and assets
- Avoid requiring design tools or manual layout skills

### Source Transparency

- Source, date, methodology notes, and caveats should have a defined place
- Editorial credibility matters as much as aesthetics

## 4. What A Good Infographic Should Contain

An infographic should not just be "a chart with a title." It should package information so that a reader can understand the subject quickly and accurately.

### Required Content Layers

- Headline
- Optional subtitle / framing statement
- Primary takeaway or summary sentence
- Main visual block or sequence of visual blocks
- Labels and annotations that explain the meaning of the visual
- Source attribution
- Date / time context
- Medianama branding

### Optional Content Layers

- Short explainer paragraphs
- Definitions / glossary cards
- Key numbers
- Comparison notes
- Methodology / caveat box
- Callout quotes
- Links to source documents
- Screenshot or document annotation blocks

### Quality Bar

- One clear story per infographic
- Minimal jargon in labels
- Short, readable text blocks
- No decorative visual elements that do not help comprehension
- Clear order of reading on both desktop and mobile

## 5. Standard Infographic Types To Support

These types are relevant for Medianama and reflect common editorial information-design patterns, not just generic marketing templates.

### A. Statistical Infographic

Best for:

- market size
- subscriber/user growth
- platform metrics
- funding, revenue, fines, penalties, costs
- election, survey, or usage breakdowns

Typical blocks:

- bar / line / area / stacked bar / pie / map
- key number callouts
- short annotations

### B. Timeline / Chronology

Best for:

- regulatory developments
- court cases
- platform policy changes
- AI rulemaking
- startup or telecom milestones

Typical blocks:

- dated events
- grouped phases
- milestone cards
- "what changed" notes

### C. Process / How-It-Works Explainer

Best for:

- data request flows
- grievance redressal
- compliance workflows
- platform moderation pipelines
- telecom or internet infrastructure processes

Typical blocks:

- step cards
- arrows / connectors
- decision points
- actor labels

### D. Comparison / Before-After

Best for:

- old law vs new law
- draft vs final rules
- India vs other jurisdictions
- platform A vs platform B
- claim vs reality

Typical blocks:

- two-column or three-column comparison
- row-based criteria
- highlights and deltas

### E. Hierarchy / Policy Stack

Best for:

- ministry > regulator > company > user relationships
- layers of law, rules, standards, and implementation
- rights / obligations / accountability ladders

Typical blocks:

- pyramids
- layered stacks
- tree structures
- nested cards

### F. Geographic / Regional Infographic

Best for:

- state-by-state policy differences
- telecom penetration
- shutdowns
- regulatory actions
- infrastructure coverage

Typical blocks:

- India map
- choropleth / marker map
- region callouts

### G. Flow Infographic

Best for:

- movement of money
- data sharing chains
- ad-tech or platform ecosystem flows
- licensing, distribution, or enforcement flows

Typical blocks:

- sankey / alluvial / directional connectors
- origin-to-destination labels
- flow annotations

### H. Network / Ecosystem Map

Best for:

- stakeholder ecosystems
- ownership / influence structures
- industry relationships
- policy actors and institutional links

Typical blocks:

- node-link diagrams
- grouped clusters
- legend / role labels

### I. Annotated Document / Screenshot Explainer

Best for:

- highlighting changes in rules, notifications, or legal drafts
- showing where a clause appears in a document
- explaining app screens, interfaces, or policy screenshots

Typical blocks:

- screenshot / PDF crop
- numbered annotation pins
- explainer side notes

### J. List / FAQ / Glossary Infographic

Best for:

- "5 things to know"
- "terms you need to understand"
- issue explainers for beginners
- event recap graphics

Typical blocks:

- list cards
- icon + text rows
- glossary chips

### K. Decision Tree / Reader Guide

Best for:

- "does this law apply to you?"
- "which regulator is relevant?"
- "what happens next?"
- "what should a company do under this rule?"

Typical blocks:

- questions
- yes/no branches
- end-state outcomes

### L. Myth vs Fact / Claim vs Evidence

Best for:

- misinformation rebuttals
- policy rhetoric vs actual text
- public claims vs documented evidence

Typical blocks:

- paired cards
- evidence excerpts
- credibility/source markers

## 6. Relevance To Medianama Coverage

The most important infographic modes for Medianama are likely:

1. Timeline
2. Comparison
3. Process / how-it-works
4. Annotated document / screenshot
5. Statistical infographic
6. Hierarchy / policy stack
7. Network / ecosystem map
8. Geographic / regional infographic
9. Flow infographic
10. Myth vs fact / claim vs evidence

These fit Medianama's editorial mix of:

- technology policy
- AI governance
- privacy and data protection
- telecom and access
- digital markets and competition
- platform regulation
- copyright and media
- startup and business ecosystem coverage

## 7. Product Scope

### MVP

MVP should support the most reusable newsroom patterns first:

- Statistical infographic
- Timeline
- Comparison
- Process explainer
- Annotated document / screenshot
- List / glossary explainer

### Phase 2

- Hierarchy / policy stack
- Geographic infographic
- Flow infographic
- Network / ecosystem map
- Decision tree
- Myth vs fact

### Non-Goals For MVP

- Infinite freeform design canvas
- Animation-heavy storytelling
- Full illustration tooling
- Complex collaborative editing
- Interactive embeddables as first priority

## 8. Input Model

### Input Types

- CSV upload
- JSON upload
- Paste structured text
- Manual form entry
- Screenshot / image upload
- PDF page crop or image crop
- Source URL input

### Internal Model

```json
{
  "meta": {
    "title": "",
    "subtitle": "",
    "dek": "",
    "branding": "MEDIANAMA",
    "sources": [],
    "updatedAt": ""
  },
  "template": "timeline | comparison | process | statistical | annotated-doc | list",
  "blocks": [
    {
      "type": "chart | text | stat | step | event | comparison-row | annotation | image | source-note | glossary",
      "data": {}
    }
  ]
}
```

## 9. UI Structure

### Left Panel

- Project metadata
- content inputs
- uploaded assets
- source links

### Middle Panel

- block editor
- section ordering
- template-specific fields

### Right Panel

- template chooser
- style variants
- preview settings

### Bottom Bar

- validate
- render
- export

## 10. Template Logic

The product should be template-driven.

Each infographic type should define:

- allowed block types
- default layout sequence
- minimum required content
- optional sections
- typography and spacing rules
- annotation style
- export framing

Example:

- Timeline template requires:
  - title
  - at least 3 dated events
  - one source
- Comparison template requires:
  - at least 2 entities or states
  - at least 3 comparison rows
- Process template requires:
  - ordered steps
  - directional flow

## 11. Design System

### Tone

- clean
- editorial
- high-trust
- publication-ready

### Typography

- headline-first hierarchy
- readable subheads
- compact body copy
- annotation text must remain legible in export

### Color

- Medianama-led palette
- restrained accents
- data colors should remain interpretable in grayscale where possible

### Layout

- modular blocks
- strong section rhythm
- consistent margins
- mobile-safe stacking

### Branding

- MEDIANAMA mark should have a fixed, export-safe placement
- source and methodology boxes should look editorial, not promotional

## 12. Export Requirements

- PNG export
- SVG export
- print-friendly PDF export in a later phase
- 2x and 3x resolution presets
- fixed white background by default
- exported text must preserve alignment, hierarchy, and branding

## 13. Validation Rules

- No export without title
- No export without at least one source
- Warn if text blocks are too long for the chosen template
- Warn if labels overflow
- Warn if comparison rows or process steps are too dense
- Warn if chart annotations overlap
- Warn if screenshot annotations point to unclear regions

## 14. Success Criteria

The product is successful if an editor can create a publication-ready infographic without needing a designer for routine explainer graphics.

### Editorial Success Metrics

- Faster turnaround for explanatory visuals
- More consistent Medianama visual language
- Better readability for policy and business stories
- Broader support for non-numeric storytelling

### Product Success Metrics

- Time to first draft infographic
- Number of exports per template type
- Low rate of manual redesign outside the tool
- High template reuse across topic areas

## 15. Research Summary That Shaped This PRD

This PRD is informed by two ideas:

1. Chart choice should follow the communication goal:
   - time
   - shares
   - absolute values
   - relationships
   - flows
   - geography

2. Infographics are not only charts:
   - they combine text, visuals, structure, and narrative to make information understandable quickly

For Medianama, the product therefore needs a broader template system than ChartNama, especially for timelines, process explainers, comparisons, document annotations, ecosystems, and policy structure graphics.

## 16. Source Notes

- Datawrapper chart-type guide: https://www.datawrapper.de/blog/chart-types-guide
- Datawrapper on text in visualizations: https://www.datawrapper.de/blog/text-in-data-visualizations
- From Data to Viz: https://www.data-to-viz.com/
- The Data Visualisation Catalogue: https://datavizcatalogue.com/
- Medianama homepage and coverage framing: https://www.medianama.com/

## 17. Concrete Feature Plan

This section translates the PRD into a buildable plan inside the existing ChartNama product.

### Product Strategy

- Keep ChartNama as the single-chart workspace
- Add InfoNama as a second tab in the same application
- Reuse shared concepts where possible:
  - title
  - subtitle
  - source metadata
  - export pipeline
  - MEDIANAMA branding
- Do not merge the products into one confusing editor
  - ChartNama should stay fast and chart-specific
  - InfoNama should focus on multi-block editorial explainers

### v1 Scope To Build Now

The first working version of InfoNama should support five templates:

1. Timeline
2. Comparison
3. Process
4. List / glossary
5. Statistical explainer

### Shared v1 Features

- Top-level app tabs:
  - ChartNama
  - InfoNama
- Shared editorial metadata:
  - headline
  - subtitle
  - takeaway
  - source
  - updated date
- Live preview panel
- PNG export
- Fixed MEDIANAMA branding
- Strong template-specific empty states and guidance copy
- Suggested AI prompts for article-to-infographic workflow

### v1 Template Requirements

#### Timeline

- Input format:
  - `date | event title | note`
- Preview should show:
  - chronological cards
  - date markers
  - concise side notes

#### Comparison

- Input format:
  - `criterion | side A | side B`
- Preview should show:
  - two-column comparison table/cards
  - row labels
  - optional intro takeaway

#### Process

- Input format:
  - `step title | detail`
- Preview should show:
  - numbered sequence
  - directional reading flow
  - short step notes

#### List / Glossary

- Input format:
  - `term | explanation`
- Preview should show:
  - stacked explainer cards
  - emphasis on readability and scannability

#### Statistical Explainer

- Reuse the existing charting engine
- Input source:
  - current imported dataset
  - current mapped chart selection
- Preview should show:
  - headline
  - takeaway card
  - embedded chart
  - source/footer block

### UI Plan

#### Top Navigation

- Add a compact tab switcher below the hero
- Active tab should clearly indicate mode:
  - chart builder
  - infographic builder

#### InfoNama Workspace

- Left panel:
  - infographic metadata
  - source/date
  - raw block input
- Middle panel:
  - template-specific instructions
  - textarea editor
  - optional labels such as side A / side B
- Right panel:
  - template chooser
  - feature checklist
  - scope note about supported formats in v1

#### Preview Section

- Dedicated export surface separate from controls
- HTML/CSS layout for non-chart templates
- Reuse chart SVG only for statistical explainer mode

#### AI Prompt Guidance

- Add a bottom-page prompt section in InfoNama
- Prompt 1:
  - identify which infographic types are possible from an article
  - base the suggestions on supported InfoNama templates
- Prompt 2:
  - selected through a dropdown
  - generate template-specific extraction instructions
  - output should match the structured input format used by the infographic editor

### Data Model For v1

```json
{
  "mode": "timeline | comparison | process | list | statistical",
  "meta": {
    "title": "",
    "subtitle": "",
    "takeaway": "",
    "source": "",
    "updatedAt": ""
  },
  "rawItems": "",
  "labels": {
    "left": "",
    "right": ""
  }
}
```

### Parsing Rules For v1

- Split multiline input by newline
- Split each line on `|`
- Trim all fields
- Ignore empty lines
- Keep parsing lenient
- Show guidance if a line has too few fields

### Validation Rules For v1

- Require title for export
- Require source for export
- Require at least:
  - 3 entries for timeline
  - 3 rows for comparison
  - 3 steps for process
  - 3 items for list
  - valid chart config for statistical mode

### Build Order

#### Step 1

- Add app-level tabs and mode switching

#### Step 2

- Add InfoNama state model and template chooser

#### Step 3

- Build timeline, comparison, process, and list previews with HTML/CSS

#### Step 4

- Add statistical explainer mode using the existing chart renderer

#### Step 5

- Reuse PNG export for the InfoNama preview surface

#### Step 6

- Refine copy, spacing, empty states, and validation messaging

#### Step 7

- Add article-analysis and extraction prompts for AI-assisted infographic creation

### Out Of Scope For This Build

- drag-and-drop block reordering
- maps
- network diagrams
- decision trees
- PDF annotation tool
- multi-page infographic stories
- saved projects
- collaborative editing

### Next Phase After v1

- Add hierarchy / policy stack template
- Add myth-vs-fact template
- Add annotated screenshot/document template
- Add import from structured JSON block schema
- Add SVG export for non-chart infographic layouts

## 18. AI-Assisted Editorial Workflow

InfoNama should assume a realistic newsroom flow:

1. An editor pastes a Medianama or Reasoned.live article into an AI system.
2. The AI identifies which infographic templates are possible from the article.
3. The editor picks one template.
4. The AI extracts structured content in the exact format required by that template.
5. The editor pastes the structured output into InfoNama, checks the preview, and exports.

This means the product should not only render infographics. It should also help editors ask the AI the right questions before they enter the editor.
