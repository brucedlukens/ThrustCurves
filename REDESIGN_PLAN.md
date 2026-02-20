# ThrustCurves Redesign — Electric Teal / Precision Motorsport Telemetry

**Worktree:** `../ThrustCurves-redesign-teal`
**Branch:** `feature/redesign-teal`
**Primary Accent:** Electric Teal (`#00D4C8` / cyan-teal family)
**Aesthetic:** Precision Motorsport Telemetry — race data logger meets high-end automotive branding

---

## Design System

### Color Palette
```
Background:      #080c10  (near-black, blue-tinted — richer than gray-950)
Surface-1:       #0d1117  (sidebar, header)
Surface-2:       #111820  (card backgrounds)
Surface-3:       #162030  (elevated cards, chart containers)
Border:          #1e2d3d  (subtle borders)
Border-bright:   #243545  (hover/focus borders)

Accent:          #00D4C8  (electric teal — primary CTA, active nav, key values)
Accent-dim:      #009990  (darker teal for hover states)
Accent-glow:     rgba(0, 212, 200, 0.15) (glow backgrounds)
Accent-text:     #4EEAE3  (lighter teal for readable text on dark)

Text-primary:    #E8EFF5  (near-white, slight blue tint)
Text-secondary:  #6B8BA4  (muted blue-gray)
Text-tertiary:   #3D5568  (very muted, labels)

Success:         #22d3a0  (green-teal for positive deltas)
Warning:         #F59E0B  (amber for warnings)
Danger:          #EF4444  (red for negative deltas/errors)
```

### Typography
```
Display/Headers: Chakra Petch (Google Fonts) — distinctive, technical, great numerals
                 Weights: 400, 600, 700
Body/UI:         Barlow Condensed (Google Fonts) — clean, condensed, readable
                 Weights: 400, 500, 600
Numeric/Mono:    JetBrains Mono (Google Fonts) — for all data values, RPM, speed
                 Weights: 400, 600

Font roles:
  .font-display  → Chakra Petch (app name, page titles, chart titles)
  .font-ui       → Barlow Condensed (nav, labels, section headers)
  .font-data     → JetBrains Mono (numbers, metrics, table values)
```

### Gear Colors (intentional palette, not rainbow defaults)
```
Gear 1: #00D4C8  (teal — accent)
Gear 2: #3B82F6  (blue)
Gear 3: #8B5CF6  (violet)
Gear 4: #F59E0B  (amber)
Gear 5: #EF4444  (red)
Gear 6: #10B981  (emerald)
Envelope: #FFFFFF at 90% opacity, strokeWidth 2.5
```

---

## File-by-File Implementation Plan

### STEP 1: src/index.css
**What changes:**
- Replace Inter font with Chakra Petch + Barlow Condensed + JetBrains Mono via Google Fonts `@import`
- Add CSS custom properties for the full color system
- Add `.font-display`, `.font-ui`, `.font-data` utility classes
- Set default background to `var(--bg)` and text to `var(--text-primary)`
- Add custom scrollbar styles (thin, teal thumb)
- Add `@layer utilities` for custom classes that Tailwind v4 needs

**Implementation:**
```css
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Barlow+Condensed:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
@import "tailwindcss";

:root {
  --bg: #080c10;
  --surface-1: #0d1117;
  --surface-2: #111820;
  --surface-3: #162030;
  --border: #1e2d3d;
  --border-bright: #243545;
  --accent: #00D4C8;
  --accent-dim: #009990;
  --accent-glow: rgba(0, 212, 200, 0.15);
  --accent-text: #4EEAE3;
  --text-primary: #E8EFF5;
  --text-secondary: #6B8BA4;
  --text-tertiary: #3D5568;
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: 'Barlow Condensed', system-ui, sans-serif;
}

.font-display { font-family: 'Chakra Petch', monospace; }
.font-ui { font-family: 'Barlow Condensed', system-ui, sans-serif; }
.font-data { font-family: 'JetBrains Mono', monospace; }

/* Thin teal scrollbars */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--surface-1); }
::-webkit-scrollbar-thumb { background: var(--accent-dim); border-radius: 2px; }
```

