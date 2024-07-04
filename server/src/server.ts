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
} from 'vscode-languageserver/node';
import * as WordsData from './data/words.json'

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

interface ExampleSettings {
	maxNumberOfProblems: number;
}

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasDiagnosticRelatedInformationCapability = false;
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;
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
		}
	};
	return result;
});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	change.document
	console.log("[server.ts,74] change: ", change)
});

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

function getRandomWords(): string[] {
	const amount = 10;
	const len = WordsData.length;
	const rndArr = Array.from({ length: amount }, () => Math.floor(Math.random() * len));
	const chosenWords = rndArr.map(i => WordsData[i]);
	return chosenWords;
}

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {

		console.log("[server.ts,22] WordsData: ", WordsData)
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		// const randomWords = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)).join(" ");;
		const randomWords = getRandomWords().join(" ");
		console.log("[server.ts,221] randomWords: ", randomWords)
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
