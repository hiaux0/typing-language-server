/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	DocumentDiagnosticReport,
	Diagnostic,
	DiagnosticSeverity,
	Position,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { getFirstDifferentCharIndex } from './features/diagnostics/diagnostics';
import { getParagraphs, getWordAtIndex } from './modules/string';
import { getRandomWords } from './data/random-data';
import { getFencedCodeBlockContentNodeByName } from './tree-sitter/ts-markdown';
import { updateAnalytics } from './modules/analytics';
import { TypingAnalyticsMap, WordsFilterConfigurationOutput } from './types/types';
import { JsonDb } from './data/jsonDb';
import { prettyPrintTypoTableAll } from './modules/pretty-print';
import { getFilterConfigurationsForWords } from './features/configuration';

interface ExampleSettings {
	maxNumberOfProblems: number;
}

export const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasDiagnosticRelatedInformationCapability = false;
// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},
			// documentFormattingProvider: true,
			//documentOnTypeFormattingProvider: {
			//	"firstTriggerCharacter": "}",
			//	"moreTriggerCharacter": [";", ","]
			//}
		}
	};
	return result;
});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// connection.onDocumentFormatting()
// connection.onDocumentOnTypeFormatting((params) => {
connection.onDocumentFormatting((_params) => {
	return []
});

let filterConfig: WordsFilterConfigurationOutput;
const typingDb = new JsonDb<TypingAnalyticsMap>();
let mainAnalyticsMap: TypingAnalyticsMap = {};
documents.onDidOpen((event) => {
	typingDb.setDbPath(event.document.uri);
	mainAnalyticsMap = typingDb.readDb();
	filterConfig = getFilterConfigurationsForWords(event.document.getText())
})

documents.onDidSave((event) => {
	filterConfig = getFilterConfigurationsForWords(event.document.getText())
})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	// console.log("changed>>>");
	// checkForSpellingErrors(change.document);

	upperCaseValidator(change.document);
});

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

