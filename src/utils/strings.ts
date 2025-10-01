export function getAggregatedColumns(text: string, keyword: string): string[] {
    const match = text.match(new RegExp(`\\s*${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]!) : [];
}

export function getPivotingGroups(text: string): string[] {
    const match = text.match(/\s*PIVOTIFYJS_GROUPS:\s*(\[[^\]]*\])/);
    return match ? JSON.parse(match[1]!) : [];
}
