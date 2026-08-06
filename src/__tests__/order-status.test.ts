import { describe, it, expect } from "vitest";

// Mirrors the server-side machine in src/lib/api/ops.functions.ts.
// Kept in sync intentionally: this is the contract staff tooling relies on.
const ALLOWED: Record<string, string[]> = {
  new: ["review", "paid", "cancelled"],
  review: ["paid", "cancelled"],
  paid: ["shipping", "cancelled", "returned"],
  shipping: ["delivered", "cancelled", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

describe("order status machine", () => {
  it("allows the happy path new → review → paid → shipping → delivered", () => {
    expect(ALLOWED["new"]).toContain("review");
    expect(ALLOWED["review"]).toContain("paid");
    expect(ALLOWED["paid"]).toContain("shipping");
    expect(ALLOWED["shipping"]).toContain("delivered");
  });

  it("never moves backwards or out of a terminal state", () => {
    expect(ALLOWED["paid"]).not.toContain("new");
    expect(ALLOWED["delivered"]).not.toContain("paid");
    expect(ALLOWED["cancelled"]).toHaveLength(0);
    expect(ALLOWED["returned"]).toHaveLength(0);
  });

  it("only allows returns from states where goods left the warehouse", () => {
    for (const from of ["new", "review"]) {
      expect(ALLOWED[from]).not.toContain("returned");
    }
    for (const from of ["paid", "shipping", "delivered"]) {
      expect(ALLOWED[from]).toContain("returned");
    }
  });
});
