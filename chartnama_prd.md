# PRODUCT REQUIREMENTS DOCUMENT (v2)

## Product Name

ChartNama

## 1. Product Definition

A client-side web app that: - Accepts structured data (paste / CSV /
JSON) - Allows user to explicitly choose chart type - Renders charts
using a strict, predefined design system - Exports publication-grade PNG

## 2. Core Principles

### Opinionated Design

-   No user styling
-   All visuals predefined

### Explicit Control

-   User selects chart type
-   User maps X-axis and Y-series

## 3. Data Input

### Formats

-   Paste (CSV-like)
-   CSV Upload
-   JSON Upload

### Internal Format

{ columns: string\[\] rows: Array\<Record\<string, number \| string\>\>
}

### Mapping UI

-   X-axis selector
-   Y-series multi-select

## 4. Chart Types

### Bar Chart (Single)

-   Vertical bars
-   Mustard color
-   Labels above
-   No Y-axis/grid

### Bar Chart (Dual)

-   Two bars per category
-   Mustard + Red
-   Supports negatives

### Stacked Bar

-   Red + Grey base
-   Additional palette if needed

### Line Chart

-   Straight lines
-   Circular markers
-   Labels on each point

### Multi-line

-   Max 6 series
-   Fixed palette

### Pie

-   Clean circle
-   Outside labels

### Area (Stacked)

-   Time-based
-   Opacity variation

## 5. Design System

### Colors

--mustard: #f4b400 --red: #e53935 --black: #111111 --grey: #cfcfcf
--background: #ffffff

### Typography

-   Inter / sans-serif
-   Title: 28--36px bold centered
-   Subtitle: 16--18px
-   Labels: 12--14px

### Layout

-   Centered
-   Padding: 40--60px

### Axes

-   Minimal or hidden
-   No gridlines

## 6. D3 Requirements

-   scaleBand, scaleLinear, scaleTime
-   line(): curveLinear
-   pie() + arc()

## 7. PNG Export

-   2x resolution
-   White background
-   Use html-to-image

## 8. UI Structure

-   Left: Input + preview
-   Middle: Mapping
-   Right: Chart selector
-   Bottom: Render + Download

## 9. Non-Goals

-   No animations
-   No backend
-   No customization
