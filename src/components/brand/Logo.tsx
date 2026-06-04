import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/metacare-logo.png.asset.json";

/**
 * Metacare brand mark — uses the official uploaded logo.
 * The logo image already contains the brand mark + wordmark on a blue background,
 * so we render it inside a rounded blue tile for header use, and pair it with a
 * short "Beauty" sub-line in the layout for clarity.
 */
export function Logo({ className, variant = "default", showWordmark = true }: {
  className?: string;
  variant?: "default" | "mono";
  showWordmark?: boolean;
}) {
  const { lang } = useI18n();
  const isMono = variant === "mono";
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl shadow-glow",
          isMono ? "bg-primary-foreground/15" : ""
        )}
      >
        <img
          src={logoAsset.url}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </span>
      {showWordmark && (
        <span className={cn("flex flex-col leading-none", isMono ? "text-primary-foreground" : "")}>
          <span className={cn("font-display text-base tracking-tight md:text-lg", isMono ? "" : "text-foreground")}>
            {lang === "ar" ? "ميتاكير" : "metacare"}
          </span>
          <span className={cn("mt-0.5 text-[10px] uppercase tracking-[0.24em]", isMono ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {lang === "ar" ? "بيوتي" : "Beauty"}
          </span>
        </span>
      )}
    </div>
  );
}
