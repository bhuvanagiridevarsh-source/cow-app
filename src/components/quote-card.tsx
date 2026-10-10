import { QuotesIcon } from 'phosphor-react-native/src/icons/Quotes';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { usePalette } from '@/hooks/use-theme';

type Props = { text: string; name: string; role?: string };

/** A warm quote card: the words, then who said them. */
export function QuoteCard({ text, name, role }: Props) {
  const p = usePalette();
  return (
    <Card tone="warm">
      <QuotesIcon size={28} weight="fill" color={p.accent} />
      <AppText>{text}</AppText>
      <AppText variant="small" color="muted">
        {role ? `${name}, ${role}` : name}
      </AppText>
    </Card>
  );
}
