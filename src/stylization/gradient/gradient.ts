import { TableData } from "@/models";
import { GradientInstruction, StyleInstruction, StyleAgent } from "@/types";
import tinycolor from "tinycolor2";
import { getInstructions } from "@/stylization/gradient/instructions";


export const getColor = (value: number, min: number, max: number, fromColor: string, toColor: string): string => {
    // Handle edge case where min === max (all values are the same)
    if (min === max) {
        return fromColor;
    }

    // Calculate the ratio (0 to 1) of where value falls between min and max
    const ratio = (value - min) / (max - min);

    // Clamp ratio between 0 and 1
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    // Use tinycolor to interpolate between the two colors
    const from = tinycolor(fromColor);
    const to = tinycolor(toColor);

    // Interpolate between colors using the ratio
    const interpolated = tinycolor.mix(from, to, clampedRatio * 100);

    // Return as rgba to preserve opacity
    return interpolated.toRgbString();
};

export class GradientAgent implements StyleAgent {
    getInstructions(text: string): StyleInstruction[] {
        return getInstructions(text);
    }

    isCompatible(instruction: StyleInstruction): boolean {
        return "type" in instruction && instruction.type === "gradient";
    }

    apply(table: HTMLTableElement, instruction: GradientInstruction): void {
        const tableData = new TableData(table);
        const allNumericValues = tableData
            .getValues({ column: instruction.column })
            .filter(v => typeof v === "number" && !isNaN(v));
        const min = Math.min(...allNumericValues as number[]);
        const max = Math.max(...allNumericValues as number[]);

        tableData.rows.forEach(row => {
            const cell = row[tableData.columns[instruction.column]!]!;
            const value = cell.getValue();

            if (typeof value !== "number" || isNaN(value)) {
                // Skip non-numeric or NaN values
                return;
            }

            const color = getColor(value as number, min, max, instruction.from, instruction.to);
            const colorKey = instruction.target === "background" ? "background-color" : "color";
            cell.cssStyle = `${colorKey}: ${color};`;
        });

        table.innerHTML = tableData.getHtmlTableElement().innerHTML;
    }
}
