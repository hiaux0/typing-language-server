import * as Parser from "tree-sitter";
import * as Markdown from "@tree-sitter-grammars/tree-sitter-markdown";

const parser = new Parser();
parser.setLanguage(Markdown);

// Then you can parse some source code,

export function getTree(sourceCode: string) {
  const tree = parser.parse(sourceCode);
  return tree;
}

export function getQuery(queryString: string) {
  const query = new Parser.Query(Markdown, queryString);
  return query;
}
