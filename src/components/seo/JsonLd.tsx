import { useEffect } from "react";

/**
 * Injects a schema.org JSON-LD block into <head>.
 *
 * React does not reliably render inline <script> children inside route
 * components, so the tag is created imperatively and cleaned up on unmount.
 */
export function JsonLd({ data, id = "app-jsonld" }: { data: unknown; id?: string }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    el.textContent = json;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [json, id]);
  return null;
}
