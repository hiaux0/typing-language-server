import { getFencedCodeBlockContentNodeByName } from "../tree-sitter/ts-markdown"
import { WordsFilterConfigurationInput, WordsFilterConfigurationOutput } from "../types/types";

export const defaultFilterConfigurationOutput: WordsFilterConfigurationOutput = {
	lesson: "words",
	amount: 10,
	length: 999,
	repeat: 1,
	ignore: [],
	anyOrder: [],
	oneOf: [],
	sequence: [],
}

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
export function getFilterConfigurationsForWords(sourceCode: string): WordsFilterConfigurationOutput {
	const node = getFencedCodeBlockContentNodeByName(sourceCode, "settings")
	const text = node?.node.text;
	if (!text) return defaultFilterConfigurationOutput;
	try {
		const asJson = JSON.parse(text) as WordsFilterConfigurationInput;
		const output = {
			// to keep the ordering of the properties
			...asJson,
			...defaultFilterConfigurationOutput
		}
		output.amount = asJson.amount;
		output.length = asJson.length;
		if (asJson.lesson) output.lesson = asJson.lesson;
		if (asJson.repeat) output.repeat = asJson.repeat;

		stringToArray("ignore")
		stringToArray("anyOrder")
		stringToArray("oneOf")
		stringToArray("sequence")

		return output;

		function stringToArray(key: keyof WordsFilterConfigurationOutput): void {
			if (typeof asJson[key] === 'string') {
				const value = asJson[key] as string
				const lettersArr = value
					.split(",")
					.map(char => char.trim());
				// @ts-ignore - output has props with number as keys, but we assign them at the start of the try block
				output[key] = lettersArr;
			}
		}
	} catch (error) {
		console.log("Not valid JSON");
		console.log("[configuration.ts,23] error: ", error);
		return defaultFilterConfigurationOutput;
	}
}
