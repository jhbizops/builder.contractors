import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { HeadManager } from '@/components/HeadManager';

const getMeta = (selector: string) => document.head.querySelector<HTMLMetaElement>(selector);

describe('HeadManager', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    window.history.pushState({}, '', '/');
  });

  it('sets title, canonical, and meta tags from props', async () => {
    window.history.pushState({}, '', '/about');

    render(
      <HeadManager
        title="About Builder.Contractors"
        description="About page description."
        keywords={['builders', 'contractors']}
        canonicalPath="/about"
        alternateLinks={[
          { hrefLang: 'x-default', href: '/about' },
          { hrefLang: 'en-US', href: '/us/about' },
        ]}
      />,
    );

    await waitFor(() => {
      expect(document.title).toBe('About Builder.Contractors');
    });

    const canonicalUrl = `${window.location.origin}/about`;

    expect(getMeta('meta[name="description"]')?.content).toBe('About page description.');
    expect(getMeta('meta[name="robots"]')?.content).toContain('index,follow');
    expect(getMeta('meta[name="googlebot"]')?.content).toContain('max-image-preview:large');
    expect(getMeta('meta[name="bingbot"]')?.content).toContain('max-snippet:-1');
    expect(getMeta('meta[name="keywords"]')?.content).toBe('builders, contractors');
    expect(getMeta('meta[property="og:title"]')?.content).toBe('About Builder.Contractors');
    expect(getMeta('meta[property="og:description"]')?.content).toBe('About page description.');
    expect(getMeta('meta[property="og:url"]')?.content).toBe(canonicalUrl);
    expect(getMeta('meta[property="twitter:title"]')?.content).toBe('About Builder.Contractors');
    expect(getMeta('meta[property="twitter:description"]')?.content).toBe('About page description.');
    expect(getMeta('meta[property="twitter:url"]')?.content).toBe(canonicalUrl);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      canonicalUrl,
    );
    expect(document.head.querySelector('link[rel="alternate"][type="text/plain"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/llms.txt`,
    );
    expect(document.head.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/llms-full.txt`,
    );
    expect(document.head.querySelector('link[rel="sitemap"][title="Primary sitemap"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/sitemap.xml`,
    );
    expect(document.head.querySelector('link[rel="sitemap"][data-variant="ai"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/sitemap-ai.xml`,
    );
    expect(document.head.querySelector('link[rel="alternate"][hreflang="x-default"]')?.getAttribute('href')).toBe(
      canonicalUrl,
    );
    expect(document.head.querySelector('link[rel="alternate"][hreflang="en-US"]')?.getAttribute('href')).toBe(
      `${window.location.origin}/us/about`,
    );
  });

  it('skips keyword tag creation when keywords are omitted', async () => {
    render(<HeadManager title="Home" description="Home summary." />);

    await waitFor(() => {
      expect(document.title).toBe('Home');
    });

    expect(getMeta('meta[name="keywords"]')).toBeNull();
  });
});
