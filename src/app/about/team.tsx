import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import type { ContentPerson } from '@/features/content/schema';
import { useContent } from '@/features/content/use-content';
import { space } from '@/theme';

function PersonCard({ person }: { person: ContentPerson }) {
  return (
    <Card>
      <View style={styles.row}>
        <Avatar name={person.name} photo={person.photo} />
        <View style={styles.text}>
          <AppText variant="heading">{person.name}</AppText>
          <AppText variant="bodyStrong" color="link">
            {person.role}
          </AppText>
          {person.focus ? <AppText color="muted">{person.focus}</AppText> : null}
        </View>
      </View>
    </Card>
  );
}

export default function TeamScreen() {
  const { team, changeMakers, board } = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Meet the team" />
      <AppText variant="title">The student leaders behind CoW</AppText>
      {team.map((person) => (
        <PersonCard key={person.name} person={person} />
      ))}

      {changeMakers.length > 0 ? (
        <>
          <AppText variant="title" style={styles.section}>
            ChangeMakers
          </AppText>
          {changeMakers.map((person) => (
            <PersonCard key={person.name} person={person} />
          ))}
        </>
      ) : null}

      {board.length > 0 ? (
        <>
          <AppText variant="title" style={styles.section}>
            Board of Trustees & Advisors
          </AppText>
          <AppText color="muted">Mentors and community leaders guiding CoW&apos;s mission.</AppText>
          {board.map((member) => (
            <Card key={member.name}>
              <View style={styles.row}>
                <Avatar name={member.name} photo={member.photo} />
                <View style={styles.text}>
                  <AppText variant="heading">{member.name}</AppText>
                  <AppText>{member.bio}</AppText>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  text: { flex: 1, gap: 2 },
  section: { marginTop: space.md },
});
