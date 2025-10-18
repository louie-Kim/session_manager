export function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center text-sm text-neutral-500">
      {loading ? 'Loading sessions...' : 'No sessions found. Run Codex CLI to create sessions.'}
    </div>
  );
}
