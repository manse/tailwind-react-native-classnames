# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What is this?

`twrnc` (Tailwind React Native Classnames) — a TypeScript library that provides a
TailwindCSS API for React Native. It parses Tailwind utility class strings and returns
React Native style objects. Compatible with Tailwind CSS v2 and v3 (not v4).

## Commands

- **Run all tests:** `npm test`
- **Run a single test file:** `npx jest src/__tests__/borders.spec.ts`
- **Run tests matching a pattern:** `npx jest -t "pattern"`
- **Watch mode:** `npm run test:watch`
- **Lint:** `npm run lint`
- **Lint fix:** `npm run lint:fix`
- **Type check:** `npm run ts:check`
- **Format check:** `npm run format:check`
- **Format fix:** `npm run format`
- **Compile (ESM + CJS):** `npm run compile`
- **Pre-publish check (lint + format + types + tests):** `npm run npub:precheck`

## Architecture

### Entry points

- `src/index.ts` — Default export. Wraps `create()` with React Native's `Platform.OS` and
  version. Exports `tw`, `create`, `style`, `plugin`, hooks.
- `src/create.ts` — Core factory (`create()`) that builds the `TailwindFn` object.
  Resolves tailwind config via `tailwindcss/resolveConfig`, sets up caching, and wires
  together `style()`, `color()`, `prefixMatch()`, and device context setters.

### Utility parsing pipeline

1. **Input parsing** (`src/parse-inputs.ts`) — The `style()` function accepts a
   classnames-style API (strings, arrays, objects, RN style objects). `parseInputs()`
   separates utility class strings from raw style objects.
2. **UtilityParser** (`src/UtilityParser.ts`) — A character-level parser that processes a
   single utility string. It strips prefixes (platform, dark, breakpoint, orientation,
   retina, arbitrary breakpoints), detects negation, then matches the remaining string
   against known utility patterns via `consumePeeked()`.
3. **Resolvers** (`src/resolve/*.ts`) — Each resolver handles a category of utilities
   (spacing, color, borders, flex, width-height, transforms, etc.) and returns a `StyleIR`
   (intermediate representation).
4. **StyleIR types** (`src/types.ts`) — Four kinds: `complete` (ready-to-use style),
   `dependent` (needs other styles to resolve, e.g. opacity merging), `ordered`
   (breakpoint-ordered for specificity), `null` (no match).
5. **Static styles** (`src/styles.ts`) — A lookup table of simple keyword-to-style
   mappings (e.g., `items-center` → `{ alignItems: 'center' }`).
6. **Cache** (`src/cache.ts`) — Caches parsed IR and full style objects per device context
   group (dark/light, window dimensions, font scale, pixel density).

### Device context and hooks

- `src/hooks.ts` — React hooks `useDeviceContext` and `useAppColorScheme` that connect
  `tw` to runtime device info (color scheme, window size, font scale, pixel density).
- Device context changes create new cache groups keyed by the context combination.

### Plugin system

- `src/plugin.ts` — Supports Tailwind's `addUtilities` plugin API. Custom utilities can be
  style objects or strings (like `@apply`).
- `src/tw-config.ts` — TwConfig type definition and theme property mappings.

## Code conventions

- **Backtick quotes required:** ESLint enforces backtick quotes for all strings
  (`@typescript-eslint/quotes: backtick`).
- **Explicit return types:** All exported functions must have explicit return types
  (`@typescript-eslint/explicit-function-return-type`).
- **Consistent type imports:** Use `import type` for type-only imports
  (`@typescript-eslint/consistent-type-imports`).
- **No `console.log`:** `no-console` is an error. Use the `warn()` helper from
  `src/helpers.ts`.
- **No `.only` in tests:** `no-only-tests/no-only-tests` is enforced.
- **Test file pattern:** Tests live in `src/__tests__/*.spec.ts` (and `.spec.tsx` for
  React component tests).
- **Dual output:** Compiles to both ESM (`dist/esm`) and CJS (`dist/cjs`) via separate
  tsconfig files.
