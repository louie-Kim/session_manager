# codex resume Manager - Phase 4 Testing Plan

## Automated Coverage (Jest)
- [x] `electron/scanner/session-meta.ts`: validates happy path, missing file, invalid JSON.  
- [x] `electron/cli/resume-session.ts`: ensures spawn command, ID mismatch guard, and missing CLI errors.  
- [x] `electron/ipc/resume-session-handler.ts`: verifies IPC success payloads and error propagation.  
- [x] `electron/watchers/session-watcher.ts`: confirms file watcher events bubble up and error paths stay observable.

Run locally with:
```bash
pnpm test
```

## Playwright Smoke (E2E)
- [ ] Start the web app locally (`pnpm dev:web`) or point `PLAYWRIGHT_BASE_URL` at a running build.
- [x] Execute the Chromium smoke test: `pnpm test:e2e` (last run 2025-10-14, passed).
- [ ] Capture screenshots, traces, and videos stored under `playwright-report/` when failures occur.

## Manual Verification Checklist
> NOTE: These scenarios require an interactive Electron + CLI environment. They remain pending until executed on a real desktop host.

- [ ] Launch the desktop bundle using `pnpm dev:desktop` (Next.js + Electron).
- [ ] Confirm session list matches `%USERPROFILE%\.codex\sessions` ordering.
- [ ] View session detail panel for cwd, CLI version, and instructions accuracy.
- [ ] Click **Resume Session** and ensure a Command Prompt opens with `codex resume <session_id>`.
- [ ] Run `codex /status` in that shell and verify the `session_id` matches the UI selection.
- [ ] Execute `codex resume <session_id>` manually in the same shell; CLI should resume without UI assistance.
- [ ] Mutate the active session log (for example, `echo smoke >> <session_dir>\session.log`) and check the UI reorders/refreshes.
- [ ] Corrupt or remove `session_meta`; UI should show a warning and disable resume.
- [ ] Rename `%USERPROFILE%\.codex\bin\codex.exe`, retry resume, and confirm toast messaging describes the missing CLI.
- [ ] Restore any renamed files to return the environment to a healthy state.

## Tooling Summary
- **Jest** (`pnpm test`): unit coverage for metadata parsing, CLI resume validation, IPC handlers, scanners, and the watcher bridge.  
- **Playwright** (`pnpm test:e2e`): Chromium smoke to sanity-check UI wiring against a running Next.js instance.  
- **Manual CLI Checks**: follow the checklist above to validate resume integrity end-to-end.  
- **Future Enhancements**: expand Playwright coverage once deterministic fixtures exist, and script session mutations for automated manual steps.
