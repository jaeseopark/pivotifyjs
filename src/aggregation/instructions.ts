import { AggregateInstruction, AggregateOperator } from "@/types";

export const groupInstructionsByColumn = (instructions: AggregateInstruction[]): {
    [column: string]: AggregateOperator[]
} => {
    return instructions.reduce((acc, instr) => {
        acc[instr.column] = acc[instr.column] || [];
        if (!acc[instr.column]!.includes(instr.operator)) {
            acc[instr.column]!.push(instr.operator);
        }
        return acc;
    }, {} as { [column: string]: AggregateOperator[] });
}
