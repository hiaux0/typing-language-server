import { getFencedCodeBlockContentNodeByName } from "../tree-sitter/ts-markdown"

export function getFilterLettersForWords(sourceCode: string): string[] {
	const node = getFencedCodeBlockContentNodeByName(sourceCode, "letters")
	const text = node?.node.text;
	if (!text) return [];
	const letters = text.split("").filter(char => char.trim() !== "");
	return letters
}
