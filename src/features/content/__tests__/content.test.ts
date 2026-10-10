import bundledJson from '../../../../content/content.json';

import { splitEvents } from '@/domain/events';
import { isUsableUrl } from '@/domain/urls';
import { fetchRemoteContent, MAX_CONTENT_BYTES, newerContent, resolveContent } from '@/features/content/load';
import { type Content, parseContent } from '@/features/content/schema';

const bundled = parseContent(bundledJson) as Content;
/** A fresh, editable copy of the real file. */
const copy = (): Record<string, any> => JSON.parse(JSON.stringify(bundledJson));
const response = (body: string, ok = true) =>
  (async () => ({ ok, text: async () => body })) as unknown as typeof fetch;

describe('content/content.json (the copy shipped in the app)', () => {
  it('passes the content rules', () => {
    expect(bundled).not.toBeNull();
  });
  it('has the organization facts from the brief (§4)', () => {
    expect(bundled.tagline).toBe('Small change for big change.');
    expect(bundled.headline).toBe('Compassion Driven Change');
    expect(bundled.team.map((p) => p.name)).toEqual(['Yuvraaj Kumar (Yuvi)', 'Dhanvin Challa', 'Guntas Dhanjal']);
    expect(bundled.changeMakers.map((p) => p.name)).toEqual(['Aditi Menon', 'Samyuktha Nair']);
    expect(bundled.board.map((p) => p.name)).toEqual([
      'Wesley Mathews',
      'Lata Setty',
      'Prema Roddam',
      'Dr. Thomas Abraham',
    ]);
    expect(bundled.featuredPartner?.name).toBe('Voices of Children');
    expect(bundled.partners).toHaveLength(10);
    expect(bundled.membershipLevels.map((l) => l.name)).toEqual([
      'Volunteer',
      'Supporter',
      'Activist',
      'Ambassador',
      'Change Maker',
    ]);
    expect(bundled.founderQuote.text).toMatch(/We are the lamp!/);
  });
  it('never says "tax-deductible" (501(c)(3) status is pending)', () => {
    expect(JSON.stringify(bundledJson)).not.toMatch(/tax.?deductible/i);
  });
  it('has no placeholder text', () => {
    expect(JSON.stringify(bundledJson)).not.toMatch(/lorem|todo|tbd|coming soon/i);
  });
  it('only has links that work or are left out', () => {
    const urls = [...bundled.partners.map((p) => p.url), ...bundled.events.map((e) => e.url)].filter(Boolean);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(isUsableUrl(url)).toBe(true);
  });
});

describe('parseContent', () => {
  it.each([null, undefined, 'hello', 42, [], {}])('rejects %p', (input) => {
    expect(parseContent(input)).toBeNull();
  });
  it('rejects a file with required text missing or blank', () => {
    const noTeam = copy();
    delete noTeam.team;
    expect(parseContent(noTeam)).toBeNull();

    const blankName = copy();
    blankName.team[0].name = '   ';
    expect(parseContent(blankName)).toBeNull();

    const emptyStory = copy();
    emptyStory.story.paragraphs = [];
    expect(parseContent(emptyStory)).toBeNull();
  });
  it('rejects the wrong types', () => {
    const wrong = copy();
    wrong.partners = 'UNICEF';
    expect(parseContent(wrong)).toBeNull();
  });
  it('rejects impossible dates', () => {
    const badDay = copy();
    badDay.events[0].startDate = '2026-02-30';
    expect(parseContent(badDay)).toBeNull();

    const backwards = copy();
    backwards.events[0].endDate = '2026-10-01';
    expect(parseContent(backwards)).toBeNull();

    const sloppy = copy();
    sloppy.updated = 'October 10';
    expect(parseContent(sloppy)).toBeNull();
  });
  it('rejects a file made for a different app version', () => {
    const future = copy();
    future.schemaVersion = 2;
    expect(parseContent(future)).toBeNull();
  });
  it('rejects absurdly long text', () => {
    const long = copy();
    long.tagline = 'x'.repeat(5000);
    expect(parseContent(long)).toBeNull();
  });
  it('accepts extra fields, missing optional fields, and empty lists', () => {
    const relaxed = copy();
    relaxed.somethingNew = { hello: 'world' };
    relaxed.team[0].favoriteColor = 'blue';
    delete relaxed.team[0].photo;
    delete relaxed.featuredPartner;
    relaxed.events = [];
    relaxed.quotes = [];
    relaxed.partners[0].url = '';
    const parsed = parseContent(relaxed);
    expect(parsed).not.toBeNull();
    expect(parsed).not.toHaveProperty('somethingNew');
  });
  it('does not reject the file over a bad link (screens hide it instead)', () => {
    const badLink = copy();
    badLink.partners[0].url = 'not a link';
    const parsed = parseContent(badLink);
    expect(parsed).not.toBeNull();
    expect(isUsableUrl(parsed?.partners[0].url)).toBe(false);
  });
});

