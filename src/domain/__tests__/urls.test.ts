import * as config from '@/config';
import { isUsableUrl, visibleLinks } from '@/domain/urls';

describe('isUsableUrl', () => {
  it.each(['', '   ', undefined, null, 'childrenofwarproject.org', 'javascript:alert(1)', 'https://', 'ftp://x.org'])(
    'rejects %p',
    (u) => expect(isUsableUrl(u)).toBe(false),
  );
  it.each(['https://childrenofwarproject.org', 'https://childrenofwarproject.org/#ambassador', 'http://a.b/c'])(
    'accepts %p',
    (u) => expect(isUsableUrl(u)).toBe(true),
  );
});

describe('visibleLinks', () => {
  it('hides blank links', () => {
    expect(visibleLinks([{ url: '' }, { url: 'https://youtube.com/x' }])).toEqual([{ url: 'https://youtube.com/x' }]);
  });
});

describe('config', () => {
  it('has the brief’s fixed values', () => {
    expect(config.CONTACT_EMAIL).toBe('hello.childrenofwarproject@gmail.com');
    expect(isUsableUrl(config.WEBSITE_URL)).toBe(true);
    expect(isUsableUrl(config.CONTENT_URL)).toBe(true);
    expect(isUsableUrl(config.YOUTUBE_URL)).toBe(true);
    expect(isUsableUrl(config.JOIN_URL)).toBe(true);
    expect(config.IOS_BUNDLE_ID).toBe('org.childrenofwarproject.app');
  });
  it('every URL is either blank (hidden) or usable', () => {
    for (const u of [config.DONATE_URL, config.PRIVACY_POLICY_URL, config.TERMS_URL, ...config.SOCIAL_URLS.map((s) => s.url)]) {
      expect(u === '' || isUsableUrl(u)).toBe(true);
    }
  });
});
