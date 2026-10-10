import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/states';
import { formatEventDates, njToday, splitEvents } from '@/domain/events';
import { isUsableUrl } from '@/domain/urls';
import type { ContentEvent } from '@/features/content/schema';
import { useContent } from '@/features/content/use-content';
import { openInApp } from '@/lib/links';

function EventCard({ event, upcoming }: { event: ContentEvent; upcoming: boolean }) {
  const url = event.url;
  const when = event.time ? `${formatEventDates(event)} · ${event.time}` : formatEventDates(event);
  return (
    <Card tone={upcoming ? 'warm' : 'plain'}>
      <AppText variant="heading">{event.title}</AppText>
      {event.subtitle ? <AppText variant="bodyStrong">{event.subtitle}</AppText> : null}
      <AppText variant="bodyStrong" color="link">
        {when}
      </AppText>
      {event.location ? <AppText color="muted">{event.location}</AppText> : null}
      {event.note ? <AppText>{event.note}</AppText> : null}
      {upcoming && isUsableUrl(url) ? (
        <Button label="Event details" variant="secondary" icon={ArrowSquareOutIcon} onPress={() => void openInApp(url)} />
      ) : null}
    </Card>
  );
}

export default function EventsScreen() {
  const { events } = useContent();
  const { upcoming, past } = splitEvents(events, njToday());
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Events" />
      <AppText variant="title">Coming up</AppText>
      {upcoming.length > 0 ? (
        upcoming.map((event) => <EventCard key={event.title + event.startDate} event={event} upcoming />)
      ) : (
        <EmptyState title="Nothing scheduled right now" body="New events will show up here as soon as CoW announces them." />
      )}
      {past.length > 0 ? (
        <>
          <AppText variant="title">Past events</AppText>
          {past.map((event) => (
            <EventCard key={event.title + event.startDate} event={event} upcoming={false} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
