import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://metacare-beauty-sudano.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Read the live catalogue through the public (anon) client: only
        // active rows and slugs, no prices — the same data a visitor sees.
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const [productsRes, brandsRes, categoriesRes] = await Promise.all([
          supabasePublic.from("catalog_public").select("slug").limit(2000),
          supabasePublic.from("brands").select("slug").eq("is_active", true).limit(500),
          supabasePublic.from("categories").select("slug").eq("is_active", true).limit(500),
        ]);

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/products", changefreq: "daily", priority: "0.9" },
          { path: "/categories", changefreq: "weekly", priority: "0.8" },
          { path: "/brands", changefreq: "weekly", priority: "0.8" },
          { path: "/offers", changefreq: "daily", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/faq", changefreq: "monthly", priority: "0.5" },
          ...(brandsRes.data ?? []).map((b) => ({ path: `/brands/${b.slug}`, changefreq: "weekly" as const, priority: "0.7" })),
          ...(categoriesRes.data ?? []).map((c) => ({ path: `/products?category=${c.slug}`, changefreq: "weekly" as const, priority: "0.6" })),
          ...(productsRes.data ?? []).map((p) => ({ path: `/products/${p.slug}`, changefreq: "weekly" as const, priority: "0.7" })),
        ];

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path.replace(/&/g, "&amp;")}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
