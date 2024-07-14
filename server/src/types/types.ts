import { Position } from "vscode-languageserver-textdocument";

/**
 * Type from the client: vscode.TextEditor.Selection
 */
export interface ClientEditorSelection {
	/**
	 * The position at which the selection starts.
	 * This position might be before or after [active](#Selection.active).
	 */
	anchor: Position;
	/**
	 * The position of the cursor.
	 * This position might be before or after [anchor](#Selection.anchor).
	 */
	active: Position;
	start: Position;
	end: Position;

	/**
	 * A selection is reversed if [active](#Selection.active).isBefore([anchor](#Selection.anchor)).
	 */
	// isReversed: boolean;
}

export interface GetEditorSelectionResponse {
	documentText: string;
	documentUri: string;
	documentPath: string;
	selections: ClientEditorSelection[];
}

export interface TypoAnalytics {
	text: string;
	mispelled: number;
}

export interface Analytics {
	occurrence: number,
	// typos: string[];
	typos: TypoAnalytics[]
}

// export type AnalyticsMap = Map<string, Analytics>;
export type AnalyticsMap = Record<string, Analytics>;


export interface WordsFilterConfigurationInput {
	amount: number, // amount of words
	length: number, // length of the word
	// letters: string | string[], // "rs" or ["st", "rs"]
	oneOf: string | string[], // "rs" or ["r", "s"]
	inOneWord: string | string[], // "rs, at" or ["rs", "at"]
	ignore: string | string[], // "rs" or ["st", "rs"]
}

export interface WordsFilterConfigurationOutput extends WordsFilterConfigurationInput {
	oneOf: string[], // ["r", "s"]
	ignore: string[], // "rs" or ["st", "rs"]
}
