import { aggregateTable, appendComputedColumns } from "@/utils";


const processTable = (table: HTMLTableElement, p: HTMLParagraphElement): HTMLTableElement => {
    const text = p.innerHTML;

    const newTable = table.cloneNode(true) as HTMLTableElement;

    appendComputedColumns(newTable, text);
    aggregateTable(newTable, text);

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