---

### STEP 2: src/components/layout/AppShell.tsx
**What changes:**
- Add mobile nav state (`isMobileNavOpen`, `setIsMobileNavOpen`)
- Render `<Header>` with `onMenuToggle` prop
- Render `<Sidebar>` with `isOpen`/`onClose` props
- Mobile: backdrop overlay when nav is open
- Desktop: persistent sidebar; Mobile: drawer slides in from left
- Main content area: full height, scrollable, proper padding

**Key structure:**
```tsx
<div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
  <Header onMenuToggle={toggle} isMobileNavOpen={isMobileNavOpen} />
  <div className="flex flex-1 overflow-hidden">
    {/* Mobile backdrop */}
    {isMobileNavOpen && (
      <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden" onClick={close} />
    )}
    <Sidebar isOpen={isMobileNavOpen} onClose={close} />
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
</div>
```

---

### STEP 3: src/components/layout/Header.tsx
**What changes:**
- Hamburger button (visible only on mobile, `md:hidden`)
- "ThrustCurves" in Chakra Petch, teal accent, tracking-tight
- Tagline: "Performance Simulator" in Barlow Condensed, muted
- Subtle bottom border with faint teal glow line
- Background: `var(--surface-1)` with subtle `border-b`

**Visual detail:**
The header bottom border should have a 1px teal line at very low opacity (`border-b border-[var(--accent)]/20`) to add depth without being garish.

---

### STEP 4: src/components/layout/Sidebar.tsx
**What changes:**
- **Desktop** (`md:`): fixed 280px left sidebar, always visible
- **Mobile**: absolute positioned, z-30, slides in with CSS transition, `translate-x-0` when open, `-translate-x-full` when closed
- Nav items with icons (use simple Unicode/SVG inline or lucide if available, else skip)
- Active state: left border accent `border-l-2 border-[var(--accent)]`, background teal glow, text teal
- Inactive state: text-secondary, hover lifts to text-primary + subtle bg
- Bottom of sidebar: small version number or tagline (optional)

**Nav item structure:**
```tsx
<NavLink className={({ isActive }) =>
  `flex items-center gap-3 px-5 py-3 mx-3 rounded-lg transition-all
   border-l-2 font-ui text-base tracking-wide
   ${isActive
     ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent-text)]'
     : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
   }`
}>
```

---

### STEP 5: src/pages/SimulatorPage.tsx
**What changes:**
- **Desktop**: `flex gap-0` (no gap — panels are bordered panels)
- Left control column: `w-80 shrink-0 border-r border-[var(--border)] overflow-y-auto`
- Right results column: `flex-1 min-w-0 overflow-y-auto p-6`
- **Mobile** (`md:` breakpoint): stack vertically, left panel comes first then charts
- Empty state: centered with teal accent + stylized instruction text
- Running state: teal spinner animation
- Section headings: Chakra Petch, small caps, teal, with decorative left-border line

---

### STEP 6: src/components/car-selector/CarSearch.tsx
**What changes:**
- Search input with magnifying glass SVG icon (inlined, left-padded)
- Input style: dark background, teal focus ring, Barlow Condensed font
- Placeholder text: slightly lighter than tertiary text
- Focus state: `border-[var(--accent)]` + subtle `shadow-[0_0_0_3px_var(--accent-glow)]`

---

### STEP 7: src/components/car-selector/CarCard.tsx
**What changes:**
- Selected state: `border-[var(--accent)]` left border prominent, `bg-[var(--accent-glow)]`, top-left has small teal "●" indicator or checkmark
- Unselected: `border-[var(--border)]` `bg-[var(--surface-2)]`, hover: `border-[var(--border-bright)]`
- Car name: Chakra Petch, font-semibold, text-primary
- HP/Torque numbers: JetBrains Mono, teal accent color when selected else text-secondary
- Engine/drivetrain tags: small pill badges with `bg-[var(--surface-3)]` style
- Subtle background gradient on selected: `from-[var(--accent-glow)] to-transparent`

