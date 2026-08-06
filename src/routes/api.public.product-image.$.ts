import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// Public image proxy for the private `product-images` bucket.
// Public buckets are disabled for this workspace, so the storefront reads
// product photos through this read-only route instead. It streams bytes and
// nothing else — no listing, no writes, no metadata.
export const Route = createFileRoute("/api/public/product-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
