import { SessionManager } from './components/session-manager';

export default function Home() {
  return (
    <main className='min-h-screen bg-neutral-100 px-6 py-10 font-sans sm:px-10'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6'>
        <header>
          <h1 className='text-2xl font-semibold text-neutral-900'>Codex Session Manager</h1>
          <p className='mt-1 text-sm text-neutral-600'>
            Inspect Codex CLI sessions, view metadata, and resume work in a dedicated command prompt.
          </p>
        </header>
        <SessionManager />
      </div>
    </main>
  );
}

