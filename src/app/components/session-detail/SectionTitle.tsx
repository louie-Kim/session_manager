import type { ReactNode } from 'react';

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-neutral-800">{children}</h3>;
}
