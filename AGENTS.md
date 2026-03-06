# Dungeoneer Repository – Agent Field Notes

> **Meta note**: This is the primary agent knowledge base for this repository. When you learn something that will help future implementation/debug sessions, update this file immediately.

- **Repository scope**: Dungeoneer is a deterministic procedural dungeon generator published as an npm package. Core implementation is TypeScript and compiles to `dist/`.
- **Runtime baseline**: Node.js `>=20` (see `package.json` engines).
- **Public API**: Main entry is `build({ width, height, seed? })`, returning `{ rooms, tiles, seed, toJS }`.

## Workspace layout

- `src/` — TypeScript source (`index.ts`, `room.ts`, `tile.ts`)
- `dist/` — compiled JS + declarations (build artifact and package entrypoint)
- `test/` — AVA test suite + fixtures
- `demo/` — browser demo (`main.js`, `index.html`, generated `bundle.js`)
- `.github/workflows/` — CI/release workflows
- `ROADMAP.md` — milestone plan and project direction

## Build, test, and quality commands

- `npm run build` — compile TypeScript (`src` → `dist`)
- `npm run typecheck` — strict TS checks without emit
- `npm run test` — AVA tests with nyc coverage
- `npm run lint` — StandardJS checks (`test/**/*.js`, `demo/main.js`)
- `npm run ci` — lint + typecheck + tests
- `npm run dev` — run demo app via Parcel

## CI and release notes

- CI runs on Node 20 and 22.
- CI uses `npm install` (not `npm ci`) because this repository intentionally does not track a lockfile.
- Releases are managed via Release Please.
- Use Conventional Commits. Mark breaking changes with `feat!:` or a `BREAKING CHANGE:` footer.

## Testing expectations

- Preserve deterministic behavior: seeded runs must be stable (`seed: 'foobarbaz'` fixture is a regression anchor).
- For generation changes, update tests/fixtures deliberately and explain why in PR notes.
- Prefer narrow targeted tests first, then full `npm run ci`.

## Coding and change conventions

- Keep behavior-preserving refactors separate from behavior-changing fixes when practical.
- Avoid checking generated demo bundle changes unless intentionally rebuilding demo output.
- Keep comments focused on intent/why, not obvious implementation details.
- Keep API compatibility unless a breaking change is intentional and documented.

## Known project context

- The project was recently ported from JS (`lib/`) to TS (`src/`).
- `versionist` was removed; Release Please is the source of truth for release automation.
- There is an active roadmap for M1 constraints work (`ROADMAP.md`, issues #52–#56).

## Workflow reminder

- If you discover repeated gotchas (tooling quirks, test caveats, release pitfalls), add them here immediately.
