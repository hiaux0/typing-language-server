/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *
 * Additional changes and modifications by hiaux0, 2024.
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
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { getFirstDifferentCharIndex } from "./features/diagnostics/diagnostics";
import { getParagraphs, getWordAtIndex } from "./modules/string";
import { getRandomWords } from "./data/random-data";
import { getFencedCodeBlockContentNodeByName } from "./tree-sitter/ts-markdown";
import { updateAnalytics } from "./modules/analytics";
import {
  TypingAnalyticsMap,
  WordsFilterConfigurationOutput,
} from "./types/types";
import { JsonDb } from "./data/jsonDb";
// import { prettyPrintTypoTableAll } from "./modules/pretty-print";
import {
  getFilterConfigurationsForWords,
  NEW_WORDS_TRIGGER,
} from "./features/configuration";
import { increaseCurrentLetterIndex } from "./features/lessons/frequency";

interface ExampleSettings {
  maxNumberOfProblems: number;
}

export const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasDiagnosticRelatedInformationCapability = false;
// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

/**
 * WorkspaceFolder must have "typing" in its path
 */
function canInitialize(params: InitializeParams): boolean {
  const allowList = ["typing"];
  const okay = allowList.find((allowedName) => {
    const okayByWorkSpaceFolder = params.workspaceFolders?.find((folder) =>
      folder.name.endsWith(allowedName),
    );
    return okayByWorkSpaceFolder;
  });
  return !!okay;
}

connection.onInitialize((params: InitializeParams) => {
  if (!canInitialize(params)) {
    return {
      capabilities: {},
    } as InitializeResult;
  }

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
        resolveProvider: true,
      },
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
      // documentFormattingProvider: true,
      //documentOnTypeFormattingProvider: {
      //	"firstTriggerCharacter": "}",
      //	"moreTriggerCharacter": [";", ","]
      //}
    },
  };
  return result;
});

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

// connection.onDocumentFormatting()
// connection.onDocumentOnTypeFormatting((params) => {
connection.onDocumentFormatting((_params) => {
  return [];
});

let filterConfig: WordsFilterConfigurationOutput;
const typingDb = new JsonDb<TypingAnalyticsMap>();
let mainAnalyticsMap: TypingAnalyticsMap = {};
documents.onDidOpen((event) => {
  typingDb.setDbPath(event.document.uri);
  const data = typingDb.readDb();
  if (data) {
    mainAnalyticsMap = data;
  }
  filterConfig = getFilterConfigurationsForWords(event.document.getText());
});

documents.onDidSave((event) => {
  filterConfig = getFilterConfigurationsForWords(event.document.getText());
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  // checkForSpellingErrors(change.document);

  upperCaseValidator(change.document);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
});

connection.languages.diagnostics.on(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (document !== undefined) {
    const upperCaseItems = await upperCaseValidator(document);
    const spellingMistakes = checkForSpellingErrors(document, filterConfig);
    // const spellingMistakes = [] as any
    const items = [...upperCaseItems, ...spellingMistakes];
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items,
    } satisfies DocumentDiagnosticReport;
  } else {
    // We don't know the document. We can either try to read it from disk
    // or we don't report problems for it.
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: [],
    } satisfies DocumentDiagnosticReport;
  }
});

