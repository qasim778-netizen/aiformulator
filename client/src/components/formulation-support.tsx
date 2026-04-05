import { useQuery } from "@tanstack/react-query";
import { Beaker, ShieldCheck, Package, Wrench, FlaskConical, Droplets, Layers, Car, Star, ExternalLink, LucideIcon } from "lucide-react";
import { SiFiverr } from "react-icons/si";
import avatarExpert from "../assets/avatars/avatar-expert.png";
import avatarTester from "../assets/avatars/avatar-tester.png";
import avatarDesigner from "../assets/avatars/avatar-designer.png";
import type { Formulator } from "@shared/schema";

const FIVERR_LINK = "https://www.fiverr.com/search/gigs?query=chemical%20formulation";

// ── Color map (matches admin COLOR_OPTIONS) ───────────────────────────────────
const COLOR_MAP: Record<string, { header: string; border: string; button: string; buttonHover: string }> = {
  pink:   { header: "bg-pink-500",   border: "border-pink-400",   button: "bg-pink-500",   buttonHover: "hover:bg-pink-600" },
  purple: { header: "bg-purple-700", border: "border-purple-500", button: "bg-purple-700", buttonHover: "hover:bg-purple-800" },
  orange: { header: "bg-orange-500", border: "border-orange-400", button: "bg-orange-500", buttonHover: "hover:bg-orange-600" },
  blue:   { header: "bg-blue-600",   border: "border-blue-400",   button: "bg-blue-600",   buttonHover: "hover:bg-blue-700" },
  teal:   { header: "bg-teal-600",   border: "border-teal-400",   button: "bg-teal-600",   buttonHover: "hover:bg-teal-700" },
  green:  { header: "bg-green-600",  border: "border-green-400",  button: "bg-green-600",  buttonHover: "hover:bg-green-700" },
  indigo: { header: "bg-indigo-600", border: "border-indigo-400", button: "bg-indigo-600", buttonHover: "hover:bg-indigo-700" },
  red:    { header: "bg-red-500",    border: "border-red-400",    button: "bg-red-500",    buttonHover: "hover:bg-red-600" },
};

function colorFor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.pink;
}

// ── Hardcoded fallback cards (shown when DB has no entries) ───────────────────
interface FallbackCard {
  headerLabel: string;
  Icon: LucideIcon;
  photo: string;
  photoAlt: string;
  ctaLabel: string;
  ctaHref: string;
  color: string;
}

const FIVERR = "https://www.fiverr.com/search/gigs?query=";

const DEFAULT_FALLBACK: FallbackCard[] = [
  {
    headerLabel: "Cosmetic Formulation Expert",
    Icon: FlaskConical,
    photo: avatarExpert,
    photoAlt: "Cosmetic Formulation Expert",
    ctaLabel: "Find Cosmetic Experts",
    ctaHref: `${FIVERR}cosmetic+formulation+expert`,
    color: "pink",
  },
  {
    headerLabel: "Stability & Testing Specialist",
    Icon: ShieldCheck,
    photo: avatarTester,
    photoAlt: "Stability & Testing Specialist",
    ctaLabel: "Find QA Specialists",
    ctaHref: `${FIVERR}product+stability+testing+specialist`,
    color: "purple",
  },
  {
    headerLabel: "Branding & Packaging Consultant",
    Icon: Package,
    photo: avatarDesigner,
    photoAlt: "Branding & Packaging Consultant",
    ctaLabel: "Find Branding Experts",
    ctaHref: `${FIVERR}brand+packaging+designer`,
    color: "orange",
  },
];

