import { getComputations } from "./computation";

describe("getComputations", () => {
  it("parses a simple compute line", () => {
    const input = `PIVOTIFYJS_COMPUTE:"Subtotal"="Unit Cost" * "Qty"`;
    const result = getComputations(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      column: "Subtotal",
      equation: `"Unit Cost" * "Qty"`,
      variables: [
        { column: "Unit Cost", default: "" },
        { column: "Qty", default: "" }
      ]
    });
  });
});