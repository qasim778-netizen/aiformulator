import { Beaker, ShieldCheck, Package, Wrench, FlaskConical, Palette, Car, Droplets, TestTube, Layers, Star, ExternalLink, LucideIcon } from "lucide-react";
import avatarExpert from "../assets/avatars/avatar-expert.png";
import avatarTester from "../assets/avatars/avatar-tester.png";
import avatarDesigner from "../assets/avatars/avatar-designer.png";

// ── Card types ────────────────────────────────────────────────────────────────
interface SupportCard {
  headerLabel: string;
  Icon: LucideIcon;
  photo: string;
  photoAlt: string;
  ctaLabel: string;
  ctaHref: string;
  color: {
    header: string;
    border: string;
    button: string;
    buttonHover: string;
  };
}

// ── Per-card color presets ────────────────────────────────────────────────────
const PINK = {
  header: "bg-pink-500",
  border: "border-pink-400",
  button: "bg-pink-500",
  buttonHover: "hover:bg-pink-600",
};
const PURPLE = {
  header: "bg-purple-700",
  border: "border-purple-500",
  button: "bg-purple-700",
  buttonHover: "hover:bg-purple-800",
};
const ORANGE = {
  header: "bg-orange-500",
  border: "border-orange-400",
  button: "bg-orange-500",
  buttonHover: "hover:bg-orange-600",
};

