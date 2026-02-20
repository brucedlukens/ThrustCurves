# ThrustCurves — Precision Motorsport Telemetry Redesign
## Worktree: ThrustCurves-telemetry-ms7k2
## Branch: feature/phase6-telemetry-design
## Date: 2026-02-19

---

## Design System

### Color Palette (Tailwind v4 CSS variables via @theme)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-surface-0` | `#080809` | App background (near-black) |
| `--color-surface-1` | `#0f0f12` | Card/panel background |
| `--color-surface-2` | `#17171c` | Elevated card, input bg |
| `--color-surface-3` | `#1f1f26` | Hover states |
| `--color-border` | `#2a2a35` | Default border |
| `--color-border-subtle` | `#1e1e26` | Subtle separators |
| `--color-accent` | `#dc2626` | Signal red — primary accent |
| `--color-accent-bright` | `#ef4444` | Hover/active accent |
| `--color-accent-dim` | `#7f1d1d` | Muted accent (backgrounds) |
| `--color-text-primary` | `#eeeef2` | Main text |
| `--color-text-secondary` | `#8888a0` | Secondary labels |
| `--color-text-muted` | `#55556a` | Placeholder, disabled |
| `--color-text-data` | `#f0f0fa` | Instrument data numbers |

### Typography

**Google Fonts to import:**
- `Barlow+Condensed:wght@400;500;600;700` — headers, section labels, nav
- `JetBrains+Mono:wght@400;500;600` — all numeric data, inputs
- System fallback for body text: `system-ui, -apple-system, sans-serif`

**Usage:**
- `.font-display` → Barlow Condensed (headers, car names, metric labels)
- `.font-data` → JetBrains Mono (numbers, tables, inputs, chart labels)
- Body text → system-ui

### Chart Color Palette (intentional, not rainbow)
- Gear 1: `#ef4444` (red — low, aggressive)
- Gear 2: `#f97316` (orange)
- Gear 3: `#eab308` (amber)
- Gear 4: `#22c55e` (green — mid, stable)
- Gear 5: `#06b6d4` (cyan)
- Gear 6: `#6366f1` (indigo — high, refined)
- Gear 7+: `#a855f7` (violet)
- Gear 8+: `#ec4899` (pink)
- Envelope: `#f0f0fa` (near-white, bold — "the line that matters")

---

## Implementation Checklist

### Phase A: Foundation
- [x] Create worktree + npm install
- [ ] **A1**: `src/index.css` — Font imports, @theme variables, base styles, utility classes
- [ ] **A2**: `src/components/layout/AppShell.tsx` — Responsive shell, mobile state
- [ ] **A3**: `src/components/layout/Header.tsx` — Display font branding, mobile hamburger
- [ ] **A4**: `src/components/layout/Sidebar.tsx` — Desktop persistent + mobile drawer

### Phase B: Car Selector
- [ ] **B1**: `src/components/car-selector/CarSearch.tsx` — Command-palette style search
- [ ] **B2**: `src/components/car-selector/CarCard.tsx` — Instrument-style numbers, selected state
- [ ] **B3**: `src/components/car-selector/CarSpecTable.tsx` — Monospace data table

### Phase C: Editor / Modifications Panel
- [ ] **C1**: `src/components/editor/ModificationsPanel.tsx` — Accordion sections
- [ ] **C2**: `src/components/editor/ForcedInductionToggle.tsx` — Premium toggle switch
- [ ] **C3**: `src/components/editor/WeightEditor.tsx` — Slider + monospace input
- [ ] **C4**: `src/components/editor/GearRatioEditor.tsx` — Monospace inputs grid
- [ ] **C5**: `src/components/editor/AeroEditor.tsx` — Numeric inputs
- [ ] **C6**: `src/components/editor/TireSizeEditor.tsx` — Numeric inputs
- [ ] **C7**: `src/components/editor/AltitudeSelector.tsx` — Styled selector
- [ ] **C8**: `src/components/editor/TractionEditor.tsx` — Slider
- [ ] **C9**: `src/components/editor/TorqueCurveEditor.tsx` — Keep existing, restyle

### Phase D: Charts
- [ ] **D1**: `src/components/charts/ThrustCurveChart.tsx` — Telemetry chart, bold envelope
- [ ] **D2**: `src/components/charts/PowerTorqueChart.tsx` — Dual-axis, instrument labels
- [ ] **D3**: `src/components/charts/ComparisonChart.tsx` — Side-by-side comparison

### Phase E: Results
- [ ] **E1**: `src/components/results/PerformanceCard.tsx` — Big instrument numbers, mobile scroll row
- [ ] **E2**: `src/components/results/ShiftPointsTable.tsx` — Clean monospace data table
- [ ] **E3**: `src/components/results/ComparisonTable.tsx` — Winner highlighting, delta colors

### Phase F: Saved / Persistence UI
- [ ] **F1**: `src/components/saved/SaveLoadControls.tsx` — Inline naming form
- [ ] **F2**: `src/components/saved/SavedConfigsList.tsx` — Compact lap-time-style cards

### Phase G: Pages
- [ ] **G1**: `src/pages/SimulatorPage.tsx` — Responsive two-column, stacks on mobile
- [ ] **G2**: `src/pages/ComparePage.tsx` — Side-by-side with winner highlighting
- [ ] **G3**: `src/pages/SavedPage.tsx` — Configuration manager
- [ ] **G4**: `src/pages/HomePage.tsx` — Landing with motorsport feel

