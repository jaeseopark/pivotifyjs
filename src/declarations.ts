import { AggregatorEnum, CellValue } from "./types";

export const AGGREGATION_SIGNATURE_MAP: {
    [key in AggregatorEnum]: {
        handler: (values: number[]) => number;
        label: string;
    };
} = {
    [AggregatorEnum.SUM]: {
        handler: (values: number[]) => values.reduce((a, b) => a + b, 0),
        label: "Sum"
    },
    [AggregatorEnum.AVERAGE]: {
        handler: (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        label: "Avg"
    },
    [AggregatorEnum.MIN]: {
        handler: (values: number[]) => Math.min(...values),
        label: "Min"
    },
    [AggregatorEnum.MAX]: {
        handler: (values: number[]) => Math.max(...values),
        label: "Max"
    },
    [AggregatorEnum.MEDIAN]: {
        handler: (values: number[]) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.slice(mid)[0] as number;
        },
        label: "Median"
    },
};