---

### STEP 8: src/components/editor/ModificationsPanel.tsx
**What changes:**
- Convert `Section` to accordion: each section has a chevron toggle, starts collapsed except "Environment" and "Performance" open by default
- Section header: Barlow Condensed 600, uppercase, tracking-widest, `var(--text-secondary)` + chevron icon (rotate on open)
- Active modification count badge in teal
- `Reset All` button: teal text, no underline, small font, right-aligned
- Each section body animates open/closed (simple `max-h` CSS transition or just `display` toggle)
- The "active" state of a section should be visually signaled (small teal dot on header)

**Accordion state:** `useState<Record<string, boolean>>` keyed by section name

---

### STEP 9: src/components/editor/WeightEditor.tsx
**What changes:**
- Input: `bg-[var(--surface-3)] border-[var(--border)] text-[var(--text-primary)] font-data`
- Focus: teal ring
- Stock/Effective display: small mono text below, positive delta = teal, negative = amber

---

### STEP 10: src/components/editor/ForcedInductionToggle.tsx
**What changes:**
- Switch: teal when ON (`bg-[var(--accent)]`), dark when OFF
- Thumb: white circle, smooth transition
- Label: "FORCED INDUCTION" in Barlow Condensed uppercase tracking-wider
- Status text: "ACTIVE" in teal mono / "STOCK" in muted text

---

### STEP 11: src/components/charts/ThrustCurveChart.tsx
**What changes:**
- New GEAR_COLORS from design system (teal, blue, violet, amber, red, emerald)
- Envelope: white/90% opacity, strokeWidth 2.5, no dasharray (solid bold line)
- CartesianGrid: `stroke="#1e2d3d"` (matches `--border`)
- XAxis/YAxis ticks: `fill="#6B8BA4"` (matches `--text-secondary`), Barlow Condensed font
- Tooltip: `backgroundColor: "#111820"`, teal accent border, Chakra Petch labels
- Legend: inline with color swatches, Barlow Condensed font
- Chart container wrapper: `bg-[var(--surface-3)] rounded-xl border border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`
- Chart title: "THRUST CURVES" in Chakra Petch, letter-spacing, above chart with decorative line

---

### STEP 12: src/components/charts/PowerTorqueChart.tsx
**What changes:**
- Power line: `#00D4C8` (teal)
- Torque line: `#F59E0B` (amber)
- Same grid/axis/tooltip treatment as ThrustCurveChart
- Dual Y-axis labels in matching colors

---

### STEP 13: src/components/results/PerformanceCard.tsx
**What changes:**
- Each metric in its own card: `bg-[var(--surface-3)] border border-[var(--border)] rounded-xl p-4`
- Label: Barlow Condensed, small caps, `var(--text-tertiary)`, uppercase tracking-widest
- Value: JetBrains Mono, `text-3xl font-semibold text-[var(--text-primary)]`
- Unit (s, mph): JetBrains Mono, smaller, `var(--text-secondary)`
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (same as before)
- Mobile: `flex overflow-x-auto gap-3` horizontal scroll row
- Container header: "PERFORMANCE" section label

**Value parsing:** Split value string at unit (e.g., "4.2s" → value="4.2", unit="s")

---

### STEP 14: src/components/results/ShiftPointsTable.tsx
**What changes:**
- Table header: `bg-[var(--surface-3)]`, Barlow Condensed uppercase, `var(--text-tertiary)`
- Table rows: alternating `bg-[var(--surface-2)]`/transparent, hover `bg-[var(--surface-3)]`
- Gear transition column: teal accent color for arrows (`→`)
- Speed/RPM values: JetBrains Mono, `var(--text-primary)`
- Row borders: `border-[var(--border)]`

---

### STEP 15: src/pages/ComparePage.tsx
**What changes:**
- Same responsive two-column → stacked mobile layout as SimulatorPage
- Comparison header: Chakra Petch, prominent
- ComparisonTable delta values: positive = `text-[var(--success)]`, negative = `text-[var(--danger)]`

