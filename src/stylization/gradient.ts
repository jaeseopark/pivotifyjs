import { GradientInstruction, StyleInstruction } from "@/types";
import { StyleAgent } from "@/types";
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

// Example implementation for GradientAgent
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
        // Apply the gradient style to the table data
        // Implementation omitted for brevity
    }
}
