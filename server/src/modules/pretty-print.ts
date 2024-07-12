import { AnalyticsMap } from "../types/types";
import { getWordsFromAnalytics } from "./analytics";
import { findLongest } from "./string";

export function prettyPrintTypoTable(map: AnalyticsMap, word: string | undefined): string[] {
    if (!word) return []
    const data = map[word]
    const words = getWordsFromAnalytics(map, word);
    const longest = findLongest(words);
    const cellLength = longest?.length + 4 + 2 + 1; // + 4: ` - <num>` ;; + 2: space before and after the `|` in markdown borders ;; + 1: space after the longest word
    const firstLine = `| ${word} - ${data.occurrence}`.padEnd(cellLength, ' ');
    const others = []
    for (const typo of data.typos) {
        others.push(`| ${typo.text} - ${typo.mispelled}`.padEnd(cellLength, ' '));
    }
    const separator = `|${'-'.repeat(cellLength - 1)}`;
    const result = [firstLine, separator, ...others]
    return result
}

// const map: AnalyticsMap = {
//     "abcde": {
//         "occurrence": 1,
//         "typos": [
//             {
//                 "text": "ax",
//                 "mispelled": 2
//             },
//             {
//                 "text": "abcdex",
//                 "mispelled": 3
//             }
//         ]
//     }
// }
// const word = "abcde"
// const result = prettyPrintTypoTable(map, word)
// console.log("[pretty-print.ts,55] result: ", result);


export function prettyPrintTypoTableAll(map: AnalyticsMap): string[] {
    // 1. get each row prettified
    const prettyfiedColumns = Object.keys(map).map((word) => {
        return prettyPrintTypoTable(map, word);
    });
    // 2. join the rows from top to bottom
    const result = []
    let iterations = 0
    let rowIndex = 0
    let elementExists = true
    while (elementExists && iterations < 7) {
        elementExists = prettyfiedColumns.some(col => !!col[rowIndex])
        const joinedRow = []
        // 2.1 Go from top to bottom
        for (const col of prettyfiedColumns) {
            if (!col[rowIndex]) {
                // 2.1.1 add empty rows to keep table structure
                joinedRow.push('|' + ' '.repeat(col[0].length - 1));
                continue
            }
            joinedRow.push(col[rowIndex])
        }
        result.push(joinedRow.join('') + '|')
        iterations++
        rowIndex++
    }
    result.pop() // one extra empty row is added in while>for>if>continue
    return result;
}

// const map: AnalyticsMap = {
//     "abcde": {
//         "occurrence": 1,
//         "typos": [
//             {
//                 "text": "ax",
//                 "mispelled": 2
//             },
//             {
//                 "text": "abcdex",
//                 "mispelled": 3
//             }
//         ]
//     },
//     "123": {
//         "occurrence": 1,
//         "typos": [
//             {
//                 "text": "1x",
//                 "mispelled": 2
//             },
//             // {
//             //     "text": "01234x",
//             //     "mispelled": 3
//             // }
//         ]
//     }
// };
// const result = prettyPrintTypoTableAll(map)
// console.log(result[0]);
// console.log(result[1]);
// console.log(result[2]);
// console.log(result[3]);
// console.log(result[4]);

