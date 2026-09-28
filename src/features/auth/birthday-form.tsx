import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { TextField } from '@/components/ui/text-field';
import { nyToday } from '@/domain/age';
import { space } from '@/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  initialYear?: number;
  initialMonth?: number;
  onSubmit: (birthYear: number, birthMonth: number) => void;
  busy?: boolean;
};

/**
 * "When were you born?" A neutral age question: it doesn't say what age is required,
 * and it asks everyone the same way (as the FTC recommends for apps teens use).
 */
export function BirthdayForm({ initialYear, initialMonth, onSubmit, busy }: Props) {
  const [month, setMonth] = useState<number | null>(initialMonth ?? null);
  const [year, setYear] = useState(initialYear ? String(initialYear) : '');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const today = nyToday();
    const y = Number(year);
    if (month === null) return setError('Please choose the month you were born.');
    if (!/^\d{4}$/.test(year) || y < today.year - 100 || y > today.year) {
      return setError('Please enter the year you were born, like 2009.');
    }
    if (y === today.year && month > today.month) return setError('Please check your birth month.');
    setError(null);
    onSubmit(y, month);
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="bodyStrong" color="heading">
        Month
      </AppText>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Birth month">
        {MONTHS.map((name, i) => (
          <View key={name} style={styles.cell}>
            <Chip label={name} selected={month === i + 1} onPress={() => setMonth(i + 1)} />
          </View>
        ))}
      </View>
      <TextField
        label="Year"
        value={year}
        onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        placeholder="YYYY"
        maxLength={4}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormMessage message={error} />
      <Button label="Continue" onPress={submit} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { flexBasis: '30%', flexGrow: 1 },
});
