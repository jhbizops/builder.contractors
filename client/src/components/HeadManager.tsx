import { useEffect } from "react";

type HeadManagerProps = {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  siteName?: string;
  imageUrl?: string;
  twitterImageUrl?: string;
};

const DEFAULT_SITE_NAME = "Builder.Contractors";
const DEFAULT_IMAGE_URL = "https://www.builder.contractors/og-image.jpg";
const DEFAULT_TWITTER_IMAGE_URL = "https://www.builder.contractors/twitter-image.jpg";

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
  siteName = DEFAULT_SITE_NAME,
  imageUrl = DEFAULT_IMAGE_URL,
  twitterImageUrl = DEFAULT_TWITTER_IMAGE_URL,
}: HeadManagerProps) {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const resolvedPath = canonicalPath ?? window.location.pathname;
    const canonicalUrl = new URL(resolvedPath, baseUrl).toString();
    const keywordContent = keywords?.length ? keywords.join(", ") : undefined;

    document.title = title;

    ensureMetaTag('meta[name="title"]', { name: "title" }).setAttribute("content", title);
    ensureMetaTag('meta[name="description"]', { name: "description" }).setAttribute("content", description);
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
  }, [canonicalPath, description, keywords, siteName, title, imageUrl, twitterImageUrl]);

  return null;
}
