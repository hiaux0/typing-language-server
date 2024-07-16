import { defaultFilterConfigurationOutput } from '../features/configuration';
import { getRandomElement } from '../modules/array';
import { WordsFilterConfigurationOutput } from '../types/types';
import * as WordsData from './words.json'
// const WordsData = ["abc", "hello", "scream", "next", "right", "rest", "raise", "okay", "skim", "scry"]

type WordPool = Record<string, string[]>;

const wordsByLetter = WordsData.reduce((acc, word) => {
    const firstLetter = word[0];
    if (!acc[firstLetter]) {
        acc[firstLetter] = [];
    }
    acc[firstLetter].push(word);
    return acc;
}, {} as WordPool)



/**
 * A. amount
 * B. length
 * C. oneOf
 * D. ignore
 * E. sequence
 * F. repeat
 * G. anyOrder
 * 1. Distribution checker
 */
export function getRandomWords(amount: number = 10, filters?: WordsFilterConfigurationOutput): string[] {
    const finalFilters = {
        ...defaultFilterConfigurationOutput,
        ...filters,
    }
    /* F. */
    const finalAmount = finalFilters?.repeat ? Math.round(amount / finalFilters.repeat) : amount;
    // console.log("[random-data.ts,28] filters: ", filters);
    if (!finalFilters) {
        const len = WordsData.length;
        const rndArr = Array.from({ length: finalAmount }, () => Math.floor(Math.random() * len));
        const chosenWords = rndArr.map(i => WordsData[i]);
        return chosenWords;
    }

    let infiniteLoopCounter = 0;
    /* 1. */
    // To make sure each oneOf letter is present
    let currentOneOfIndex = 0;
    const wordCollector: Set<string> = new Set();
    /* C. */
    const oneOfFilter = finalFilters.oneOf ?? [];
    // Filter by selecting a random index, then from there find the next word, that matches the filter
    /* D. */
    const lettersIgnore = finalFilters.ignore ?? [];
    /* E. */
    const sequenceFilter = finalFilters.sequence ?? [];
    const wordLength = finalFilters.length
    const orderOfFilterProps = Object.keys(finalFilters);

    const orderingFilterFunctionMap: Record<string, Function> = {
        ignore: filterByIgnore,
        oneOf: filterByOneOf,
        length: filterByLength,
        sequence: filterBySequence
    };

    /* A. */
    // while ((wordCollector.size < finalAmount) && infiniteLoopCounter < 2) {
    while ((wordCollector.size < finalAmount) && infiniteLoopCounter < WordsData.length) {
        // console.log("------------------------------------------------------------");
        infiniteLoopCounter++;
        let wordPool = WordsData
        wordPool = wordPool.filter(word => !wordCollector.has(word));

        orderOfFilterProps.forEach(filterProp => {
            if (typeof orderingFilterFunctionMap[filterProp] !== 'function') return;
            wordPool = orderingFilterFunctionMap[filterProp](wordPool);
            // console.log("[random-data.ts,69] filterProp: ", filterProp);
            const sub = wordPool.slice(0, 20);
            // console.log("[random-data.ts,70] sub: ", sub);
        });

        const targetWord = getRandomElement(wordPool);
        if (!targetWord) {
            const popped = orderOfFilterProps.pop();
            continue;
        }
        if (wordCollector.has(targetWord)) continue;
        // console.log("[random-data.ts,75] targetWord: ", targetWord);
        wordCollector.add(targetWord);
    }
    const result = Array.from(wordCollector);
    if (finalFilters.repeat) return doubleResult(result);

    return result;

    function filterByOneOf(wordPool: string[]): string[] {
        /* C. */
        if (oneOfFilter.length === 0) return wordPool;
        const letter = oneOfFilter[currentOneOfIndex++ % oneOfFilter.length];
        wordPool = wordPool.filter(word => word.includes(letter));
        return wordPool;
    }
    function filterByLength(wordPool: string[]): string[] {
        /* B. */
        wordPool = wordPool.filter(word => word.length <= wordLength);
        return wordPool;
    }
    function filterByIgnore(wordPool: string[]): string[] {
        /* D. */
        if (lettersIgnore.length === 0) return wordPool
        wordPool = wordPool.filter(word => lettersIgnore.every(filter => !word.includes(filter)));
        return wordPool;
    }
    function filterBySequence(wordPool: string[]) {
        /* E. */
        if (sequenceFilter.length === 0) return wordPool;
        const sequence = sequenceFilter[currentOneOfIndex++ % sequenceFilter.length];
        wordPool = wordPool.filter(word => word.includes(sequence));
        return wordPool;
    }
    function doubleResult(result: string[]): string[] {
        const doubled: string[] = []
        result.forEach(word => {
            for (let i = 0; i < finalFilters.repeat; i++) {
                doubled.push(word)
            }
        })
        return doubled;
    }
}

