import { AggregateInstruction } from "@/types";

type CellValue = string | number;

type ExtendedCellValueProps = { resolvedValue?: CellValue, unresolvedValue?: string, substitute?: () => string }

export class ExtendedCellValue {
    private value: CellValue;
    private isResolved: boolean;
    private substitute: () => string;

    constructor({ resolvedValue, unresolvedValue, substitute }: ExtendedCellValueProps) {
        this.value = (resolvedValue || unresolvedValue)!;
        this.isResolved = typeof resolvedValue !== "undefined";
        this.substitute = substitute || (() => unresolvedValue || "");
    }

    private resolve(): CellValue {
        let val = this.value as string; // unresolved value is always a string
        if (val.match(/\$\{[^}]+\}/)) {
            val = this.substitute();
        }

        try {
            // unresolved value could be a string representation of a numeric expression.
            val = eval(val);
        } catch (e) {
            // swallow
        }

        return val;
    }

    /**
     * Returns the resolved value, substituting variable references and caching the result.
     */
    getValue(): CellValue {
        if (!this.isResolved) {
            this.value = this.resolve();
            this.isResolved = true;
        }
        return this.value;
    }
}

export class TableData {
    columns: { [name: string]: number } = {};
    rows: ExtendedCellValue[][] = [];

    constructor(table?: HTMLTableElement) {
        if (table) {
            this.columns = Array.from(table.querySelectorAll("thead th"))
                .map(th => th.textContent?.trim() ?? "")
                .reduce((acc, name, idx) => {
                    acc[name] = idx;
                    return acc;
                }, {} as { [name: string]: number });

            this.rows = Array.from(table.querySelectorAll("tbody tr")).map(row =>
                Array.from(row.querySelectorAll("td")).map((td, colIdx, arr) => {
                    // Provide a substitute function for variable references
                    return new ExtendedCellValue(td.textContent?.trim() ?? "", () => {
                        let val = td.textContent?.trim() ?? "";
                        val = val.replace(/\$\{([^}]+)\}/g, (_, varName) => {
                            const idx = this.columns[varName.trim()];
                            return idx !== undefined ? arr[idx].getValue() : "";
                        });
                        return val;
                    });
                })
            );
        }
    }

    getCell({ rowIdx, col }: { rowIdx: number, col: string | number }): ExtendedCellValue {
        const row = this.rows[rowIdx]!;
        const colIdx = typeof col === "string" ? this.columns[col] : col;
        return row[colIdx!]!;
    }

    getValue({ cell }: { cell: ExtendedCellValue }): CellValue {
        return cell.getValue();
    }

    getValues({ rowIdx }: { rowIdx: number }): CellValue[] {
        return this.rows[rowIdx]!.map(cell => cell.getValue());
    }

    clone(): TableData {
        // TODO implement
    }

    createSummaryRow(instructions: AggregateInstruction[]) {
        // TODO implement
    }

    getInnerHtml(): string {
        const thead = `<thead><tr>${Object.keys(this.columns).map(col => `<th>${col}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${this.rows.map(row => `<tr>${row.map(cell => `<td>${cell.getValue()}</td>`).join("")}</tr>`).join("")}</tbody>`;
        return `${thead}${tbody}`;
    }
}