### Phase H: QA
- [ ] **H1**: ESLint --fix pass
- [ ] **H2**: TypeScript check (`npx tsc --noEmit`)
- [ ] **H3**: Build check (`npm run build`)
- [ ] **H4**: Visual review notes

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, collapsed sidebar, accordion controls |
| Tablet | 768px–1024px | Sidebar hidden by default (overlay), 2-col optional |
| Desktop | ≥ 1024px | Persistent sidebar + 2-column simulator |

**Mobile Simulator Layout (stacked):**
```
┌─────────────────────┐
│  [☰] ThrustCurves   │  ← Header with hamburger
├─────────────────────┤
│  ▼ Car Selection    │  ← Accordion section
│    [search input]   │
│    [CarCard]        │
├─────────────────────┤
│  ▼ Modifications    │  ← Accordion section
│    [sections...]    │
├─────────────────────┤
│  Thrust Curve Chart │  ← Full width, 220px height
├─────────────────────┤
│  Power/Torque Chart │  ← Full width, 220px height
├─────────────────────┤
│ [metric] [metric]   │  ← 2-col grid or horizontal scroll
│ [metric] [metric]   │
│ [metric]            │
├─────────────────────┤
│  Shift Points Table │
└─────────────────────┘
```

**Desktop Layout:**
```
┌──────────┬──────────────────────────────────┐
│          │  Thrust Curve Chart              │
│ Sidebar  ├──────────────────────────────────┤
│ (280px)  │  Power/Torque Chart              │
│   Nav    ├──────────────────────────────────┤
│          │  [metric] [metric] [metric]       │
│          │  [metric] [metric]               │
│──────────├──────────────────────────────────┤
│  Car     │  Shift Points Table              │
│  Search  │                                  │
│  + Cards │                                  │
│          │                                  │
│  Mods    │                                  │
│  Panel   │                                  │
└──────────┴──────────────────────────────────┘
```

Wait — the user specified desktop layout as:
- LEFT sidebar: navigation only (~280px, persistent, collapsible)
- SIMULATOR page: left control panel (~320px) + right results

So the simulator page has its OWN two-column layout WITHIN the main content area (not counting the nav sidebar).

**Corrected Desktop Layout:**
```
┌──────────┬──────────────┬──────────────────────────┐
│ Nav      │ Control Panel│ Results Area             │
│ Sidebar  │ (~320px)     │ (flex-1)                 │
│ (~280px) │              │                          │
│  Home    │ Car Search   │ ThrustCurveChart         │
│  Sim*    │ CarCards     │ PowerTorqueChart         │
│  Compare │              │ PerformanceCard          │
│  Saved   │ Mods Panel   │ ShiftPointsTable         │
│          │  ↕ sections  │                          │
└──────────┴──────────────┴──────────────────────────┘
```

---

## Key Component Architecture Decisions

### AppShell State
```tsx
// Mobile sidebar state managed at AppShell level
const [sidebarOpen, setSidebarOpen] = useState(false)
// Pass down via context or props
```

### Accordion Pattern for ModificationsPanel
```tsx
// Each section has open/closed state
// Section header: uppercase label, chevron, click to toggle
// CSS transition: max-height + opacity for smooth animation
```

### PerformanceCard Mobile
```tsx
// Desktop: CSS grid 3-2 or 5-col
// Mobile: horizontal scroll row of cards (overflow-x-auto, flex, shrink-0)
// OR: 2-col grid (grid-cols-2)
```

### Chart Styling Strategy
- Recharts `CartesianGrid`: use `--color-border-subtle` (#1e1e26)
- Recharts `XAxis/YAxis tick`: font-data, text-secondary color
- Chart container: `surface-1` bg, `border border-[--color-border]`
- Subtle inner shadow: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`
- Envelope line: `strokeWidth={3}`, stroke=`--color-text-data` (near-white)
- Gear lines: `strokeWidth={1.5}`, opacity=0.7 when not highlighted

---

## Tailwind v4 Custom Theme (@theme)

In `src/index.css`:
```css
@import "tailwindcss";

@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

@theme {
  --color-surface-0: #080809;
  --color-surface-1: #0f0f12;
  --color-surface-2: #17171c;
  --color-surface-3: #1f1f26;
  --color-border: #2a2a35;
  --color-border-subtle: #1e1e26;
  --color-accent: #dc2626;
  --color-accent-bright: #ef4444;
  --color-accent-dim: #7f1d1d;
  --color-text-primary: #eeeef2;
  --color-text-secondary: #8888a0;
  --color-text-muted: #55556a;
  --color-text-data: #f0f0fa;

  --font-display: "Barlow Condensed", system-ui, sans-serif;
  --font-data: "JetBrains Mono", "Courier New", monospace;
  --font-body: system-ui, -apple-system, sans-serif;
}

/* Base styles */
body {
  background-color: var(--color-surface-0);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* Utility classes */
.font-display { font-family: var(--font-display); }
.font-data { font-family: var(--font-data); }
```

---

## Resumability

If token budget runs out, implementation status is tracked in the checklist above.
Check off items as they complete.

**Completed as of plan creation:** A0 (worktree + npm install)
**Next to implement:** A1 (index.css), then A2-A4 (layout), then B-H in order.

**To resume:** Read this file, check which items are done (marked [x]), continue from next unchecked item.
