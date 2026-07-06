import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "./policies.privacy";

export const Route = createFileRoute("/policies/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — Terms — Metacare" },
      { name: "description", content: "الشروط والأحكام لاستخدام متجر ميتاكير بيوتي." },
      { property: "og:url", content: "https://metacare-beauty-sudano.lovable.app/policies/terms" },
    ],
    links: [{ rel: "canonical", href: "https://metacare-beauty-sudano.lovable.app/policies/terms" }],
  }),
  component: () => <PolicyPage titleKey="termsTitle" introKey="termsIntro" />,
});
