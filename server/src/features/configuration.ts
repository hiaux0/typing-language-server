import { getFencedCodeBlockContentNodeByName } from "../tree-sitter/ts-markdown";
import {
  WordsFilterConfigurationInput,
  WordsFilterConfigurationOutput,
} from "../types/types";

export const defaultFilterConfigurationOutput: WordsFilterConfigurationOutput =
  {
    lesson: "words",
    amount: 10,
    length: 999,
    repeat: 1,
    autoEnter: false,
    autoNew: false,
    newWordsOnTrigger: false,
    clearLineOnFinish: false,
    clearOnError: false,
    ignore: [],
    anyOrder: [],
    oneOf: [],
    sequence: [],
  };

export const NEW_WORDS_TRIGGER = ".";

/**
 * @example
 * ```ts
 * const sourceCode = `
 * ```letters
 * rs
 * ```
 * `;
 * const result = getFilterLettersForWords(sourceCode);
 * result // => ["r", "s"]
 * ```
 */
export function getFilterConfigurationsForWords(
  sourceCode: string,
): WordsFilterConfigurationOutput {
  const node = getFencedCodeBlockContentNodeByName(sourceCode, "settings");
  const text = node?.node.text;
  if (!text) return defaultFilterConfigurationOutput;
  try {
    const asJson = JSON.parse(text) as WordsFilterConfigurationInput;
    const output = {
      // to keep the ordering of the properties
      ...asJson,
      ...defaultFilterConfigurationOutput,
    };
    output.amount = asJson.amount;
    output.length = asJson.length;
    if (asJson.lesson) output.lesson = asJson.lesson;
    if (asJson.repeat) output.repeat = asJson.repeat;
    if (asJson.autoEnter) output.autoEnter = asJson.autoEnter;
    if (asJson.autoNew) output.autoNew = asJson.autoNew;
    if (asJson.newWordsOnTrigger)
      output.newWordsOnTrigger = asJson.newWordsOnTrigger;
    if (asJson.clearOnError) output.clearOnError = asJson.clearOnError;
    if (asJson.clearLineOnFinish)
      output.clearLineOnFinish = asJson.clearLineOnFinish;

    stringToArray("ignore");
    stringToArray("anyOrder");
    stringToArray("oneOf");
    stringToArray("sequence", { splitByLetter: false });

    return output;

    function stringToArray(
      key: keyof WordsFilterConfigurationOutput,
      options?: { splitByLetter: false },
    ): void {
      if (typeof asJson[key] !== "string") return;
      const value = asJson[key] as string;
      let lettersArr: string[] = [];
      if (value.trim() !== "") {
        if (options?.splitByLetter === false) {
          if (value.includes(",")) {
            // "a,b,c"
            lettersArr = value.split(",").map((char) => char.trim());
          } else {
            // "a b c"
            lettersArr = value.split(" ").map((char) => char.trim());
          }
        } else {
          if (value.includes(",")) {
            // "a,b,c"
            lettersArr = value.split(",").map((char) => char.trim());
          } else if (value.includes(" ")) {
            // "a b c"
            lettersArr = value.split(" ").map((char) => char.trim());
          } else {
            // "abc"
            lettersArr = value.split("").map((char) => char.trim());
          }
        }
      }
      // @ts-ignore - output has props with number as keys, but we assign them at the start of the try block
      output[key] = lettersArr;
    }
  } catch (error) {
    console.log("Not valid JSON");
    console.log("[configuration.ts,23] error: ", error);
    return defaultFilterConfigurationOutput;
  }
}
