import { defaultFilterConfigurationOutput } from "../features/configuration";
import { WordsFilterConfigurationOutput } from "../types/types";
import { getRandomWords } from "./random-data";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const baseConfig: WordsFilterConfigurationOutput =
  defaultFilterConfigurationOutput;
function getWordsFilterConfig(
  config: Partial<WordsFilterConfigurationOutput>,
): WordsFilterConfigurationOutput {
  return {
    ...baseConfig,
    ...config,
  };
}

describe("getRandomWords", () => {
  test("repeat", () => {
    const config = getWordsFilterConfig({
      amount: 6,
      sequence: ["sh", "ch"],
      length: 6,
      repeat: 3,
    });
    const result = getRandomWords(config.amount, config);
  });
  describe("ignore", () => {
    test("ignore - 1", () => {
      const config = getWordsFilterConfig({
        amount: 6,
        length: 4,
        oneOf: ["h", "l", "c", "s"],
        ignore: ["v", "z", "j", "t"],
        repeat: 2,
      });
      const result = getRandomWords(config.amount, config);
    });
    test("ignore - 2", () => {
      const config = getWordsFilterConfig({
        amount: 8,
        length: 4,
        oneOf: ["l"],
        ignore: ["v", "z", "j", "h"],
        repeat: 1,
      });
      const result = getRandomWords(config.amount, config);
      console.log("[random-data.test.ts,43] result: ", result);
      // console.log("[random-data.test.ts,43] result: ", result);
    });
    test("ignore - 3", () => {
      const config = getWordsFilterConfig({
        amount: 2,
        sequence: ["uckled"],
        oneOf: ["l"],
        anyOrder: [],
        // ignore: ['h' , 'o'],
        ignore: ["v", " z", " j", " h"],
        repeat: 1,
        length: undefined,
      });
      const result = getRandomWords(config.amount, config);
      console.log("[random-data.test.ts,43] result: ", result);
      // console.log("[random-data.test.ts,43] result: ", result);
    });
  });
});

describe("Order of config fields", () => {
  test("1", () => {
    const config = getWordsFilterConfig({
      amount: 4,
      length: 4,
      oneOf: ["r"],
      sequence: ["sh"],
    });
    const { words } = getRandomWords(config.amount, config);
    const [first, ...rest] = words;
    expect(first).toBe("rush");
    const okay = rest.every((word) => word.includes("r"));
    expect(okay).toBe(true);
  });
  test("2", () => {
    const config = getWordsFilterConfig({
      amount: 4,
      length: 4,
      sequence: ["sh"],
      oneOf: ["r"],
    });
    const { words } = getRandomWords(config.amount, config);
    const [first, ...rest] = words;
    expect(first).toBe("rush");
    const okay = rest.every((word) => word.includes("sh"));
    expect(okay).toBe(true);
  });
  test("3", () => {
    const config = getWordsFilterConfig({
      amount: 4,
      length: 5,
      sequence: ["sh"],
      oneOf: ["r"],
    });
    const { words } = getRandomWords(config.amount, config);
    const [first, ...rest] = words;
    expect(first).toHaveLength(5);
    const okay = rest.every((word) => word.includes("sh"));
    expect(okay).toBe(true);
  });
});

describe("Lessons", () => {
  describe("alphabet", () => {
    test("alphabet - 1", () => {
      const config = getWordsFilterConfig({
        lesson: "alphabet",
      });
      const { words } = getRandomWords(config.amount, config);
      expect(words[0]).toBe(ALPHABET);
    });
  });

  describe("alphabet-chunks", () => {
    test("alphabet - 1", () => {
      const config = getWordsFilterConfig({
        lesson: "alphabet-chunks",
        amount: 4,
        length: 4,
      });
      const { words } = getRandomWords(config.amount, config);
      expect(words.length).toBe(4);
      const lengthOkay = words.every((word) => word.length === 4);
      const chunkOkay = words.every((word) => ALPHABET.includes(word));
      expect(lengthOkay).toBe(true);
      expect(chunkOkay).toBe(true);
    });
  });
});
