import { router } from 'expo-router';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { ImagesIcon } from 'phosphor-react-native/src/icons/Images';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { StepHeader } from '@/components/step-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { CONDITION_LABELS, CONDITIONS, detailsProblem, TITLE_MAX } from '@/domain/listing';
import { availableWindows, dayOptions, formatDay, windowHours, WINDOWS } from '@/domain/pickup-windows';
import { preparePhoto } from '@/features/items/api';
import { useListingDraft } from '@/features/items/listing-draft';
import { useRules } from '@/features/settings/use-settings';
import { choosePhoto, PhotoError, takePhoto, type PickedPhoto } from '@/lib/photos';
import { space } from '@/theme';

/** Step 2: photo, name, value, condition, and when it can be picked up. */
export default function ListItemDetails() {
  const { draft, update } = useListingDraft();
  const rules = useRules();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);

  const days = dayOptions();
  const openWindows = draft.day ? availableWindows(draft.day) : [];
  const hasPhoto = !!draft.photoUri || !!draft.photoPath;

  const addPhoto = async (pick: () => Promise<PickedPhoto | null>) => {
    if (photoBusy) return;
    setError(null);
    setNeedsSettings(false);
    setPhotoBusy(true);
    try {
      const picked = await pick();
      if (picked) update({ photoUri: await preparePhoto(picked) });
    } catch (e) {
      setNeedsSettings(e instanceof PhotoError && e.needsSettings);
      setError(e instanceof PhotoError ? e.message : "We couldn't add that photo. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const next = () => {
    const problem = detailsProblem(draft, rules.maxItemValue);
    setNeedsSettings(false);
    setError(problem);
    if (!problem) router.push('/list-item/address');
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <StepHeader step={2} of={4} title="Tell us about it" />

      <AppText variant="bodyStrong" color="heading">
        Photo
      </AppText>
      {hasPhoto ? (
        <ItemPhoto uri={draft.photoUri} path={draft.photoPath} label={draft.title || 'your item'} style={styles.photo} />
      ) : null}
      <Button
        label={hasPhoto ? 'Take a new photo' : 'Take a photo'}
        variant={hasPhoto ? 'outline' : 'secondary'}
        icon={CameraIcon}
        loading={photoBusy}
        onPress={() => void addPhoto(takePhoto)}
      />
      <Button
        label="Choose from my photos"
        variant="outline"
        icon={ImagesIcon}
        disabled={photoBusy}
        onPress={() => void addPhoto(choosePhoto)}
      />

      <TextField
        label="What is it?"
        hint="A short name, like “Oak desk” or “32-inch TV”."
        value={draft.title}
        onChangeText={(title) => update({ title })}
        maxLength={TITLE_MAX}
        autoCapitalize="sentences"
        returnKeyType="next"
      />
      <TextField
        label="Estimated value (dollars)"
        hint="Your best guess at what it's worth today."
        value={draft.value}
        onChangeText={(t) => update({ value: t.replace(/\D/g, '').slice(0, 6) })}
        keyboardType="number-pad"
        placeholder="50"
        maxLength={6}
        returnKeyType="done"
      />

      <AppText variant="bodyStrong" color="heading">
        Condition
      </AppText>
      <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Condition">
        {CONDITIONS.map((c) => (
          <Chip
            key={c}
            label={CONDITION_LABELS[c]}
            selected={draft.condition === c}
            onPress={() => update({ condition: c })}
          />
        ))}
      </View>

      <AppText variant="bodyStrong" color="heading">
        Pickup day
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.days}
        style={styles.bleed}
        accessibilityRole="radiogroup"
        accessibilityLabel="Pickup day">
        {days.map((day) => (
          <Chip
            key={day}
            label={formatDay(day)}
            selected={draft.day === day}
            onPress={() => {
              // Keep the chosen time if that day still has it; otherwise ask again.
              const keep = draft.window && availableWindows(day).includes(draft.window) ? draft.window : null;
              update({ day, window: keep });
            }}
          />
        ))}
      </ScrollView>

      {draft.day ? (
        <>
          <AppText variant="bodyStrong" color="heading">
            Pickup time
          </AppText>
          <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Pickup time">
            {WINDOWS.filter((w) => openWindows.includes(w.key)).map((w) => (
              <Chip
                key={w.key}
                label={`${w.label} · ${windowHours(w.key)}`}
                selected={draft.window === w.key}
                onPress={() => update({ window: w.key })}
              />
            ))}
          </View>
        </>
      ) : null}

      <FormMessage message={error} />
      {needsSettings ? <TextLink label="Open Settings" onPress={() => void Linking.openSettings()} /> : null}
      <Button label="Next" onPress={next} disabled={photoBusy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  // Let the row of days scroll edge to edge, past the page padding.
  bleed: { marginHorizontal: -space.md, flexGrow: 0 },
  days: { gap: space.sm, paddingHorizontal: space.md },
});
