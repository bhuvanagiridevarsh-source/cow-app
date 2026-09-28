import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';

export default function HomeScreen() {
  return (
    <Screen>
      <Eyebrow label="A student-led project" />
      <AppText variant="display">Compassion Driven Change</AppText>
      <Lamp size={140} />
      <AppText color="muted">Small change for big change.</AppText>
    </Screen>
  );
}