async function upperCaseValidator(
  textDocument: TextDocument,
): Promise<Diagnostic[]> {
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
        end: textDocument.positionAt(m.index + m[0].length),
      },
      message: `${m[0]} is all uppercase.`,
      source: "ex",
    };
    if (hasDiagnosticRelatedInformationCapability) {
      diagnostic.relatedInformation = [
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Spelling matters",
        },
        {
          location: {
            uri: textDocument.uri,
            range: Object.assign({}, diagnostic.range),
          },
          message: "Particularly for names",
        },
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

let currentWord: string | undefined = "";
let currentTypo: string | undefined = "";
let currentPosition: Position = { line: 0, character: 0 };
let totalNumberOfLines = 0;
let wpmMap: Record<string, { start: number; wpm: number }> = {};
const NOTIFICATIONS_MESSAGES = {
  "custom/autoNew": "custom/autoNew",
  "custom/wpm": "custom/wpm",
  "custom/clearLine": "custom/clearLine",
  "custom/newLine": "custom/newLine",
  "custom/newWords": "custom/newWords",
  "custom/preventTypo": "custom/preventTypo",
  "custom/printWpmNextCodeBlockName": "custom/printWpmNextCodeBlockName",
  "custom/resetWpm": "custom/resetWpm",
};

/**
 * A. Collect wrong words
 * B. Analytics
 * C. Create diagnostics from comparison
 */
function checkForSpellingErrors(
  document: TextDocument,
  filters?: WordsFilterConfigurationOutput,
): Diagnostic[] {
  // 1. Get 2 code lines
  const sourceCode = document.getText();
  const codeBlockMatch = getFencedCodeBlockContentNodeByName(
    sourceCode,
    "typing",
  );
  if (!codeBlockMatch) return [];
  const blockText = codeBlockMatch.node.text;
  const paragraphs = getParagraphs(blockText); // first paragraph starts at 0

  totalNumberOfLines = paragraphs.reduce((acc, paragraph) => {
    return acc + paragraph.lines.length;
  }, 0);
  totalNumberOfLines -= paragraphs.length; // minus all the main lines
  /* 2.0 Reset wpm, when lines get deleted */
  const hasNumberOfLinesReduced =
    totalNumberOfLines < Object.keys(wpmMap).length;
  if (hasNumberOfLinesReduced) {
    //const clearWpmWhenAutoNewNotActive = !filters?.autoNew;
    //if (clearWpmWhenAutoNewNotActive) {
    //}
    /*prettier-ignore*/ connection.sendNotification(NOTIFICATIONS_MESSAGES["custom/resetWpm"]);
    wpmMap = {};
  }

  /* 2. Create diagnostics from comparison */
  const diagnostics: Diagnostic[] = [];
  paragraphs.forEach((paragraph) => {
    const { start: paragraphStart, lines } = paragraph;
    const [mainLine, ...rest] = lines;
    rest.forEach((remainingLine, lineIndex) => {
      const mispelledIndex = getFirstDifferentCharIndex(
        mainLine,
        remainingLine,
      );

      if (mispelledIndex === undefined) {
        /* 2.0.1 Start wpm measure */
        const isEndOfLine = remainingLine.length === mainLine.length;
        const isAtCurrentLine = getIsAtCurrentLine(paragraphStart, lineIndex);
        if (!wpmMap[currentPosition.line]) {
          wpmMap[currentPosition.line] = { start: Date.now(), wpm: -1 };
        }
        /* 2.0.2 End wpm measure */
        if (!isAtCurrentLine) return;
        if (isEndOfLine && wpmMap[currentPosition.line].wpm === -1) {
          const startTime = wpmMap[currentPosition.line];
          const finishTime = Date.now();
          // Hack, due to no reliable way to get the current cursor position
          if (finishTime === startTime.start) return;

          const numWords = mainLine.split(" ").length;
          const delta = (finishTime - startTime.start) / 1000;
          const perWord = delta / numWords; // TODO We're are not counting each word itself, but all words together
          const wpm = Math.round(60 / perWord);
          wpmMap[currentPosition.line].wpm = wpm;
          /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/printWpmNextCodeBlockName"], { wpm, line: codeBlockMatch.node.startPosition.row });
        }

        if (isEndOfLine) {
          /*
           * 2.0.3 Auto enter
           * Note: Should come before wpm, else the new lines mess up the wpm marks
           */
          const absoluteLineIndex = convertToAbsoluteLineIndex(
            paragraphStart,
            lineIndex,
          );
          if (filters?.autoNew) {
            const newWords = getRandomWords(filters.amount, filters).words;
            /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/autoNew"], { newWords, });
          } else if (filters?.clearLineOnFinish) {
            /* 2.0.4 Clear line when finished typing */
            /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/clearLine"],);
          } else if (filters?.autoEnter) {
            /* 2.0.5 New lines when finished typing */
            /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/newLine"],);
          }
          /* 2.0.6 B. Send wpm to client */
          /*prettier-ignore*/ connection.sendNotification(NOTIFICATIONS_MESSAGES["custom/wpm"], { wpmMap, absoluteLine: absoluteLineIndex, });

          // When no error, and end of line, increase currentLetter
          increaseCurrentLetterIndex();
        }

        /* 2.1 B.1 Analytics */
        const currentIndex = remainingLine.length;
        const wordAtIndex = getWordAtIndex(mainLine, currentIndex);
        if (!currentWord || currentWord !== wordAtIndex) {
          currentWord = wordAtIndex;
          updateAnalytics(mainAnalyticsMap, currentWord, currentWord);
        }
        return [];
      }

      /*
       * 2.0.4 automatically add new words with trigger character
       * because there is a trigger character, the trigger character is considered to be a "typo"
       */
      const absoluteParagraphStart = convertToAbsoluteLineIndex(
        0,
        paragraphStart,
      );
      const isNewWordsTrigger =
        remainingLine[mispelledIndex] === NEW_WORDS_TRIGGER;
      const isCursorEndOfParagraph =
        currentPosition.line === absoluteParagraphStart - 1 + rest.length; // - 1: because absolute start is 1-index (the line number in the editor starts with 1)
      const shouldAddNewWords =
        isCursorEndOfParagraph &&
        isNewWordsTrigger &&
        filters?.newWordsOnTrigger;
      if (shouldAddNewWords) {
        const newWords = getRandomWords(filters.amount, filters).words;
        /*prettier-ignore*/ connection.sendNotification(NOTIFICATIONS_MESSAGES["custom/newWords"], { newWords });
      }

      if (filters?.clearOnError && !isNewWordsTrigger) {
        /*prettier-ignore*/ connection.sendNotification(NOTIFICATIONS_MESSAGES["custom/clearLine"]);
        return;
      }

      /* 2.2 C. Create diagnostics */
      const startRow = convertToAbsoluteLineIndex(paragraphStart, lineIndex);
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
        source: "Custom LSP",
      };
      diagnostics.push(diagnostic);

      const isAtCurrentLine = getIsAtCurrentLine(paragraphStart, lineIndex);
      const isMistypedSpace = remainingLine[mispelledIndex] === " ";
      if (isMistypedSpace) {
        /* 2.5 B.2 Tell client to prevent typo */
        /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/preventTypo"], { mainLine });
      }
      if (currentPosition === undefined) return;
      if (!isAtCurrentLine && currentPosition !== undefined) return;

      /* 2.3 A. Collect wrong words */
      const givenWord = getWordAtIndex(mainLine, mispelledIndex);
      if (givenWord) {
        wrongWords.add(givenWord);
      }

      /* 2.4 B.3 Analytics */
      const typo = getWordAtIndex(remainingLine, mispelledIndex);
      if (typo) {
        /* 2.5 B.4 Tell client to prevent typo */
        /*prettier-ignore*/ connection.sendNotification( NOTIFICATIONS_MESSAGES["custom/preventTypo"], { mainLine },);
      }
      let isSubstring = false;
      if (typo && currentTypo) {
        isSubstring = currentTypo.includes(typo);
      }
      /* 2.5 B.5 Don't update when typo already present */
      if (!isSubstring) {
        updateAnalytics(mainAnalyticsMap, givenWord, typo);
      }
      currentTypo = typo;

      typingDb.writeDb(document.uri, mainAnalyticsMap);

      // const pretty = prettyPrintTypoTableAll(mainAnalyticsMap);
      // console.log("open:", JSON.stringify(pretty))
    });
  });
  return diagnostics;

  /**
   * 0 based index
   */
  function convertToAbsoluteLineIndex(
    paragraphStart: number,
    index: number,
  ): number {
    if (!codeBlockMatch) return -1;
    const blockStart = codeBlockMatch.node.startPosition.row;
    const asAbsoluteLine = blockStart + paragraphStart + index + 1; // + 1: because an index, always has a mainLine before them;
    return asAbsoluteLine;
  }

  function getIsAtCurrentLine(paragraphStart: number, index: number) {
    const asAbsoluteLine = convertToAbsoluteLineIndex(paragraphStart, index);
    const isAtCurrentLine = asAbsoluteLine === currentPosition?.line;
    return isAtCurrentLine;
  }
}

