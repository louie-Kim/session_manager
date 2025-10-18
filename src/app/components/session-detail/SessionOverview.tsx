import type { ReactNode } from 'react';

import type { SessionDetail as SessionDetailType } from '@/lib/types';

import { SectionTitle } from './SectionTitle';
import { formatKstDateTime } from './utils';

interface SessionOverviewProps {
  session: SessionDetailType;
}

export function SessionOverview({ session }: SessionOverviewProps) {
  return (
    <section>
      <SectionTitle>Overview</SectionTitle>
      <dl className="mt-3 grid grid-cols-1 gap-4 text-sm text-neutral-600 md:grid-cols-2">
        <DetailItem label="Session ID">
          <code className="break-all text-xs">{session.id}</code>
        </DetailItem>
        <DetailItem label="Working Dir">
          <code className="break-all text-xs">{session.cwd}</code>
        </DetailItem>
        <DetailItem label="Originator">{session.originator}</DetailItem>
        <DetailItem label="CLI Version">{session.cliVersion}</DetailItem>
        <DetailItem label="Status" valueClassName="capitalize">
          {session.status}
        </DetailItem>
        <DetailItem label="Created (KST)">{formatKstDateTime(new Date(session.createdAtIso))}</DetailItem>
      </dl>
    </section>
  );
}

function DetailItem({ label, children, valueClassName }: { label: string; children: ReactNode; valueClassName?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-neutral-400">{label}</dt>
      <dd className={`mt-1 text-neutral-700 ${valueClassName ?? ''}`}>{children}</dd>
    </div>
  );
}
