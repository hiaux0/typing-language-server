import { WordsFilterConfigurationOutput } from '../types/types';
import * as WordsData from './words.json'
// const WordsData = ["abc", "hello", "scream", "next", "right", "rest", "raise", "okay", "skim", "scry"]


const wordsByLetter = WordsData.reduce((acc, word) => {
    const firstLetter = word[0];
    if (!acc[firstLetter]) {
        acc[firstLetter] = [];
    }
    acc[firstLetter].push(word);
    return acc;
}, {} as Record<string, string[]>)

/**
 * A. amount
 * B. length
 * C. letters
 * D. ignore
 * E. sequence
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
    let shouldStop = false;
    const wordCollector: Set<string> = new Set();
    /* C. */
    const oneOfFilter = filters.oneOf.length === 0 ? [""] : filters.oneOf;
    console.log("[random-data.ts,31] oneOfFilter: ", oneOfFilter);
    // Filter by selecting a random index, then from there find the next word, that matches the filter
    /* D. */
    const lettersIgnore = filters.ignore;
    /* E. */
    const sequenceFilter = filters.sequence;
    /* A. */
    while ((wordCollector.size < amount || shouldStop) && infiniteLoopCounter < WordsData.length) {
        // while ((wordCollector.size < amount || shouldStop) && infiniteLoopCounter < 10) {
        const currentOneOfLetter = oneOfFilter[currentOneOfIndex++ % oneOfFilter.length];
        infiniteLoopCounter++;

        const randomIndex = Math.floor(Math.random() * len);
        let searchedToEnd = true;
        for (let forwardIndex = randomIndex; forwardIndex < len; forwardIndex++) {
            const word = applyFilterToWords(forwardIndex, currentOneOfLetter);
            searchedToEnd = !word;
            if (word) {
                console.log("[random-data.ts,52] word: ", word);
                break;
            }
        }
        const foundAWordSoCanStop = !searchedToEnd;
        if (foundAWordSoCanStop) {
            continue;
        }

        let searchedToStart = true;
        for (let backwardsIndex = randomIndex; backwardsIndex > 0; backwardsIndex--) {
            const word = applyFilterToWords(backwardsIndex, currentOneOfLetter);
            searchedToEnd = !word
            if (word) {
                console.log("[random-data.ts,63] word: ", word);
                break;
            }
        }

        shouldStop = searchedToEnd && searchedToStart; // stop when search to both start and end yielded no more results
    }
    const result = Array.from(wordCollector);
    return result;

    function applyFilterToWords(index: number, letter: string): string | undefined {
        if (!filters) return;
        const wordPool = wordsByLetter[letter] || WordsData;
        const word = wordPool[index];
        /* B. */
        const tooLong = word.length > filters.length;
        if (tooLong) return;
        /* D. */
        const ignored = lettersIgnore.some(filter => word.includes(filter))
        if (ignored) return;
        /* E. */
        if (sequenceFilter.length > 0) {
            const hasSequence = sequenceFilter.some(filter => word.includes(filter));
            if (!hasSequence) return;
        }
        /* C. */
        const wordHasLetter = word.includes(letter);
        if (!wordHasLetter) return;
        if (wordCollector.has(word)) return;
        wordCollector.add(word);
        return word
    }
}
//const result = getRandomWords(4, { letters: ["r", "s"], length: 3 })
//// console.log("[random-data.ts,22] result: ", result);
