import { formatZarDisplay } from '@/components/landing/formatZar';
import { Surface } from '@/components/ui/Card';
import { Amount, Text } from '@/components/ui/Text';

export function AuthVisual() {
  return (
    <Surface variant="elevated" className="mt-10 max-w-sm px-5 py-4">
      <Text variant="meta">This month</Text>
      <Amount display className="mt-2 block text-[var(--tl-ink)]">
        {formatZarDisplay(71540)}
      </Amount>
      <Text variant="small" className="mt-1">
        Collected
      </Text>

      <div className="mt-5 grid grid-cols-2 gap-6 border-t border-[var(--tl-line)] pt-4">
        <div>
          <Text variant="caption">Outstanding</Text>
          <Amount className="mt-1 block">{formatZarDisplay(24180)}</Amount>
        </div>
        <div>
          <Text variant="caption">Overdue</Text>
          <Amount className="mt-1 block">{formatZarDisplay(8920)}</Amount>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--tl-line)] pt-4">
        <Text variant="small">INV-10422 · Cape Creative</Text>
        <Text variant="caption" className="font-medium text-[var(--tl-success)]">
          Paid
        </Text>
      </div>
    </Surface>
  );
}
