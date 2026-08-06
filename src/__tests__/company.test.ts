import { describe, it, expect } from "vitest";
import { waDigits, COMPANY } from "@/lib/company";

// Smoke tests: cheap invariants that must never regress before a release.
describe("company contact configuration", () => {
  it("exposes a real Sudanese business line (no placeholder)", () => {
    expect(COMPANY.phone).not.toMatch(/^0?9000000/);
    expect(COMPANY.whatsapp).toMatch(/^0\d{9}$/);
  });

  it("builds wa.me digits with the country code and no leading zero", () => {
    expect(waDigits("0993373874")).toBe("249993373874");
    expect(waDigits("249993373874")).toBe("249993373874");
  });
});
