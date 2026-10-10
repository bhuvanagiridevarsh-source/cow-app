import { z } from 'zod';

/**
 * The shape of content/content.json (the About screens).
 *
 * CoW edits that file on GitHub, so the rules are forgiving where they can be:
 * - Extra fields are ignored. Optional fields (photo, url, note...) may be missing or blank.
 * - A bad link never rejects the file: screens hide any link that isn't usable.
 * - Missing or empty REQUIRED text does reject the file, and the app keeps the last good copy.
 */

/** Bump only if the file's shape changes in a way older app versions can't read. */
export const CONTENT_SCHEMA_VERSION = 1;

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
/** A calendar day like 2026-10-03 (and a real one: no Feb 30). */
const day = z.string().refine(isRealDay);

function isRealDay(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const time = Date.parse(`${d}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === d;
}

const quote = z.object({ text: text(600), name: text(80), role: optionalText(120) });

const person = z.object({
  name: text(80),
  role: text(120),
  focus: optionalText(120),
  /** A photo built into the app (e.g. "yuvraaj-kumar") or an https image link. */
  photo: optionalText(300),
});

const boardMember = z.object({ name: text(80), bio: text(600), photo: optionalText(300) });

const event = z
  .object({
    title: text(120),
    subtitle: optionalText(160),
    startDate: day,
    endDate: day.optional(),
    time: optionalText(80),
    location: optionalText(120),
    note: optionalText(300),
    url: optionalText(300),
  })
  .refine((e) => !e.endDate || e.endDate >= e.startDate);

export const contentSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  updated: day,
  tagline: text(120),
  headline: text(120),
  intro: text(400),
  story: z.object({ title: text(120), paragraphs: z.array(text(900)).min(1).max(8) }),
  founderQuote: quote,
  howItWorks: z.object({
    intro: text(300),
    steps: z.array(z.object({ title: text(80), body: text(400) })).min(1).max(8),
    impactNote: optionalText(400),
  }),
  team: z.array(person).min(1).max(30),
  changeMakers: z.array(person).max(60),
  board: z.array(boardMember).max(30),
  featuredPartner: z
    .object({ name: text(80), location: optionalText(80), description: text(400), quote: quote.optional() })
    .optional(),
  partners: z.array(z.object({ name: text(80), note: optionalText(80), url: optionalText(300) })).max(60),
  events: z.array(event).max(60),
  quotes: z.array(quote).max(20),
  membershipLevels: z
    .array(z.object({ name: text(40), requirement: text(120), perks: z.array(text(160)).min(1).max(8) }))
    .max(8),
});

export type Content = z.infer<typeof contentSchema>;
export type ContentEvent = Content['events'][number];
export type ContentPerson = Content['team'][number];

/** Returns the content if it is valid, otherwise null. Never throws. */
export function parseContent(input: unknown): Content | null {
  try {
    const result = contentSchema.safeParse(input);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
