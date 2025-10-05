import { AggregateOperator } from "@/types";

export const assertNumericArray = (values: unknown[], messageComposer?: (violations: { value: unknown; type: string }[]) => string): void => {
    const getDefaultErrorMessage = (violations: { value: unknown; type: string }[]) => {
        const details = violations
            .map(({ value, type }) => `'${value}' (type: ${type})`);
        return `Non-numeric values found during summarization: ${details}. Only numeric values are allowed for aggregation.`;
    }

    const nonNumericValues = values
        .map(value => ({ value, type: typeof value }))
        .filter(({ type }) => type !== "number");

    if (nonNumericValues.length > 0) {
        throw new Error(messageComposer?.(nonNumericValues) || getDefaultErrorMessage(nonNumericValues));
    }
}

export const AGGREGATION_SIGNATURE_MAP: {
    [key in AggregateOperator]: {
        handler: (values: number[]) => number;
        label: string;
    };
} = {
    [AggregateOperator.SUM]: {
        handler: (values: number[]) => values.reduce((a, b) => a + b, 0),
        label: "Sum"
    },
    [AggregateOperator.AVERAGE]: {
        handler: (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        label: "Avg"
    },
    [AggregateOperator.MIN]: {
        handler: (values: number[]) => Math.min(...values),
        label: "Min"
    },
    [AggregateOperator.MAX]: {
        handler: (values: number[]) => Math.max(...values),
        label: "Max"
    },
    [AggregateOperator.MEDIAN]: {
        handler: (values: number[]) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.slice(mid)[0] as number;
        },
        label: "Median"
    },
};
