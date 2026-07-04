# Relay — observability for AI agents in production

A dashboard concept for teams running AI agents in production: every run, trace,
cost, and failure in one place. **Designed and built end to end** — a live,
coded product on realistic mock data, not a Figma export.

> Product-design depth: dense data, a real component system, and every screen
> designed for its actual states — loading, empty, error, dense — not just the
> happy path.

## The three screens

- **Overview** — fleet health, error rate, p95 latency, and cost with live
  sparklines; runs-over-time chart; recent failures; a per-agent fleet table.
- **Runs** — a filterable, sortable, keyboard-navigable table of every run
  (status · agent · trigger · latency · tokens · cost · time).
- **Trace** — the signature view. Expand a run into its step-by-step chain —
  router → retrieval → LLM → tool → guard — as a latency waterfall, with the
  exact **failure point** highlighted and its error + I/O payload inline.

## Craft notes

- **Deterministic mock data.** A seeded generator produces the same fleet, runs,
  and traces every load, so the demo is stable; only relative timestamps stay
  fresh. All derivations (stats, filter, sort, percentiles) are pure and unit
  tested.
- **Hand-built SVG charts.** Sparklines, the area chart, and the trace waterfall
  are drawn from scratch — no charting dependency, a tiny bundle.
- **Dark ops-tool identity.** Layered near-black surfaces separated by contrast
  and hairline borders (not shadows), one held cyan accent, a functional status
  palette (never color alone — always icon + label + color), Geist + Geist Mono.
- **Accessible.** Semantic HTML, visible focus rings, keyboard-native tables and
  filters, `prefers-reduced-motion` honored, held contrast on secondary text.

## Stack

React 19 · TypeScript · Tailwind · Vite · Vitest · `motion`. No UI library —
every component is custom.

```bash
npm install
npm run dev      # local dev server
npm run test     # data-layer unit tests
npm run build    # typecheck + production build
```

---

A portfolio piece by **Vitalina Nikulina** — product designer who designs *and*
builds. Data is synthetic; no real agents were harmed.
