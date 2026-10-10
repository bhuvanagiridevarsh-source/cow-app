import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { CONTACT_EMAIL } from '@/config';
import { REPORT_DETAILS_MAX, REPORT_REASONS, type ReportReason } from '@/domain/pickup-text';
import { friendlyError } from '@/features/errors';
import { sendReport } from '@/features/pickups/api';
import { space } from '@/theme';

/** Report a listing, a pickup, or a person. Reports go to CoW's team, never to the other person. */
export default function ReportScreen() {
  const { itemId, pickupId, userId } = useLocalSearchParams<{ itemId?: string; pickupId?: string; userId?: string }>();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!reason) return setError('Please choose what went wrong.');
    setBusy(true);
    setError(null);
    try {
      await sendReport(reason, details, { itemId, pickupId, userId });
      setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <ScreenHeader />
        <AppText variant="title">Thank you</AppText>
        <AppText>CoW&apos;s team will review your report. The other person isn&apos;t told who reported them.</AppText>
        <Card tone="warm">
          <AppText variant="bodyStrong" color="heading">
            If anyone is in danger, call 911.
          </AppText>
        </Card>
        <Button label="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader />
      <AppText variant="title">Report a problem</AppText>
      <AppText color="muted">Your report goes to CoW&apos;s team. The other person isn&apos;t told who sent it.</AppText>
      <AppText variant="bodyStrong" color="heading">
        What went wrong?
      </AppText>
      <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="What went wrong">
        {REPORT_REASONS.map((r) => (
          <Chip key={r.key} label={r.label} selected={reason === r.key} onPress={() => setReason(r.key)} />
        ))}
      </View>
      <TextField
        label="Anything else we should know? (optional)"
        value={details}
        onChangeText={setDetails}
        maxLength={REPORT_DETAILS_MAX}
        multiline
        style={styles.details}
      />
      <FormMessage message={error} />
      <Button label="Send report" loading={busy} onPress={() => void send()} />
      <AppText variant="small" color="muted" style={styles.center}>
        In an emergency, call 911. You can also email {CONTACT_EMAIL}.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  details: { minHeight: 110, textAlignVertical: 'top' },
  center: { textAlign: 'center' },
});
