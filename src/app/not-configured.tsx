import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';

/** Shown only if this copy of the app has no Supabase keys (never in a real store build). */
export default function NotConfiguredScreen() {
  return (
    <Screen contentStyle={{ alignItems: 'center', paddingTop: 64 }}>
      <Lamp size={96} glow={0.3} flicker={false} />
      <AppText variant="title" style={{ textAlign: 'center' }}>
        Almost ready
      </AppText>
      <AppText color="muted" style={{ textAlign: 'center' }}>
        This copy of the CoW app isn&apos;t connected to its database yet.
      </AppText>
      <AppText variant="small" color="muted" style={{ textAlign: 'center' }}>
        For the developer: copy .env.example to .env, add the Supabase URL and key (see
        docs/SUPABASE_SETUP.md), then restart the app.
      </AppText>
    </Screen>
  );
}
