import {
    COMPUTE_KEYWORD
} from "@/constants";
import { ComputeInstruction } from "@/types";

// Note this file uses raw HTML processing. TODO: use the TableData model instead.

/**
 * Parses compute lines. Only 1 computed field allowed per line, separated by <br> tags or by newlines.
 * 
 * @param {string} text
 * @returns {Array<{column:string, equation:string, variables:Array<{column:string, default:string|number}>}>}
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
 * Given an HTMLTableElement, mutates the table to append new computed columns, as specified in the 'text' string.
 *
 * @param {HTMLTableElement} table - The source table element.
 */
export const appendComputedColumns = (table: HTMLTableElement, instructions: ComputeInstruction[]) => {
    instructions.forEach(comp => {
        // Note headers need to be re-fetched for each computation in case multiple computations are chained.
        const tr = table.querySelector("thead tr");
        const theadCells = tr!.querySelectorAll("th"); // assume only one thead row in a table.
        const headers = Array.from(theadCells).map(th => th.textContent.trim());

        // Build columnReverseIndex: { [columnName: string]: number }
        const columnReverseIndex = headers.reduce((acc, header, idx) => {
            acc[header] = idx;
            return acc;
        }, {} as { [column: string]: number });

        // Add new column header
        const th = document.createElement("th");
        th.textContent = comp.column;
        tr!.appendChild(th);

        // Re-query rows after header change
        const trs = table.querySelectorAll("tbody tr");
        trs.forEach(tr => {
            const row = tr.querySelectorAll("td");

            // Substitute variables in the equation with actual values from the row
            let substitutedEquation = comp.equation;
            comp.variables.forEach(variable => {
                const colIdx: number = columnReverseIndex[variable.column];
                let value = variable.default;
                if (colIdx !== undefined && row[colIdx]) {
                    value = row[colIdx].textContent.trim();
                }
                if (!isNaN(Number(value))) {
                    // Replace all occurrences of the variable in the equation with its numeric value
                    const regex = new RegExp(`\\$\\{${variable.column}\\}`, "g");
                    substitutedEquation = substitutedEquation.replace(regex, value);
                } else {
                    throw new Error(`Non-numeric value for column ${variable.column}: '${value}' typeof: ${typeof value}`);
                }
            });

            // TODO: make this more secure. passing user input to eval is dangerous.
            const computedValue = eval(substitutedEquation);
            if (computedValue === undefined || computedValue === null || isNaN(computedValue)) {
                throw new Error(`Computation resulted in invalid value for equation: '${substitutedEquation}'`);
            }

            const td = document.createElement("td");
            td.textContent = computedValue;
            tr.appendChild(td);
        });
    });
};
