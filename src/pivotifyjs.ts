import { AggregateInstruction, AggregatorEnum, ComputeInstruction } from "@/types";
import { aggregate, getAggregateInstructions } from "@/aggregation";
import { appendComputedColumns, getComputeInstructions } from "@/computation";
import { getPivotingGroups } from "./utils";

class PivotifyJS {
    table: HTMLTableElement;

    constructor(table: HTMLTableElement) {
        this.table = table.cloneNode(true) as HTMLTableElement;
    }

    analyze(rawInstructions: string) {
        const pivotingGroups = getPivotingGroups(rawInstructions);
        const computeInstructions: ComputeInstruction[] = getComputeInstructions(rawInstructions);
        const aggregateInstructions: AggregateInstruction[] = getAggregateInstructions(rawInstructions);

        return {
            pivotingGroups,
            computeInstructions,
            aggregateInstructions,
        };
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

        const uniqueAggregators = new Set(aggregateInstructions.map(instr => instr.aggregator));

        if (pivotingGroups.length === 0 && uniqueAggregators.has(AggregatorEnum.FIRST)) {
            throw new Error("PIVOTIFYJS_GROUPS must be specified when using PIVOTIFYJS_FIRST.");
        }

        aggregate(this.table, pivotingGroups, aggregateInstructions);
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
    const text = p.innerHTML;

    const pivotifyJs = new PivotifyJS(table);

    const { pivotingGroups, computeInstructions, aggregateInstructions } = pivotifyJs.analyze(text);

    if (computeInstructions.length === 0 && aggregateInstructions.length === 0) {
        return undefined;
    }

    pivotifyJs.compute(computeInstructions);
    pivotifyJs.aggregate(pivotingGroups, aggregateInstructions);

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
            console.debug("Replacing table after processing...")
            table.replaceWith(processedTable);
            p.remove();
        } else {
            console.debug("No instructions found. No replacement needed.")
        }
    });
}

document.addEventListener("DOMContentLoaded", processAllTables);
