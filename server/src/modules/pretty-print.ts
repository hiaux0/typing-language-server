import { AnalyticsMap } from "../types/types";
import { getWordsFromAnalytics } from "./analytics";
import { findLongest } from "./string";

export function prettyPrintTypoTable(map: AnalyticsMap, word: string | undefined): string[] {
    if (!word) return []
    const data = map[word]
    const firstLine = `${word} - ${data.occurrence}`
    const others = []
    for (const typo of data.typos) {
        others.push(`${typo.text} - ${typo.mispelled}`)
    }
    const words = getWordsFromAnalytics(map, word);
    const longest = findLongest(words);
    const separator = '-'.repeat(longest?.length + 3)
    const result = [firstLine, separator, ...others]
    return result
}

const data: AnalyticsMap = {
    "gasps": {
        "occurrence": 1,
        "typos": [
            {
                "text": "as",
                "mispelled": 0
            }
        ]
    }
}
// const log = prettyPrintTypoTable(data, "gasps")
// console.log("[pretty-print.ts,27] log: ", log);

/**
<word> - <occ>
<typo> - <mis>
 */
