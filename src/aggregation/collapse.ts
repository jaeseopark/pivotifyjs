import { DEFAULT_DECIMAL_PLACES } from "@/constants";
import { AGGREGATION_SIGNATURE_MAP, assertNumericArray } from "@/aggregation/handlers";
import { TableData, ExtendedCellValue } from "@/models";
import { AggregateOperator, CellValue } from "@/types";
import { formatNumericCellValue } from "@/utils";


const getPivotIdGenerator = (pivots: string[], columnReverseMap: { [column: string]: number }): (allCellValues: CellValue[]) => {
    /**
     * Values corresponding to the pivot columns, in order.
     */
    underlyingCellValues: CellValue[];
    /**
     * Unique ID representing the combination of pivot values.
     * This is a concatenation of the underlyingCellValues with "||" separator.
     */
    pivotId: string;
} => {
    return (allCellValues: CellValue[]) => {
        const underlyingCellValues = pivots.map(pivot => {
            const colIdx = columnReverseMap[pivot];
            if (colIdx === undefined) {
                return "";
            }
            return allCellValues[colIdx] as CellValue || "";
        });

        const pivotId = underlyingCellValues.join("||");

        return {
            pivotId,
            underlyingCellValues
        }
    };
};


const getAggregatedCellValue = (props: { operator: AggregateOperator, values: unknown[], showOperatorLabel: boolean }) => {
    const { operator, values, showOperatorLabel } = props;
    assertNumericArray(values, (details) => `Cannot aggregate using '${operator}' because the data contains non-numeric values: ${JSON.stringify(details)}.`);

    const aggResult = AGGREGATION_SIGNATURE_MAP[operator].handler(values as number[]);

    return formatNumericCellValue({ value: aggResult, operator: operator, options: { decimalPlaces: DEFAULT_DECIMAL_PLACES, showOperatorLabel } });
}

/**
 * Collapses the table by the specified group columns and returns a new TableData object.
 * The original TableData object remains unchanged.
 * Each group is aggregated according to the aggregation instructions.
 *
 * @param tableData - The source TableData object to collapse.
 * @returns {TableData} A new TableData object representing the grouped and aggregated table.
 */
export function collapseTable(tableData: TableData, groups: string[], aggregations: { [column: string]: AggregateOperator[] }): TableData {
    const columns = [...groups, ...Object.keys(aggregations)];
    const columnReverseMap = tableData.columns;
    const getPivotId = getPivotIdGenerator(groups, columnReverseMap);

    const grouped = tableData.rows.reduce((acc, row) => {
        const cellValues = tableData.getValues({ row });
        const { pivotId, underlyingCellValues } = getPivotId(cellValues);
        if (!acc[pivotId]) {
            acc[pivotId] = { staticValues: underlyingCellValues, rows: [] };
        }
        acc[pivotId].rows.push(row);
        return acc;
    }, {} as { [pivotId: string]: { staticValues: CellValue[], rows: ExtendedCellValue[][] } });

    const newRows: CellValue[][] = [];

    Object.values(grouped).forEach(({ staticValues, rows }) => {
        const row: CellValue[] = staticValues.map(value => value || "");
        Object.entries(aggregations).forEach(([column, operators]) => {
            const values = rows.map(row => {
                const colIdx = columnReverseMap[column]!;

                const cellValue = row[colIdx]!.getValue() as CellValue;

                if (cellValue === "" || cellValue === null || cellValue === undefined) {
                    console.log("column", column, "colIdx", colIdx, "row", row, "cellValue", cellValue);
                }

                return cellValue;
            });
            const aggResults = (operators).map(aggregatorEnum => getAggregatedCellValue({ operator: aggregatorEnum, values, showOperatorLabel: operators.length > 1 }));
            row.push(aggResults.join(", "));
        });
        newRows.push(row);
    });

    const newTableData = new TableData();
    newTableData.columns = columns.reduce((acc, name, idx) => {
        acc[name] = idx;
        return acc;
    }, {} as { [name: string]: number });
    newTableData.rows = newRows.map(rowArr =>
        rowArr.map(resolvedValue => new ExtendedCellValue({ resolvedValue }))
    );

    return newTableData;
}
