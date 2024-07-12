import { AnalyticsMap } from "../types/types";
import { prettyPrintTypoTable, prettyPrintTypoTableAll } from "./pretty-print";

describe('pretty-print.ts', () => {
    describe('prettyPrintTypoTable', () => {
        test('1 entry', () => {
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
            const result = prettyPrintTypoTable(map, word)
            expect(result).toMatchSnapshot()
        })
        test('2 entries', () => {
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
                },
                "123": {
                    "occurrence": 1,
                    "typos": [
                        {
                            "text": "1x",
                            "mispelled": 2
                        },
                        // {
                        //     "text": "01234x",
                        //     "mispelled": 3
                        // }
                    ]
                }
            }
            const result = prettyPrintTypoTableAll(map)
            expect(result).toMatchSnapshot()
        })
    });
});
