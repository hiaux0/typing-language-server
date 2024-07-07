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
import * as WordsData from './data/words.json'

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { getQuery, getTree } from './tree-sitter/tree-sitter';
import { getFirstDifferentCharIndex } from './features/diagnostics/diagnostics';

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
	checkForSpellingMistakes(change.document);
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
		const spellingMistakes = checkForSpellingMistakes(document);
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

function checkForSpellingMistakes(document: TextDocument): Diagnostic[] {
	// 1. Get 2 code lines
	const sourceCode = document.getText();
	const tree = getTree(sourceCode);
	// const text = tree.rootNode.text
	const query = getQuery(`
		(
		  (fenced_code_block
			(info_string) @info_string
			(#eq? @info_string "typing")
		  ) @fenced_code_block
		)
	`)
	const matches = query.captures(tree.rootNode);
	if (matches.length === 0) return [];

	const match = matches[0];
	const node = match.node;

	// const codeBlockContentMatches = getQuery(`(code_fence_content (block_continuation))`).captures(node);
	const codeBlockContentMatches = getQuery(`((code_fence_content) @block)`).captures(node);

	const codeBlockMatch = codeBlockContentMatches[0];
	const blockText = codeBlockMatch.node.text
	const split = blockText.split("\n");
	const firstRowText = split[0]
	const secondRowText = split[1]

	// 2. Create diagnistics from comparison
	const differentIndex = getFirstDifferentCharIndex(firstRowText, secondRowText);
	if (differentIndex === undefined) return [];

	const diagnostics: Diagnostic[] = [];
	const range = {
		start: Position.create(codeBlockMatch.node.startPosition.row + 1, differentIndex), // +1 line index start at 0
		end: Position.create(codeBlockMatch.node.startPosition.row + 1, secondRowText.length),
	};
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Warning,
		range,
		message: `Spelling mistake`,
		source: 'ex'
	};
	diagnostics.push(diagnostic);
	return diagnostics;
}

function getRandomWords(): string[] {
	const amount = 10;
	const len = WordsData.length;
	const rndArr = Array.from({ length: amount }, () => Math.floor(Math.random() * len));
	const chosenWords = rndArr.map(i => WordsData[i]);
	return chosenWords;
}

// This handler provides the initial list of the completion items.
// TODO: this is always called?! When I was adding diagnostics, the logs here would always print
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		// const randomWords = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)).join(" ");;
		const randomWords = getRandomWords().join(" ");
		// console.log("[server.ts,221] randomWords: ", randomWords)
		return [
			{
				label: 'words',
				kind: CompletionItemKind.Text,
				data: 1,
				insertText: randomWords,
				detail: randomWords,
			},
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 3,
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

documents.listen(connection);
connection.listen();
