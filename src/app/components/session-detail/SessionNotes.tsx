import type { SessionDetail as SessionDetailType } from '@/lib/types';

import { SectionTitle } from './SectionTitle';

interface SessionNotesProps {
  notes?: SessionDetailType['notes'];
  metadataPath?: SessionDetailType['metadataPath'];
}

export function SessionNotes({ notes, metadataPath }: SessionNotesProps) {
  return (
    <>
      {notes ? (
        <section>
          <SectionTitle>Notes</SectionTitle>
          <p className="mt-2 text-sm text-neutral-600">{notes}</p>
        </section>
      ) : null}
      {metadataPath ? (
        <section>
          <SectionTitle>Metadata Path</SectionTitle>
          <p className="mt-2 break-all text-xs text-neutral-500">{metadataPath}</p>
        </section>
      ) : null}
    </>
  );
}
