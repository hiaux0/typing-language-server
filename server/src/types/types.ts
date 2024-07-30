import { Position } from "vscode-languageserver-textdocument";

/**
 * file://path/to/file.ext
 */
export type Uri = string;

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

export interface TypingAnalytics {
  occurrence: number;
  typos: TypoAnalytics[];
}

// export type AnalyticsMap = Map<string, Analytics>;
export type TypingAnalyticsMap = Record<string, TypingAnalytics>;

export type TypingLessons =
  | "words"
  | "alphabet" // abcdefghijklmnopqrstuvwxyz
  | "alphabet-chunks" // chunks of alphabet
  | "ac" // alphabet-chunks
  | "bigrams" // todo
  | "vim"; // todo
export interface WordsFilterConfigurationInput {
  lesson?: TypingLessons;
  amount: number; // amount of words
  length: number; // length of the word
  repeat?: number;
  autoEnter?: boolean; // Auto new line when finished. Note: Either this or clearLineOnFinish
  autoNewWords?: boolean;
  clearOnError?: boolean;
  clearLineOnFinish?: boolean; // Note: Either this or autoEnter
  // letters: string | string[], // "rs" or ["st", "rs"]
  ignore?: string | string[]; // "rs" or ["st", "rs"]
  anyOrder?: string | string[]; // "rs, at" or ["rs", "at"]
  oneOf?: string | string[]; // "rs" or ["r", "s"]
  sequence?: string | string[]; // "rs, at" or ["rs", "at"]
}

export interface WordsFilterConfigurationOutput
  extends Required<WordsFilterConfigurationInput> {
  ignore: string[]; // "rs" or ["st", "rs"]
  oneOf: string[]; // ["r", "s"]
  sequence: string[]; // ["r", "s"]
}
