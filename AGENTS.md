# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/app`, using Next.js App Router conventions (`layout.tsx` for shared UI, segment directories for routes).
- Global styles are centralized in `src/app/globals.css`; prefer component-level Tailwind utilities over ad-hoc CSS files.
- Static assets such as icons reside in `public/`; reference them with absolute paths (e.g., `/window.svg`).
- TypeScript path alias `@/` resolves to `src/`, so favor imports like `import Button from "@/components/Button";` instead of relative chains.

## Build, Test, and Development Commands
- `pnpm install` installs workspace dependencies; keep the lockfile committed.
- `pnpm dev:web` launches the Next.js dev server only (useful for UI work without Electron).
- `pnpm build:electron && pnpm start:electron` compiles Electron sources to `dist/electron` and opens the desktop shell (requires an existing Next.js server; set `ELECTRON_START_URL` if not using the default).
- `pnpm dev:desktop` runs `pnpm dev:web` and, once HTTP://localhost:3000 responds, rebuilds Electron and launches the desktop app in one step.
- `pnpm build` runs the Turbopack production build for Next.js; ensure it passes before opening a pull request.
- `pnpm start` serves the optimized Next.js build for pre-merge verification.
- `pnpm lint` runs ESLint; pair with `pnpm test` (Jest) before every PR.

## Coding Style & Naming Conventions
- Write modern, typed React components; keep files in TypeScript (`.tsx`/`.ts`) and adhere to the strict compiler settings in `tsconfig.json`.
- Indent with two spaces, rely on ESLint for formatting guidance, and avoid introducing Prettier overrides without discussion.
- Route segment folders stay in lowercase (`src/app/dashboard/`), while exported React components use PascalCase.
- Stick with Tailwind CSS 4 utility classes for styling; group related utilities logically (layout → spacing → color).

## Testing Guidelines
- Run `pnpm test` to execute Jest suites covering session metadata parsing, CLI resume safety checks, and IPC wiring.
- Before claiming Phase 4 manual scenarios are fixed, follow the checklist in `docs/phase4_testing.md`.
- Document any additional manual verification steps in your PR description (e.g., “Verified CMD `codex /status` ID matches UI selection”).
- For new UI, include component-level checks that cover edge cases such as empty states or suspended data fetching.

## Commit & Pull Request Guidelines
- Git history is minimal; follow Conventional Commits (`feat:`, `fix:`, `chore:`) to keep the log grep-friendly.
- Squash work-in-progress commits locally before pushing; keep the public history clean.
- Pull requests must describe the change, reference any issue IDs, note the commands you ran (build, lint, manual checks), and attach screenshots or recordings for UI updates.
- Tag reviewers familiar with affected areas, and respond to feedback with follow-up commits rather than force-pushing silently.
- Before marking a task as complete, double-check that no ESLint or TypeScript errors remain; this ensures code quality and prevents build regressions.
