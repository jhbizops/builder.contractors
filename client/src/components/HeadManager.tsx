import { useEffect } from "react";

type HeadManagerProps = {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  alternateLinks?: Array<{
    hrefLang: string;
    href: string;
  }>;
  siteName?: string;
  imageUrl?: string;
  twitterImageUrl?: string;
};

const DEFAULT_SITE_NAME = "Builder.Contractors";
const DEFAULT_IMAGE_URL = "https://www.builder.contractors/og-image.jpg";
const DEFAULT_TWITTER_IMAGE_URL = "https://www.builder.contractors/twitter-image.jpg";
const DEFAULT_ROBOTS_CONTENT = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

const ensureMetaTag = (selector: string, attributes: Record<string, string>) => {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    return existing;
  }

  const meta = document.createElement("meta");
  Object.entries(attributes).forEach(([key, value]) => meta.setAttribute(key, value));
  document.head.appendChild(meta);
  return meta;
};

const ensureLinkTag = (selector: string, attributes: Record<string, string>) => {
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (existing) {
    return existing;
  }

  const link = document.createElement("link");
  Object.entries(attributes).forEach(([key, value]) => link.setAttribute(key, value));
  document.head.appendChild(link);
  return link;
};

export function HeadManager({
  title,
  description,
  keywords,
  canonicalPath,
  alternateLinks,
  siteName = DEFAULT_SITE_NAME,
  imageUrl = DEFAULT_IMAGE_URL,
  twitterImageUrl = DEFAULT_TWITTER_IMAGE_URL,
}: HeadManagerProps) {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const resolvedPath = canonicalPath ?? window.location.pathname;
    const canonicalUrl = new URL(resolvedPath, baseUrl).toString();
    const keywordContent = keywords?.length ? keywords.join(", ") : undefined;
    const resolvedAlternates =
      alternateLinks?.map((alternate) => ({
        ...alternate,
        href: new URL(alternate.href, baseUrl).toString(),
      })) ?? [];

    document.title = title;

    ensureMetaTag('meta[name="title"]', { name: "title" }).setAttribute("content", title);
    ensureMetaTag('meta[name="description"]', { name: "description" }).setAttribute("content", description);
    ensureMetaTag('meta[name="robots"]', { name: "robots" }).setAttribute("content", DEFAULT_ROBOTS_CONTENT);
    ensureMetaTag('meta[name="googlebot"]', { name: "googlebot" }).setAttribute(
      "content",
      DEFAULT_ROBOTS_CONTENT,
    );
    ensureMetaTag('meta[name="bingbot"]', { name: "bingbot" }).setAttribute("content", DEFAULT_ROBOTS_CONTENT);
    ensureMetaTag('meta[property="article:publisher"]', { property: "article:publisher" }).setAttribute(
      "content",
      siteName,
    );
    if (keywordContent) {
      ensureMetaTag('meta[name="keywords"]', { name: "keywords" }).setAttribute("content", keywordContent);
    }

    ensureMetaTag('meta[property="og:type"]', { property: "og:type" }).setAttribute("content", "website");
    ensureMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }).setAttribute(
      "content",
      siteName,
    );
    ensureMetaTag('meta[property="og:title"]', { property: "og:title" }).setAttribute("content", title);
    ensureMetaTag('meta[property="og:description"]', { property: "og:description" }).setAttribute(
      "content",
      description,
    );
    ensureMetaTag('meta[property="og:url"]', { property: "og:url" }).setAttribute("content", canonicalUrl);
    ensureMetaTag('meta[property="og:image"]', { property: "og:image" }).setAttribute("content", imageUrl);

    ensureMetaTag('meta[property="twitter:card"]', { property: "twitter:card" }).setAttribute(
      "content",
      "summary_large_image",
    );
    ensureMetaTag('meta[property="twitter:title"]', { property: "twitter:title" }).setAttribute(
      "content",
      title,
    );
    ensureMetaTag('meta[property="twitter:description"]', { property: "twitter:description" }).setAttribute(
      "content",
      description,
    );
    ensureMetaTag('meta[property="twitter:url"]', { property: "twitter:url" }).setAttribute(
      "content",
      canonicalUrl,
    );
    ensureMetaTag('meta[property="twitter:image"]', { property: "twitter:image" }).setAttribute(
      "content",
      twitterImageUrl,
    );

    ensureLinkTag('link[rel="canonical"]', { rel: "canonical" }).setAttribute("href", canonicalUrl);
    ensureLinkTag('link[rel="author"]', { rel: "author" }).setAttribute("href", `${baseUrl}/about`);
    ensureLinkTag('link[rel="help"]', { rel: "help" }).setAttribute("href", `${baseUrl}/faq`);
    ensureLinkTag('link[rel="alternate"][type="text/plain"]', {
      rel: "alternate",
      type: "text/plain",
    }).setAttribute("href", `${baseUrl}/llms.txt`);

    const managedAlternates = document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="alternate"][data-managed="head-manager"]',
    );
    managedAlternates.forEach((link) => link.remove());
    resolvedAlternates.forEach((alternate) => {
      const link = ensureLinkTag(`link[rel="alternate"][hreflang="${alternate.hrefLang}"]`, {
        rel: "alternate",
        hreflang: alternate.hrefLang,
      });
      link.setAttribute("href", alternate.href);
      link.dataset.managed = "head-manager";
    });
  }, [alternateLinks, canonicalPath, description, keywords, siteName, title, imageUrl, twitterImageUrl]);

  return null;
}
