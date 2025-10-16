# Codex Session Manager - Phase 3 Functional Design

## Session Metadata Handling
- Target files: `<sessionRoot>/<sessionId>/session_meta`. Each file is JSON matching the CLI contract.
- Required fields inside `payload`: `id`, `timestamp`, `cwd`, `originator`, `cli_version`. Treat missing fields as corruption.
- Normalize timestamps to `Date` instances in the renderer and keep raw ISO strings for display.
- Cache parsed results with an `etag` composed of file path + mtime to avoid re-reading unchanged sessions.
- Include a checksum derived from `payload.id` in logs to simplify debugging mismatches (e.g., `console.info("[session]", id.slice(0,8), "loaded")`).

## Resume Flow Implementation
1. **UI**: Detail pane calls `resumeSession(id)` from the preload bridge; button enters a loading state.
2. **Preload**: Validate `id` (UUID v7 pattern) and path before invoking IPC.
3. **Main process**:
   - Read `session_meta` synchronously (try/catch) to avoid race conditions.
   - Compare `sessionId` from UI with `meta.payload.id`; mismatch throws `SessionIdMismatchError`.
   - Resolve CLI binary path (`CODEX_CLI_PATH` or default under `%USERPROFILE%\.codex\bin\codex.exe`).
   - Spawn `cmd.exe` with `/c start cmd /k "<cli> session <metaId>"`, `detached: true`, and `stdio: "ignore"`.
   - Optionally enqueue a follow-up task to run `codex /status` for telemetry; failures emit a warning event.
4. **Renderer**: On success, show a success toast and release the loading state; on error, display the message and log the stack in development mode.

## IPC Contracts
- `resume-session` response shape: `{ success: true, sessionId }` or `{ success: false, code, message }`.
- Define custom error codes:
  - `MISSING_META`: file read failure.
  - `ID_MISMATCH`: UI id differs from meta id.
  - `CLI_NOT_FOUND`: codex executable missing.
  - `SPAWN_FAILED`: command launch error.
- Emitting `session-events` with `{ type: "error", code, sessionId }` allows the renderer to annotate the affected row.

## UI States and Feedback
- Session list row badges:
  - `Active`: currently selected session.
  - `Corrupted`: metadata invalid; disable resume button.
  - `Missing CLI`: global banner when CLI binary is not found.
- Detail view shows:
  ```
  Session ID: 0199dc75-7be5-7ae2-98a3-5be0079041b5
  Created: 2025-10-13 07:25:11 (local time)
  CLI Version: 0.46.0
  Working Directory: D:\vsCodeWorkSpace\session_manager
  ```
- Provide tooltips on the resume button reminding users to confirm `/status` output matches the selected session ID.

## Edge Cases
- When `session_meta` is locked or unreadable, mark the entry as `Unavailable` and surface a retry option.
- If multiple sessions share the same `payload.id`, retain the latest one and warn about duplicates.
- Should the user delete a session while the detail panel is open, gracefully clear the selection and show a toast indicating the removal.
- For high-volume directories, throttle refreshes (e.g., 500 ms debounce) to prevent UI thrashing while maintaining accuracy.