// This handler provides the initial list of the completion items.
// TODO this is always called?! When I was adding diagnostics, the logs here would always print
connection.onCompletion(
  (params: TextDocumentPositionParams): CompletionItem[] => {
    currentPosition = params.position;
    return [
      {
        label: "words",
        kind: CompletionItemKind.Text,
      },
      {
        label: "wrong",
        kind: CompletionItemKind.Text,
      },
      {
        label: "clear",
        kind: CompletionItemKind.Text,
      },
      {
        label: "filters",
        kind: CompletionItemKind.Text,
      },
    ];
  },
);

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.label === "clear") {
    wrongWords.clear();
  } else if (item.label === "filters") {
    // Note! should not print inside "typing" block, else shows errors and other unwanted behavior
    const filterAsText = JSON.stringify(filterConfig, null, 2);
    item.insertText = filterAsText;
  } else if (item.label === "words") {
    const randomWordsArr = getRandomWords(filterConfig.amount, filterConfig);
    if (!randomWordsArr) return item;
    const { words } = randomWordsArr;
    const randomWords = words.join(" ") ?? "no words for given filter found";

    item.insertText = randomWords;
    item.detail = randomWords;
    mainAnalyticsMap = {};
  } else if (item.label === "wrong") {
    const wrongWordsArray =
      wrongWords.size > 0 ? Array.from(wrongWords).join(" ") : " ";
    item.insertText = wrongWordsArray;
    item.detail = wrongWordsArray;
  }
  return item;
});

connection.onNotification("custom/cursorPosition", (params) => {
  currentPosition = params.position;
});

documents.listen(connection);
connection.listen();
