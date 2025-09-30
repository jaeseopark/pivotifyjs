import { getComputations, appendComputedColumns } from "@/utils/computation";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

function loadTableFromHtml(htmlFile = "subscriptions.simple.html") {
  const htmlPath = path.resolve(
    fileURLToPath(import.meta.url),
    `../../test/data/${htmlFile}`
  );
  const html = fs.readFileSync(htmlPath, "utf8");
  document.body.innerHTML = html;
  return document.querySelector("table") as HTMLTableElement;
}

describe("getComputations", () => {
  it.each([
    [
      `PIVOTIFYJS_COMPUTE:"Subtotal"=\${Unit Cost} * \${Qty}`,
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
      `PIVOTIFYJS_COMPUTE:"Subtotal"=\${Unit Cost} * \${Qty:1}`,
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
    const computations = getComputations(computeText);
    expect(computations).toHaveLength(1);
    expect(computations[0]).toEqual(expected);
  });

  it("compute numeric values (from subscriptions.simple.html)", () => {
    const computeText = 'PIVOTIFYJS_COMPUTE:"CostLastChecked"= ${Annual Cost} + ${Last Checked}';
    const table = loadTableFromHtml();
    const columnCounterBefore = table.querySelectorAll("th").length;
    appendComputedColumns(table, computeText);
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

  // TODO: test case for multiple computed fields
});
