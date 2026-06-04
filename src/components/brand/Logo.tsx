import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Typographic Metacare wordmark — placeholder until the official logo asset is uploaded.
 * Replace by importing the real logo image and rendering it inside this component.
 */
export function Logo({ className, variant = "default" }: { className?: string; variant?: "default" | "mono" }) {
  const { lang } = useI18n();
  const isMono = variant === "mono";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
          isMono ? "bg-primary-foreground/15 text-primary-foreground" : "gradient-brand text-primary-foreground shadow-glow"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.5c2.8 3.2 4.5 6 4.5 8.7a4.5 4.5 0 1 1-9 0c0-2.7 1.7-5.5 4.5-8.7Z" />
          <path d="M5.5 16.5c1.9 2.6 3.9 4 6.5 4s4.6-1.4 6.5-4" />
        </svg>
      </span>
      <span className={cn("flex flex-col leading-none", isMono ? "text-primary-foreground" : "")}>
        <span className={cn("font-display text-lg tracking-tight", isMono ? "" : "text-foreground")}>
          {lang === "ar" ? "ميتاكير" : "Metacare"}
        </span>
        <span className={cn("text-[10px] uppercase tracking-[0.22em]", isMono ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {lang === "ar" ? "بيوتي" : "Beauty"}
        </span>
      </span>
    </div>
  );
}
