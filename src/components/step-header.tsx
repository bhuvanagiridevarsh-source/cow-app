import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Eyebrow } from '@/components/ui/eyebrow';
import { space } from '@/theme';

type Props = { step: number; of: number; title: string; body?: string };

/** "Step 2 of 4" plus the one question this screen asks. */
export function StepHeader({ step, of, title, body }: Props) {
  return (
    <View style={{ gap: space.sm }}>
      <Eyebrow label={`Step ${step} of ${of}`} />
      <AppText variant="title">{title}</AppText>
      {body ? <AppText color="muted">{body}</AppText> : null}
    </View>
  );
}
