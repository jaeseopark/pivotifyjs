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
