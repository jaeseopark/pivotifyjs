import { AGGREGATION_SIGNATURE_MAP } from "@/aggregation/handlers";
import { DEFAULT_DECIMAL_PLACES, GLOBAL_PREFIX, SUMMARY_PREFIX } from "@/constants";
import { AggregateOperator } from "@/types";

export function getAggregatedColumns(text: string, keyword: AggregateOperator, { isSummary = false }): string[] {
    const prefix = isSummary ? SUMMARY_PREFIX : GLOBAL_PREFIX;
    const match = text.match(new RegExp(`\\s*${prefix}_${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]!) : [];
}

export function getPivotingGroups(text: string): string[] {
    // Supports multiple groups, e.g. PIVOTIFYJS_GROUPS: ["Category", "Item"]
    const match = text.match(/\s*PIVOTIFYJS_GROUPS:\s*\[([^\]]*)\]/);
    if (!match) return [];
    // Parse the array content safely
    try {
        return JSON.parse(`[${match[1]}]`);
    } catch {
        throw new Error("PIVOTIFYJS_GROUPS matched but could not parse as a valid array.", match[1]);
    }
}

type FormatNumericCellValueProps = {
    value: number;
    operator: AggregateOperator;
    options?: {
        decimalPlaces?: number;
        showOperatorLabel?: boolean;
    };
};

// TODO: should probably be moved to the aggregation folder
export const formatNumericCellValue = (props: FormatNumericCellValueProps): string => {
    const { value, operator, options = {} } = props;
    const decimalPlaces = options?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;
    const showOperatorLabel = options?.showOperatorLabel ?? false;

    let stringifiedResult = value.toFixed(decimalPlaces);
    if (stringifiedResult.endsWith(".00")) {
        stringifiedResult = stringifiedResult.slice(0, -3);
    }

    return showOperatorLabel
        ? `${AGGREGATION_SIGNATURE_MAP[operator].label}: ${stringifiedResult}`
        : stringifiedResult;
};
