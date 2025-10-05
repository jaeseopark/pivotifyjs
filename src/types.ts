
export enum AggregatorEnum {
    SUM = "PIVOTIFYJS_SUM",
    MIN = "PIVOTIFYJS_MIN",
    MAX = "PIVOTIFYJS_MAX",
    AVERAGE = "PIVOTIFYJS_AVERAGE",
    MEDIAN = "PIVOTIFYJS_MEDIAN",
}

export type ComputeInstruction = {
    column: string;
    equation: string;
    variables: { column: string; default: string }[];
};

export interface AggregateInstruction {
    column: string,
    aggregator: AggregatorEnum
};

export interface SummarizeInstruction extends AggregateInstruction {
    // shares the same structure as AggregateInstruction, but declaring as a separate type to enforce type safety.
}

export type AggregateInstructionsWithGroups = {
    groups: string[],
    aggregateInstructions: AggregateInstruction[];
}

export type CellValue = string | number;
