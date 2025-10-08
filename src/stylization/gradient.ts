import { TableData } from "@/models";
import { GradientInstruction, StyleInstruction, StyleAgent } from "@/types";
import tinycolor from "tinycolor2";

const validateColor = (value: string): string => {
    if (!tinycolor(value).isValid()) {
        throw new Error(`Invalid color value: ${value}. Must be a valid hex code or CSS color name.`);
    }
    return value;
}

const PARAM_SANITIZERS = {
    "target": {
        validate: (value: string): "background" | "text" => {
            if (["bg", "background"].includes(value)) return "background";
            if (value === "text") return "text";
            throw new Error(`Invalid target value: ${value}. Allowed values are 'bg', 'background', 'text'.`);
        },
        default: "background"
    },
    "sort": {
        validate: (value: string): "ascending" | "descending" => {
            if (value === "ascending" || value === "descending") return value;
            throw new Error(`Invalid sort value: ${value}. Allowed values are 'ascending', 'descending'.`);
        },
        default: "ascending"
    },
    "from": {
        validate: validateColor,
        default: "transparent"
    },
    "to": {
        validate: validateColor,
        default: "transparent"
    }
};

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
        const GRADIENT_KEYWORD = "PIVOTIFYJS_STYLE_GRADIENT";
        const lines = text.split(/<br>|\r?\n/).filter(line => line.trim().startsWith(GRADIENT_KEYWORD + ":"));
        return lines.reduce<StyleInstruction[]>((acc, line) => {
            // Regex: PIVOTIFYJS_STYLE_GRADIENT:"Col1"="from:#ff0000;to:#00ff00;sort:ascending;target:bg"
            const match = line.match(/.*:"([^"]+)"="([^"]+)"/);
            if (!match) return acc;
            const column = match[1]!;
            const paramsStr = match[2]!;

            // Parse key-value pairs
            const params: Record<string, string> = {};
            paramsStr.split(";").forEach(pair => {
                const [key, value] = pair.split(":").map(s => s.trim());
                if (key && value) params[key] = value;
            });

            // Build sanitizedParams using PARAM_SANITIZERS
            const sanitizedParams: Record<string, any> = {};
            Object.entries(PARAM_SANITIZERS).forEach(([key, sanitizer]) => {
                if (params[key] !== undefined) {
                    sanitizedParams[key] = sanitizer.validate(params[key]);
                } else {
                    sanitizedParams[key] = sanitizer.default;
                }
            });

            // Ensure at least one of 'from' or 'to' is provided by the user
            const userProvidedFrom = "from" in params;
            const userProvidedTo = "to" in params;
            if (!userProvidedFrom && !userProvidedTo) {
                throw new Error(`At least one of 'from' and 'to' color must be specified for gradient styling.`);
            }

            acc.push({
                type: "gradient",
                target: sanitizedParams["target"],
                column,
                from: sanitizedParams["sort"] === "ascending" ? sanitizedParams["from"] : sanitizedParams["to"],
                to: sanitizedParams["sort"] === "ascending" ? sanitizedParams["to"] : sanitizedParams["from"],
            } as StyleInstruction);

            return acc;
        }, []);
    }

    isCompatible(instruction: StyleInstruction): boolean {
        return "type" in instruction && instruction.type === "gradient";
    }

    apply(table: HTMLTableElement, instruction: GradientInstruction): void {
        const tableData = new TableData(table);
        const allCellValues = tableData.getValues({ column: instruction.column });
        const min = Math.min(...allCellValues as number[]);
        const max = Math.max(...allCellValues as number[]);
        
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
