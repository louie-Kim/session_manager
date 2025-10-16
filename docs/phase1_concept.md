# codex resume Manager - Phase 1 Concept

## Product Overview
codex resume Manager (Windows Edition) is a desktop companion to the Codex CLI. The Electron shell packages a Next.js renderer to give developers a fast, GUI-based way to browse local codex resumes stored under `C:\Users\<USER>\.codex\sessions`. Every interaction in the app keeps the CLI as the source of truth while removing the friction of reading plain JSON files or typing long session IDs manually.

## User Goals
- Discover active and archived sessions without remembering IDs.
- Inspect session context (originating directory, CLI version, timestamps, instructions) before resuming.
- Launch a Windows Command Prompt already pointed at the chosen session via `codex resume <session_id>`.
- Confirm that the CLI-reported session ID matches the UI-selected ID to avoid context drift.

## Core Feature Set
| Feature | Description | Notes |
|---------|-------------|-------|
| Session Discovery | Recursively scan `.codex\sessions`, parse latest metadata, and sort by updated time. | Runs from Electron main process on a timer and via manual refresh. |
| Metadata Parsing | Load each `session_meta` JSON and surface `payload` fields in the UI. | Fail gracefully if the JSON is invalid or missing fields. |
| Session Detail View | Display timeline, CLI version, working directory, and instructions with a resume action. | Include toast feedback when commands succeed or fail. |
| Resume Shortcut | When users click Resume, spawn `cmd.exe` with `codex resume <id>` and leave the window open. | Hardware-accelerated; detached process so the app stays responsive. |
| ID Integrity Check | Before launching the CLI, compare UI-selected ID with the meta file and optional `codex /status` output. | Mismatch blocks the action and surfaces an error toast. |

## Experience Notes
- Layout follows a master/detail split: session list on the left, detail viewer on the right, and a top command bar for filtering.
- Provide dark and light themes; reuse shadcn/ui primitives for consistency with the rest of the Next.js stack.
- Offer keyboard shortcuts (e.g., `Ctrl+R` to refresh, `Ctrl+L` to focus the filter input) to keep power users productive.
- When metadata is incomplete, highlight required fixes and direct users to open the session folder.

## Technical Constraints
- **Platform:** Electron 27 with a bundled Next.js (App Router) renderer and Tailwind CSS 4.
- **State Management:** Zustand for cross-component session state; React Query is deferred until Phase 2.
- **CLI Interaction:** Use Node's `child_process.spawn` inside the Electron main process to run Codex commands; point to `C:\Users\<USER>\.codex\bin\codex.exe`.
- **Configuration:** Allow overrides through environment variables (`CODEX_SESSION_PATH`, `CODEX_CLI_PATH`) for atypical installations.
- **Testing Baseline:** Phase 1 focuses on manual verification; Jest unit tests and Playwright E2E coverage arrive during future phases.

## Success Criteria
- Users can view every session found in `.codex\sessions`, along with accurate metadata.
- Clicking Resume launches a new Command Prompt with the correct session already loaded.
- Any ID mismatch prevents the resume action and clearly explains the issue.
- The UI feels native to Windows, loads quickly, and never blocks while the CLI runs.
