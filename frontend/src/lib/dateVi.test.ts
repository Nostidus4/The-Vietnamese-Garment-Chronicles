import { describe, expect, it } from "vitest";
import { formatDateVi, parseDateVi } from "./dateVi";

describe("dates in Du Ký (#145)", () => {
  it("are shown d/m/yyyy, without leading zeros", () => {
    expect(formatDateVi("2026-02-17")).toBe("17/2/2026");
    expect(formatDateVi(null)).toBe("");
  });
  it("are read back from the same form, with / . or -", () => {
    expect(parseDateVi("17/2/2026")).toBe("2026-02-17");
    expect(parseDateVi(" 7.10.2026 ")).toBe("2026-10-07");
    expect(parseDateVi("01-12-2025")).toBe("2025-12-01");
  });
  it("refuse a day that does not exist or another order", () => {
    expect(parseDateVi("31/2/2026")).toBeNull();
    expect(parseDateVi("2026-02-17")).toBeNull();
    expect(parseDateVi("17/2")).toBeNull();
  });
  it("round-trip", () => {
    for (const iso of ["2026-01-01", "2024-02-29", "2026-12-31"]) expect(parseDateVi(formatDateVi(iso))).toBe(iso);
  });
});
