import { storage } from "./storage";

interface SeoMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

const SITE_NAME = "AIFormulator";
const SITE_URL = "https://aiformulator.net";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function getSeoMetaForUrl(url: string): Promise<SeoMeta | null> {
  const cleanUrl = url.split("?")[0].split("#")[0];

  const formulationMatch = cleanUrl.match(/^\/formulation\/(.+)$/);
  if (formulationMatch) {
    const slugOrId = formulationMatch[1];
    try {
      const formulation = await storage.getFormulationBySlug(slugOrId);
      if (formulation) {
        const title = formulation.seoTitle || formulation.name;
        const description =
          formulation.metaDescription ||
          `Professional ${formulation.name} formulation with complete manufacturing guide, ingredients list, and technical specifications.`;

        return {
          title: title.length > 60 ? title.substring(0, 57) + "..." : title,
          description:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogTitle: title.length > 60 ? title.substring(0, 57) + "..." : title,
          ogDescription:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogType: "article",
          canonicalUrl: `${SITE_URL}/formulation/${formulation.slug}`,
          noindex: formulation.status !== "published" || !formulation.isActive,
        };
      }
    } catch (e) {
      console.error("SSR meta lookup failed for formulation:", e);
    }
  }

  const categoryMatch = cleanUrl.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    const slugOrId = categoryMatch[1];
    try {
      const categories = await storage.getCategories();
      const category = categories.find(
        (c) => c.slug === slugOrId || c.id === slugOrId
      );
      if (category) {
        const title =
          category.seoTitle || `${category.name} | ${SITE_NAME}`;
        const description =
          category.metaDescription ||
          `Browse professional ${category.name.toLowerCase()} formulations. Complete manufacturing guides with ingredients and instructions.`;

        return {
          title: title.length > 60 ? title.substring(0, 57) + "..." : title,
          description:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogTitle: title.length > 60 ? title.substring(0, 57) + "..." : title,
          ogDescription:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogType: "website",
          canonicalUrl: `${SITE_URL}/category/${category.slug}`,
        };
      }
    } catch (e) {
      console.error("SSR meta lookup failed for category:", e);
    }
  }

  const blogMatch = cleanUrl.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (post) {
        const title = post.metaTitle || post.title;
        const description =
          post.metaDescription ||
          post.excerpt ||
          `Read ${post.title} on ${SITE_NAME}`;

        return {
          title: title.length > 60 ? title.substring(0, 57) + "..." : title,
          description:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogTitle: title.length > 60 ? title.substring(0, 57) + "..." : title,
          ogDescription:
            description.length > 160
              ? description.substring(0, 157) + "..."
              : description,
          ogType: "article",
          canonicalUrl: `${SITE_URL}/blog/${post.slug}`,
        };
      }
    } catch (e) {
      console.error("SSR meta lookup failed for blog:", e);
    }
  }

  return null;
}

export function injectSeoMeta(html: string, meta: SeoMeta): string {
  const escapedTitle = escapeHtml(meta.title);
  const escapedDesc = escapeHtml(meta.description);
  const escapedOgTitle = escapeHtml(meta.ogTitle);
  const escapedOgDesc = escapeHtml(meta.ogDescription);

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapedTitle}</title>`
  );

  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapedDesc}" />`
  );

  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapedOgTitle}" />`
  );

  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapedOgDesc}" />`
  );

  html = html.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="${meta.ogType}" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapedOgTitle}" />`
  );

  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapedOgDesc}" />`
  );

  if (meta.canonicalUrl) {
    const canonicalTag = `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`;
    if (html.includes('<link rel="canonical"')) {
      html = html.replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/,
        canonicalTag
      );
    } else {
      html = html.replace("</head>", `  ${canonicalTag}\n  </head>`);
    }
  }

  if (meta.noindex) {
    const noindexTag = `<meta name="robots" content="noindex, nofollow" />`;
    if (!html.includes('name="robots"')) {
      html = html.replace("</head>", `  ${noindexTag}\n  </head>`);
    }
  }

  return html;
}
