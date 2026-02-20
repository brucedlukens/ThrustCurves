# Phase 6: Precision Motorsport Telemetry Redesign

**Worktree:** `C:/Users/Bruce/workspace/ThrustCurves-redesign`
**Branch:** `feature/phase6-redesign`
**Base:** Merged PR #5 (6d5071b) — all phases 1–5 complete

---

## Aesthetic Direction

**Theme:** Precision Motorsport Telemetry — race data logger meets high-end automotive branding.
- Deep near-black background (#0a0a0f base)
- Accent: **Amber/Gold** (`#f59e0b` amber-500) — replaces all indigo
- Display typeface: **Chakra Petch** (headers, labels, car name, nav items)
- Data typeface: **JetBrains Mono** (all numeric data — HP, torque, RPM, times, ratios)
- Body/UI: **Barlow Condensed** (descriptions, card text, form labels)
- Charts: instrument-panel feel — intentional gear color palette, glowing envelope line
- Data feels alive — numbers feel like instrument panel readouts, not form fields

---

## Fonts (Google Fonts via @import)

```
Chakra Petch: 400, 600, 700
Barlow Condensed: 400, 500, 600
JetBrains Mono: 400, 500
```

Applied via CSS variables:
- `--font-display: 'Chakra Petch'` — app name, section headers, nav, metric labels
- `--font-ui: 'Barlow Condensed'` — body text, descriptions, card content
- `--font-mono: 'JetBrains Mono'` — all numeric data

---

## Color Palette (CSS Custom Properties)

```css
:root {
  --color-bg:          #0a0a0f;              /* Deep near-black base */
  --color-surface:     #111118;              /* Cards, panels */
  --color-surface-2:   #1a1a24;             /* Nested elements, inputs */
  --color-border:      #2a2a38;              /* Subtle borders */
  --color-border-2:    #3a3a50;             /* Elevated/focus borders */
  --color-text-1:      #f0f0f8;             /* Primary text */
  --color-text-2:      #8888aa;             /* Secondary text */
  --color-text-3:      #55556a;             /* Tertiary/placeholder */
  --color-accent:      #f59e0b;             /* Amber primary accent */
  --color-accent-dim:  rgba(245,158,11,0.12); /* Amber selected bg tint */
  --color-accent-glow: rgba(245,158,11,0.2); /* Amber glow */
  --color-success:     #10b981;             /* Green */
  --color-danger:      #ef4444;             /* Red */
  --font-display:      'Chakra Petch', system-ui, sans-serif;
  --font-ui:           'Barlow Condensed', system-ui, sans-serif;
  --font-mono:         'JetBrains Mono', 'Courier New', monospace;
}
```

---

## Gear Color Palette (Motorsport-Inspired)

Replace rainbow defaults:
```
Gear 1: #f59e0b  (amber — matches accent)
Gear 2: #06b6d4  (cyan)
Gear 3: #10b981  (emerald)
Gear 4: #8b5cf6  (violet)
Gear 5: #f43f5e  (rose)
Gear 6: #fb923c  (orange)
Envelope: #ffffff (white, with drop-shadow glow)
```

---

## Implementation Order & Checklist

Work through items in this exact order. Check off as complete.

### Foundation

- [ ] **`src/index.css`**
  - Google Fonts @import (Chakra Petch, Barlow Condensed, JetBrains Mono)
  - CSS custom properties (:root block above)
  - Base body styles (font-family: var(--font-ui), background: var(--color-bg), color: var(--color-text-1))
  - Custom scrollbar (thin, 6px, matches --color-border-2)
  - `@import "tailwindcss"` stays at top (before font import)
  - Font utility classes via Tailwind: use arbitrary values in components like `font-[family-name:var(--font-display)]`

- [ ] **`src/components/layout/AppShell.tsx`**
  - Add `const [sidebarOpen, setSidebarOpen] = useState(false)`
  - Pass `onMenuToggle={() => setSidebarOpen(true)}` to Header
  - Pass `isOpen={sidebarOpen}` and `onClose={() => setSidebarOpen(false)}` to Sidebar
  - Desktop layout unchanged (flex row, sidebar left, main right)
  - Mobile: main area full-width (sidebar hidden, shown as drawer)
  - Background: bg-[--color-bg]

- [ ] **`src/components/layout/Header.tsx`**
  - Accept `onMenuToggle?: () => void` prop
  - Left: hamburger button `md:hidden` — three lines SVG icon
  - "THRUSTCURVES" in Chakra Petch bold, amber color, uppercase tracking
  - Subtitle "CAR PERFORMANCE SIMULATOR" in Barlow Condensed, muted, hidden on mobile (sm:hidden)
  - Background: bg-[--color-surface] border-b border-[--color-border]
  - No right-side content (reserved)

- [ ] **`src/components/layout/Sidebar.tsx`**
  - Accept `isOpen?: boolean`, `onClose?: () => void` props
  - Desktop: `hidden md:flex flex-col` static sidebar (w-56, not w-48)
  - Mobile overlay: `fixed inset-0 z-40` backdrop when open, `md:hidden`
  - Sidebar panel: `fixed left-0 top-0 h-full w-64 z-50` with slide transition
  - `translate-x-0` when open, `-translate-x-full` when closed, `transition-transform duration-300`
  - Nav items: Chakra Petch, amber active state
  - Active: `border-l-2 border-amber-500 bg-[--color-accent-dim] text-amber-400`
  - Inactive: `text-[--color-text-2] hover:text-[--color-text-1] hover:bg-[--color-surface-2]`
  - SVG icons inline next to each label (Home, Gauge/Tachometer, BarChart2, Bookmark)
  - Close button on mobile drawer (×)
  - Bottom decorative element: 3 horizontal lines (speed stripe motif)

### Pages (responsive layout)

- [ ] **`src/pages/SimulatorPage.tsx`**
  - Desktop: `md:flex md:flex-row gap-6 h-full` — left panel w-72, right flex-1
  - Mobile: `flex flex-col gap-4` — stacked (controls → charts → results)
  - Left control panel: full-width on mobile, scrollable on desktop
  - Chart section headers: Chakra Petch uppercase with amber left border accent
    ```
    <div class="flex items-center gap-2 mb-3">
      <div class="w-0.5 h-4 bg-amber-500"></div>
      <h2 class="font-[family-name:var(--font-display)] text-xs uppercase tracking-widest text-[--color-text-2]">
        Thrust Curves
      </h2>
    </div>
    ```
  - SaveLoadControls positioned right of section header (flex justify-between)
  - Charts container: `bg-[--color-surface] rounded-lg border border-[--color-border] p-4`

- [ ] **`src/pages/HomePage.tsx`**
  - Full hero redesign: centered, Chakra Petch display title (text-5xl md:text-7xl)
  - "THRUSTCURVES" — uppercase, amber gradient or solid amber
  - Tagline: Barlow Condensed, muted, tracking-wide
  - Primary CTA: amber bg button, dark text
  - Secondary CTA: amber border, amber text, transparent bg
  - Subtle decorative: three thin horizontal lines (speed stripe) above title

- [ ] **`src/pages/ComparePage.tsx`**
  - Mobile: stacked (setup selector → chart → table)
  - Page title: Chakra Petch, large
  - Desktop two-column layout unchanged

- [ ] **`src/pages/SavedPage.tsx`**
  - Title: Chakra Petch
  - Otherwise minimal changes (card styling via SavedConfigsList)

### Charts (Hero Treatment)

- [ ] **`src/components/charts/ThrustCurveChart.tsx`**
  - New GEAR_COLORS: `['#f59e0b','#06b6d4','#10b981','#8b5cf6','#f43f5e','#fb923c']`
  - Envelope line: white `#ffffff`, strokeWidth 3, dotted pattern (strokeDasharray "4 3")
  - Envelope glow: wrap in SVG filter or add a second thicker translucent line beneath
    - Add: `<Line dataKey="envelope" stroke="rgba(255,255,255,0.2)" strokeWidth={8} dot={false} connectNulls />` immediately before the white line
  - Grid: stroke `#1e1e2e` (darker than current #374151)
  - CartesianGrid: strokeDasharray "2 4" (more subtle)
  - Axis ticks: `style={{ fontFamily: 'Chakra Petch', fontSize: 10, fill: '#8888aa' }}`
  - Axis labels: `style={{ fontFamily: 'Chakra Petch', fontSize: 11, fill: '#8888aa' }}`
  - Tooltip: `contentStyle={{ backgroundColor: '#111118', border: '1px solid #3a3a50', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: 11 }}`
  - Tooltip `labelStyle={{ fontFamily: 'Chakra Petch', color: '#f59e0b' }}`
  - Legend: `wrapperStyle={{ fontFamily: 'Chakra Petch', fontSize: 11, color: '#8888aa' }}`
  - Height: 340 (up from 320)

- [ ] **`src/components/charts/PowerTorqueChart.tsx`**
  - Torque line: `#f59e0b` (amber, matches accent)
  - Power line: `#06b6d4` (cyan)
  - Y-axis label colors match their lines
  - Same font/tooltip treatment as ThrustCurveChart
  - Height: 300 (up from 280)

- [ ] **`src/components/charts/ComparisonChart.tsx`**
  - Same COMPARISON_COLORS as GEAR_COLORS above
  - Same font/tooltip/grid treatment
  - Height: 340

### Results

- [ ] **`src/components/results/PerformanceCard.tsx`**
  - Complete visual overhaul — dashboard / timing board aesthetic
  - Container: `bg-[--color-surface] rounded-lg border border-[--color-border] overflow-hidden`
  - Amber top accent: `border-t-2 border-amber-500` on container
  - Header: Chakra Petch uppercase, amber text, tracking-widest
  - Each metric card:
    - Label: Chakra Petch, text-[10px] uppercase tracking-widest, text-[--color-text-3]
    - Value: JetBrains Mono, text-3xl font-medium, text-[--color-text-1]
    - Subtle bottom border between label and value: thin amber line
  - Desktop: 5-column grid `grid grid-cols-5`
  - Mobile: horizontal scroll row `flex overflow-x-auto gap-0 snap-x`
    - Each card: `min-w-[120px] snap-start p-4 border-r border-[--color-border]`
  - Dividers between cards: `divide-x divide-[--color-border]` on desktop

- [ ] **`src/components/results/ShiftPointsTable.tsx`**
  - Header row: Chakra Petch uppercase, text-[--color-text-3]
  - Data cells: JetBrains Mono
  - "Gear N → N" arrows: amber colored arrows
  - Alternating rows: very subtle `bg-[--color-surface-2]/50` on every other row
  - Border: `border-[--color-border]`

- [ ] **`src/components/results/ComparisonTable.tsx`**
  - Metric labels: Chakra Petch uppercase
  - All numeric values: JetBrains Mono
  - Winner (fastest) in each row: amber text highlight
  - Deltas: JetBrains Mono, green if improvement (negative delta), red if worse
  - Base column header: "(BASE)" label in muted text

### Modifications Panel

- [ ] **`src/components/editor/ModificationsPanel.tsx`**
  - Replace `<Section>` with `<AccordionSection>` component (defined in same file)
  - AccordionSection props: `title`, `children`, `defaultOpen?: boolean`, `activeCount?: number`
  - State: `const [openSections, setOpenSections] = useState({ Environment: true, Performance: true, Engine: false, Drivetrain: false, Tires: false, Aerodynamics: false })`
  - Section header: `flex items-center justify-between cursor-pointer py-2`
    - Left: Chakra Petch uppercase tracking-widest, text-[--color-text-2]
    - Right: chevron SVG (rotates on open), + active count badge if closed+active
  - Content: conditionally rendered (no animation needed initially)
  - Active count badge: small amber pill `<span class="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">{n}</span>`
  - Section dividers: `border-t border-[--color-border]`

- [ ] **`src/components/editor/TorqueCurveEditor.tsx`**
  - Slider: `accent-amber-500` (Tailwind v4: `accent-[#f59e0b]`)
  - Percentage label: JetBrains Mono, amber, text-base (larger than current)
  - Custom curve table: JetBrains Mono inputs
  - "Enter custom values" link: amber color

- [ ] **`src/components/editor/ForcedInductionToggle.tsx`**
  - Toggle: larger `h-6 w-11`, amber when ON (`bg-amber-500` replaces `bg-indigo-600`)
  - Dot: `h-4 w-4`, translates `translate-x-6` when on, `translate-x-1` when off
  - Label: Barlow Condensed
  - Stock badge: tiny `text-[10px] bg-[--color-surface-2] text-[--color-text-3] px-1 rounded` when not overridden

- [ ] **`src/components/editor/GearRatioEditor.tsx`**
  - Inputs: `font-[family-name:var(--font-mono)]` + amber focus ring
  - Replace `focus:ring-indigo-500` → `focus:ring-amber-500`
  - Input bg: `bg-[--color-surface-2] border-[--color-border]`

- [ ] **`src/components/editor/WeightEditor.tsx`**
  - Input: JetBrains Mono, amber focus
  - Stock/Effective display: stock in text-[--color-text-3], effective in text-[--color-text-1]
  - All indigo → amber

- [ ] **`src/components/editor/TireSizeEditor.tsx`**
  - Inputs: JetBrains Mono, amber focus
  - Outer diameter: amber highlight text

- [ ] **`src/components/editor/AeroEditor.tsx`**
  - Inputs: JetBrains Mono, amber focus
  - All indigo → amber

- [ ] **`src/components/editor/AltitudeSelector.tsx`**
  - Select + input: amber focus, bg-[--color-surface-2]
  - All indigo → amber

- [ ] **`src/components/editor/TractionEditor.tsx`**
  - Select + input: amber focus
  - μ symbol in JetBrains Mono
  - All indigo → amber

### Car Selector

- [ ] **`src/components/car-selector/CarSearch.tsx`**
  - Command palette aesthetic: `bg-[--color-surface-2] border border-[--color-border]`
  - Left padding for icon: `pl-9`
  - SVG magnifying glass icon absolutely positioned: `absolute left-3 top-1/2 -translate-y-1/2`
  - Focus: `focus:border-[--color-border-2] focus:ring-1 focus:ring-amber-500/30`
  - Placeholder: text-[--color-text-3]
  - Clear button (×) when query non-empty — appears at right, fades in

- [ ] **`src/components/car-selector/CarCard.tsx`**
  - Redesign layout: instrument-style
  - Top row: Year + Make + Model in Barlow Condensed medium (text-sm), trim in muted
  - HP/torque row: JetBrains Mono, larger text (text-base), displayed prominently
    - `{hp} hp / {torque} lb·ft` as the hero data row
  - Bottom row: drivetrain + gears + displacement as small pills/tags
  - Selected state: `border-l-2 border-amber-500 bg-[--color-accent-dim]` + amber checkmark (✓) at right
  - Unselected: `border-[--color-border] bg-[--color-surface] hover:border-[--color-border-2]`
  - Replace all indigo references with amber

- [ ] **`src/components/car-selector/CarSpecTable.tsx`**
  - Label cells: Chakra Petch uppercase
  - Value cells: JetBrains Mono for numeric values, Barlow Condensed for text values
  - Max Power / Max Torque rows: slightly highlighted with amber left border

### Saved

- [ ] **`src/components/saved/SaveLoadControls.tsx`**
  - "Save Setup" button: `border-amber-600 text-amber-400 hover:bg-amber-500 hover:text-black`
  - Save/Cancel buttons: amber primary, muted cancel
  - Input: JetBrains Mono, amber focus
  - All indigo → amber

- [ ] **`src/components/saved/SavedConfigsList.tsx`**
  - Card: `bg-[--color-surface] border border-[--color-border] rounded-lg`
  - Setup name: Barlow Condensed medium, text-[--color-text-1]
  - Car label: text-[--color-text-2], smaller
  - Date: JetBrains Mono, text-[--color-text-3]
  - Selected (compare): amber border + amber bg tint
  - Action buttons: consistent styling — muted borders, hover elevates
  - Compare button when selected: amber fill
  - Delete button hover: red border + red text
  - All indigo → amber

---

## Technical Notes

### Tailwind v4 Font Application
There is no tailwind.config.ts. To apply custom font families, use:
```tsx
// Arbitrary CSS variable value syntax in Tailwind v4:
className="font-[family-name:var(--font-display)]"
className="font-[family-name:var(--font-mono)]"
className="font-[family-name:var(--font-ui)]"
```
Or use inline `style={{ fontFamily: 'var(--font-display)' }}`.

### Recharts Font Customization (SVG text)
Recharts renders SVG `<text>` elements. Apply fonts via:
```tsx
<XAxis tick={{ style: { fontFamily: 'Chakra Petch', fontSize: 10 } }} />
<YAxis tick={{ style: { fontFamily: 'Chakra Petch', fontSize: 10 } }} />
// For axis labels:
label={{ value: 'Speed (mph)', style: { fontFamily: 'Chakra Petch' }, fill: '#8888aa' }}
// For tooltip:
<Tooltip contentStyle={{ fontFamily: 'JetBrains Mono' }} labelStyle={{ fontFamily: 'Chakra Petch' }} />
// For legend:
<Legend wrapperStyle={{ fontFamily: 'Chakra Petch' }} />
```

### Envelope Glow Effect
Since Recharts Line doesn't directly support SVG filters, simulate glow by rendering two lines:
```tsx
{/* Glow layer — wide, low opacity */}
<Line dataKey="envelope" stroke="rgba(255,255,255,0.15)" strokeWidth={10} dot={false} connectNulls legendType="none" />
{/* Main white line */}
<Line dataKey="envelope" name="Envelope" stroke="#ffffff" strokeWidth={2.5} dot={false} connectNulls />
```
Note: Two Lines with same `dataKey` in Recharts — the second will show in legend; first uses `legendType="none"` to hide it.

### Mobile Drawer Animation
```tsx
// Sidebar
<div className={`fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
```

### Accordion Sections (ModificationsPanel)
Simple implementation — no animation required initially:
```tsx
function AccordionSection({ title, children, defaultOpen = false, activeCount = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-[--color-border] pt-3">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-1">
        <span className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-widest text-[--color-text-2]">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {!open && activeCount > 0 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">{activeCount}</span>}
          <ChevronIcon className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && <div className="pt-2 pb-3">{children}</div>}
    </div>
  )
}
```

### Input Style Constant (shared pattern across all editors)
Replace the old `INPUT_CLS` constant in each editor file:
```ts
const INPUT_CLS =
  'w-full bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 ' +
  'text-sm text-[--color-text-1] font-[family-name:var(--font-mono)] ' +
  'focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-[--color-border-2] ' +
  'placeholder:text-[--color-text-3]'
```

### Existing Tests — No Behavior Changes
- All component logic, props, store interactions, and callbacks remain IDENTICAL
- Only change: Tailwind class names and inline styles (visual only)
- Tests that check class names: search test files before starting — update if needed
- Tests that check rendered content/behavior: should pass without changes

---

## Final Steps (after all components complete)

1. `npm run lint` — fix any ESLint issues
2. `npm test` — ensure all existing tests pass
3. `npm run build` — ensure production build succeeds
4. Visual QA: Check mobile layout (768px breakpoint), charts, accordion, card styles
5. Commit: `git add -A && git commit -m "feat: precision motorsport telemetry redesign"`
6. Push and create PR: `gh pr create`

---

## Session Resume

If this session is interrupted, resume from this file. Check the checklist above — find the first unchecked item and continue from there. Each item is self-contained enough to pick up mid-stream.

**Worktree:** `C:/Users/Bruce/workspace/ThrustCurves-redesign`
**Branch:** `feature/phase6-redesign`
