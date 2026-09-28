/**
 * A tiny reader for the simple Markdown used in docs/TERMS.md and docs/PRIVACY_POLICY.md:
 * # title, ## heading, - bullet, paragraphs, **bold**, [text](link), and email addresses.
 */
export type Span = { text: string; bold?: boolean; url?: string };
export type Block = { kind: 'title' | 'heading' | 'paragraph' | 'bullet'; spans: Span[] };

const EMAIL = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/;

function emailSpans(text: string, bold?: boolean): Span[] {
  return text
    .split(EMAIL)
    .filter((part) => part !== '')
    .map((part) =>
      EMAIL.test(part) ? { text: part, bold, url: `mailto:${part}` } : { text: part, bold },
    );
}

export function parseInline(text: string): Span[] {
  const spans: Span[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const index = m.index ?? 0;
    if (index > last) spans.push(...emailSpans(text.slice(last, index)));
    if (m[1] !== undefined) spans.push(...emailSpans(m[1], true));
    else spans.push({ text: m[2], url: m[3] });
    last = index + m[0].length;
  }
  if (last < text.length) spans.push(...emailSpans(text.slice(last)));
  return spans;
}

export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', spans: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      flush();
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ kind: 'heading', spans: parseInline(line.slice(3)) });
    } else if (line.startsWith('# ')) {
      flush();
      blocks.push({ kind: 'title', spans: parseInline(line.slice(2)) });
    } else if (line.startsWith('- ')) {
      flush();
      blocks.push({ kind: 'bullet', spans: parseInline(line.slice(2)) });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
