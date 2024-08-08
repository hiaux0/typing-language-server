import { defaultFilterConfigurationOutput } from "../features/configuration";
import {
  getCurrentLetterFromIgnore,
  getNextLetterByFrequencyForIgnore,
} from "../features/lessons/frequency";
import { getRandomElement } from "../modules/array";
import { TypingLessons, WordsFilterConfigurationOutput } from "../types/types";
import * as WordsData from "./words.json";
// const WordsData = ["abc", "hello", "scream", "next", "right", "rest", "raise", "okay", "skim", "scry"]

const lessonsMap: Record<TypingLessons, string[]> = {
  words: WordsData,
  alphabet: ["abcdefghijklmnopqrstuvwxyz"],
  ["alphabet-chunks"]: ["abcdefghijklmnopqrstuvwxyz"],
  ["letter-frequency"]: WordsData,
  ["lf"]: WordsData,
  ["ac"]: ["abcdefghijklmnopqrstuvwxyz"],
  /*prettier-ignore*/
  bigrams: [
    "al", "an", "ar", "as", "at",
    "ce", "co",
    "de",
    "ea", "ed", "en", "er", "es",
    "ha", "he", "hi",
    "ic", "in", "io", "is", "it",
    "le",
    "me",
    "nd", "ne", "ng", "nt",
    "of", "on", "or", "ou",
    "ra", "re", "ri", "ro",
    "se", "st",
    "te", "th", "ti", "to",
    "ve",
  ],
  vim: [
    "cc",
    "ce",
    "ciw",
    "cw",
    "daw",
    "dh",
    "dj",
    "dk",
    "dl",
    "diw",
    "dw",
    "ge",
    "gt",
    "h",
    "j",
    "k",
    "l",
    "vaw",
    "ve",
    "vb",
    "viw",
    "yaw",
    "yiw",
    "yw",
    "yy",
  ],
};

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
export function getRandomWords(
  amount: number = 10,
  filters?: WordsFilterConfigurationOutput,
): { words: string[]; filters: WordsFilterConfigurationOutput } {
  const finalFilters: WordsFilterConfigurationOutput = {
    ...defaultFilterConfigurationOutput,
    ...(JSON.parse(JSON.stringify(filters)) as WordsFilterConfigurationOutput),
  };
  /* F. */
  const finalAmount = finalFilters?.repeat
    ? Math.round(amount / finalFilters.repeat)
    : amount;
  if (!finalFilters) {
    const len = WordsData.length;
    const rndArr = Array.from({ length: finalAmount }, () =>
      Math.floor(Math.random() * len),
    );
    const chosenWords = rndArr.map((i) => WordsData[i]);
    return { words: chosenWords, filters: finalFilters };
  }
  const lettersToIgnore = getNextLetterByFrequencyForIgnore();

  let infiniteLoopCounter = 0;
  /* 1. */
  // To make sure each oneOf letter is present
  let currentOneOfIndex = 0;
  const wordCollector: Set<string> = new Set();
  /* C. */
  const initialOneOfFilters = [...finalFilters.oneOf];
  /* E. */
  const sequenceFilter = finalFilters.sequence ?? [];
  const wordLength = finalFilters.length;
  const orderOfFilterProps = Object.keys(finalFilters);

  const orderingFilterFunctionMap: Record<string, Function> = {
    ignore: filterByIgnore,
    oneOf: filterByOneOf,
    length: filterByLength,
    sequence: filterBySequence,
  };

  /* A. */
  while (
    wordCollector.size < finalAmount &&
    infiniteLoopCounter < WordsData.length
  ) {
    infiniteLoopCounter++;
    let wordPool = lessonsMap[finalFilters.lesson];
    wordPool = wordPool.filter((word) => !wordCollector.has(word));

    /* H. */
    if (filters?.lesson === "alphabet-chunks" || filters?.lesson === "ac") {
      const alphabet = wordPool[0];
      const max = alphabet.length - filters.length;
      const randomIndex = getRandoNumber(0, max);
      const targetWord = alphabet.slice(
        randomIndex,
        randomIndex + filters.length,
      );
      if (!targetWord) {
        continue;
      }
      if (wordCollector.has(targetWord)) continue;
      wordCollector.add(targetWord);
    } else {
      if (filters?.lesson === "letter-frequency" || filters?.lesson === "lf") {
        // finalFilters.ignore = lettersToIgnore;
        wordPool = wordPool.filter((word) => {
          const hasLetter = lettersToIgnore.find((letter) => {
            const included = word.toLowerCase().includes(letter.toLowerCase());
            return included;
          });
          return !hasLetter;
        });

        if (lettersToIgnore.length < 20) {
          const currentLetter = getCurrentLetterFromIgnore(lettersToIgnore);
          if (!finalFilters.oneOf.includes(currentLetter)) {
            finalFilters.oneOf.push(currentLetter);
          }
        }
      }

      orderOfFilterProps.forEach((filterProp) => {
        if (typeof orderingFilterFunctionMap[filterProp] !== "function") return;
        wordPool = orderingFilterFunctionMap[filterProp](wordPool);
      });
      const targetWord = getRandomElement(wordPool);
      if (!targetWord) {
        orderOfFilterProps.pop();
        continue;
      }
      if (wordCollector.has(targetWord)) continue;
      wordCollector.add(targetWord);
    }
  }

  let words = Array.from(wordCollector);
  if (finalFilters.repeat) {
    words = repeatResult(words);
  }
  const result = {
    words,
    filters: finalFilters,
  };
  finalFilters.oneOf = initialOneOfFilters;

  return result;

  function filterByOneOf(wordPool: string[]): string[] {
    /* C. */
    if (finalFilters.oneOf.length === 0) return wordPool;
    const letter =
      finalFilters.oneOf[currentOneOfIndex++ % finalFilters.oneOf.length];
    wordPool = wordPool.filter((word) => word.includes(letter));
    return wordPool;
  }
  function filterByLength(wordPool: string[]): string[] {
    /* B. */
    if (!wordLength) return wordPool;
    wordPool = wordPool.filter((word) => word.length <= wordLength);
    return wordPool;
  }
  function filterByIgnore(wordPool: string[]): string[] {
    /* D. */
    if (finalFilters.ignore.length === 0) return wordPool;
    wordPool = wordPool.filter((word) =>
      finalFilters.ignore.every((filter) => !word.includes(filter)),
    );
    return wordPool;
  }
  function filterBySequence(wordPool: string[]) {
    /* E. */
    if (sequenceFilter.length === 0) return wordPool;
    const sequence =
      sequenceFilter[currentOneOfIndex++ % sequenceFilter.length];
    wordPool = wordPool.filter((word) => word.includes(sequence));
    return wordPool;
  }
  function repeatResult(result: string[]): string[] {
    const doubled: string[] = [];
    result.forEach((word) => {
      for (let i = 0; i < finalFilters.repeat; i++) {
        doubled.push(word);
      }
    });
    return doubled;
  }
}
