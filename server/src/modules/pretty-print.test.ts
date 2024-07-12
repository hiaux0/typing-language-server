import { AnalyticsMap } from "../types/types";
import { prettyPrintTypoTable } from "./pretty-print";

const map: AnalyticsMap = {
    "abcde": {
        "occurrence": 1,
        "typos": [
            {
                "text": "ax",
                "mispelled": 2
            },
            {
                "text": "abcdex",
                "mispelled": 3
            }
        ]
    }
}
const word = "abcde"
fdescribe('pretty-print.ts', () => {
    test('prettyPrintTypoTable', () => {
        const result = prettyPrintTypoTable(map, word)
        expect(result).toMatchSnapshot()
    });
});
