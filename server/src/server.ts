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
import { getFencedCodeBlockContentNode } from './tree-sitter/ts-markdown';

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
			documentFormattingProvider: true,
			documentOnTypeFormattingProvider: {
				"firstTriggerCharacter": "}",
				"moreTriggerCharacter": [";", ","]
			}
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
connection.onDocumentFormatting((params) => {
	console.log("[server.ts,75] params: ", params)
	return []
});


// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	console.log("changed>>>");
	// checkForSpellingErrors(change.document);
	upperCaseValidator(change.document);
});
// connection.onDidChangeTextDocument((change) => {
connection.onDidChangeWatchedFiles((change) => {
	console.log("[server.ts,67] change: ", change)
})

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		const upperCaseItems = await upperCaseValidator(document);
		const spellingMistakes = checkForSpellingErrors(document);
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

/**
 * A. Collect wrong words
 * B. Create diagnostics from comparison
 */
function checkForSpellingErrors(document: TextDocument): Diagnostic[] {
	console.log("1. ----------------------------");
	// 1. Get 2 code lines
	const sourceCode = document.getText();
	const codeBlockMatch = getFencedCodeBlockContentNode(sourceCode);
	if (!codeBlockMatch) return []
	const blockText = codeBlockMatch.node.text
	const split = blockText.split("\n");
	const firstRowText = split[0]
	const secondRowText = split[1]
	const paragraphs = getParagraphs(blockText)
	console.log("[server.ts,187] paragraphs: ", paragraphs);

	// 2. Create diagnostics from comparison
	const diagnostics: Diagnostic[] = [];
	paragraphs.forEach((paragraph) => {
		const { start: paragraphStart, lines } = paragraph;
		const [given, ...rest] = lines
		rest.forEach((remainingLine, lineIndex) => {
			console.log("2. [server.ts,196] lineIndex: ", lineIndex);
			const differentIndex = getFirstDifferentCharIndex(given, remainingLine);
			if (differentIndex === undefined) return [];

			// 2.1 A. Collect wrong words
			const wrongWord = getWordAtIndex(firstRowText, differentIndex)
			if (wrongWord) {
				wrongWords.add(wrongWord);
			}

			// 2.2 B. Create diagnostics
			const startRow = paragraphStart + lineIndex + codeBlockMatch.node.startPosition.row + 1;
			const start = Position.create(startRow, differentIndex); // +1 line index start at 0
			console.log("2.1 [server.ts,206] start: ", start);
			// const endCol = Math.max()
			const end = Position.create(startRow, remainingLine.length);
			console.log("2.2 [server.ts,208] end: ", end);
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
		})

	})
	return diagnostics;
}


// This handler provides the initial list of the completion items.
// TODO: this is always called?! When I was adding diagnostics, the logs here would always print
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	const randomWords = getRandomWords().join(" ");
	const wrongWordsArray = wrongWords.size > 0 ? Array.from(wrongWords).join(" ") : " "
	console.log("[server.ts,229] wrongWords: ", wrongWords);
	// console.log("[server.ts,221] randomWords: ", randomWords)
	return [
		{
			label: 'words',
			kind: CompletionItemKind.Text,
			insertText: randomWords,
			detail: randomWords,
		},
		{
			label: 'wrong',
			kind: CompletionItemKind.Text,
			insertText: wrongWordsArray,
			detail: wrongWordsArray,
		},
		{
			label: 'clear',
			kind: CompletionItemKind.Text,
		},
	];
}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.label === "clear") {
			console.log("[server.ts,255] item: ", item);
			wrongWords.clear();
		}
		return item;
	}
);

documents.listen(connection);
connection.listen();