// ── Single card ───────────────────────────────────────────────────────────────
function SupportCardItem({ card }: { card: SupportCard }) {
  const { Icon } = card;
  return (
    <div className={`rounded-2xl border-2 ${card.color.border} overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200`}>
      {/* Colored header bar */}
      <div className={`${card.color.header} px-4 py-3 flex items-center gap-2`}>
        <Icon className="h-4 w-4 text-white opacity-90 flex-shrink-0" />
        <span className="text-white text-xs font-bold uppercase tracking-wider leading-tight">
          {card.headerLabel}
        </span>
      </div>

      {/* Portrait photo */}
      <div className="w-full overflow-hidden bg-gray-100 flex-1">
        <img
          src={card.photo}
          alt={card.photoAlt}
          className="w-full h-64 object-cover object-top"
        />
      </div>

      {/* CTA button */}
      <a
        href={card.ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${card.color.button} ${card.color.buttonHover} text-white text-sm font-semibold text-center py-3.5 px-4 flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer`}
      >
        <ExternalLink className="h-4 w-4 opacity-80" />
        {card.ctaLabel}
      </a>
    </div>
  );
}

// ── Card factory ──────────────────────────────────────────────────────────────
const FIVERR = "https://www.fiverr.com/search/gigs?query=";

function makeCards(
  label1: string, cta1: string, href1: string, Icon1: LucideIcon,
  label2: string, cta2: string, href2: string, Icon2: LucideIcon,
  label3: string, cta3: string, href3: string, Icon3: LucideIcon,
): SupportCard[] {
  return [
    { headerLabel: label1, Icon: Icon1, photo: avatarExpert,   photoAlt: label1, ctaLabel: cta1, ctaHref: href1, color: PINK   },
    { headerLabel: label2, Icon: Icon2, photo: avatarTester,   photoAlt: label2, ctaLabel: cta2, ctaHref: href2, color: PURPLE },
    { headerLabel: label3, Icon: Icon3, photo: avatarDesigner, photoAlt: label3, ctaLabel: cta3, ctaHref: href3, color: ORANGE },
  ];
}

// ── Card datasets ─────────────────────────────────────────────────────────────
const COSMETIC_CARDS = makeCards(
  "Cosmetic Formulation Expert",     "Find Cosmetic Experts",    `${FIVERR}cosmetic+formulation+expert`,           FlaskConical,
  "Stability & Testing Specialist",  "Find QA Specialists",      `${FIVERR}product+stability+testing+specialist`,  ShieldCheck,
  "Branding & Packaging Consultant", "Find Branding Experts",    `${FIVERR}brand+packaging+designer`,              Package,
);

const CLEANING_CARDS = makeCards(
  "Industrial Cleaner Expert",       "Find Formulation Experts", `${FIVERR}industrial+cleaning+formulation+expert`, Beaker,
  "Quality Control Specialist",      "Find QC Specialists",      `${FIVERR}product+quality+control+specialist`,     ShieldCheck,
  "Packaging & Label Consultant",    "Find Packaging Experts",   `${FIVERR}product+packaging+label+designer`,       Package,
);

const AUTOMOTIVE_CARDS = makeCards(
  "Automotive Product Expert",       "Find Automotive Experts",  `${FIVERR}automotive+product+formulation+expert`,  Car,
  "Performance Testing Expert",      "Find Testing Experts",     `${FIVERR}automotive+product+testing+specialist`,  Wrench,
  "Launch & Packaging Consultant",   "Find Launch Experts",      `${FIVERR}product+launch+packaging+consultant`,    Package,
);

const COATINGS_CARDS = makeCards(
  "Adhesives & Coatings Expert",     "Find Coatings Experts",    `${FIVERR}adhesives+coatings+formulation+expert`,  Droplets,
  "Process Optimization Expert",     "Find Process Experts",     `${FIVERR}chemical+process+optimization+specialist`, Wrench,
  "Product Positioning Consultant",  "Find Brand Consultants",   `${FIVERR}product+brand+positioning+consultant`,   Layers,
);

const DEFAULT_CARDS = makeCards(
  "Product Formulation Expert",      "Find Formulation Experts", `${FIVERR}product+formulation+expert`,             Beaker,
  "QC & Stability Specialist",       "Find QC Specialists",      `${FIVERR}quality+control+product+testing`,        ShieldCheck,
  "Branding & Packaging Consultant", "Find Branding Experts",    `${FIVERR}brand+packaging+designer`,               Package,
);

function getCards(slug: string): SupportCard[] {
  if (/cleaning|household|industrial|degreaser|detergent/.test(slug)) return CLEANING_CARDS;
  if (/skin|beauty|cosmetic|hair|personal|oral|baby|grooming|organic|mens|salon/.test(slug)) return COSMETIC_CARDS;
  if (/automotive|car/.test(slug)) return AUTOMOTIVE_CARDS;
  if (/adhesive|coating|paint|3d.print|building|construct|textile/.test(slug)) return COATINGS_CARDS;
  return DEFAULT_CARDS;
}

// ── Shared section layout ─────────────────────────────────────────────────────
function SupportSection({ heading, cards }: { heading: string; cards: SupportCard[] }) {
  const words = heading.split(" ");
  const hi = words.findIndex((w) => w === "Professional");

  return (
    <section aria-label="Formulation expert support">
      {/* Badge */}
      <div className="flex justify-center mb-5">
        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow">
          <Star className="h-3.5 w-3.5 fill-white" />
          Expert Support
        </span>
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {hi >= 0 ? (
            <>
              {words.slice(0, hi).join(" ")}{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {words.slice(hi, hi + 2).join(" ")}
              </span>{" "}
              {words.slice(hi + 2).join(" ")}
            </>
          ) : heading}
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
          Connect with <strong className="text-gray-700 font-semibold">verified</strong> experts who can refine your formula,
          ensure quality, and help you launch successfully.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {cards.map((card, i) => (
          <SupportCardItem key={i} card={card} />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-3">Trusted professionals ready to help you succeed</p>
        <a
          href="https://www.fiverr.com/categories/programming-tech/chemistry-formulation"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm px-7 py-3.5 rounded-full shadow-md transition-colors duration-150"
        >
          <Star className="h-4 w-4 fill-white opacity-90" />
          Explore All Experts on Fiverr
          <span className="text-gray-400 text-base ml-1">›</span>
        </a>
      </div>
    </section>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────
export function FormulationSupportAll() {
  return (
    <SupportSection
      heading="Need Professional Help With This Formula?"
      cards={COSMETIC_CARDS}
    />
  );
}

interface Props {
  categorySlug?: string;
}

export default function FormulationSupport({ categorySlug = "" }: Props) {
  const slug = categorySlug.toLowerCase();
  return (
    <div className="mt-12 mb-2">
      <SupportSection
        heading="Need Professional Help With This Formula?"
        cards={getCards(slug)}
      />
    </div>
  );
}
