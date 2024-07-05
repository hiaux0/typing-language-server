import { WorkspaceUpdates } from "./WorkspaceUpdates";

export function getEdits() {
	const workspaceUpdates: WorkspaceUpdates = new WorkspaceUpdates();
	workspaceUpdates.applyChanges();
	// workspaceUpdates.replaceText(
	// 	documentUri,
	// 	withImports,
	// 	selection.start.line,
	// 	selection.start.character,
	// 	selection.end.line,
	// 	selection.end.character
	// );
	const edits = workspaceUpdates.getEdits();
	return edits;
}