describe('fetchRemoteContent', () => {
  it('returns valid online content', async () => {
    const result = await fetchRemoteContent('https://x.org/c.json', response(JSON.stringify(bundledJson)));
    expect(result).toEqual(bundled);
  });
  it.each([
    ['a failed download', response('Not found', false)],
    ['broken JSON', response('{ "tagline": ')],
    ['a web page instead of JSON', response('<html></html>')],
    ['content that fails the rules', response('{"tagline":"hi"}')],
    ['a file that is too big', response(' '.repeat(MAX_CONTENT_BYTES + 1))],
    [
      'no connection',
      (async () => {
        throw new Error('Network request failed');
      }) as unknown as typeof fetch,
    ],
  ])('returns null for %s', async (_name, fetchImpl) => {
    await expect(fetchRemoteContent('https://x.org/c.json', fetchImpl)).resolves.toBeNull();
  });
});

describe('resolveContent (which copy the app shows)', () => {
  const older: Content = { ...bundled, updated: '2026-01-01', tagline: 'Older copy' };
  const newer: Content = { ...bundled, updated: '2027-01-01', tagline: 'Newer copy' };

  it('uses a valid online copy and saves it as the last good copy', async () => {
    const writeCache = jest.fn(async () => {});
    const result = await resolveContent({
      bundled,
      fetchRemote: async () => newer,
      readCache: async () => older,
      writeCache,
    });
    expect(result.tagline).toBe('Newer copy');
    expect(writeCache).toHaveBeenCalledWith(newer);
  });
  it('keeps the last good copy when the online copy is bad or the phone is offline', async () => {
    const writeCache = jest.fn(async () => {});
    const result = await resolveContent({
      bundled,
      fetchRemote: async () => null,
      readCache: async () => newer,
      writeCache,
    });
    expect(result.tagline).toBe('Newer copy');
    expect(writeCache).not.toHaveBeenCalled();
  });
  it('prefers the built-in copy over an older saved copy (after an app update)', async () => {
    const result = await resolveContent({
      bundled,
      fetchRemote: async () => null,
      readCache: async () => older,
      writeCache: async () => {},
    });
    expect(result).toBe(bundled);
  });
  it.each([null, 'garbage', { tagline: 'half a file' }])(
    'falls back to the built-in copy when the saved copy is %p',
    async (cached) => {
      const result = await resolveContent({
        bundled,
        fetchRemote: async () => null,
        readCache: async () => cached,
        writeCache: async () => {},
      });
      expect(result).toBe(bundled);
    },
  );
  it('newerContent keeps the first copy on a tie', () => {
    const twin: Content = { ...bundled, tagline: 'Twin' };
    expect(newerContent(bundled, twin)).toBe(bundled);
    expect(newerContent(bundled, newer)).toBe(newer);
  });
});

describe('splitEvents', () => {
  const events = bundled.events;
  it('puts an event in "coming up" through its last day', () => {
    expect(splitEvents(events, '2026-10-04').upcoming.map((e) => e.startDate)).toEqual(['2026-10-03']);
    expect(splitEvents(events, '2026-10-05').upcoming).toEqual([]);
  });
  it('lists coming-up events soonest first and past events most recent first', () => {
    const list = [{ startDate: '2026-12-01' }, { startDate: '2026-11-01' }, { startDate: '2026-01-05' }, { startDate: '2026-03-09' }];
    const { upcoming, past } = splitEvents(list, '2026-10-10');
    expect(upcoming.map((e) => e.startDate)).toEqual(['2026-11-01', '2026-12-01']);
    expect(past.map((e) => e.startDate)).toEqual(['2026-03-09', '2026-01-05']);
  });
  it('does not change the original list', () => {
    const list = [{ startDate: '2026-12-01' }, { startDate: '2026-11-01' }];
    splitEvents(list, '2026-10-10');
    expect(list[0].startDate).toBe('2026-12-01');
  });
});
