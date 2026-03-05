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

  // Static pages — fixed canonical + unique title/description per page
  const staticPages: Record<string, SeoMeta> = {
    "/": {
      title: "AI Formulation Generator | Online Chemical Formulation Software",
      description: "AI formulation generator for industrial and commercial products. Create custom chemical formulas instantly or browse 50+ professional product formulations with cost optimization.",
      ogTitle: "AI Formulation Generator | Online Chemical Formulation Software",
      ogDescription: "Create custom chemical formulas instantly or browse 50+ professional product formulations with cost optimization and technical documentation.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/`,
    },
    "/browse": {
      title: "Browse Chemical Formulations | AIFormulator",
      description: "Browse our full library of professional chemical formulations across skincare, cleaning, automotive, construction, and more. Download ready-to-manufacture formulas.",
      ogTitle: "Browse Chemical Formulations | AIFormulator",
      ogDescription: "Browse our full library of professional chemical formulations across skincare, cleaning, automotive, construction, and more.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/browse`,
    },
    "/collection": {
      title: "Chemical Formulation Collections by Category | AIFormulator",
      description: "Browse professional chemical formulation collections organized by product category. Find formulations for skincare, cleaning products, automotive, and more.",
      ogTitle: "Chemical Formulation Collections by Category | AIFormulator",
      ogDescription: "Browse professional chemical formulation collections organized by product category.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/collection`,
    },
    "/blog": {
      title: "Chemical Formulation Knowledge Hub | AIFormulator Blog",
      description: "Expert guides, how-to articles, and industry insights for chemical formulators. Learn about ingredients, manufacturing processes, and product development.",
      ogTitle: "Chemical Formulation Knowledge Hub | AIFormulator Blog",
      ogDescription: "Expert guides and how-to articles for chemical formulators on ingredients, manufacturing, and product development.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/blog`,
    },
    "/about": {
      title: "About AIFormulator | AI-Powered Chemical Formulation Platform",
      description: "Learn about AIFormulator — the AI-powered platform helping small business manufacturers create professional chemical formulations for skincare, cleaning products, and more.",
      ogTitle: "About AIFormulator | AI-Powered Chemical Formulation Platform",
      ogDescription: "AIFormulator helps small business manufacturers create professional chemical formulations using AI.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/about`,
    },
    "/faq": {
      title: "Frequently Asked Questions | AIFormulator",
      description: "Get answers to common questions about AIFormulator — chemical formulation downloads, customization, manufacturing support, and subscription plans.",
      ogTitle: "Frequently Asked Questions | AIFormulator",
      ogDescription: "Get answers to common questions about chemical formulation downloads, customization, and subscription plans.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/faq`,
    },
    "/demo": {
      title: "Try the AI Formulation Generator Demo | AIFormulator",
      description: "See how AIFormulator works. Generate a professional chemical formulation in seconds with our AI-powered demo — no signup required.",
      ogTitle: "Try the AI Formulation Generator Demo | AIFormulator",
      ogDescription: "Generate a professional chemical formulation in seconds with our AI-powered demo — no signup required.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/demo`,
    },
    "/terms-of-service": {
      title: "Terms of Service | AIFormulator",
      description: "Read AIFormulator's Terms of Service covering usage rights, intellectual property, and platform policies for chemical formulation software.",
      ogTitle: "Terms of Service | AIFormulator",
      ogDescription: "Terms of Service for AIFormulator — usage rights, intellectual property, and platform policies.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/terms-of-service`,
    },
    "/privacy-policy": {
      title: "Privacy Policy | AIFormulator",
      description: "Read AIFormulator's Privacy Policy to understand how we collect, use, and protect your personal data on our chemical formulation platform.",
      ogTitle: "Privacy Policy | AIFormulator",
      ogDescription: "How AIFormulator collects, uses, and protects your personal data.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/privacy-policy`,
    },
    "/disclaimer": {
      title: "Disclaimer | AIFormulator",
      description: "Read the AIFormulator disclaimer regarding formulation accuracy, professional use guidelines, and liability limitations for chemical formulation content.",
      ogTitle: "Disclaimer | AIFormulator",
      ogDescription: "Disclaimer regarding formulation accuracy, professional use, and liability for AIFormulator content.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/disclaimer`,
    },
    "/signup": {
      title: "Create Your Account | AIFormulator",
      description: "Sign up for AIFormulator and access professional chemical formulations, AI-powered formula generation, and manufacturing guides.",
      ogTitle: "Create Your Account | AIFormulator",
      ogDescription: "Sign up for AIFormulator and access professional chemical formulations and AI formula generation.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/signup`,
      noindex: true,
    },
    "/login": {
      title: "Sign In | AIFormulator",
      description: "Sign in to your AIFormulator account to access your chemical formulations, downloads, and account settings.",
      ogTitle: "Sign In | AIFormulator",
      ogDescription: "Sign in to access your AIFormulator account.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/login`,
      noindex: true,
    },
    "/forgot-password": {
      title: "Reset Password | AIFormulator",
      description: "Reset your AIFormulator account password.",
      ogTitle: "Reset Password | AIFormulator",
      ogDescription: "Reset your AIFormulator account password.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/forgot-password`,
      noindex: true,
    },
    "/reset-password": {
      title: "Set New Password | AIFormulator",
      description: "Set a new password for your AIFormulator account.",
      ogTitle: "Set New Password | AIFormulator",
      ogDescription: "Set a new password for your AIFormulator account.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/reset-password`,
      noindex: true,
    },
    "/my-account": {
      title: "My Account | AIFormulator",
      description: "Manage your AIFormulator account, view downloaded formulations, and update your profile settings.",
      ogTitle: "My Account | AIFormulator",
      ogDescription: "Manage your AIFormulator account and downloaded formulations.",
      ogType: "website",
      canonicalUrl: `${SITE_URL}/my-account`,
      noindex: true,
    },
  };

  if (staticPages[cleanUrl]) {
    return staticPages[cleanUrl];
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
