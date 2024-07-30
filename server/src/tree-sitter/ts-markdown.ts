import { QueryCapture } from "tree-sitter";
import { getQuery, getTree } from "./tree-sitter";

/* TODO more than the first block */
export function getFencedCodeBlockContentNodeByName(
  sourceCode: string,
  codeBlockName: string,
): QueryCapture | undefined {
  const tree = getTree(sourceCode);
  const query = getQuery(`
	(
	  (fenced_code_block
		(info_string) @info_string
		(#eq? @info_string ${codeBlockName})
	  ) @fenced_code_block
	)
  `);
  const matches = query.captures(tree.rootNode);
  if (matches.length === 0) return;
  const match = matches[0];
  const node = match.node;
  const codeBlockContentMatches = getQuery(
    `((code_fence_content) @block)`,
  ).captures(node);
  const codeBlockMatch = codeBlockContentMatches[0];
  return codeBlockMatch;
}
