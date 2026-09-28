import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ageBlockedUntil, ageGroup, nyToday } from '@/domain/age';
import { BirthdayForm } from '@/features/auth/birthday-form';
import { useDeviceState } from '@/features/device-state';

/** Asked BEFORE any email, so we never collect a child's email (US children's privacy law). */
export default function BirthdayScreen() {
  const { draft, updateDraft, blockUntil } = useDeviceState();
  return (
    <Screen keyboard>
      <ScreenHeader />
      <AppText variant="title">When were you born?</AppText>
      <AppText color="muted">We ask everyone. It helps keep CoW safe for students.</AppText>
      <BirthdayForm
        initialYear={draft.birthYear}
        initialMonth={draft.birthMonth}
        onSubmit={(birthYear, birthMonth) => {
          if (ageGroup(birthYear, birthMonth, nyToday()) === 'too_young') {
            blockUntil(ageBlockedUntil(birthYear, birthMonth));
            updateDraft({ birthYear: undefined, birthMonth: undefined });
            router.replace('/too-young');
            return;
          }
          updateDraft({ birthYear, birthMonth });
          router.push('/sign-in');
        }}
      />
    </Screen>
  );
}
