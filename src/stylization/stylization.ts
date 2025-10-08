import { StyleInstruction, StyleAgent } from "@/types";
import { GradientAgent } from "@/stylization/gradient";
import { TableData } from "@/models";

const AGENT_REGISTRY = [
    new GradientAgent()
] as StyleAgent[];

export const getStyleInstructions = (text: string): StyleInstruction[] => {
    return AGENT_REGISTRY.flatMap(agent => agent.getInstructions(text));
};

export const stylize = (table: HTMLTableElement, styleInstructions: StyleInstruction[]) => {
    const tableData = new TableData(table);
    const invalidColumns = styleInstructions
        .map(({ column }) => column)
        .filter(column => tableData.columns[column] === undefined);
    if (invalidColumns.length > 0) {
        throw new Error(`The following columns specified in style instructions do not exist in the table: ${[...new Set(invalidColumns)].join(", ")}`);
    }

    styleInstructions.forEach(instruction => {
        const agent = AGENT_REGISTRY.find(agent => agent.isCompatible(instruction));
        if (!agent) {
            throw new Error(`No compatible agent found for instruction: ${JSON.stringify(instruction)}`);
        }
        agent.apply(table, instruction);
    });
};
