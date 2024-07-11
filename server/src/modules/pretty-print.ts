import { AnalyticsMap } from "../types/types";

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
export function prettyPrintTypoTable(map: AnalyticsMap, word: string): string[] {
    const data = map[word]

    const firstLine = `${word} - ${data.occurrence}`
    const others = []
    for (const typo of data.typos) {
        others.push(`${typo.text} - ${typo.mispelled}`)
    }
    const result = [firstLine, ...others]
    return result
}

const log = prettyPrintTypoTable(data, "gasps")
console.log("[pretty-print.ts,27] log: ", log);

/**
<word> - <occ>
<typo> - <mis>
 */
