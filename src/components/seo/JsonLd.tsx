import { useEffect } from "react";

/**
 * Injects a schema.org JSON-LD block into the document.
 *
 * It is appended to <body>: the router owns <head> and prunes tags it did not
 * create, and crawlers accept JSON-LD anywhere in the document.
 */
export function JsonLd({ data, id = "app-jsonld" }: { data: unknown; id?: string }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    document.getElementById(id)?.remove();
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    el.textContent = json;
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, [json, id]);
  return null;
}

