# codex resume Manager - Phase 2 Architecture

## High-Level System Topology
```
+--------------------+        IPC         +---------------------------+
| Electron Main      | <----------------> | Next.js Renderer (AppDir) |
| Process            |                    | React + Zustand            |
|                    |                    |                            |
| - Session scanner  |                    | - Session list UI          |
| - CLI executor     |                    | - Detail + resume action   |
| - Integrity checks |                    | - Toast + shortcuts        |
+--------------------+                    +---------------------------+
         |                                             ^
         v                                             |
 Windows File System                         Tailwind UI Components
  (C:\Users\<USER>\.codex\sessions)           (shadcn/ui atoms)
```

## Electron Main Responsibilities
- Initialize the BrowserWindow with secure defaults (contextIsolation, preload only).
- Watch the configured session root (`CODEX_SESSION_PATH`) on a short interval; reuse cached metadata to avoid repeated disk reads.
- Expose IPC handlers:
  - `get-sessions`: return normalized session summaries (id, mtime, cwd, cliVersion).
  - `get-session-detail`: lazy-load and parse `session_meta` JSON on demand.
  - `resume-session`: verify the meta id against the UI request, then spawn `cmd.exe /c start cmd /k "<codex.exe> session <id>"`.
- Resolve the Codex CLI binary via `CODEX_CLI_PATH` and validate existence at start-up; surface user-friendly errors through renderer-safe IPC responses.
- Enforce ID integrity by optionally cross-checking `codex /status` output after launch and emitting telemetry for manual review.

## Renderer (Next.js) Responsibilities
- Boot with App Router layouts; preload session data via a server component that calls the preload bridge.
- Manage client state with Zustand stores: `useSessionStore` (arrays, filters) and `useSelectionStore` (active id, loading flags).
- Render a master/detail layout: left column session list with keyboard navigation, right column detail inspector with resume button and metadata tabs.
- Provide optimistic UI updates (loading indicators, disabled resume button) while waiting for IPC round-trips.
- Surface toast notifications via shadcn/ui to convey success, warnings (ID mismatch), or missing CLI binaries.

## IPC Contract
| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `get-sessions` | Renderer -> Main | `{ forceRefresh?: boolean }` | `{ sessions: SessionSummary[] }` |
| `get-session-detail` | Renderer -> Main | `{ id: string }` | `{ session: SessionDetail }` |
| `resume-session` | Renderer -> Main | `{ sessionId: string, path: string }` | `{ success: boolean, error?: string }` |
| `session-events` | Main -> Renderer | `{ type: "updated" or "error", payload: unknown }` | n/a |

Define TypeScript types in `electron/preload/session-ipc.d.ts` and share them via the `@/types` alias to keep both processes aligned.

## Preload Bridge
- The preload script exports a `window.codexSessions` namespace with methods that wrap `ipcRenderer.invoke` and `ipcRenderer.on`.
- Validate parameters before sending to the main process; reject with descriptive errors if id or paths are malformed.
- Strip any filesystem paths from responses before exposing them to the renderer to maintain sandbox boundaries.

## File Layout
```
.
|-- electron/
|   |-- main.ts                # App bootstrap, BrowserWindow, IPC handlers
|   |-- preload.ts             # bridge for session APIs
|   |-- scanner/session.ts     # filesystem scan + normalization
|   |-- cli/runner.ts          # codex.exe discovery and spawn helpers
|-- src/app/
|   |-- layout.tsx             # shared App Router chrome
|   |-- page.tsx               # entry route hosting SessionManager
|   |-- components/
|       |-- session-list.tsx
|       |-- session-detail.tsx
|       |-- resume-button.tsx
|-- src/lib/
    |-- stores/session-store.ts
    |-- toast.ts               # thin wrapper over shadcn/ui toaster
```

## Process Lifecycle
1. App launch boots Electron main, validates environment variables, and loads cached session metadata.
2. BrowserWindow loads the Next.js renderer; preload ensures IPC methods are ready before hydration.
3. Renderer requests `get-sessions`, populates state, and shows the latest session order.
4. Selecting a session triggers `get-session-detail`; data hydrates the detail panel.
5. Clicking resume calls `resume-session`; main verifies ID and opens CMD running `codex resume <id>`. Renderer displays status toast.
6. Main emits `session-events` when filesystem watchers detect updates, prompting renderer refresh.

## Error Handling
- IPC handlers always resolve; business errors return `{ success: false, error }`.
- Any JSON parsing failure marks the session as `corrupted` and prompts an inline warning next to the item.
- When Codex CLI is missing, disable resume-related UI and surface remediation instructions.
- Unexpected exceptions funnel through a single logger (`electron/log.ts`), mirrored in the renderer console during development builds.
