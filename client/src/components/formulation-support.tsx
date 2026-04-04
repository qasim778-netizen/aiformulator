import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Beaker, ShieldCheck, Package, Wrench, FlaskConical, Palette, Car, Droplets, TestTube, Layers } from "lucide-react";

// ── Avatar URLs (DiceBear illustrated characters, consistent seeds) ──────────
// personas style = full illustrated character with body — 3 distinct professional roles
const AVATAR_URLS: Record<string, string> = {
  expert:   "https://api.dicebear.com/8.x/personas/svg?seed=DrSarahFormulatorLab&backgroundColor=dbeafe",
  tester:   "https://api.dicebear.com/8.x/personas/svg?seed=DrMarkQCTesterGlass&backgroundColor=dcfce7",
  designer: "https://api.dicebear.com/8.x/personas/svg?seed=AlexBrandPackagingDesign&backgroundColor=fef9c3",
};

interface SupportCard {
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  iconBg: string;
  avatarLabel: string;
  avatarType: "expert" | "tester" | "designer";
}

interface SupportRow {
  rowLabel: string;
  rowTag: string;
  tagColor: string;
  cards: SupportCard[];
}

// ── Shared card renderer ─────────────────────────────────────────────────────
function SupportCardItem({ card }: { card: SupportCard }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col min-h-[260px]">
      {/* Header row: small icon + role label */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`${card.iconBg} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
          aria-hidden="true"
        >
          {card.icon}
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {card.avatarLabel}
        </span>
      </div>

      {/* Content: text left + avatar right */}
      <div className="flex gap-3 flex-1 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-2 leading-snug text-[15px]">
            {card.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {card.description}
          </p>
        </div>

        {/* Avatar illustration */}
        <div className="w-[100px] flex-shrink-0 flex items-end justify-center self-end">
          {!imgFailed ? (
            <img
              src={AVATAR_URLS[card.avatarType]}
              alt={`Illustrated ${card.avatarLabel}`}
              className="w-full h-auto object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className={`${card.iconBg} w-16 h-16 rounded-full flex items-center justify-center`}
              aria-label={card.avatarLabel}
            >
              {card.icon}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="outline"
        className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors mt-auto"
      >
        {card.cta}
      </Button>
    </div>
  );
}

function Disclaimer() {
  return (
    <>
      <p className="text-xs text-gray-400 text-center mb-4 max-w-xl mx-auto">
        These are example support categories to help users find relevant services for formulation and launch needs.
      </p>
      <div className="text-center">
        <Button variant="secondary" className="px-8">
          Explore Expert Help
        </Button>
      </div>
    </>
  );
}

// ── Card data helpers ────────────────────────────────────────────────────────
function makeCards(
  c1: Omit<SupportCard, "avatarType">,
  c2: Omit<SupportCard, "avatarType">,
  c3: Omit<SupportCard, "avatarType">
): SupportCard[] {
  return [
    { ...c1, avatarType: "expert" },
    { ...c2, avatarType: "tester" },
    { ...c3, avatarType: "designer" },
  ];
}

const CLEANING_CARDS = makeCards(
  {
    title: "Industrial Cleaner Formulation Expert",
    description: "Guidance for ingredient adjustment, performance improvement, dilution strategy, and manufacturing suitability.",
    cta: "Consult Expert",
    icon: <Beaker className="h-4 w-4 text-white" />,
    iconBg: "bg-blue-600",
    avatarLabel: "Formulation Expert",
  },
  {
    title: "Quality Control Support",
    description: "Help with pH targets, viscosity checks, stability review, and batch consistency planning.",
    cta: "Get QC Help",
    icon: <ShieldCheck className="h-4 w-4 text-white" />,
    iconBg: "bg-teal-600",
    avatarLabel: "QC Specialist",
  },
  {
    title: "Packaging & Labeling Consultant",
    description: "Support for label direction, packaging selection, product presentation, and launch readiness.",
    cta: "Start Project",
    icon: <Package className="h-4 w-4 text-white" />,
    iconBg: "bg-orange-500",
    avatarLabel: "Packaging Consultant",
  }
);

const COSMETIC_CARDS = makeCards(
  {
    title: "Cosmetic Formulation Expert",
    description: "Support for shampoos, lotions, face wash, serums, creams, and product refinement for target users.",
    cta: "Consult Expert",
    icon: <FlaskConical className="h-4 w-4 text-white" />,
    iconBg: "bg-pink-500",
    avatarLabel: "Cosmetic Expert",
  },
  {
    title: "Stability & Testing Support",
    description: "Guidance for texture, pH balance, compatibility, and basic product stability planning.",
    cta: "Get Product Help",
    icon: <TestTube className="h-4 w-4 text-white" />,
    iconBg: "bg-purple-500",
    avatarLabel: "Stability Specialist",
  },
  {
    title: "Branding & Packaging Consultant",
    description: "Help with product presentation, packaging direction, and market-ready positioning.",
    cta: "Start Project",
    icon: <Palette className="h-4 w-4 text-white" />,
    iconBg: "bg-rose-500",
    avatarLabel: "Brand Designer",
  }
);

const AUTOMOTIVE_CARDS = makeCards(
  {
    title: "Automotive Product Expert",
    description: "Support for cleaners, polishes, dressings, compounds, and performance-focused formulation adjustment.",
    cta: "Consult Expert",
    icon: <Car className="h-4 w-4 text-white" />,
    iconBg: "bg-slate-700",
    avatarLabel: "Automotive Expert",
  },
  {
    title: "Performance Testing Support",
    description: "Guidance for gloss, cleaning strength, surface compatibility, and application performance review.",
    cta: "Get Product Help",
    icon: <Wrench className="h-4 w-4 text-white" />,
    iconBg: "bg-yellow-600",
    avatarLabel: "Performance Tester",
  },
  {
    title: "Packaging & Launch Consultant",
    description: "Help with packaging direction, label planning, and launch presentation for automotive products.",
    cta: "Start Project",
    icon: <Package className="h-4 w-4 text-white" />,
    iconBg: "bg-blue-500",
    avatarLabel: "Launch Consultant",
  }
);

const COATINGS_CARDS = makeCards(
  {
    title: "Adhesives & Coatings Expert",
    description: "Guidance for bonding performance, drying behavior, raw material adjustment, and production suitability.",
    cta: "Consult Expert",
    icon: <Droplets className="h-4 w-4 text-white" />,
    iconBg: "bg-amber-600",
    avatarLabel: "Coatings Expert",
  },
  {
    title: "Process Optimization Support",
    description: "Help with viscosity targets, application behavior, curing profile, and production consistency.",
    cta: "Get Process Help",
    icon: <Wrench className="h-4 w-4 text-white" />,
    iconBg: "bg-gray-600",
    avatarLabel: "Process Specialist",
  },
  {
    title: "Product Positioning Consultant",
    description: "Support for packaging direction, use-case messaging, and launch preparation.",
    cta: "Start Project",
    icon: <Layers className="h-4 w-4 text-white" />,
    iconBg: "bg-teal-500",
    avatarLabel: "Brand Designer",
  }
);

const DEFAULT_CARDS = makeCards(
  {
    title: "Product Formulation Expert",
    description: "Support for formula improvement, ingredient adjustments, and practical product development guidance.",
    cta: "Consult Expert",
    icon: <Beaker className="h-4 w-4 text-white" />,
    iconBg: "bg-teal-600",
    avatarLabel: "Formulation Expert",
  },
  {
    title: "Production & QC Support",
    description: "Help with batch consistency, product checks, and manufacturing-oriented refinement.",
    cta: "Get Support",
    icon: <ShieldCheck className="h-4 w-4 text-white" />,
    iconBg: "bg-blue-600",
    avatarLabel: "QC Specialist",
  },
  {
    title: "Packaging & Branding Consultant",
    description: "Guidance for packaging direction, labels, and product launch preparation.",
    cta: "Start Project",
    icon: <Package className="h-4 w-4 text-white" />,
    iconBg: "bg-orange-500",
    avatarLabel: "Brand Designer",
  }
);

// ── All rows for homepage ────────────────────────────────────────────────────
const ALL_ROWS: SupportRow[] = [
  {
    rowLabel: "Cleaning & Industrial Products",
    rowTag: "Industrial",
    tagColor: "bg-blue-100 text-blue-700",
    cards: CLEANING_CARDS,
  },
  {
    rowLabel: "Personal Care & Cosmetics",
    rowTag: "Cosmetics",
    tagColor: "bg-pink-100 text-pink-700",
    cards: COSMETIC_CARDS,
  },
  {
    rowLabel: "Adhesives, Coatings & Specialty",
    rowTag: "Specialty",
    tagColor: "bg-amber-100 text-amber-700",
    cards: COATINGS_CARDS,
  },
];

function getCards(slug: string): SupportCard[] {
  if (/cleaning|household|industrial|degreaser|detergent/.test(slug)) return CLEANING_CARDS;
  if (/skin|beauty|cosmetic|hair|personal|oral|baby|grooming|organic|mens|salon/.test(slug)) return COSMETIC_CARDS;
  if (/automotive|car/.test(slug)) return AUTOMOTIVE_CARDS;
  if (/adhesive|coating|paint|3d.print|building|construct|textile/.test(slug)) return COATINGS_CARDS;
  return DEFAULT_CARDS;
}

function getHeading(slug: string): string {
  if (/cleaning|household|industrial|degreaser|detergent/.test(slug)) return "Need help optimizing this cleaner formula?";
  if (/skin|beauty|cosmetic|hair|personal|oral|baby|grooming|organic|mens|salon/.test(slug)) return "Need help refining this cosmetic formula?";
  if (/automotive|car/.test(slug)) return "Need help improving this automotive formula?";
  if (/adhesive|coating|paint|3d.print|building|construct|textile/.test(slug)) return "Need help perfecting this coating formula?";
  return "Need help customizing this formula?";
}

// ── Homepage export: 3 labelled rows ────────────────────────────────────────
export function FormulationSupportAll() {
  return (
    <section aria-label="Formulation support options">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Find the Right Formulation Support
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-base">
          Connect with the right type of expert for formula refinement, scale-up, quality guidance, packaging, branding, or launch preparation.
        </p>
      </div>

      <div className="space-y-10 mb-8">
        {ALL_ROWS.map((row) => (
          <div key={row.rowLabel}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${row.tagColor}`}>
                {row.rowTag}
              </span>
              <h3 className="text-lg font-bold text-gray-800">{row.rowLabel}</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {row.cards.map((card, i) => (
                <SupportCardItem key={i} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Disclaimer />
    </section>
  );
}

// ── Formulation detail page export: single category row ─────────────────────
interface Props {
  categorySlug?: string;
}

export default function FormulationSupport({ categorySlug = "" }: Props) {
  const slug = categorySlug.toLowerCase();
  const heading = getHeading(slug);
  const cards = getCards(slug);

  return (
    <section className="mt-12 mb-2" aria-label="Formulation support options">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{heading}</h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-base">
          Connect with the right type of support for formula refinement, scale-up, quality guidance, packaging, branding, or launch preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        {cards.map((card, i) => (
          <SupportCardItem key={i} card={card} />
        ))}
      </div>

      <Disclaimer />
    </section>
  );
}
