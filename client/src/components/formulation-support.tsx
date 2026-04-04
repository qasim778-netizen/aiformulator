import { Button } from "@/components/ui/button";
import { Beaker, ShieldCheck, Package, Wrench, FlaskConical, Palette, Car, Droplets } from "lucide-react";

interface SupportCard {
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  iconBg: string;
  avatarLabel: string;
}

function getHeading(slug: string): string {
  if (/cleaning|household|industrial|degreaser|detergent/.test(slug)) {
    return "Need help optimizing this cleaner formula?";
  }
  if (/skin|beauty|cosmetic|hair|personal|oral|baby|grooming|organic|mens/.test(slug)) {
    return "Need help refining this cosmetic formula?";
  }
  if (/automotive|car/.test(slug)) {
    return "Need help improving this automotive formula?";
  }
  if (/adhesive|coating|paint|3d-print|building|construct/.test(slug)) {
    return "Need help perfecting this coating formula?";
  }
  return "Need help customizing this formula?";
}

function getCards(slug: string): SupportCard[] {
  if (/cleaning|household|industrial|degreaser|detergent/.test(slug)) {
    return [
      {
        title: "Industrial Cleaner Formulation Expert",
        description: "Guidance for ingredient adjustment, performance improvement, dilution strategy, and manufacturing suitability.",
        cta: "Consult Expert",
        icon: <Beaker className="h-6 w-6 text-white" />,
        iconBg: "bg-blue-600",
        avatarLabel: "Formulation Expert",
      },
      {
        title: "Quality Control Support",
        description: "Help with pH targets, viscosity checks, stability review, and batch consistency planning.",
        cta: "Get QC Help",
        icon: <ShieldCheck className="h-6 w-6 text-white" />,
        iconBg: "bg-teal-600",
        avatarLabel: "QC Specialist",
      },
      {
        title: "Packaging & Labeling Consultant",
        description: "Support for label direction, packaging selection, product presentation, and launch readiness.",
        cta: "Start Project",
        icon: <Package className="h-6 w-6 text-white" />,
        iconBg: "bg-orange-500",
        avatarLabel: "Packaging Consultant",
      },
    ];
  }

  if (/skin|beauty|cosmetic|hair|personal|oral|baby|grooming|organic|mens/.test(slug)) {
    return [
      {
        title: "Cosmetic Formulation Expert",
        description: "Support for shampoos, lotions, face wash, serums, creams, and product refinement for target users.",
        cta: "Consult Expert",
        icon: <FlaskConical className="h-6 w-6 text-white" />,
        iconBg: "bg-pink-500",
        avatarLabel: "Cosmetic Expert",
      },
      {
        title: "Stability & Testing Support",
        description: "Guidance for texture, pH balance, compatibility, and basic product stability planning.",
        cta: "Get Product Help",
        icon: <ShieldCheck className="h-6 w-6 text-white" />,
        iconBg: "bg-purple-500",
        avatarLabel: "Stability Specialist",
      },
      {
        title: "Branding & Packaging Consultant",
        description: "Help with product presentation, packaging direction, and market-ready positioning.",
        cta: "Start Project",
        icon: <Palette className="h-6 w-6 text-white" />,
        iconBg: "bg-rose-500",
        avatarLabel: "Branding Consultant",
      },
    ];
  }

  if (/automotive|car/.test(slug)) {
    return [
      {
        title: "Automotive Product Expert",
        description: "Support for cleaners, polishes, dressings, compounds, and performance-focused formulation adjustment.",
        cta: "Consult Expert",
        icon: <Car className="h-6 w-6 text-white" />,
        iconBg: "bg-slate-700",
        avatarLabel: "Automotive Expert",
      },
      {
        title: "Performance Testing Support",
        description: "Guidance for gloss, cleaning strength, surface compatibility, and application performance review.",
        cta: "Get Product Help",
        icon: <Wrench className="h-6 w-6 text-white" />,
        iconBg: "bg-yellow-600",
        avatarLabel: "Performance Specialist",
      },
      {
        title: "Packaging & Launch Consultant",
        description: "Help with packaging direction, label planning, and launch presentation for automotive products.",
        cta: "Start Project",
        icon: <Package className="h-6 w-6 text-white" />,
        iconBg: "bg-blue-500",
        avatarLabel: "Launch Consultant",
      },
    ];
  }

  if (/adhesive|coating|paint|3d.print|building|construct/.test(slug)) {
    return [
      {
        title: "Adhesives & Coatings Expert",
        description: "Guidance for bonding performance, drying behavior, raw material adjustment, and production suitability.",
        cta: "Consult Expert",
        icon: <Droplets className="h-6 w-6 text-white" />,
        iconBg: "bg-amber-600",
        avatarLabel: "Coatings Expert",
      },
      {
        title: "Process Optimization Support",
        description: "Help with viscosity targets, application behavior, curing profile, and production consistency.",
        cta: "Get Process Help",
        icon: <Wrench className="h-6 w-6 text-white" />,
        iconBg: "bg-gray-600",
        avatarLabel: "Process Specialist",
      },
      {
        title: "Product Positioning Consultant",
        description: "Support for packaging direction, use-case messaging, and launch preparation.",
        cta: "Start Project",
        icon: <Package className="h-6 w-6 text-white" />,
        iconBg: "bg-teal-500",
        avatarLabel: "Positioning Consultant",
      },
    ];
  }

  return [
    {
      title: "Product Formulation Expert",
      description: "Support for formula improvement, ingredient adjustments, and practical product development guidance.",
      cta: "Consult Expert",
      icon: <Beaker className="h-6 w-6 text-white" />,
      iconBg: "bg-teal-600",
      avatarLabel: "Formulation Expert",
    },
    {
      title: "Production & QC Support",
      description: "Help with batch consistency, product checks, and manufacturing-oriented refinement.",
      cta: "Get Support",
      icon: <ShieldCheck className="h-6 w-6 text-white" />,
      iconBg: "bg-blue-600",
      avatarLabel: "QC Support",
    },
    {
      title: "Packaging & Branding Consultant",
      description: "Guidance for packaging direction, labels, and product launch preparation.",
      cta: "Start Project",
      icon: <Package className="h-6 w-6 text-white" />,
      iconBg: "bg-orange-500",
      avatarLabel: "Branding Consultant",
    },
  ];
}

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
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`${card.iconBg} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}
                role="img"
                aria-label={`${card.avatarLabel} icon`}
              >
                {card.icon}
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {card.avatarLabel}
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 leading-snug text-base">
              {card.title}
            </h3>
            <p className="text-sm text-gray-500 mb-5 flex-1 leading-relaxed">
              {card.description}
            </p>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            >
              {card.cta}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mb-4 max-w-xl mx-auto">
        These example support categories help users identify the type of expert assistance they may need for formulation, quality, packaging, or launch preparation.
      </p>

      <div className="text-center">
        <Button variant="secondary" className="px-8">
          Explore Expert Help
        </Button>
      </div>
    </section>
  );
}
