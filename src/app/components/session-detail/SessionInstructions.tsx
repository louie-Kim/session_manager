import { useState } from 'react';

import type { SessionDetail as SessionDetailType } from '@/lib/types';

import { SectionTitle } from './SectionTitle';

interface SessionInstructionsProps {
  instructions: SessionDetailType['instructions'];
}

export function SessionInstructions({ instructions }: SessionInstructionsProps) {
  const instructionText =
    instructions && typeof instructions === 'string'
      ? instructions
      : instructions
        ? JSON.stringify(instructions, null, 2)
        : null;

  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionTitle>Instructions</SectionTitle>
        {instructionText ? (
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            className="text-sm font-medium text-neutral-600 underline transition hover:text-neutral-900"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
      {instructionText ? (
        open ? (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50">
            <pre className="whitespace-pre-wrap px-4 py-3 text-xs text-neutral-700">{instructionText}</pre>
          </div>
        ) : null
      ) : (
        <p className="mt-3 text-sm text-neutral-500">No instructions captured.</p>
      )}
    </section>
  );
}
