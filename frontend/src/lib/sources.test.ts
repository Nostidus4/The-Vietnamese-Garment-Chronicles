import { describe, expect, it } from "vitest";
import { cited, plainAnswer } from "./sources";

describe("what the reader sees of the sources (#50)", () => {
  it("drops the reference codes Tèo sometimes copies into an answer", () => {
    expect(plainAnswer("Năm 1744, Chúa Nguyễn Phúc Khoát định chế áo ngũ thân [ref-03, ref-12]. Sau đó vua Minh Mạng phổ biến [ref-11] nhé!")).toBe(
      "Năm 1744, Chúa Nguyễn Phúc Khoát định chế áo ngũ thân. Sau đó vua Minh Mạng phổ biến nhé!",
    );
    expect(plainAnswer("Áo tứ thân đi cùng yếm, nón quai thao (research-5-3).")).toBe("Áo tứ thân đi cùng yếm, nón quai thao.");
    expect(plainAnswer("Số thân áo (keep) và cổ áo (caution) nên giữ.")).toBe("Số thân áo và cổ áo nên giữ.");
    // Tèo now also reads Compass rules (#51): their type names must not leak either
    expect(plainAnswer("Sneakers là phụ kiện hiện đại (flexible), còn đổi số thân (core) thì không.")).toBe(
      "Sneakers là phụ kiện hiện đại, còn đổi số thân thì không.",
    );
  });
  it("never cites a source the team has not vetted, nor an unknown id", () => {
    const sources = {
      a: { id: "a", title: "Bảo tàng", url: null },
      b: { id: "b", title: "Bản đồ trang phục", url: null, verified: false },
    };
    expect(cited({ sources }, ["b", "a", "x"]).map((s) => s.id)).toEqual(["a"]);
  });
});
