# Dungeoneer Roadmap

A practical roadmap to evolve Dungeoneer from a great dungeon generator into a more configurable toolkit for real game pipelines.

## Vision

Build a deterministic, ergonomic dungeon generation library with:

- richer generation controls,
- composable post-processing,
- and clean export/integration paths for game engines and map tooling.

## Principles

- **Deterministic first**: every feature should preserve reproducibility via seed + options.
- **Backward compatible by default**: avoid breaking `build({ width, height, seed })` workflows.
- **Small surface, strong docs**: keep API tidy; invest in examples and visual demos.
- **Ship in slices**: milestones should produce independently useful outcomes.

## Milestones

## M1 — Generation Constraints (Core Controls)

**Goal:** Give users practical control over dungeon shape and feel.

### Scope

- Add optional `constraints` to `build` options, including initial support for:
  - room count range (`minRooms`, `maxRooms`)
  - room size range (`minRoomSize`, `maxRoomSize`)
  - dead-end budget (`maxDeadEnds`)
- Ensure constraints interact safely with existing generation logic (fallback behaviour when impossible).

### Deliverables

- [ ] Constraint option schema and validation
- [ ] Constraint-aware generation pass(es)
- [ ] Regression tests for deterministic behaviour
- [ ] README section with examples and caveats

### Success criteria

- Same seed + same constraints always yields same output.
- Existing users with no constraints observe no behavioural change.

---

## M2 — Post-Processing Plugins (Composable Enhancements)

**Goal:** Introduce a lightweight plugin system for map enrichment.

### Scope

- Add optional `plugins` pipeline to run after base generation.
- Define stable plugin contract (input dungeon, seeded RNG helper, options).
- Provide first-party plugins:
  - `addSecrets`
  - `addChokePoints`
  - `addRegionTags`

### Deliverables

- [ ] Plugin runner and hook API
- [ ] 2–3 built-in plugins
- [ ] Unit tests for plugin isolation and ordering
- [ ] Demo controls to toggle plugins

### Success criteria

- Plugins are deterministic and order-aware.
- Plugin failures surface clear errors.

---

## M3 — Export Adapters + Demo Explorer (Integration)

**Goal:** Make generated dungeons easier to consume outside the library.

### Scope

- Add export utilities:
  - compact tile matrix JSON
  - rich metadata JSON
  - optional adapter for Tiled-compatible output
- Upgrade demo into an “explorer” with:
  - seed presets
  - options panel
  - copy/share config payload

### Deliverables

- [ ] Export adapter module(s)
- [ ] Integration docs for common engine workflows
- [ ] Enhanced demo UX for inspecting outputs

### Success criteria

- Users can generate and export dungeons without reading internals.
- Demo can round-trip a shared config reliably.

---

## M4 — Performance + Quality Hardening

**Goal:** Keep speed and reliability strong as features expand.

### Scope

- Add lightweight benchmarks for typical map sizes.
- Introduce property-style tests for invariants (connectivity, bounds, tile type consistency).
- Tune hotspots identified by benchmark baseline.

### Deliverables

- [ ] Benchmark script + baseline results in docs
- [ ] Invariant/property tests
- [ ] Performance notes and guardrails for future changes

### Success criteria

- No significant regression (>10%) for baseline scenarios unless explicitly accepted.
- Core invariants remain green across randomized seeded runs.

---

## Suggested Execution Order

1. **M1 first** (most direct value for game use-cases).
2. **M2 second** (opens ecosystem/customisation path).
3. **M3 third** (improves adoption and practical integration).
4. **M4 continuously**, with a formal hardening pass before each release.

## Tracking

Use this file as the source of truth for planning.

- Create issues per milestone slice.
- Link PRs under each milestone deliverable.
- Mark checkboxes as scope lands.
