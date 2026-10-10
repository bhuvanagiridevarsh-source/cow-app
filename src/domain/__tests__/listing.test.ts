import { addressProblem, detailsProblem, EMPTY_DRAFT, parseValue, type ListingDraft } from '@/domain/listing';
import { countsTowardLimit, donationGroup, groupDonations } from '@/domain/my-donations';
import {
  addDays,
  availableWindows,
  dayOptions,
  describeWindow,
  formatDay,
  isWindowOver,
  njDay,
  njTime,
  windowFromRange,
  windowHours,
  windowRange,
  WINDOWS,
} from '@/domain/pickup-windows';
import { DEFAULT_ZIP_PREFIXES } from '@/domain/zip';
import { draftFromItem } from '@/features/items/draft-from-item';
import { isJpeg, jpegHasGps } from '@/lib/jpeg';

// Saturday Oct 10, 2026, 10:30 AM in New Jersey (daylight time, UTC-4).
const NOW = new Date('2026-10-10T14:30:00Z');

describe('pickup windows', () => {
  it('are Morning 9-12, Afternoon 12-4, Evening 4-7 (PLAN D7)', () => {
    expect(WINDOWS.map((w) => [w.key, w.startHour, w.endHour])).toEqual([
      ['morning', 9, 12],
      ['afternoon', 12, 16],
      ['evening', 16, 19],
    ]);
    expect(windowHours('morning')).toBe('9 AM–12 PM');
    expect(windowHours('afternoon')).toBe('12 PM–4 PM');
    expect(windowHours('evening')).toBe('4 PM–7 PM');
  });
  it('convert New Jersey time correctly in summer and winter', () => {
    expect(njTime('2026-10-10', 9).toISOString()).toBe('2026-10-10T13:00:00.000Z'); // daylight time
    expect(njTime('2026-12-10', 9).toISOString()).toBe('2026-12-10T14:00:00.000Z'); // standard time
    // The day the clocks change (Nov 1, 2026): 9 AM is already standard time.
    expect(njTime('2026-11-01', 9).toISOString()).toBe('2026-11-01T14:00:00.000Z');
    expect(njTime('2027-03-14', 9).toISOString()).toBe('2027-03-14T13:00:00.000Z');
  });
  it('windowRange matches what the database accepts (1 to 12 hours long)', () => {
    for (const w of WINDOWS) {
      const { start, end } = windowRange('2026-10-17', w.key);
      const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
      expect(hours).toBe(w.endHour - w.startHour);
      expect(hours).toBeGreaterThanOrEqual(1);
      expect(hours).toBeLessThanOrEqual(12);
    }
  });
  it('knows today in New Jersey, even late at night UTC', () => {
    expect(njDay(NOW)).toBe('2026-10-10');
    expect(njDay(new Date('2026-10-11T03:00:00Z'))).toBe('2026-10-10');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('only offers windows with at least an hour left', () => {
    expect(availableWindows('2026-10-10', NOW)).toEqual(['morning', 'afternoon', 'evening']);
    expect(availableWindows('2026-10-10', new Date('2026-10-10T15:30:00Z'))).toEqual(['afternoon', 'evening']); // 11:30 AM
    expect(availableWindows('2026-10-10', new Date('2026-10-10T22:30:00Z'))).toEqual([]); // 6:30 PM
    expect(availableWindows('2026-10-11', new Date('2026-10-10T22:30:00Z'))).toHaveLength(3);
  });
  it('offers today through 3 weeks out, skipping today once it is too late', () => {
    const days = dayOptions(NOW);
    expect(days[0]).toBe('2026-10-10');
    expect(days[days.length - 1]).toBe('2026-10-31');
    expect(days).toHaveLength(22);
    expect(dayOptions(new Date('2026-10-10T22:30:00Z'))[0]).toBe('2026-10-11');
  });
  it('never offers a window the database would refuse as too far away (31 days)', () => {
    const last = dayOptions(NOW).pop() as string;
    const { start } = windowRange(last, 'evening');
    expect(new Date(start).getTime() - NOW.getTime()).toBeLessThan(31 * 86_400_000);
  });
  it('describes days and saved windows in plain words', () => {
    expect(formatDay('2026-10-10', NOW)).toBe('Today');
    expect(formatDay('2026-10-11', NOW)).toBe('Tomorrow');
    expect(formatDay('2026-10-17', NOW)).toBe('Sat, Oct 17');
    const { start, end } = windowRange('2026-10-17', 'morning');
    expect(describeWindow(start, end, NOW)).toBe('Sat, Oct 17 · 9 AM–12 PM');
  });
  it('turns a saved window back into the buttons (for editing)', () => {
    const { start, end } = windowRange('2026-12-05', 'evening');
    expect(windowFromRange(start, end)).toEqual({ day: '2026-12-05', key: 'evening' });
    expect(windowFromRange('2026-12-05T15:30:00Z', '2026-12-05T18:00:00Z')).toEqual({ day: '2026-12-05', key: null });
  });
  it('knows when a pickup time is over', () => {
    expect(isWindowOver('2026-10-10T14:00:00Z', NOW)).toBe(true);
    expect(isWindowOver('2026-10-10T16:00:00Z', NOW)).toBe(false);
  });
});

describe('listing rules', () => {
  const good: ListingDraft = {
    ...EMPTY_DRAFT,
    category: 'furniture',
    title: 'Oak desk',
    value: '120',
    condition: 'good',
    day: '2026-10-17',
    window: 'morning',
    photoUri: 'file:///photo.jpg',
    street: '12 Maple St',
    town: 'Monroe Twp',
    zip: '08831',
  };
  const rules = { allowedZipPrefixes: DEFAULT_ZIP_PREFIXES, adultHomeRequired: false };

  it('parseValue reads whole dollars', () => {
    expect(parseValue('120')).toBe(120);
    expect(parseValue('$1,200')).toBe(1200);
    expect(parseValue(' 45 ')).toBe(45);
    expect(parseValue('')).toBeNull();
    expect(parseValue('12.50')).toBeNull();
    expect(parseValue('abc')).toBeNull();
    expect(parseValue('-5')).toBeNull();
  });
  it('accepts a complete listing', () => {
    expect(detailsProblem(good, 5000, NOW)).toBeNull();
    expect(addressProblem(good, rules)).toBeNull();
  });
  it('an already-uploaded photo counts as a photo (editing)', () => {
    expect(detailsProblem({ ...good, photoUri: null, photoPath: 'u/abc.jpg' }, 5000, NOW)).toBeNull();
  });
  it.each<[string, Partial<ListingDraft>, RegExp]>([
    ['no photo', { photoUri: null }, /photo/],
    ['a 2-letter name', { title: 'TV' }, /what the item is/],
    ['a blank name', { title: '   ' }, /what the item is/],
    ['a 61-letter name', { title: 'x'.repeat(61) }, /under 60/],
    ['no value', { value: '' }, /at least \$1/],
    ['a zero value', { value: '0' }, /at least \$1/],
    ['a value over the cap', { value: '5001' }, /up to \$5,000/],
    ['no condition', { condition: null }, /condition/],
    ['no day', { day: null }, /pickup day/],
    ['no time', { window: null }, /pickup time/],
    ['a time that has passed', { day: '2026-10-10', window: 'morning' }, /has passed/],
  ])('step 2 catches %s', (_name, change, message) => {
    const now = new Date('2026-10-10T15:30:00Z'); // 11:30 AM: this morning is no longer offered
    expect(detailsProblem({ ...good, ...change }, 5000, now)).toMatch(message);
  });
  it.each<[string, Partial<ListingDraft>, RegExp]>([
    ['no street', { street: ' ' }, /street/],
    ['a very long unit', { unit: 'x'.repeat(31) }, /unit/],
    ['no town', { town: '' }, /town/],
    ['a short ZIP', { zip: '0883' }, /5-digit/],
    ['a ZIP outside New Jersey', { zip: '10001' }, /New Jersey/],
    ['a very long note', { note: 'x'.repeat(201) }, /under 200/],
  ])('step 3 catches %s', (_name, change, message) => {
    expect(addressProblem({ ...good, ...change }, rules)).toMatch(message);
  });
  it('follows the board’s service area, not a fixed list', () => {
    expect(addressProblem({ ...good, zip: '10001' }, { ...rules, allowedZipPrefixes: ['100'] })).toBeNull();
    expect(addressProblem(good, { ...rules, allowedZipPrefixes: ['100'] })).toMatch(/New Jersey/);
  });
  it('minor donors must confirm an adult will be home when the rule is on (PLAN D3)', () => {
    const minorRules = { ...rules, adultHomeRequired: true };
    expect(addressProblem(good, minorRules)).toMatch(/adult will be home/);
    expect(addressProblem({ ...good, adultHome: true }, minorRules)).toBeNull();
  });
});

describe('photo location-data check', () => {
  const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
  const segment = (marker: number, body: number[]) => [0xff, marker, ...be16(body.length + 2), ...body];
  const chars = (s: string) => Array.from(s).map((c) => c.charCodeAt(0));
  /** A tiny Exif block (big-endian) whose first directory holds the given tags. */
  const exif = (tags: number[]) => [
    ...chars('Exif\0\0'),
    ...chars('MM'),
    0x00, 0x2a,
    0x00, 0x00, 0x00, 0x08,
    ...be16(tags.length),
    ...tags.flatMap((tag) => [...be16(tag), 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x1a]),
    0x00, 0x00, 0x00, 0x00,
  ];
  /** The same block, little-endian. */
  const exifLittle = (tag: number) => [
    ...chars('Exif\0\0'),
    ...chars('II'),
    0x2a, 0x00,
    0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    tag & 0xff, (tag >> 8) & 0xff, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x1a, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  const jfif = segment(0xe0, [...chars('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const picture = [0xff, 0xda, 0x00, 0x02, 0x12, 0x34, 0xff, 0xd9];
  const jpeg = (...segments: number[][]) => new Uint8Array([0xff, 0xd8, ...segments.flat(), ...picture]);

  it('recognizes a JPEG', () => {
    expect(isJpeg(jpeg(jfif))).toBe(true);
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(isJpeg(new Uint8Array([]))).toBe(false);
  });
  it('passes a photo with no hidden info', () => {
    expect(jpegHasGps(jpeg(jfif))).toBe(false);
  });
  it('passes a photo whose Exif has no location (e.g. only rotation)', () => {
    expect(jpegHasGps(jpeg(jfif, segment(0xe1, exif([0x0112]))))).toBe(false);
  });
  it('catches GPS in Exif, in either byte order, wherever the tag sits', () => {
    expect(jpegHasGps(jpeg(jfif, segment(0xe1, exif([0x8825]))))).toBe(true);
    expect(jpegHasGps(jpeg(jfif, segment(0xe1, exif([0x0112, 0x8769, 0x8825]))))).toBe(true);
    expect(jpegHasGps(jpeg(segment(0xe1, exifLittle(0x8825))))).toBe(true);
    expect(jpegHasGps(jpeg(segment(0xe1, exifLittle(0x0112))))).toBe(false);
  });
  it('catches GPS written as XMP text', () => {
    const xmp = chars('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta exif:GPSLatitude="40,21.5N"/>');
    expect(jpegHasGps(jpeg(jfif, segment(0xe1, xmp)))).toBe(true);
    const plain = chars('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta dc:title="desk"/>');
    expect(jpegHasGps(jpeg(jfif, segment(0xe1, plain)))).toBe(false);
  });
  it('never crashes on cut-off or strange files', () => {
    const whole = Array.from(jpeg(jfif, segment(0xe1, exif([0x8825]))));
    for (let cut = 0; cut < whole.length; cut++) {
      expect(() => jpegHasGps(new Uint8Array(whole.slice(0, cut)))).not.toThrow();
    }
    expect(jpegHasGps(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x00]))).toBe(false);
    expect(jpegHasGps(new Uint8Array([1, 2, 3, 4, 5]))).toBe(false);
  });
});

describe('my donations', () => {
  it('puts each status in the right group', () => {
    expect(donationGroup('requested')).toBe('needs_answer');
    expect(donationGroup('accepted')).toBe('scheduled');
    expect(donationGroup('collected')).toBe('confirm');
    expect(donationGroup('listed')).toBe('waiting');
    expect(donationGroup('confirmed')).toBe('done');
    expect(donationGroup('removed')).toBe('taken_down');
    expect(donationGroup('withdrawn')).toBeNull();
  });
  it('lists what needs the donor first and drops empty groups', () => {
    const items = [{ status: 'listed' }, { status: 'confirmed' }, { status: 'requested' }, { status: 'withdrawn' }] as const;
    expect(groupDonations(items).map((g) => [g.key, g.items.length])).toEqual([
      ['needs_answer', 1],
      ['waiting', 1],
      ['done', 1],
    ]);
    expect(groupDonations([])).toEqual([]);
  });
  it('counts toward the listing limit exactly like the database', () => {
    const counted = (['listed', 'requested', 'accepted', 'collected', 'confirmed', 'withdrawn', 'removed'] as const).filter(
      countsTowardLimit,
    );
    expect(counted).toEqual(['listed', 'requested', 'accepted', 'collected']);
  });
});

describe('draftFromItem (editing a listing)', () => {
  const { start, end } = windowRange('2026-10-17', 'afternoon');
  const item = {
    id: 'i1', donor_id: 'u1', category: 'electronics', title: 'Monitor', value: 80, condition: 'good',
    photo_path: 'u1/abcdefgh.jpg', pickup_window_start: start, pickup_window_end: end, town: 'Monroe Twp',
    approx_lat: 40.33, approx_lng: -74.44, status: 'listed', hidden_at: null,
    created_at: start, updated_at: start, confirmed_at: null,
  } as const;
  const address = { item_id: 'i1', street: '12 Maple St', unit: null, zip: '08831', pickup_note: 'Garage', exact_lat: null, exact_lng: null };

  it('fills the form from the saved listing', () => {
    expect(draftFromItem(item, address, NOW)).toEqual({
      category: 'electronics', title: 'Monitor', value: '80', condition: 'good',
      day: '2026-10-17', window: 'afternoon', photoPath: 'u1/abcdefgh.jpg', photoUri: null,
      street: '12 Maple St', unit: '', town: 'Monroe Twp', zip: '08831', note: 'Garage', adultHome: false,
    });
  });
  it('leaves the pickup time blank once it has passed', () => {
    const later = draftFromItem(item, address, new Date('2026-10-18T14:00:00Z'));
    expect(later.day).toBeNull();
    expect(later.window).toBeNull();
    expect(later.title).toBe('Monitor');
  });
});
