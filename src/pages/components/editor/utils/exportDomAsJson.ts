import { type LexicalEditor } from "lexical";

export function exportDom(editor: LexicalEditor) {
  const state = editor.getEditorState();
  return state.toJSON();
}
