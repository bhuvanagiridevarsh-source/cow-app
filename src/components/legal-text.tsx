import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { parseMarkdown, type Span } from '@/legal/markdown';
import { openEmail, openInApp } from '@/lib/links';
import { space } from '@/theme';

function Spans({ spans }: { spans: Span[] }) {
  return spans.map((span, i) => {
    if (span.url) {
      const url = span.url;
      return (
        <AppText
          key={i}
          color="link"
          accessibilityRole="link"
          style={styles.link}
          onPress={() => (url.startsWith('mailto:') ? openEmail(url.slice(7)) : openInApp(url))}>
          {span.text}
        </AppText>
      );
    }
    return (
      <AppText key={i} variant={span.bold ? 'bodyStrong' : 'body'}>
        {span.text}
      </AppText>
    );
  });
}

/** Shows the Terms of Use or Privacy Policy text (from docs/, via src/legal/generated.ts). */
export function LegalText({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  return (
    <View style={styles.wrap}>
      {blocks.map((block, i) => {
        if (block.kind === 'title') {
          return (
            <AppText key={i} variant="title">
              <Spans spans={block.spans} />
            </AppText>
          );
        }
        if (block.kind === 'heading') {
          return (
            <AppText key={i} variant="heading" style={styles.heading}>
              <Spans spans={block.spans} />
            </AppText>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={i} style={styles.bullet}>
              <AppText>{'•'}</AppText>
              <AppText style={styles.bulletText}>
                <Spans spans={block.spans} />
              </AppText>
            </View>
          );
        }
        return (
          <AppText key={i}>
            <Spans spans={block.spans} />
          </AppText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  heading: { marginTop: space.sm },
  bullet: { flexDirection: 'row', gap: space.sm, paddingLeft: space.xs },
  bulletText: { flex: 1 },
  link: { textDecorationLine: 'underline' },
});
