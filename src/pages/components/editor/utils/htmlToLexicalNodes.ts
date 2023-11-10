import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, type LexicalEditor } from "lexical";

export function htmlToLexicalNodes(editor: LexicalEditor, html: string) {
  editor.update(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const unfilteredNodes = $generateNodesFromDOM(editor, doc);
    const nodes = unfilteredNodes.filter(
      (node) =>
        node.__type !== "text" &&
        node.__type !== "ins" &&
        node.__type !== "del",
    );
    if (nodes) {
      try {
        $getRoot().clear();
        $getRoot().select();
        $insertNodes(nodes);
      } catch (e) {
        console.log("Error inserting nodes");
        console.log(e);
        throw e;
      }
    }
  });
}
