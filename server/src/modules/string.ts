interface GetParagraphsResult {
    start: number,
    lines: string[]
}
export function getParagraphs(input: string): GetParagraphsResult[] {
    if (!input) return []

    const result: GetParagraphsResult[] = [];
    const split = input.split("\n");
    let step: GetParagraphsResult = {
        start: NaN,
        lines: [],
    }
    for (let i = 0; i < split.length; i++) {
        const line = split[i];
        if (line.trim() === '') continue;

        if (Number.isNaN(step.start)) {
            step.start = i;
        }
        step.lines.push(line);

        const nextLine = split[i + 1];
        const isNextLineEmpty = !nextLine?.trim();
        if (isNextLineEmpty) {
            result.push(step)
            step = {
                start: NaN,
                lines: []
            }
        }
    }

    return result;
}
// const result = getParagraphs(`000
// 111
//
//
// 444
//
// 666
// 777`)
// console.log("[string.ts,38] result: ", result);

/**
 * Paragraphs are separated by a line
 * @example
 * ```ts
 * const input = `
 * 1 hello world this is it // Paragraph 1 - index 0
 * 2 hello world this is it
 * 3 
 * 4 another block // Paragraph 2 - index 3
 * 5 another block
 * 6 another block
 * `
 *
 * getParagraphStartIndeces(input) // => [0, 4]
 * ```
 */
export function getParagraphStartIndeces(input: string): number[] {
    if (!input) return []

    const indeces = [0]; // If not empty, there is always a paragraph at index 0
    const split = input.split("\n");
    for (let i = 0; i < split.length; i++) {
        const line = split[i];
        if (line !== "") continue;
        const next = i + 1;
        const nextLine = split[next];
        if (!nextLine) continue;
        indeces.push(next)
    }

    return indeces;
}
// const result = getParagraphStartIndeces(`hello world this is it
// hello world this is it
//
// another block
// another block
// another block`)
// console.log("[string.ts,38] result: ", result);

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


