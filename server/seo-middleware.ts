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

// Generate pre-rendered HTML body content for a formulation page.
// This is injected into <div id="root"> so Google sees real content before JS loads.
// React replaces this entirely once the SPA boots — it's only for crawlers.
export async function generateFormulationPrerender(slug: string): Promise<string | null> {
  try {
    const formulation = await storage.getFormulationBySlug(slug);
    // Serve prerendered HTML for any active formulation — draft or published.
    // All active formulations are publicly accessible on the site, so Google
    // should see their content. The draft/published distinction is admin-only.
    if (!formulation || !formulation.isActive) return null;

    const e = escapeHtml;

    // Parse ingredients JSON
    let ingredientRows = "";
    try {
      const ingredients: any[] = JSON.parse(formulation.ingredients);
      ingredientRows = ingredients.map(ing =>
        `<tr><td>${e(ing.name || "")}</td><td>${e(ing.percentage || ing.amount || "")}</td><td>${e(ing.function || ing.role || "")}</td></tr>`
      ).join("");
    } catch { ingredientRows = ""; }

    // Parse instructions JSON
    let instructionHtml = "";
    try {
      const instructions: any[] = JSON.parse(formulation.instructions as string);
      instructionHtml = instructions.map((phase: any) => {
        const steps = Array.isArray(phase.steps)
          ? `<ol>${phase.steps.map((s: string) => `<li>${e(s)}</li>`).join("")}</ol>`
          : `<p>${e(String(phase.steps || ""))}</p>`;
        return `<div><h3>${e(phase.phase || phase.name || "Step")}</h3>${steps}</div>`;
      }).join("");
    } catch {
      // If it's plain text, just show it
      instructionHtml = formulation.instructions
        ? `<p>${e(String(formulation.instructions))}</p>`
        : "";
    }

    const specs: string[] = [];
    if (formulation.phLevel) specs.push(`<li><strong>pH Level:</strong> ${e(formulation.phLevel)}</li>`);
    if (formulation.shelfLife) specs.push(`<li><strong>Shelf Life:</strong> ${e(formulation.shelfLife)}</li>`);
    if (formulation.batchSize) specs.push(`<li><strong>Batch Size:</strong> ${e(formulation.batchSize)}</li>`);
    if (formulation.processingTime) specs.push(`<li><strong>Processing Time:</strong> ${e(formulation.processingTime)}</li>`);
    if (formulation.temperature) specs.push(`<li><strong>Temperature:</strong> ${e(formulation.temperature)}</li>`);
    if (formulation.storageConditions) specs.push(`<li><strong>Storage:</strong> ${e(formulation.storageConditions)}</li>`);
    if (formulation.viscosity) specs.push(`<li><strong>Viscosity:</strong> ${e(formulation.viscosity)}</li>`);
    if (formulation.certification) specs.push(`<li><strong>Certification:</strong> ${e(formulation.certification)}</li>`);

    return `<div id="ssr-content" style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; <a href="/browse">Formulations</a> &rsaquo; ${e(formulation.name)}</nav>
  <h1>${e(formulation.name)}</h1>
  <p>${e(formulation.description || "")}</p>
  ${specs.length ? `<section><h2>Technical Specifications</h2><ul>${specs.join("")}</ul></section>` : ""}
  ${ingredientRows ? `<section><h2>Ingredients</h2><table><thead><tr><th>Ingredient</th><th>Percentage</th><th>Function</th></tr></thead><tbody>${ingredientRows}</tbody></table></section>` : ""}
  ${instructionHtml ? `<section><h2>Manufacturing Process</h2>${instructionHtml}</section>` : ""}
  ${formulation.usageInstructions ? `<section><h2>Usage Instructions</h2><p>${e(formulation.usageInstructions)}</p></section>` : ""}
  <p><a href="${SITE_URL}/formulation/${e(formulation.slug || "")}">View full formulation details on AIFormulator</a></p>
</div>`;
  } catch (err) {
    console.error("Prerender generation failed:", err);
    return null;
  }
}

