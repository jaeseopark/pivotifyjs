import { getAggregations} from "./utils.js";
import { appendComputedColumns } from "./utils/computation.js";

const processTable = (table: HTMLTableElement, p: HTMLParagraphElement): HTMLTableElement => {
    const text = p.innerHTML;

   const newTable = table.cloneNode(true) as HTMLTableElement;
    
    appendComputedColumns(newTable, text);

    // TODO: mutate newTable further

    // // Get aggregations and computations from the <p> text
    // const { sumCols, avgCols, minCols, maxCols, medianCols, firstCols } = getAggregations(text);

    // // Handle summary row for supported aggregations
    // const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
    // const newRow = document.createElement("tr");
    // headers.forEach((header, colIndex) => {
    //     const td = document.createElement("td");
    //     let parts = [];
    //     if (sumCols.includes(header)) {
    //         const { sum } = aggregateColumn(table, colIndex);
    //         parts.push(`Sum=${sum}`);
    //     }
    //     if (avgCols.includes(header)) {
    //         const { avg } = aggregateColumn(table, colIndex);
    //         parts.push(`Avg=${avg.toFixed(2)}`);
    //     }
    //     if (minCols && minCols.includes(header)) {
    //         const { min } = aggregateColumn(table, colIndex);
    //         parts.push(`Min=${min}`);
    //     }
    //     if (maxCols && maxCols.includes(header)) {
    //         const { max } = aggregateColumn(table, colIndex);
    //         parts.push(`Max=${max}`);
    //     }
    //     if (medianCols && medianCols.includes(header)) {
    //         const { median } = aggregateColumn(table, colIndex);
    //         parts.push(`Median=${median}`);
    //     }
    //     if (firstCols && firstCols.includes(header)) {
    //         const { first } = aggregateColumn(table, colIndex);
    //         parts.push(`First=${first}`);
    //     }
    //     td.textContent = parts.join(", ");
    //     newRow.appendChild(td);
    // });
    // table.querySelector("tbody").appendChild(newRow);

    // // Remove the <p> after processing
    // p.remove();

    return newTable;
};

export function processAllTables() {
    document.querySelectorAll("table").forEach(table => {
        let p = table.nextElementSibling;
        while (p && p.tagName.toLowerCase() !== "p") {
            p = p.nextElementSibling;
        }
        if (!p) return;
        const processedTable = processTable(table, p as HTMLParagraphElement);
        table.parentNode?.replaceChild(processedTable, table);
    });
}

// Only run this in the browser, not in tests
if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", processAllTables);
}
