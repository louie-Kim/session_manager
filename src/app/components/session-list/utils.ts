import type { SessionListItem } from '@/lib/types';

export function getStatusBadge(status: SessionListItem['status']) {
  switch (status) {
    case 'corrupted':
      return { label: 'Corrupted', className: 'bg-red-100 text-red-700' };
    case 'missing':
      return { label: 'Missing', className: 'bg-amber-100 text-amber-700' };
    default:
      return { label: 'Ready', className: 'bg-emerald-100 text-emerald-700' };
  }
}

export function formatKstDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');

  if (!year || !month || !day || !hour || !minute) {
    return formatter.format(date);
  }

  return `${year}-${month}-${day} ${hour}:${minute} KST`;
}