// Pre-render HTML for a blog post page — fetches content from DB.
export async function generateBlogPrerender(slug: string): Promise<string | null> {
  try {
    const post = await storage.getBlogPostBySlug(slug);
    if (!post || !post.isPublished) return null;
    const e = escapeHtml;
    const dateStr = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    const bodyHtml = post.content
      ? post.content.replace(/<script[\s\S]*?<\/script>/gi, "")
      : (post.excerpt ? `<p>${e(post.excerpt)}</p>` : "");
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; ${e(post.title)}</nav>
  <h1>${e(post.title)}</h1>
  ${dateStr ? `<p><time datetime="${e(String(post.publishedAt || ""))}">${dateStr}</time>${post.category ? ` &middot; ${e(post.category)}` : ""}</p>` : ""}
  ${post.excerpt ? `<p><strong>${e(post.excerpt)}</strong></p>` : ""}
  <div>${bodyHtml}</div>
  <p><a href="${SITE_URL}/blog">More articles on the AIFormulator Knowledge Hub</a></p>
</div>`;
  } catch (err) {
    console.error("Blog prerender failed:", err);
    return null;
  }
}

// Pre-render HTML for static pages — returns hardcoded content mirroring the React page.
// For the /blog listing page we also fetch recent posts from the DB.
export async function generateStaticPrerender(url: string): Promise<string | null> {
  const cleanUrl = url.split("?")[0].split("#")[0];

  if (cleanUrl === "/") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:1100px;margin:0 auto;padding:24px">
  <h1>AI Formulation Generator – Professional Chemical Formulation Software Online</h1>
  <h2>AI-Powered Formulation Solutions for Small Business</h2>
  <p>AIFormulator is an advanced AI formulation generator built for manufacturers and small businesses. Our chemical formulation AI helps you create commercial-ready product formulas with accurate ingredient percentages, cost optimization, and professional documentation — all through a powerful online formulation tool.</p>
  <section>
    <h2>Who Can Use AIFormulator</h2>
    <ul>
      <li><strong>Brand Owners</strong> – Launching private-label products with professional formulations</li>
      <li><strong>Professional Formulators</strong> – R&amp;D specialists creating new chemical formulations</li>
      <li><strong>Small Business Owners</strong> – Starting manufacturing operations affordably</li>
      <li><strong>Contract Manufacturers</strong> – OEM/ODM chemical producers needing ready formulas</li>
      <li><strong>Chemical Traders</strong> – Raw material suppliers supporting formulation projects</li>
      <li><strong>Startup Entrepreneurs</strong> – Entering the chemical products industry</li>
    </ul>
  </section>
  <section>
    <h2>Explore Formulation Categories</h2>
    <ul>
      <li><a href="/category/skincare-cosmetics">Skincare &amp; Cosmetics Formulations</a></li>
      <li><a href="/category/cleaning-products">Cleaning Products Formulations</a></li>
      <li><a href="/category/oral-care">Oral Care Formulations</a></li>
      <li><a href="/category/hair-care">Hair Care Formulations</a></li>
      <li><a href="/category/automotive">Automotive &amp; Car Care Formulations</a></li>
      <li><a href="/category/adhesives-sealants">Adhesives &amp; Sealants Formulations</a></li>
      <li><a href="/category/construction-building">Construction &amp; Building Materials</a></li>
      <li><a href="/category/baby-care">Baby Care &amp; Sensitive Skin Formulations</a></li>
    </ul>
  </section>
  <section>
    <h2>How the AI Formulation Generator Works</h2>
    <ol>
      <li><strong>Select your product category</strong> – Choose from 10+ industries</li>
      <li><strong>Define your specifications</strong> – Set pH, viscosity, batch size, and performance requirements</li>
      <li><strong>Generate your formula</strong> – The AI creates a complete ingredient list with percentages</li>
      <li><strong>Download your formulation</strong> – Get a professional PDF with manufacturing instructions</li>
    </ol>
  </section>
  <p><a href="/browse">Browse all ready-to-use formulations</a> | <a href="/blog">Read formulation guides</a> | <a href="/signup">Create a free account</a></p>
</div>`;
  }

  if (cleanUrl === "/about") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; About</nav>
  <h1>About AI Formulator</h1>
  <h2>Revolutionizing Chemical Formulation for Small Business Success</h2>
  <p>Empowering small business manufacturers with professional-grade chemical formulations and AI-powered formulation tools for creating high-quality products that compete with industry leaders.</p>
  <section>
    <h2>Our Mission</h2>
    <p>To democratize access to professional chemical formulations by empowering small manufacturers with cutting-edge AI technology, comprehensive databases, and expert knowledge. We bridge the gap between industrial-grade chemistry and accessible business solutions.</p>
  </section>
  <section>
    <h2>Our Vision</h2>
    <p>A world where innovative chemical formulations drive sustainable business growth. We envision small businesses creating market-leading products through intelligent formulation science, contributing to a safer and more sustainable future.</p>
  </section>
  <section>
    <h2>What We Offer</h2>
    <ul>
      <li><strong>137+ Ready Formulations</strong> – Professional-tested formulations across skincare, cosmetics, cleaning products, oral care, and specialized industrial applications.</li>
      <li><strong>AI-Powered Innovation</strong> – Advanced AI formulation engine with intelligent suggestions, cost optimization, and custom formulation generation based on your specifications.</li>
      <li><strong>Professional Standards</strong> – Lab-grade accuracy with comprehensive safety guidelines, regulatory compliance, and detailed manufacturing protocols.</li>
    </ul>
  </section>
  <section>
    <h2>Why Choose AI Formulator</h2>
    <h3>For Small Businesses</h3>
    <ul>
      <li>Access professional-grade formulations without expensive R&amp;D costs</li>
      <li>AI-powered optimization reduces material waste and production costs</li>
      <li>Comprehensive safety and regulatory guidance for market compliance</li>
      <li>Scale from small batches to commercial production seamlessly</li>
    </ul>
    <h3>Our Technology Edge</h3>
    <ul>
      <li>Advanced AI algorithms trained on thousands of successful formulations</li>
      <li>Real-time ingredient compatibility and stability analysis</li>
      <li>Continuous database updates with latest industry innovations</li>
      <li>Integration with supply chain data for optimal sourcing recommendations</li>
    </ul>
  </section>
  <section>
    <h2>Our Commitment to Excellence</h2>
    <p>We are dedicated to providing accurate, safe, and commercially viable formulations that drive small business success. Every formulation undergoes rigorous testing, documentation, and validation to ensure reliability, safety, and compliance with international industry standards.</p>
    <ul>
      <li>99.5% Formulation Success Rate</li>
      <li>24/7 AI-Powered Support</li>
      <li>100% Safety Compliance</li>
    </ul>
  </section>
  <p><a href="/browse">Browse formulations</a> | <a href="/faq">Read FAQs</a></p>
</div>`;
  }

  if (cleanUrl === "/faq") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; FAQ</nav>
  <h1>Frequently Asked Questions</h1>
  <p>Find answers to common questions about AI Formulator, formulations, and our services.</p>
  <section>
    <h2>What is AI Formulator?</h2>
    <p>AI Formulator is a comprehensive platform that provides small business manufacturers with access to 68+ professional chemical formulations and an AI-powered formulation wizard. We help you create high-quality products across categories like skincare, cleaning products, oral care, and more.</p>
  </section>
  <section>
    <h2>Are the formulations safe and tested?</h2>
    <p>Yes, all our formulations are professionally tested and follow industry safety standards. Each formulation includes detailed safety information, regulatory notes, and proper handling instructions. However, we recommend conducting your own testing for your specific use case and market requirements.</p>
  </section>
  <section>
    <h2>How does the AI formulation wizard work?</h2>
    <p>Our AI formulation wizard guides you through a 4-step process: selecting product type, specifying technical requirements, defining special properties, and generating custom formulations. The AI considers factors like pH levels, viscosity, cost optimization, and regulatory compliance.</p>
  </section>
  <section>
    <h2>Do I need an account to use the service?</h2>
    <p>You can browse all formulations and explore the platform freely without signing up. Authentication is only required for downloading PDF formulations, which gives you detailed manufacturing instructions, ingredient specifications, and quality protocols.</p>
  </section>
  <section>
    <h2>What categories of products do you cover?</h2>
    <p>We cover 10+ product categories including: Skincare &amp; Cosmetics, Cleaning Products, Oral Care, Hair Care, Personal Care, Industrial Chemicals, Specialty Formulations, Automotive, Adhesives &amp; Sealants, Construction Materials, and Baby Care.</p>
  </section>
  <section>
    <h2>Can I modify existing formulations?</h2>
    <p>Yes, our formulations serve as excellent starting points that you can modify for your specific needs. Each formulation includes notes on possible variations and substitutions. For complex modifications, consider using our AI wizard to create custom formulations tailored to your requirements.</p>
  </section>
  <section>
    <h2>What information is included in each formulation?</h2>
    <p>Each formulation includes: complete ingredient list with percentages, step-by-step manufacturing instructions, technical specifications (pH, viscosity, etc.), safety information, estimated costs, batch size recommendations, shelf life, regulatory notes, and target market information.</p>
  </section>
  <section>
    <h2>Can I use these formulations commercially?</h2>
    <p>Yes, all our formulations are designed for commercial use. However, you are responsible for ensuring compliance with local regulations, obtaining necessary permits, conducting required testing for your market, and following proper manufacturing practices.</p>
  </section>
  <section>
    <h2>Do you provide technical support?</h2>
    <p>Yes, we offer technical support via email. Our team includes experienced formulators who can help with questions about ingredients, processes, troubleshooting, and modifications.</p>
  </section>
  <section>
    <h2>How accurate are the cost estimations?</h2>
    <p>Cost estimations are based on current market prices for raw materials and are updated regularly. Actual costs may vary depending on your suppliers, location, purchase volumes, and market fluctuations. Use our estimates as a baseline for your budgeting and sourcing decisions.</p>
  </section>
  <p>Still have questions? <a href="mailto:support@aiformulator.net">Email us at support@aiformulator.net</a></p>
</div>`;
  }

  if (cleanUrl === "/browse") {
    let categoryLinks = "";
    try {
      const cats = await storage.getCategories();
      categoryLinks = cats.map(c =>
        `<li><a href="/category/${escapeHtml(c.slug || c.id)}">${escapeHtml(c.name)}</a>${c.description ? ` – ${escapeHtml(c.description)}` : ""}</li>`
      ).join("");
    } catch { categoryLinks = ""; }
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:1100px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Browse Formulations</nav>
  <h1>Browse Professional Chemical Formulations</h1>
  <p>Explore our full library of ready-to-manufacture chemical formulations. Each formulation includes a complete ingredient list, step-by-step manufacturing process, technical specifications, and downloadable PDF documentation.</p>
  ${categoryLinks ? `<section><h2>Formulation Categories</h2><ul>${categoryLinks}</ul></section>` : ""}
  <p><a href="/">Use the AI Formulation Generator</a> to create a custom formula for your product requirements.</p>
</div>`;
  }

  if (cleanUrl === "/collection") {
    let categoryLinks = "";
    try {
      const cats = await storage.getCategories();
      categoryLinks = cats.map(c =>
        `<li><a href="/category/${escapeHtml(c.slug || c.id)}">${escapeHtml(c.name)}</a>${c.description ? ` – ${escapeHtml(c.description)}` : ""}</li>`
      ).join("");
    } catch { categoryLinks = ""; }
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:1100px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Collections</nav>
  <h1>Chemical Formulation Collections by Category</h1>
  <p>Browse professional chemical formulation collections organized by product category. Each collection contains multiple tested formulations with full manufacturing documentation for commercial production.</p>
  ${categoryLinks ? `<section><h2>Browse by Category</h2><ul>${categoryLinks}</ul></section>` : ""}
  <p><a href="/browse">View all formulations</a> | <a href="/">Generate a custom formula with AI</a></p>
</div>`;
  }

  if (cleanUrl === "/blog") {
    let postLinks = "";
    try {
      const posts = await storage.getBlogPosts();
      const published = posts.filter((p: any) => p.isPublished || p.status === "published").slice(0, 20);
      postLinks = published.map((p: any) =>
        `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a>${p.excerpt ? ` – ${escapeHtml(p.excerpt)}` : ""}</li>`
      ).join("");
    } catch { postLinks = ""; }
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:1000px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Knowledge Hub</nav>
  <h1>Chemical Formulation Knowledge Hub</h1>
  <p>Expert guides, how-to articles, and industry insights for chemical formulators. Learn about ingredients, manufacturing processes, quality control, and product development for skincare, cleaning products, and more.</p>
  ${postLinks ? `<section><h2>Latest Articles</h2><ul>${postLinks}</ul></section>` : ""}
  <section>
    <h2>Topics We Cover</h2>
    <ul>
      <li>Skincare formulation guides and ingredient science</li>
      <li>Hair care product development and manufacturing</li>
      <li>Cleaning product formulations and safety compliance</li>
      <li>Adhesives and sealants manufacturing</li>
      <li>Industrial chemical formulation</li>
      <li>Raw ingredient sourcing and cost optimization</li>
      <li>Starting a chemical product business</li>
    </ul>
  </section>
  <p><a href="/browse">Browse ready-to-use formulations</a> | <a href="/">Try the AI formula generator</a></p>
</div>`;
  }

  if (cleanUrl === "/terms-of-service") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Terms &amp; Conditions</nav>
  <h1>Terms &amp; Conditions</h1>
  <p>Please read these terms and conditions carefully before using AI Formulator services. Effective Date: January 15, 2025.</p>
  <section>
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using AI Formulator ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
  </section>
  <section>
    <h2>2. Service Description</h2>
    <p>AI Formulator provides artificial intelligence-powered chemical formulation recommendations and access to a database of professional formulations. Our service is designed to assist small business manufacturers in developing chemical products across various categories including skincare, cleaning products, and personal care items.</p>
  </section>
  <section>
    <h2>3. AI-Generated Content Disclaimer</h2>
    <p>Formulations generated by our AI system are based on available data and algorithms. AI-generated formulations may contain errors or inaccuracies, should be thoroughly tested before commercial use, require professional verification for safety and compliance, and are not guaranteed to work as intended for all applications.</p>
  </section>
  <section>
    <h2>4. User Responsibilities</h2>
    <p>As a user of AI Formulator, you agree to use formulations at your own risk and responsibility, conduct proper testing before commercial production, comply with all local, state, and federal regulations, obtain necessary permits and certifications, and use the service only for lawful purposes.</p>
  </section>
  <section>
    <h2>5. Intellectual Property</h2>
    <p>All content, formulations, and materials provided through AI Formulator are for informational purposes. While you may use the formulations for commercial purposes, the underlying technology, algorithms, and database remain the intellectual property of AI Formulator.</p>
  </section>
  <section>
    <h2>6. Limitation of Liability</h2>
    <p>AI Formulator shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our service, including product defects, regulatory non-compliance, business losses, or personal injury.</p>
  </section>
  <section>
    <h2>7. Professional Consultation</h2>
    <p>AI Formulator does not provide professional chemical engineering, regulatory, or safety advice. Users should consult with qualified professionals before implementing any formulations, especially for products intended for human use or commercial sale.</p>
  </section>
  <section>
    <h2>8. Account and Authentication</h2>
    <p>While browsing is free, access to PDF downloads requires authentication. You are responsible for maintaining the security of your account credentials. Unauthorized sharing of account access is prohibited.</p>
  </section>
  <section>
    <h2>9. Governing Law</h2>
    <p>These terms shall be governed by and construed in accordance with the laws of the State of California, United States. For questions about these Terms &amp; Conditions, please contact us at legal@aiformulator.net.</p>
  </section>
  <p><a href="/privacy-policy">Privacy Policy</a> | <a href="/disclaimer">Disclaimer</a></p>
</div>`;
  }

  if (cleanUrl === "/privacy-policy") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Privacy Policy</nav>
  <h1>Privacy Policy</h1>
  <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information. Effective Date: January 15, 2025.</p>
  <section>
    <h2>1. Information We Collect</h2>
    <p>When you authenticate to download PDFs, we collect your email address, name, profile image URL, and unique user identifier. We also automatically collect usage data including pages visited, formulations viewed and downloaded, AI wizard usage, search queries, device information, and general location data.</p>
  </section>
  <section>
    <h2>2. How We Use Your Information</h2>
    <p>We use collected information to provide AI formulation recommendations, improve AI performance through anonymized training data, provide personalized recommendations, analyze usage patterns, send service updates, and meet legal compliance requirements.</p>
  </section>
  <section>
    <h2>3. Information Sharing</h2>
    <p>We do not sell your personal information. We may share information only with service providers that help us operate (hosting, analytics, authentication), when required by law, in connection with a business transfer, or when you explicitly authorize sharing.</p>
  </section>
  <section>
    <h2>4. Data Security</h2>
    <p>We implement appropriate security measures to protect your information including encrypted data transmission (HTTPS/TLS), secure database storage with access controls, regular security audits, limited employee access on a need-to-know basis, and session management and authentication security.</p>
  </section>
  <section>
    <h2>5. Your Rights</h2>
    <p>You have the right to access, correct, or delete your personal information. You may also opt out of non-essential data collection and request data portability. To exercise these rights, contact us at privacy@aiformulator.net.</p>
  </section>
  <section>
    <h2>6. Cookies and Tracking</h2>
    <p>We use essential cookies for authentication and session management, and analytics cookies (such as Google Analytics) to understand how users interact with our platform. You can control cookie preferences in your browser settings.</p>
  </section>
  <section>
    <h2>7. Contact</h2>
    <p>For privacy questions or data requests, contact us at privacy@aiformulator.net.</p>
  </section>
  <p><a href="/terms-of-service">Terms of Service</a> | <a href="/disclaimer">Disclaimer</a></p>
