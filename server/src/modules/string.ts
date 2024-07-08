function getIndexBackwardsUntil(input: string, index: number, untilChars: string[]): number {
    let startIndex = 0
    for (let i = index; i >= 0; i--) {
        let char = input[i];
        if (untilChars.includes(char)) {
            break;
        }
        startIndex = i
    }
    return startIndex
}

function getIndexForwardUntil(input: string, index: number, untilChars: string[]): number {
    let endIndex = 0
    for (let i = index; i < input.length; i++) {
        let char = input[i];
        if (untilChars.includes(char)) {
            break;
        }
        endIndex = i
    }
    return endIndex
}

export function getWordAtIndex(input: string, index: number): string | undefined {
    const untilChars = [' ', '\n', '\t']
    let current = input[index];
    if (!current) return;
    if (untilChars.includes(current)) return;

    let startIndex = getIndexBackwardsUntil(input, index, untilChars)
    let endIndex = getIndexForwardUntil(input, index, untilChars)
    const word = input.slice(startIndex, endIndex + 1)
    return word;
}

console.log(getWordAtIndex('012 456 89', 3))
