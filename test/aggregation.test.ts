import { getAggregateInstructions } from "@/aggregation";
import { processAllTables } from "@/pivotifyjs";
import { loadTableFromHtml, normalizeHtml } from "./testUtils";
import { summarize } from "@/aggregation/summarization";
import { TableData } from "@/models/TableData";


describe("getAggregations", () => {
    it("should parse aggregation keywords and columns from text", () => {
        const text = `
            PIVOTIFYJS_SUM:["Annual Cost", "Unit Cost", "Qty"]
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
            PIVOTIFYJS_MIN:    ["Qty"]
        `;
        const result = getAggregateInstructions(text, { isSummary: false });

        expect(result).toHaveLength(5);
        expect(result).toContainEqual({ operator: "SUM", column: "Annual Cost" });
        expect(result).toContainEqual({ operator: "SUM", column: "Unit Cost" });
        expect(result).toContainEqual({ operator: "SUM", column: "Qty" });
        expect(result).toContainEqual({ operator: "AVERAGE", column: "Annual Cost" });
        expect(result).toContainEqual({ operator: "MIN", column: "Qty" });
    });
});

describe("aggregateTable with groups", () => {
    it("should add subtotal rows for each group and a grand total row", () => {
        const table = loadTableFromHtml("subscriptions.complex.html");

        const p = document.createElement("p");
        p.innerHTML = `
            PIVOTIFYJS_GROUPS:["Last Checked"]<br>
            PIVOTIFYJS_SUM:["Annual Cost"]<br>
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
        `;

        const parent = table.parentElement?.appendChild(p);
        if (parent?.nextSibling) {
            parent?.parentElement?.insertBefore(p, parent.nextSibling
            )
        } else {
            parent?.parentElement?.appendChild(p);
        }

        processAllTables();

        const newTable = document.querySelector("table")!;
        const expectedTable = loadTableFromHtml("subscriptions.expected.aggregation.html");

        expect(normalizeHtml(newTable.outerHTML)).toEqual(normalizeHtml(expectedTable.outerHTML));
    });
});
