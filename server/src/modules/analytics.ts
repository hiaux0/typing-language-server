import { Analytics, AnalyticsMap, TypoAnalytics } from "../types/types";

let currentWord: string | undefined = '';

function getNewTypoAnalytics(typo: string, mispelled: number): TypoAnalytics {
    const typoAnalytics: TypoAnalytics = {
        text: typo,
        mispelled
    }
    return typoAnalytics
}

export function updateAnalytics(analyticsMap: AnalyticsMap, word: string | undefined, typo: string | undefined) {
    console.log("[analytics.ts,14] 0.0 updateAnalytics: ");
    if (!word) return
    if (!typo) return

    // 1. New word
    const mispelled = word.includes(typo) ? 0 : 1;
    const typoAnalytics = getNewTypoAnalytics(typo, mispelled);
    const wordData = analyticsMap[word];
    console.log("[analytics.ts,22] 2. wordData: ", wordData);
    if (!wordData) {
        const wordAnalytics: Analytics = {
            occurrence: 1,
            typos: []
        }
        if (word !== typo) {
            wordAnalytics.typos.push(typoAnalytics)
        }
        if (currentWord !== word) {
            currentWord = word;
        }

        analyticsMap[word] = wordAnalytics;
        console.log("[analytics.ts,40] analyticsMap: ", analyticsMap);
        return;
    }

    // 2. Increase occurrence
    console.log("[analytics.ts,48] word: ", word);
    console.log("[analytics.ts,48] currentWord: ", currentWord);
    if (currentWord !== word) {
        console.log("[analytics.ts,38] 3. update occ: ");
        wordData.occurrence += 1;
        currentWord = word;
    }

    // 3. Update existing word
    const targetTypo = wordData.typos.find((item) => item.text === typo);
    if (targetTypo) {
        if (mispelled > 0) {
            targetTypo.mispelled += 1;
        }
        return
    }

    // 4. Add new typo data
    if (mispelled === 0) return;
    wordData.typos.push(typoAnalytics)
    console.log("[analytics.ts,65] analyticsMap: ", analyticsMap);
}

// updateAnalytics(mainAnalyticsMap, 'wrong', 'wrong')
// updateAnalytics(mainAnalyticsMap, 'wrong', 'wh')
// updateAnalytics(mainAnalyticsMap, 'wrong', 'whoong')
// // updateAnalytics(mainAnalyticsMap, 'wrong', 'whong')
// // updateAnalytics(mainAnalyticsMap, 'wrong', 'wrang')
// console.log(mainAnalyticsMap.get('wrong'));
// console.log(mainAnalyticsMap.get('wrong')!.typos[0]);
// console.log(mainAnalyticsMap.get('wrong')!.typos[1]);
//
// const asht = {
//     "wrong": {
//         occurrence: 5,
//         typos:
//             [
//                 {
//                     text: "whong",
//                     occurrence: 5,
//                     mispelled: 1,
//                 },
//                 {
//                     text: "wronng",
//                     occurrence: 3,
//                     mispelled: 2,
//                 },
//
//             ]
//     }
// }