</div>`;
  }

  if (cleanUrl === "/disclaimer") {
    return `<div id="ssr-content" style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; Disclaimer</nav>
  <h1>Disclaimer of Use</h1>
  <p>Important disclaimers regarding the use of AI Formulator and chemical formulations. Effective Date: January 15, 2025.</p>
  <section>
    <h2>Critical Safety Notice</h2>
    <p>Chemical formulations can be dangerous if improperly handled or prepared. Always consult with qualified professionals, conduct proper testing, and follow all safety protocols before manufacturing any products.</p>
  </section>
  <section>
    <h2>1. General Disclaimer</h2>
    <p>The information provided by AI Formulator is for educational and informational purposes only. While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind about the completeness, accuracy, reliability, suitability, or availability of the formulations or related information.</p>
  </section>
  <section>
    <h2>2. AI-Generated Content Limitations</h2>
    <p>AI-generated formulations are suggestions, not guaranteed solutions. Algorithms may produce errors, inconsistencies, or inappropriate recommendations. AI cannot account for all variables in real-world manufacturing conditions. Generated formulations require human expertise for validation and safety assessment. AI recommendations should never replace professional chemical engineering consultation.</p>
  </section>
  <section>
    <h2>3. Safety and Testing Requirements</h2>
    <p>Before using any formulation you must conduct comprehensive safety testing, verify chemical compatibility and stability, test for skin sensitivity and toxicity where applicable, ensure proper ventilation and safety equipment during preparation, and follow all Material Safety Data Sheet (MSDS) guidelines for all ingredients.</p>
  </section>
  <section>
    <h2>4. Regulatory Compliance</h2>
    <p>You are solely responsible for ensuring compliance with all applicable regulations including FDA regulations for cosmetics and personal care products, EPA requirements for cleaning products and industrial chemicals, OSHA workplace safety standards, local and state manufacturing regulations, and international standards for exported products.</p>
  </section>
  <section>
    <h2>5. Professional Consultation Required</h2>
    <p>AI Formulator is not a substitute for professional advice. You must consult with qualified chemical engineers for formulation validation, regulatory experts for compliance and approval, safety specialists for risk assessment, quality control professionals for testing, and legal counsel for liability matters.</p>
  </section>
  <section>
    <h2>6. No Warranty or Guarantee</h2>
    <p>AI Formulator provides all content "as is" without warranty of any kind. We specifically disclaim fitness for any particular purpose, accuracy or completeness of formulations, safety or efficacy of suggested formulations, and compliance with regulatory requirements.</p>
  </section>
  <p><a href="/terms-of-service">Terms of Service</a> | <a href="/privacy-policy">Privacy Policy</a></p>
