import { CellValue } from "@/types";

type ExtendedCellValueProps = { resolvedValue: CellValue } | { unresolvedValue: string, substitute: () => string };

/**
 * Represents a cell value that can be resolved from a string expression or substituted variable.
 */
export class ExtendedCellValue {
    private value: CellValue;
    private isResolved: boolean;
    private substitute?: () => string;
    public cssStyle?: string;

    constructor(props: ExtendedCellValueProps) {
        if ('resolvedValue' in props) {
            this.value = props.resolvedValue;
            this.isResolved = true;
        } else {
            const { unresolvedValue, substitute } = props;
            this.value = unresolvedValue;
            this.isResolved = false;
            this.substitute = substitute;
        }
    }

    /**
     * Resolves the cell value by substituting variable references and evaluating expressions.
     * Assumption: this method is called only if the value is not yet resolved, which implies that the substitute function is defined.
     * @returns The resolved cell value as a string or number.
     */
    private resolve(): CellValue {
        let val = this.value as string; // unresolved value is always a string
        if (val.match(/\$\{[^}]+\}/)) {
            val = this.substitute?.() as string;
        }

        try {
            // unresolved value could be a string representation of a numeric expression.
            val = eval(val);
        } catch {
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

    getHtmlCellElement(): HTMLTableCellElement {
        const td = document.createElement("td");
        // putting ?? to account for 0 (numeric zero) case.
        td.textContent = String(this.getValue() ?? "");
        if (this.cssStyle) {
            td.style.cssText = this.cssStyle;
        }
        return td;
    }
}
