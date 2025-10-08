
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


export type BaseStyleInstruction = {
    column: string;
}

export type GradientInstruction = BaseStyleInstruction & {
    type: "gradient";
    target: "background" | "text";
    from: string;
    to: string;
};

export type DimensionInstruction = BaseStyleInstruction & {
    // This is a placeholder
    type: "dimension";
    width: string;
};

export type StyleInstruction = GradientInstruction | DimensionInstruction;


export interface StyleAgent {
    getInstructions(text: string): StyleInstruction[];
    isCompatible(instruction: StyleInstruction): boolean;
    apply(table: HTMLTableElement, instruction: StyleInstruction): void;
}


export type CellValue = string | number;