connection.languages.diagnostics.on(async (params) => {
	console.log("[server.ts,102] diagnostics.on: ");
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		const upperCaseItems = await upperCaseValidator(document);
		const spellingMistakes = checkForSpellingErrors(document);
		// const spellingMistakes = [] as any
		const items = [...upperCaseItems, ...spellingMistakes]
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items,
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

async function upperCaseValidator(textDocument: TextDocument): Promise<Diagnostic[]> {
	// In this simple example we get the settings for every validate run.
	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;
	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < 100) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}


const wrongWords: Set<string> = new Set();

/**
hello world this is it
hello world this is it

another block
another block
another block
 */


let currentWord: string | undefined = '';
let currentTypo: string | undefined = '';
let currentPosition: Position | undefined = undefined;
/**
 * A. Collect wrong words
 * B. Analytics
 * C. Create diagnostics from comparison
 */
function checkForSpellingErrors(document: TextDocument): Diagnostic[] {
	console.log("clear");
	console.log("1. ----------------------------");
	// 1. Get 2 code lines
	const sourceCode = document.getText();
	const codeBlockMatch = getFencedCodeBlockContentNodeByName(sourceCode, "typing");
	if (!codeBlockMatch) return []
	const blockText = codeBlockMatch.node.text
	const paragraphs = getParagraphs(blockText)

	/* 2. Create diagnostics from comparison */
	const diagnostics: Diagnostic[] = [];
	paragraphs.forEach((paragraph) => {
		console.log("-------------------------------------------------------------------");
		console.log("currentPosition.line: ", currentPosition?.line)
		const { start: paragraphStart, lines } = paragraph;
		const [givenLine, ...rest] = lines
		rest.forEach((remainingLine, lineIndex) => {
			const mispelledIndex = getFirstDifferentCharIndex(givenLine, remainingLine);
			console.log("[server.ts,213] mispelledIndex: ", mispelledIndex);
			console.log("[server.ts,215] currentWord: ", currentWord);
			if (mispelledIndex === undefined) {
				const currentIndex = remainingLine.length;
				const wordAtIndex = getWordAtIndex(givenLine, currentIndex);
				console.log("[server.ts,218] wordAtIndex: ", wordAtIndex);
				/* 2.1 B.1 Analytics */
				if (!currentWord || currentWord !== wordAtIndex) {
					currentWord = wordAtIndex
					console.log("[server.ts,220] currentWord: ", currentWord);
					updateAnalytics(mainAnalyticsMap, currentWord, currentWord);
					console.log("[server.ts,215] 4. mainAnalyticsMap: ", mainAnalyticsMap);
				}
				return [];
			}

			/* 2.2 C. Create diagnostics */
			const startRow = convertToAbsoluteLine(paragraphStart, lineIndex);
			const start = Position.create(startRow, mispelledIndex); // +1 line index start at 0
			const end = Position.create(startRow, remainingLine.length);
			const range = {
				start,
				end,
			};
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range,
				message: `Spelling mistake`,
				source: 'Custom LSP'
			};
			diagnostics.push(diagnostic);

			console.log("-------------------------------------------------------------------");
			const isAtCurrentLine = getIsAtCurrentLine(paragraphStart, lineIndex);
			if (currentPosition === undefined) return;
			if (!isAtCurrentLine && currentPosition !== undefined) return;

			console.log("[server.ts,232] mispelledIndex: ", mispelledIndex);

			/* 2.3 A. Collect wrong words */
			const givenWord = getWordAtIndex(givenLine, mispelledIndex)
			console.log("[server.ts,249] givenWord: ", givenWord);
			if (givenWord) {
				wrongWords.add(givenWord);
			}

			/* 2.4 B.2 Analytics */
			const wrongWord = getWordAtIndex(remainingLine, mispelledIndex);
			console.log("[server.ts,256] wrongWord: ", wrongWord);
			if (currentTypo !== wrongWord) {
				updateAnalytics(mainAnalyticsMap, givenWord, wrongWord)
			}
			currentTypo = wrongWord;

			typingDb.writeDb(document.uri, mainAnalyticsMap);
			const pretty = prettyPrintTypoTableAll(mainAnalyticsMap)
			console.log("open:", JSON.stringify(pretty))

		})
	})
	return diagnostics;

	function convertToAbsoluteLine(paragraphStart: number, index: number): number {
		if (!codeBlockMatch) return -1;
		const blockStart = codeBlockMatch.node.startPosition.row;
		const asAbsoluteLine = blockStart + paragraphStart + index + 1; // + 1: because an index, always has a givenLine before them;
		return asAbsoluteLine;
	}

	function getIsAtCurrentLine(paragraphStart: number, index: number) {
		const asAbsoluteLine = convertToAbsoluteLine(paragraphStart, index);
		const isAtCurrentLine = asAbsoluteLine === currentPosition?.line;
		return isAtCurrentLine;
	}
}


// This handler provides the initial list of the completion items.
// TODO: this is always called?! When I was adding diagnostics, the logs here would always print
connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
	currentPosition = params.position;
	return [
		{
			label: 'words',
			kind: CompletionItemKind.Text,
		},
		{
			label: 'wrong',
			kind: CompletionItemKind.Text,
		},
		{
			label: 'clear',
			kind: CompletionItemKind.Text,
		},
	];
});

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.label === "clear") {
			wrongWords.clear();
		} else if (item.label === 'words') {
			console.log("[server.ts,307] filterConfig: ", filterConfig);
			// const randomWords = getRandomWords(filterConfig.amount).join(" ");
			const randomWords = getRandomWords(filterConfig.amount, filterConfig)?.join(" ") ?? "no words for given filter found";
			// console.log("[server.ts,310] randomWords: ", randomWords);
			item.insertText = randomWords
			item.detail = randomWords
			mainAnalyticsMap = {}
		} else if (item.label === 'wrong') {
			const wrongWordsArray = wrongWords.size > 0 ? Array.from(wrongWords).join(" ") : " "
			item.insertText = wrongWordsArray;
			item.detail = wrongWordsArray;

		}
		return item;
	}
);

documents.listen(connection);
connection.listen();
