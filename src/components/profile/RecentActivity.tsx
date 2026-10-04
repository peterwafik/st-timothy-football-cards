import { formatDay } from '@/lib/dates';
import type { TimelineItem } from '@/lib/profile';

export function RecentActivity({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="font-card text-lg text-chalk/70">Nothing yet. Your first session will show up here.</p>;
  }
  return (
    <ol className="divide-y divide-chalk/10">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-4 py-3">
          <span className="w-24 shrink-0 font-card text-base text-chalk/60">{formatDay(item.date)}</span>
          <span className="flex-1 font-card text-lg font-bold">{item.label}</span>
          <span
            className={`font-stadium text-2xl font-bold tabular-nums ${
              item.kind === 'deduction' ? 'text-[#ef6461]' : item.kind === 'bonus' ? 'text-trophy' : ''
            }`}
          >
            {item.points > 0 ? `+${item.points}` : item.points}
          </span>
        </li>
      ))}
    </ol>
  );
}