</div>`;
  }

  return null;
}

// Pre-render HTML for /category/:slug pages.
// Fetches the category and its published formulations so Googlebot sees real content.
export async function generateCategoryPrerender(slug: string): Promise<string | null> {
  try {
    const e = escapeHtml;
    const category = await storage.getCategoryBySlug(slug);
    if (!category) return null;

    const formulations = await storage.getFormulationsByCategory(String(category.id));
    const published = formulations.filter(f => f.status === "published" && f.isActive);

    const formulationLinks = published
      .slice(0, 30)
      .map(f =>
        `<li><a href="/formulation/${e(f.slug || String(f.id))}">${e(f.name)}</a></li>`
      )
      .join("\n      ");

    return `<div id="ssr-content" style="font-family:sans-serif;max-width:1100px;margin:0 auto;padding:24px">
  <nav><a href="/">Home</a> &rsaquo; <a href="/collection">Collections</a> &rsaquo; ${e(category.name)}</nav>
  <h1>${e(category.name)}</h1>
  ${category.description ? `<p>${e(category.description)}</p>` : ""}
  <section>
    <h2>Professional Formulations in This Category</h2>
    <p>Browse ${published.length} professional chemical formulation${published.length !== 1 ? "s" : ""} in the ${e(category.name)} category. Each formulation includes full ingredient lists, manufacturing instructions, and technical specifications.</p>
    ${formulationLinks ? `<ul>${formulationLinks}</ul>` : ""}
  </section>
  <section>
    <h2>What You Get With Each Formula</h2>
    <ul>
      <li>Complete ingredient list with exact percentages</li>
      <li>Step-by-step manufacturing process</li>
      <li>Technical specifications (pH, viscosity, shelf life)</li>
      <li>Regulatory and safety guidelines</li>
      <li>Cost optimization data</li>
      <li>Downloadable PDF documentation</li>
    </ul>
  </section>
  <p><a href="/collection">Browse all categories</a> | <a href="/browse">Search all formulations</a> | <a href="/signup">Get full access</a></p>
