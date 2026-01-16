import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE_URL = "https://aiformulator.net";

export function CanonicalLinkManager() {
  const [location] = useLocation();

  useEffect(() => {
    const canonicalUrl = `${BASE_URL}${location}`;
    
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonicalUrl);

    return () => {
    };
  }, [location]);

  return null;
}
