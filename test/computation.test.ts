import { getComputeInstructions, appendComputedColumns } from "@/computation";
import { loadTableFromHtml, normalizeHtml } from "./testUtils";


describe("getComputations", () => {
  it.each([
    [
      `PIVOTIFYJS_COMPUTE:"Subtotal"="\${Unit Cost} * \${Qty}"`,
      {
        column: "Subtotal",
        equation: "${Unit Cost} * ${Qty}",
        variables: [
          { column: "Unit Cost", default: "" },
          { column: "Qty", default: "" }
        ]
      }
    ],
    [
      `PIVOTIFYJS_COMPUTE:"Subtotal"="\${Unit Cost} * \${Qty:1}"`,
      {
        column: "Subtotal",
        equation: "${Unit Cost} * ${Qty}",
        variables: [
          { column: "Unit Cost", default: "" },
          { column: "Qty", default: "1" }
        ]
      }
    ]
  ])("parses compute line: %s", (computeText, expected) => {
    const computations = getComputeInstructions(computeText);
    expect(computations).toHaveLength(1);
    expect(computations[0]).toEqual(expected);
  });

  it("compute numeric values (from subscriptions.simple.html)", () => {
    const table = loadTableFromHtml("subscriptions.simple.html");
    const columnCounterBefore = table.querySelectorAll("th").length;

    appendComputedColumns(
      table,
      getComputeInstructions('PIVOTIFYJS_COMPUTE:"CostLastChecked"="${Annual Cost} + ${Last Checked}"')
    );

    const columnCounterAfter = table.querySelectorAll("th").length;

    expect(columnCounterAfter).toBe(columnCounterBefore + 1);

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent?.trim());
    const annualCostIdx = headers.indexOf("Annual Cost");
    const lastCheckedIdx = headers.indexOf("Last Checked");
    const costLastCheckedIdx = headers.indexOf("CostLastChecked");
    expect(costLastCheckedIdx).toEqual(columnCounterBefore);

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      expect(cells.length).toBe(columnCounterAfter);

      const newCellValue = cells[costLastCheckedIdx];
      expect(newCellValue).toBeDefined();

      // Verify the computed value is correct
      const annualCostValue = Number(cells[annualCostIdx].textContent);
      const lastCheckedValue = Number(cells[lastCheckedIdx].textContent);
      const expected = annualCostValue + lastCheckedValue;
      const actual = Number(newCellValue.textContent?.trim());
      expect(actual).toBe(expected);
    });
  });

  it("calculates Subtotal by multiplying Unit Cost and Qty (from materials.complex.html)", () => {
    const table = loadTableFromHtml("materials.complex.html");
    const expectedTable = loadTableFromHtml("materials.expected.subtotal.html");

    appendComputedColumns(
      table,
      getComputeInstructions('PIVOTIFYJS_COMPUTE:"Subtotal"="${Unit Cost} * ${Qty}"')
    );

    expect(normalizeHtml(table.outerHTML)).toBe(normalizeHtml(expectedTable.outerHTML));
  });

  // TODO: test case for multiple computed fields
});
