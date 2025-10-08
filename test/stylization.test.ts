import { describe, it, expect } from '@jest/globals';
import { GradientAgent, getColor } from '@/stylization/gradient';
import { loadTableFromHtml, normalizeHtml } from './testUtils';
import { stylize } from '@/stylization';

describe('GradientAgent', () => {
    describe('getInstructions', () => {
        it('should parse gradient instruction correctly', () => {
            const instructionText = 'PIVOTIFYJS_STYLE_GRADIENT:"Cost"="from:green;to:red;target:bg"';

            const gradientAgent = new GradientAgent();
            const instructions = gradientAgent.getInstructions(instructionText);

            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual({
                type: 'gradient',
                target: 'background',
                column: 'Cost',
                from: 'green',
                to: 'red',
            });
        });

        it('should use default values when parameters are not provided', () => {
            const instructionText = 'PIVOTIFYJS_STYLE_GRADIENT:"Cost"="from:blue"';

            const gradientAgent = new GradientAgent();
            const instructions = gradientAgent.getInstructions(instructionText);

            expect(instructions).toHaveLength(1);
            expect(instructions[0]).toEqual({
                type: 'gradient',
                target: 'background', // default
                column: 'Cost',
                from: 'blue',
                to: 'transparent', // default
            });
        });
    });

    describe('apply', () => {
        it('should apply green to red gradient to cost column', () => {
            // Load the test HTML file using utility
            const table = loadTableFromHtml('subscriptions.simple.html');

            // Create gradient instruction text
            const instructionText = 'PIVOTIFYJS_STYLE_GRADIENT:"Annual Cost"="from:green;to:red;target:bg"';

            // Create gradient agent and get instructions
            const gradientAgent = new GradientAgent();
            const instructions = gradientAgent.getInstructions(instructionText);

            // Apply the gradient
            stylize(table, instructions);

            // Load expected result and compare
            const expectedTable = loadTableFromHtml('subscriptions.expected.gradient.html');
            expect(normalizeHtml(table.outerHTML)).toBe(normalizeHtml(expectedTable.outerHTML));
        });
    });
});

describe('getColor', () => {
    it('should return fromColor when min === max', () => {
        expect(getColor(100, 100, 100, 'green', 'red')).toBe('green');
    });

    it('should interpolate between fromColor and toColor', () => {
        // Middle value between min and max
        const color = getColor(50, 0, 100, 'green', 'red');
        expect(typeof color).toBe('string');
        // Accept any valid rgb string, but not regex match
        expect([
            'rgb(128, 64, 0)', // Example output, adjust as needed
            'rgb(128,128,0)',   // Another possible output
            'rgb(128, 128, 0)'  // Another possible output
        ]).toContain(color);
    });

    it('should return fromColor for value at min', () => {
        expect(getColor(0, 0, 100, 'green', 'red')).toBe('rgb(0, 128, 0)');
    });

    it('should return toColor for value at max', () => {
        expect(getColor(100, 0, 100, 'green', 'red')).toBe('rgb(255, 0, 0)');
    });

    it('should clamp values below min and above max', () => {
        expect(getColor(-50, 0, 100, 'green', 'red')).toBe('rgb(0, 128, 0)');
        expect(getColor(150, 0, 100, 'green', 'red')).toBe('rgb(255, 0, 0)');
    });
});