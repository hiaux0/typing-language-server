import { WordsFilterConfigurationOutput } from '../types/types';
import * as WordsData from './words.json'
// const WordsData = ["abc", "hello", "scream", "next", "right", "rest", "raise", "okay", "skim", "scry"]

/**
 * A. amount
 * B. length
 * C. letters
 * D. ignore
 * 1. Distribution checker
 */
export function getRandomWords(amount: number = 10, filters?: WordsFilterConfigurationOutput): string[] {
    const len = WordsData.length;

    if (!filters) {
        const rndArr = Array.from({ length: amount }, () => Math.floor(Math.random() * len));
        const chosenWords = rndArr.map(i => WordsData[i]);
        return chosenWords;
    }

    let infiniteLoopCounter = 0;
    /* 1. */
    // To make sure each oneOf letter is present
    let currentOneOfIndex = 0;
    // const canHaveLesserWords = filters.length < 10 // 10: chosen as a sane default
    let shouldStop = false;
    const wordCollector: Set<string> = new Set();
    /* C. */
    const oneOfFilter = filters.oneOf;
    // Filter by selecting a random index, then from there find the next word, that matches the filter
    // while (wordCollector.size < amount && infiniteLoopCounter < WordsData.length) {
    /* D. */
    const lettersIgnore = filters.ignore;
    /* A. */
    while ((wordCollector.size < amount || shouldStop) && infiniteLoopCounter < WordsData.length) {
        const currentOneOfLetter = oneOfFilter[currentOneOfIndex++ % oneOfFilter.length];
        infiniteLoopCounter++;
        const randomIndex = Math.floor(Math.random() * len);
        let searchedToEnd = true;
        for (let forwardIndex = randomIndex; forwardIndex < len; forwardIndex++) {
            const word = WordsData[forwardIndex];
            /* B. */
            const tooLong = word.length > filters.length;
            if (tooLong) continue;
            /* D. */
            const ignored = lettersIgnore.some(filter => word.includes(filter))
            if (ignored) continue;
            /* C. */
            const wordFromOneOfFilter = word.includes(currentOneOfLetter);
            if (!wordFromOneOfFilter) continue;
            if (wordCollector.has(word)) continue;
            searchedToEnd = false;
            wordCollector.add(word);
            break
        }
        const foundAWordSoCanStop = !searchedToEnd;
        if (foundAWordSoCanStop) {
            continue;
        }

        let searchedToStart = true;
        for (let backwardsIndex = randomIndex; backwardsIndex > 0; backwardsIndex--) {
            const word = WordsData[backwardsIndex];
            /* B. */
            const tooLong = word.length > filters.length;
            if (tooLong) continue;
            /* D. */
            const ignored = lettersIgnore.some(filter => word.includes(filter))
            if (ignored) continue;
            /* C. */
            const wordFromOneOfFilter = word.includes(currentOneOfLetter);
            if (!wordFromOneOfFilter) continue;
            if (wordCollector.has(word)) continue;
            searchedToStart = false;
            wordCollector.add(word);
            break;
        }

        shouldStop = searchedToEnd && searchedToStart; // stop when search to both start and end yielded no more results
    }
    const result = Array.from(wordCollector);
    return result;
}
//const result = getRandomWords(4, { letters: ["r", "s"], length: 3 })
//console.log("[random-data.ts,22] result: ", result);
