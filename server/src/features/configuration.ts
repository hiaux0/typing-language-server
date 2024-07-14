import { getFencedCodeBlockContentNodeByName } from "../tree-sitter/ts-markdown"
import { WordsFilterConfigurationInput, WordsFilterConfigurationOutput } from "../types/types";

const defaultFilterConfigurationOutput: WordsFilterConfigurationOutput = {
	amount: 10,
	oneOf: [],
	inOneWord: [],
	ignore: [],
	length: 999
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
// export function getFilterLettersForWords(sourceCode: string): string[] {
export function getFilterConfigurationsForWords(sourceCode: string): WordsFilterConfigurationOutput {
	const node = getFencedCodeBlockContentNodeByName(sourceCode, "settings")
	const text = node?.node.text;
	if (!text) return defaultFilterConfigurationOutput;
	try {
		const asJson = JSON.parse(text) as WordsFilterConfigurationInput;
		const output = defaultFilterConfigurationOutput;
		output.amount = asJson.amount;
		output.length = asJson.length;

		if (typeof asJson.oneOf === 'string') {
			const lettersArr = asJson.oneOf.split("").filter(char => char.trim() !== "");
			output.oneOf = lettersArr;
		}

		if (typeof asJson.ignore === 'string') {
			const lettersArr = asJson.ignore.split("").filter(char => char.trim() !== "");
			output.ignore = lettersArr;
		}

		return output;
	} catch (error) {
		console.log("Not valid JSON");
		console.log("[configuration.ts,23] error: ", error);
		return defaultFilterConfigurationOutput;
	}
}
