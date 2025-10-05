import { PivotifyJS } from "@/models/PivotifyJS";

/**
 * Populates computed fields and aggregates the data.
 * Returns a new table DOM after processing. Returns undefined if no relevant instructions are found.
 *
 * @param table - The HTMLTableElement to process.
 * @param p - The HTMLParagraphElement containing instructions.
 * @returns {HTMLTableElement | undefined} The processed table element, or undefined if no instructions are found.
 */
const processTable = (table: HTMLTableElement, p: HTMLParagraphElement): HTMLTableElement | undefined => {
    const { pivotingGroups, computeInstructions, aggregateInstructions, summarizeInstructions, styleInstructions } = PivotifyJS.analyze(p.innerHTML);

    if (computeInstructions.length === 0
        && aggregateInstructions.length === 0
        && summarizeInstructions.length === 0
        && styleInstructions.length === 0) {
        return undefined;
    }

    const pivotifyJs = new PivotifyJS(table);

    pivotifyJs.sanitizeTable();
    pivotifyJs.compute(computeInstructions);
    pivotifyJs.aggregate(pivotingGroups, aggregateInstructions);
    pivotifyJs.summarize(summarizeInstructions);
    pivotifyJs.stylize(styleInstructions);

    // Return the modified copy of the table
    return pivotifyJs.table;
};

const getSiblingParagraph = (table: HTMLTableElement): HTMLParagraphElement | null => {
    const candidates = [
        // <p> could be right next to the table or could be in the parent container.
        (table.parentNode as Element | null)?.nextElementSibling,
        table.nextElementSibling
    ]
    return candidates.find(candidate => candidate && candidate.tagName.toLowerCase() === "p") as HTMLParagraphElement | null;
};

export function processAllTables() {
    document.querySelectorAll("table").forEach(table => {
        const p = getSiblingParagraph(table);
        if (!p) {
            return;
        }

        const processedTable = processTable(table, p);
        if (processedTable) {
            table.innerHTML = processedTable.innerHTML;
            p.remove();
        }
    });
}

document.addEventListener("DOMContentLoaded", processAllTables);
