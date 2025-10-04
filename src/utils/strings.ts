export function getAggregatedColumns(text: string, keyword: string): string[] {
    const match = text.match(new RegExp(`\\s*${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]!) : [];
}

export function getPivotingGroups(text: string): string[] {
    // Supports multiple groups, e.g. PIVOTIFYJS_GROUPS: ["Category", "Item"]
    const match = text.match(/\s*PIVOTIFYJS_GROUPS:\s*\[([^\]]*)\]/);
    if (!match) return [];
    // Parse the array content safely
    try {
        return JSON.parse(`[${match[1]}]`);
    } catch {
        throw new Error("PIVOTIFYJS_GROUPS matched but could not parse as a valid array.", match[1]);
    }
}