---

### STEP 16: src/components/results/ComparisonTable.tsx
**What changes:**
- Winner highlighting: lowest time / highest speed gets teal accent background
- Delta column: `+X.Xs` in success green, `-X.Xs` in danger red
- All numeric values in JetBrains Mono
- Column headers: Barlow Condensed, muted

---

### STEP 17: src/components/saved/SaveLoadControls.tsx
**What changes:**
- Save button: teal border + text, hover fills teal
- Name input: monospace font (feels like naming a lap time), dark bg, teal focus
- Saved confirmation: teal flash message
- Cancel: muted text button

---

### STEP 18: src/components/saved/SavedConfigsList.tsx
**What changes:**
- Cards: `bg-[var(--surface-2)] border-[var(--border)]`
- Selected for compare: `border-[var(--accent)] bg-[var(--accent-glow)]`
- Car name: Chakra Petch or Barlow Condensed semibold
- Date: JetBrains Mono, very muted
- Compare button: teal when selected, ghost when not
- Load/Delete: small ghost buttons

---

### STEP 19: src/pages/HomePage.tsx (bonus — if time allows)
**What changes:**
- Hero: large Chakra Petch heading, teal accent word
- Quick-start CTA button: teal filled
- Feature cards: surface-2 bg, border treatment

---

## Mobile Layout Summary (≤768px / `md:` breakpoint)

### AppShell
- Sidebar: hidden off-screen, slides in on hamburger tap, backdrop overlay
- Header: hamburger ☰ button on left, app name centered or left

### SimulatorPage
- Stack: `flex-col` instead of `flex-row`
- Control panel: full width, no fixed height, collapsible sections (accordion in ModificationsPanel)
- Charts: full width, `height={220}` (reduced from 320)
- PerformanceCard: horizontal scroll `flex overflow-x-auto gap-3` with fixed-width cards `w-32 shrink-0`

### ComparePage
- Same stacking pattern
- Left panel (setup selector) on top, full width, before charts

---

## Implementation Sequence

```
[ ] 1. src/index.css                          — fonts, CSS vars, base styles
[ ] 2. src/components/layout/AppShell.tsx     — mobile nav state + shell
[ ] 3. src/components/layout/Header.tsx       — hamburger + branding
[ ] 4. src/components/layout/Sidebar.tsx      — desktop fixed + mobile drawer
[ ] 5. src/pages/SimulatorPage.tsx            — responsive two-col/stack layout
[ ] 6. src/components/car-selector/CarSearch.tsx
[ ] 7. src/components/car-selector/CarCard.tsx
[ ] 8. src/components/editor/ModificationsPanel.tsx — accordion sections
[ ] 9. src/components/editor/WeightEditor.tsx
[10] 10. src/components/editor/ForcedInductionToggle.tsx
[11] 11. src/components/charts/ThrustCurveChart.tsx
[12] 12. src/components/charts/PowerTorqueChart.tsx
[13] 13. src/components/results/PerformanceCard.tsx
[14] 14. src/components/results/ShiftPointsTable.tsx
[15] 15. src/pages/ComparePage.tsx
[16] 16. src/components/results/ComparisonTable.tsx
[17] 17. src/components/saved/SaveLoadControls.tsx
[18] 18. src/components/saved/SavedConfigsList.tsx
[19] 19. src/pages/HomePage.tsx                — bonus
```

---

## Scope Boundaries

**Do NOT change:**
- Any logic/hooks/stores/utils files
- TypeScript types
- Test files
- package.json / vite.config.ts / tsconfig files
- Routing (App.tsx)

**Only change:** The visual layer — `.tsx` component files and `index.css`

---

## Resumability Notes

If context runs out during implementation:
1. Check this file for the current step (marked `[x]` when done)
2. The design system is fully defined above — no need to re-derive colors/fonts
3. Each file section above is a complete spec for that component
4. Files not yet started are untouched copies from `main`
5. Run `npm run build` to check for TS errors, `npm run lint` for style
