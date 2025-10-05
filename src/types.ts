
export enum AggregateOperator {
    SUM = "SUM",
    MIN = "MIN",
    MAX = "MAX",
    AVERAGE = "AVERAGE",
    MEDIAN = "MEDIAN",
}

export type ComputeInstruction = {
    column: string;
    equation: string;
    variables: { column: string; default: string }[];
};

export interface AggregateInstruction {
    column: string,
    operator: AggregateOperator
};

export interface SummarizeInstruction extends AggregateInstruction {
    // shares the same structure as AggregateInstruction, but declaring as a separate type to enforce type safety.
}

export type AggregateInstructionsWithGroups = {
    groups: string[],
    aggregateInstructions: AggregateInstruction[];
}

export type CellValue = string | number;
