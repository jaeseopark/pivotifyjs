import { DEFAULT_DECIMAL_PLACES } from "@/constants";
import { AGGREGATION_SIGNATURE_MAP, assertNumericArray } from "@/aggregation/handlers";
import { TableData, ExtendedCellValue } from "@/models/TableData";
import { AggregateOperator, CellValue } from "@/types";
import { assert } from "console";
import { formatNumericCellValue } from "@/utils";


type GetPivotIdReturnType = (allCellValues: CellValue[]) => {
    pivotId: string,
    distinctCellValues: CellValue[]
};


const getPivotIdGenerator = (pivots: string[], columnReverseMap: { [column: string]: number }): GetPivotIdReturnType => {
    return (allCellValues: CellValue[]) => {
        const distinctCellValues = pivots.map(pivot => {
            const colIdx = columnReverseMap[pivot];
            if (colIdx === undefined) {
                return "";
            }
            return allCellValues[colIdx] as CellValue;
        });

        const pivotId = distinctCellValues.join("||");

        return {
            pivotId,
            distinctCellValues
        }
    };
};


const getAggregatedCellValue = (props: { operator: AggregateOperator, values: unknown[], showOperatorLabel: boolean }) => {
    const { operator, values, showOperatorLabel } = props;
    assertNumericArray(values, (details) => `Cannot aggregate using '${operator}' because the data contains non-numeric values: ${details}.`);

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

    const grouped = tableData.rows.reduce((acc, row, rowIdx) => {
        const cellValues = tableData.getValues({ rowIdx });
        const { pivotId, distinctCellValues } = getPivotId(cellValues);
        if (!acc[pivotId]) {
            acc[pivotId] = { cellValues: distinctCellValues, rowIndices: [] };
        }
        acc[pivotId].rowIndices.push(rowIdx);
        return acc;
    }, {} as { [pivotId: string]: { cellValues: CellValue[], rowIndices: number[] } });

    const newRows: CellValue[][] = [];

    Object.values(grouped).forEach(({ cellValues, rowIndices }) => {
        const row: CellValue[] = [];
        cellValues.forEach((val) => {
            row.push(val);
        });
        Object.entries(aggregations).forEach(([column, operators]) => {
            const values = rowIndices.map(rowIdx => tableData.getCell({ rowIdx, col: column }).getValue());
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
        rowArr.map(val => new ExtendedCellValue({ unresolvedValue: String(val), substitute: () => String(val) }))
    );

    return newTableData;
}
