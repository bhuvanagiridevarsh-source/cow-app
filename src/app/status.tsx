import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorRetry, Loading } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-provider';

/** Shown while the account is loading, or if it couldn't load (with Try again). */
export default function StatusScreen() {
  const { status, reloadProfile, signOut } = useAuth();
  if (status !== 'error') {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your account" />
      </Screen>
    );
  }
  return (
    <Screen scroll={false}>
      <ErrorRetry
        message="We couldn't load your account. Check your internet connection and try again."
        onRetry={() => void reloadProfile()}
      />
      <Button label="Sign out" variant="outline" onPress={() => void signOut('thisDevice')} />
    </Screen>
  );
}
