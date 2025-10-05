import { StyleInstruction, StyleAgent } from "@/types";
import { GradientAgent } from "@/stylization/gradient";

const AGENT_REGISTRY = [
    new GradientAgent()
] as StyleAgent[];

// Updated getStyleInstructions to use all agents in AGENT_REGISTRY
export const getStyleInstructions = (text: string): StyleInstruction[] => {
    return AGENT_REGISTRY.flatMap(agent => agent.getInstructions(text));
};


export const stylize = (table: HTMLTableElement, styleInstructions: StyleInstruction[]) => {
    styleInstructions.map(instruction => {
        const agent = AGENT_REGISTRY.find(agent => agent.isCompatible(instruction));
        if (!agent) {
            throw new Error(`No compatible agent found for instruction: ${JSON.stringify(instruction)}`);
        }
        return (table: HTMLTableElement) => agent.apply(table, instruction);
    }).forEach(apply => {
        apply(table);
    });
};
