
export enum AggregatorEnum {
    SUM = "PIVOTIFYJS_SUM",
    MIN = "PIVOTIFYJS_MIN",
    MAX = "PIVOTIFYJS_MAX",
    AVERAGE = "PIVOTIFYJS_AVERAGE",
    MEDIAN = "PIVOTIFYJS_MEDIAN",
    FIRST = "PIVOTIFYJS_FIRST"
}

export type ComputeInstruction = {
    column: string;
    equation: string;
    variables: { column: string; default: string }[];
};

export type AggregateInstruction = {
    column: string,
    aggregator: AggregatorEnum
};

export type AggregateInstructionsWithGroups = {
    groups: string[],
    aggregateInstructions: AggregateInstruction[];
}
