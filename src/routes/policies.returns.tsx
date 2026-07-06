import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "./policies.privacy";

export const Route = createFileRoute("/policies/returns")({
  head: () => ({
    meta: [
      { title: "سياسة الإرجاع — Returns — Metacare" },
      { name: "description", content: "سياسة الإرجاع في ميتاكير بيوتي." },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/policies/returns" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/policies/returns" }],
  }),
  component: () => <PolicyPage titleKey="returnsTitle" introKey="returnsIntro" />,
});
