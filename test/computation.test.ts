import { getComputations, appendComputedColumns } from "@/utils/computation";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

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

  it("parses a compute line with defaults", () => {
    const input = `PIVOTIFYJS_COMPUTE:"Subtotal"="Unit Cost" * "Qty:1"`;
    const result = getComputations(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      column: "Subtotal",
      equation: `"Unit Cost" * "Qty"`,
      variables: [
        { column: "Unit Cost", default: "" },
        { column: "Qty", default: 1 }
      ]
    });
  });

  it("uses default values when appending computed columns (from subscriptions.simple.html)", () => {
    const htmlPath = path.resolve(
      fileURLToPath(import.meta.url),
      "../../test/data/subscriptions.simple.html"
    );
    const html = fs.readFileSync(htmlPath, "utf8");
    document.body.innerHTML = html;
    const table = document.querySelector("table") as HTMLTableElement;
    const computeText = `PIVOTIFYJS_COMPUTE:"ServiceWithNotes"= "Service" + "Notes:2"`;

    appendComputedColumns(table, computeText);

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const service = cells[0].textContent?.trim() ?? "";
      const expected = service + "2";
      const actual = cells[cells.length - 1].textContent?.trim();
      expect(actual).toBe(expected);
    });
  });
});
