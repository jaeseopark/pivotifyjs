import {
    COMPUTE_KEYWORD
} from "../constants.js";

/**
 * Parses PIVOTIFYJS_COMPUTE lines.
 * @param {string} text
 * @returns {Array<{column:string, equation:string, variables:Array<{column:string, default:string|number}>}>}
 */
export const getComputations = (text: string): {
    column: string;
    equation: string;
    variables: { column: string; default: string | number }[];
}[] => {
    const lines = text.split("<br>").filter(line => line.trim().startsWith(COMPUTE_KEYWORD));
    return lines
        .map(line => {
            const match = line.match(/PIVOTIFYJS_COMPUTE:"([^"]+)"=(.+)/);
            if (!match) return null;
            const column = match[1];
            const equation = match[2].trim();
            const variables = equation.split("*").map(factor => {
                const [col, def] = factor.split(":");
                let defaultValue: string | number = "";
                if (def !== undefined) {
                    // Try to convert to number if possible
                    const num = Number(def.trim());
                    defaultValue = isNaN(num) ? def.trim() : num;
                }
                return {
                    column: col.trim(),
                    default: defaultValue
                };
            });
            return { column: column as string, equation, variables };
        })
        .filter((item): item is { column: string; equation: string; variables: { column: string; default: string | number }[] } => item !== null);
};

/**
 * Given an HTMLTableElement, mutates the table to append new computed columns, as specified in the 'text' string.
 *
 * @param {HTMLTableElement} table - The source table element.
 */
export const appendComputedColumns = (table: HTMLTableElement, text: string) => {
    // Use getComputations to parse computation objects
    const computations = getComputations(text);

    computations.forEach(comp => {
        // Note headers need to be re-fetched for each computation in case multiple computations are chained.
        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());

        // Build columnReverseIndex: { [columnName: string]: number }
        const columnReverseIndex = {};
        headers.forEach((header, idx) => {
            columnReverseIndex[header] = idx;
        });

        // Add new column header
        const theadRow = table.querySelector("thead tr");
        const th = document.createElement("th");
        th.textContent = comp.column;
        theadRow.appendChild(th);

        // Compute each row value
        Array.from(table.querySelectorAll("tbody tr")).forEach(tr => {
            const row = tr.querySelectorAll("td");

            // Substitute variables in the equation with actual values from the row
            let substitutedEquation = comp.equation;
            comp.variables.forEach(variable => {
                const colIdx = columnReverseIndex[variable.column];
                let value = variable.default;
                if (colIdx !== undefined && row[colIdx]) {
                    const cellVal = row[colIdx].textContent.trim();
                    value = cellVal || variable.default;
                }
                // Replace all occurrences of the column name in the equation with its value
                // Use word boundaries to avoid partial replacements
                const regex = new RegExp(`\\b${variable.column}\\b`, "g");
                substitutedEquation = substitutedEquation.replace(regex, value);
            });

            // Evaluate the substituted equation
            let computedValue = "";
            try {
                computedValue = eval(substitutedEquation);
            } catch (e) {
                computedValue = "";
            }

            const td = document.createElement("td");
            td.textContent = computedValue;
            tr.appendChild(td);
        });

        headers.push(comp.column);
    });
};
