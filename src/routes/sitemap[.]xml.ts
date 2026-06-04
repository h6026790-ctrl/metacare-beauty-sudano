import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { brands, categories, products } from "@/lib/mock-data";

// TODO: replace with the project URL once a custom domain is configured.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/products", changefreq: "daily", priority: "0.9" },
          { path: "/categories", changefreq: "weekly", priority: "0.8" },
          { path: "/brands", changefreq: "weekly", priority: "0.8" },
          { path: "/offers", changefreq: "daily", priority: "0.8" },
          { path: "/search", changefreq: "weekly", priority: "0.4" },
          ...brands.map((b) => ({ path: `/brands/${b.id}`, changefreq: "weekly" as const, priority: "0.7" })),
          ...categories.map((c) => ({ path: `/products?category=${c.id}`, changefreq: "weekly" as const, priority: "0.6" })),
          ...products.map((p) => ({ path: `/products/${p.id}`, changefreq: "weekly" as const, priority: "0.7" })),
        ];

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
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