</div>`;
  } catch (err) {
    console.error("Category prerender failed:", err);
    return null;
  }
}

export async function getSeoMetaForUrl(url: string): Promise<SeoMeta | null> {
  const cleanUrl = url.split("?")[0].split("#")[0];

  const formulationMatch = cleanUrl.match(/^\/formulation\/(.+)$/);
  if (formulationMatch) {
    const slugOrId = formulationMatch[1];
    try {
      const formulation = await storage.getFormulationBySlug(slugOrId);
      if (formulation) {
        // Use seoTitle only when it actually relates to the formulation name
        // (shares at least one meaningful word with 4+ chars). If the seoTitle
        // is from a different product (admin data-entry error), fall back to name
        // to avoid title/content mismatch which Google flags as a spam signal.
        const seoTitleIsRelated = formulation.seoTitle
          ? (formulation.name.toLowerCase().match(/[a-z]{4,}/g) || []).some(
              word => formulation.seoTitle!.toLowerCase().includes(word)
            )
          : false;
        const title = (formulation.seoTitle && seoTitleIsRelated)
          ? formulation.seoTitle
          : formulation.name;
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
          // Only mark inactive (hidden) formulations as noindex.
          // Active formulations are publicly accessible regardless of draft/published
          // status — all 337 production formulations are currently draft, so treating
          // "draft + active" as noindex would prevent Google from ever indexing them.
          noindex: !formulation.isActive,
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