// ── Single card ───────────────────────────────────────────────────────────────
function FallbackCardItem({ card }: { card: FallbackCard }) {
  const { Icon } = card;
  const c = colorFor(card.color);
  return (
    <div className={`rounded-2xl border-2 ${c.border} overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200`}>
      <div className={`${c.header} px-4 py-3 flex items-center gap-2`}>
        <Icon className="h-4 w-4 text-white opacity-90 flex-shrink-0" />
        <span className="text-white text-xs font-bold uppercase tracking-wider leading-tight">{card.headerLabel}</span>
      </div>
      <div className="w-full overflow-hidden bg-gray-100 flex-1">
        <img src={card.photo} alt={card.photoAlt} className="w-full h-64 object-cover object-top" />
      </div>
      <a
        href={card.ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${c.button} ${c.buttonHover} text-white text-sm font-semibold text-center py-3.5 px-4 flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer`}
      >
        <ExternalLink className="h-4 w-4 opacity-80" />
        {card.ctaLabel}
      </a>
    </div>
  );
}

function FormulatorCard({ formulator }: { formulator: Formulator }) {
  const c = colorFor(formulator.color);
  return (
    <div className={`rounded-2xl border-2 ${c.border} overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200`}>
      <div className={`${c.header} px-4 py-3 flex items-center gap-2`}>
        <span className="text-white text-xs font-bold uppercase tracking-wider leading-tight">
          {formulator.expertiseName}
        </span>
      </div>
      <div className="w-full overflow-hidden bg-gray-100 flex-1">
        <img
          src={formulator.photoUrl}
          alt={formulator.expertiseName}
          className="w-full h-64 object-cover object-top"
        />
      </div>
      <a
        href={formulator.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${c.button} ${c.buttonHover} text-white text-sm font-semibold text-center py-3.5 px-4 flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer`}
      >
        <ExternalLink className="h-4 w-4 opacity-80" />
        Connect with Expert
      </a>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function SupportSection({ heading, formulators }: { heading: string; formulators: Formulator[] | null }) {
  const words = heading.split(" ");
  const hi = words.findIndex((w) => w === "Professional");
  const useDB = formulators && formulators.length > 0;

  return (
    <section aria-label="Formulation expert support">
      {/* ── Fiverr header branding ── */}
      <div className="flex justify-center mb-5">
        <a
          href={FIVERR_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white border-2 border-[#1DBF73] rounded-2xl px-6 py-3 shadow-sm hover:shadow-md transition-shadow duration-150 group"
        >
          <SiFiverr className="h-8 w-8 text-[#1DBF73]" />
          <div className="text-left">
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold leading-none mb-0.5">Powered by</div>
            <div className="text-xl font-extrabold text-gray-900 leading-none tracking-tight group-hover:text-[#1DBF73] transition-colors">
              fiverr<span className="text-[#1DBF73]">.</span>
            </div>
          </div>
        </a>
      </div>

      {/* Badge */}
      <div className="flex justify-center mb-4">
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

      {/* Cards: DB data or hardcoded fallback */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {useDB
          ? formulators.map((f) => <FormulatorCard key={f.id} formulator={f} />)
          : DEFAULT_FALLBACK.map((c, i) => <FallbackCardItem key={i} card={c} />)
        }
      </div>

      {/* Footer CTA */}
      <div className="text-center">
        <a
          href={FIVERR_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-[#1DBF73] hover:bg-[#19a463] text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-md transition-colors duration-150"
        >
          <SiFiverr className="h-4 w-4" />
          Explore All Experts on Fiverr
          <span className="text-white/70 text-base ml-0.5">›</span>
        </a>
      </div>
    </section>
  );
}

// ── Hook: fetch from API ──────────────────────────────────────────────────────
function useFormulators() {
  return useQuery<Formulator[]>({
    queryKey: ["/api/formulators"],
    staleTime: 5 * 60 * 1000,
  });
}

// ── Homepage export ───────────────────────────────────────────────────────────
export function FormulationSupportAll() {
  const { data: formulators } = useFormulators();
  return (
    <SupportSection
      heading="Need Professional Help With This Formula?"
      formulators={formulators ?? null}
    />
  );
}

// ── Formulation detail page export ───────────────────────────────────────────
interface Props {
  categorySlug?: string;
}

export default function FormulationSupport({ categorySlug = "" }: Props) {
  const { data: formulators } = useFormulators();
  return (
    <div className="mt-12 mb-2">
      <SupportSection
        heading="Need Professional Help With This Formula?"
        formulators={formulators ?? null}
      />
    </div>
  );
}
