import { COMPUTE_KEYWORD } from "@/constants";
import { CellValue, ComputeInstruction } from "./types";
import { TableData } from "@/models/TableData";
import { ExtendedCellValue } from "@/models/ExtendedCellValue";

/**
 * Parses PIVOTIFYJS_COMPUTE lines. Only 1 computed field allowed per line, separated by <br> tags or by newlines.
 * 
 * @param {string} text
 * @returns {ComputeInstruction[]}
 */
export const getComputeInstructions = (text: string): ComputeInstruction[] => {
    // Support both <br> and newline as line separators (Windows compatible)
    const lines = text.split(/<br>|\r?\n/).filter(line => line.trim().startsWith(COMPUTE_KEYWORD + ":"));
    return lines
        .map(line => {
            const match = line.match(/.*:"([^"]+)"="(.+)"/);
            if (!match) return null;
            const column = match[1];
            const equation = match[2]!.trim();

            // Remove default values from the equation for the output if present
            const equationStripped = equation.replace(/\$\{([^}:]+)(?::([^}]+))?\}/g, (_, col) => `\${${col}}`);

            const variableRegex = /\$\{([^}:]+)(?::([^}]+))?\}/g;
            const variables: { column: string; default: string }[] = [];
            let matchVar;
            while ((matchVar = variableRegex.exec(equation)) !== null) {
                const col = matchVar[1];
                const def = matchVar[2];
                let defaultValue: string = def !== undefined ? def.trim() : "";
                variables.push({
                    column: col!.trim(),
                    default: defaultValue
                });
            }
            return { column: column as string, equation: equationStripped, variables };
        })
        .filter((item): item is { column: string; equation: string; variables: { column: string; default: string }[] } => item !== null);
};

/**
 * Given a TableData object, mutates it to append new computed columns, as specified in the instructions.
 *
 * @param {TableData | HTMLTableElement} tableOrTableData - The source TableData object or HTMLTableElement.
 * @param {ComputeInstruction[]} instructions - Array of compute instructions.
 */
export const appendComputedColumns = (
    table: HTMLTableElement,
    instructions: ComputeInstruction[]
) => {
    // Always create a TableData instance from the HTMLTableElement
    const tableData = new TableData(table);

    instructions.forEach(instruction => {
        // Add new column to TableData
        const colIdx = Object.keys(tableData.columns).length;
        tableData.columns[instruction.column] = colIdx;

        // For each row, compute the value and append as ExtendedCellValue
        tableData.rows.forEach((row) => {
            let substitutedEquation = instruction.equation;
            instruction.variables.forEach(variable => {
                const fetchedValue: CellValue = tableData.getValue({ row, col: variable.column });

                let value: string;

                if (typeof fetchedValue === "number") {
                    value = fetchedValue.toString();
                } else {
                    value = String(fetchedValue).trim();
                }

                // Substitute variable in equation
                const regex = new RegExp(`\\$\\{${variable.column}(?::[^}]*)?\\}`, "g");
                substitutedEquation = substitutedEquation.replace(regex, value || variable.default || "");
            });

            let computedValue: string | number;
            try {
                computedValue = eval(substitutedEquation);
            } catch {
                throw new Error(`Computation resulted in invalid value for equation: '${substitutedEquation}'`);
            }
            if (computedValue === undefined || computedValue === null || isNaN(Number(computedValue))) {
                throw new Error(`Computation resulted in invalid value for equation: '${substitutedEquation}'`);
            }

            row.push(new ExtendedCellValue({ resolvedValue: computedValue }));
        });
    });

    // Update the DOM table with the computed columns
    const newTable = tableData.getHtmlTableElement();
    table.innerHTML = newTable.innerHTML;
};
