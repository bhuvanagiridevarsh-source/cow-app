import { useLocalSearchParams } from 'expo-router';

import { LegalText } from '@/components/legal-text';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { PRIVACY_MD, TERMS_MD } from '@/legal';

/** Terms of Use or Privacy Policy (the in-app copy of docs/TERMS.md and docs/PRIVACY_POLICY.md). */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  return (
    <Screen>
      <ScreenHeader />
      <LegalText markdown={doc === 'privacy' ? PRIVACY_MD : TERMS_MD} />
    </Screen>
  );
}
