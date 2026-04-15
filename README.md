# ChartNama

ChartNama is a client-side chart builder for publication-grade visuals. It accepts pasted CSV-like data, CSV uploads, and JSON uploads, lets the user map the X axis and Y series explicitly, renders charts with a fixed editorial design system, and exports the result as a 2x PNG.

## Stack

- React 19
- TypeScript
- Vite
- D3
- html-to-image
- Papa Parse

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run lint
```

## Product scope

- Client-side only
- No backend
- No chart styling controls
- Explicit chart type and field mapping
- Fixed palette and typography
