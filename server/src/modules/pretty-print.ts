import { TypingAnalyticsMap } from "../types/types";
import { getWordsFromAnalytics } from "./analytics";
import { findLongest } from "./string";

export function prettyPrintTypoTable(
  map: TypingAnalyticsMap,
  word: string | undefined,
): string[] {
  if (!word) return [];
  const data = map[word];
  const words = getWordsFromAnalytics(map, word);
  const longest = findLongest(words);
  const cellLength = longest?.length + 4 + 2 + 1; // + 4: ` - <num>` ;; + 2: space before and after the `|` in markdown borders ;; + 1: space after the longest word
  const firstLine = `| ${word} - ${data.occurrence}`.padEnd(cellLength, " ");
  const others = [];
  for (const typo of data.typos) {
    others.push(`| ${typo.text} - ${typo.mispelled}`.padEnd(cellLength, " "));
  }
  const separator = `|${"-".repeat(cellLength - 1)}`;
  const result = [firstLine, separator, ...others];
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
//     }
// }
// const word = "abcde"
// const result = prettyPrintTypoTable(map, word)
// console.log("[pretty-print.ts,55] result: ", result);

export function prettyPrintTypoTableAll(map: TypingAnalyticsMap): string[] {
  // 1. get each row prettified
  const prettyfiedColumns = Object.keys(map).map((word) => {
    return prettyPrintTypoTable(map, word);
  });
  // 2. join the rows from top to bottom
  const result = [];
  let rowIndex = 0;
  let elementExists = true;
  while (elementExists) {
    elementExists = prettyfiedColumns.some((col) => !!col[rowIndex]);
    const joinedRow = [];
    // 2.1 Go from top to bottom
    for (const col of prettyfiedColumns) {
      if (!col[rowIndex]) {
        // 2.1.1 add empty rows to keep table structure
        joinedRow.push("|" + " ".repeat(col[0].length - 1));
        continue;
      }
      joinedRow.push(col[rowIndex]);
    }
    result.push(joinedRow.join("") + "|");
    rowIndex++;
  }
  result.pop(); // one extra empty row is added in while>for>if>continue
  return result;
}

const map: TypingAnalyticsMap = {
  banquets: {
    occurrence: 8,
    typos: [
      {
        text: "banques",
        mispelled: 2,
      },
      {
        text: "banqe",
        mispelled: 2,
      },
      {
        text: "banqets",
        mispelled: 2,
      },
      {
        text: "banqet",
        mispelled: 1,
      },
      {
        text: "bang",
        mispelled: 1,
      },
      {
        text: "banquest",
        mispelled: 27,
      },
    ],
  },
};
const result = prettyPrintTypoTableAll(map);
console.log(result[0]);
console.log(result[1]);
console.log(result[2]);
console.log(result[3]);
console.log(result[4]);
console.log(result[5]);
console.log(result[6]);
console.log(result[7]);
console.log(result[8]);
