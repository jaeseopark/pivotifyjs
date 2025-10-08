import { AggregateInstruction, ComputeInstruction, StyleInstruction, SummarizeInstruction } from "@/types";
import { aggregate, getAggregateInstructions } from "@/aggregation";
import { appendComputedColumns, getComputeInstructions } from "@/computation";
import { getPivotingGroups, expandColspanRowspan } from "@/utils";
import { summarize } from "@/aggregation/summarization";
import { getStyleInstructions, stylize } from "@/stylization";

export class PivotifyJS {
    table: HTMLTableElement;

    constructor(table: HTMLTableElement) {
        this.table = table.cloneNode(true) as HTMLTableElement;
    }

    static analyze(rawInstructions: string) {
        const pivotingGroups = getPivotingGroups(rawInstructions);
        const computeInstructions: ComputeInstruction[] = getComputeInstructions(rawInstructions);
        const summarizeInstructions: SummarizeInstruction[] = getAggregateInstructions(rawInstructions, { isSummary: true });
        const aggregateInstructions: AggregateInstruction[] = getAggregateInstructions(rawInstructions, { isSummary: false });
        const styleInstructions: StyleInstruction[] = getStyleInstructions(rawInstructions);

        return {
            pivotingGroups,
            computeInstructions,
            aggregateInstructions,
            summarizeInstructions,
            styleInstructions
        };
    }

    sanitizeTable() {
        expandColspanRowspan(this.table);
        // TODO other sanitization logic go here... (to be determined)
    }

    compute(computeInstructions: ComputeInstruction[]) {
        if (computeInstructions.length === 0) {
            return;
        }

        appendComputedColumns(this.table, computeInstructions);
    }

    aggregate(pivotingGroups: string[], aggregateInstructions: AggregateInstruction[]) {
        if (aggregateInstructions.length === 0) {
            return;
        }

        aggregate(this.table, pivotingGroups, aggregateInstructions);
    }

    summarize(summarizeInstructions: SummarizeInstruction[]) {
        if (summarizeInstructions.length === 0) {
            return;
        }

        summarize(this.table, summarizeInstructions);
    }

    stylize(styleInstructions: StyleInstruction[]) {
        if (styleInstructions.length === 0) {
            return;
        }

        stylize(this.table, styleInstructions);
    }
}


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
