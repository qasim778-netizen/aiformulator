import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

export default function Breadcrumb({ items, baseUrl = "https://aiformulator.net" }: BreadcrumbProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-schema";
    
    const existingScript = document.getElementById("breadcrumb-schema");
    if (existingScript) {
      existingScript.remove();
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": item.href ? `${baseUrl}${item.href}` : undefined
      }))
    };

    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("breadcrumb-schema");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items, baseUrl]);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" />
              )}
              
              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                  {item.label}
                </span>
              ) : (
                <Link href={item.href || "/"}>
                  <span className="hover:text-primary hover:underline cursor-pointer transition-colors">
                    {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                    {item.label}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
