/// <reference types="node" />
// (Node types come with Jest; these tests read the docs and source files.)
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import { PRIVACY_MD, PRIVACY_VERSION, TERMS_MD, TERMS_VERSION } from '@/legal/generated';
import { parseInline, parseMarkdown } from '@/legal/markdown';

const root = join(__dirname, '../../..');
const docText = (file: string) =>
  readFileSync(join(root, 'docs', file), 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '').trim() + '\n';

describe('in-app Terms and Privacy Policy', () => {
  it('match docs/ exactly (run `npm run sync-legal` if this fails)', () => {
    expect(TERMS_MD).toBe(docText('TERMS.md'));
    expect(PRIVACY_MD).toBe(docText('PRIVACY_POLICY.md'));
  });
  it('have dated versions', () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(PRIVACY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('Terms include the zero-tolerance rule (brief §3)', () => {
    expect(TERMS_MD).toMatch(/zero tolerance/i);
  });
  it('never hide reviewer notes in the app', () => {
    expect(TERMS_MD).not.toMatch(/<!--|DRAFT/);
    expect(PRIVACY_MD).not.toMatch(/<!--|DRAFT/);
  });
});

describe('brief hard rules in shipped text', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== '__tests__') walk(path);
      } else if (/\.(ts|tsx|json|md)$/.test(name)) files.push(path);
    }
  };
  walk(join(root, 'src'));

  it('never says "tax-deductible" (501(c)(3) is pending)', () => {
    const offenders = files.filter((f) => /tax[\s-]?deductible/i.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
  it('has no placeholder text', () => {
    const offenders = files.filter((f) => /lorem ipsum/i.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('parseMarkdown', () => {
  it('reads titles, headings, bullets and paragraphs', () => {
    const blocks = parseMarkdown('# Title\n\n## One\n\nLine one\nline two\n\n- a\n- **b** c\n');
    expect(blocks.map((b) => b.kind)).toEqual(['title', 'heading', 'paragraph', 'bullet', 'bullet']);
    expect(blocks[2].spans[0].text).toBe('Line one line two');
    expect(blocks[4].spans).toEqual([{ text: 'b', bold: true }, { text: ' c', bold: undefined }]);
  });
  it('turns links and emails into tappable spans', () => {
    expect(parseInline('see [site](https://x.org) now')).toEqual([
      { text: 'see ', bold: undefined },
      { text: 'site', url: 'https://x.org' },
      { text: ' now', bold: undefined },
    ]);
    const spans = parseInline('Email hello.childrenofwarproject@gmail.com.');
    expect(spans[1]).toEqual({
      text: 'hello.childrenofwarproject@gmail.com',
      bold: undefined,
      url: 'mailto:hello.childrenofwarproject@gmail.com',
    });
  });
  it('parses the real Terms without losing text', () => {
    const blocks = parseMarkdown(TERMS_MD);
    expect(blocks[0]).toEqual({ kind: 'title', spans: [{ text: 'Terms of Use', bold: undefined }] });
    expect(blocks.filter((b) => b.kind === 'heading').length).toBeGreaterThanOrEqual(10);
  });
});
