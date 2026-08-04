// Public configuration.
// Business contact details live in `src/lib/company.ts` (Company Information).
// These re-exports exist so older imports keep working.
import { COMPANY } from "./company";

export const METACARE_WHATSAPP = COMPANY.whatsapp;
export { COMPANY };
