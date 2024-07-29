import { defaultFilterConfigurationOutput } from '../features/configuration';
import { getRandomElement } from '../modules/array';
import { TypingLessons, WordsFilterConfigurationOutput } from '../types/types';
import * as WordsData from './words.json'
// const WordsData = ["abc", "hello", "scream", "next", "right", "rest", "raise", "okay", "skim", "scry"]

const lessonsMap: Record<TypingLessons, string[]> = {
    words: WordsData,
    alphabet: ["abcdefghijklmnopqrstuvwxyz"],
    ["alphabet-chunks"]: ["abcdefghijklmnopqrstuvwxyz"],
    ["ac"]: ["abcdefghijklmnopqrstuvwxyz"],
    bigrams: [],
    vim: ["xp", "ciw", "diw", "viw", "dk",]
}

export function getRandoNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * A. amount
 * B. length
 * C. oneOf
 * D. ignore
 * E. sequence
 * F. repeat
 * G. anyOrder
 * H. Alphabet chunks
 * 1. Distribution checker
 */
export function getRandomWords(amount: number = 10, filters?: WordsFilterConfigurationOutput): string[] {
    const finalFilters = {
        ...defaultFilterConfigurationOutput,
        ...filters,
    }
    /* F. */
    const finalAmount = finalFilters?.repeat ? Math.round(amount / finalFilters.repeat) : amount;
    // // console.log("[random-data.ts,28] filters: ", filters);
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
    // console.log("[random-data.ts,55] lettersIgnore: ", lettersIgnore);
    /* E. */
    const sequenceFilter = finalFilters.sequence ?? [];
    const wordLength = finalFilters.length
    // console.log("[random-data.ts,58] wordLength: ", wordLength);
    const orderOfFilterProps = Object.keys(finalFilters);
    // console.log("[random-data.ts,60] orderOfFilterProps: ", orderOfFilterProps);

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
        let wordPool = lessonsMap[finalFilters.lesson];
        wordPool = wordPool.filter(word => !wordCollector.has(word));

        /* H. */
        if (filters?.lesson === 'alphabet-chunks' || filters?.lesson === 'ac') {
            const alphabet = wordPool[0];
            const max = alphabet.length - filters.length;
            const randomIndex = getRandoNumber(0, max);
            const targetWord = alphabet.slice(randomIndex, randomIndex + filters.length);
            if (!targetWord) {
                continue;
            }
            if (wordCollector.has(targetWord)) continue;
            wordCollector.add(targetWord);
        } else {
            orderOfFilterProps.forEach(filterProp => {
                if (typeof orderingFilterFunctionMap[filterProp] !== 'function') return;
                wordPool = orderingFilterFunctionMap[filterProp](wordPool);
                // console.log("[random-data.ts,69] filterProp: ", filterProp);
                const sub = wordPool.slice(0, 20);
                // console.log("[random-data.ts,70] sub: ", sub);
            });
            const targetWord = getRandomElement(wordPool);
            if (!targetWord) {
                orderOfFilterProps.pop();
                continue;
            }
            if (wordCollector.has(targetWord)) continue;
            // // console.log("[random-data.ts,75] targetWord: ", targetWord);
            wordCollector.add(targetWord);
        }

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
        if (!wordLength) return wordPool;
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

