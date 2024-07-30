import {
  TypingAnalytics,
  TypingAnalyticsMap,
  TypoAnalytics,
} from "../types/types";

let currentWord: string | undefined = "";

export function getWordsFromAnalytics(
  analyticsMap: TypingAnalyticsMap,
  word: string,
): string[] {
  const data = analyticsMap[word];
  const typos = data.typos.map((item) => item.text);
  const result = [word, ...typos];
  return result;
}
// const map = {
//     "banquets": {
//         "occurrence": 8,
//         "typos": [
//             {
//                 "text": "banques",
//                 "mispelled": 2
//             },
//             {
//                 "text": "banqe",
//                 "mispelled": 2
//             },
//             {
//                 "text": "banqets",
//                 "mispelled": 2
//             },
//             {
//                 "text": "banqet",
//                 "mispelled": 1
//             },
//             {
//                 "text": "bang",
//                 "mispelled": 1
//             },
//             {
//                 "text": "banquest",
//                 "mispelled": 27
//             }
//         ]
//     },
// }
// const result = getWordsFromAnalytics(map, 'banquets')
// console.log("[analytics.ts,44] result: ", result.length);

/**
 * 1. New word
 * 2. Increase occurrence
 * 3. Update existing word
 * 4. Add new typo data
 */
export function updateAnalytics(
  analyticsMap: TypingAnalyticsMap,
  word: string | undefined,
  typo: string | undefined,
) {
  if (!word) return;
  if (!typo) return;

  // 1. New word
  const mispelled = word.includes(typo) ? 0 : 1;
  const typoAnalytics = getNewTypoAnalytics(typo, mispelled);
  const wordData = analyticsMap[word];
  if (!wordData) {
    const wordAnalytics: TypingAnalytics = {
      occurrence: 1,
      typos: [],
    };
    if (word !== typo) {
      wordAnalytics.typos.push(typoAnalytics);
    }
    if (currentWord !== word) {
      currentWord = word;
    }

    analyticsMap[word] = wordAnalytics;
    return;
  }

  // 2. Increase occurrence
  if (currentWord !== word) {
    wordData.occurrence += 1;
    currentWord = word;
  }

  // 3. Update existing word
  const targetTypo = wordData.typos.find((item) => item.text === typo);
  if (targetTypo) {
    if (mispelled > 0) {
      targetTypo.mispelled += 1;
    }
    return;
  }

  // 4. Add new typo data
  if (mispelled === 0) return;

  // 4.1 Replace if it's a substring
  const partOf = wordData.typos.find((existingTypo) =>
    typo.startsWith(existingTypo.text),
  );
  if (partOf) {
    partOf.text = typo;
    return;
  }
  typoAnalytics;
  wordData.typos.push(typoAnalytics);
  wordData.typos.sort((a, b) => a.text.localeCompare(b.text));
}

function getNewTypoAnalytics(typo: string, mispelled: number): TypoAnalytics {
  const typoAnalytics: TypoAnalytics = {
    text: typo,
    mispelled,
  };
  return typoAnalytics;
}

//const mainAnalyticsMap: AnalyticsMap = {};
//updateAnalytics(mainAnalyticsMap, 'seek', 'r')
//updateAnalytics(mainAnalyticsMap, 'seek', 're')
//updateAnalytics(mainAnalyticsMap, 'seek', 'ree')
//updateAnalytics(mainAnalyticsMap, 'seek', 'reek')
//console.log("[analytics.ts,110] mainAnalyticsMap: ", mainAnalyticsMap.seek);
//console.log("[analytics.ts,110] mainAnalyticsMap: ", mainAnalyticsMap.seek.typos[0]);
//console.log("[analytics.ts,110] mainAnalyticsMap: ", mainAnalyticsMap.seek.typos[1]);
//console.log("[analytics.ts,110] mainAnalyticsMap: ", mainAnalyticsMap.seek.typos[2]);
//console.log("[analytics.ts,110] mainAnalyticsMap: ", mainAnalyticsMap.seek.typos[3]);
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
