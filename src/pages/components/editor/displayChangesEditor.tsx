import { $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { OverflowNode } from "@lexical/overflow";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $getRoot, $insertNodes } from "lexical";
import { useEffect } from "react";
import { VisibleDelNode } from "./nodes/delNode";
import { InsNode } from "./nodes/insNode";
import { htmlToLexicalNodes } from "./utils/htmlToLexicalNodes";

type InitialConfig = Parameters<typeof LexicalComposer>["0"]["initialConfig"];

export function DisplayChangesEditor(props: { diff: string }) {
  const nodes = [
    VisibleDelNode,
    InsNode,
    AutoLinkNode,
    LinkNode,
    ListItemNode,
    ListNode,
    OverflowNode,
    HeadingNode,
    TableCellNode,
    TableNode,
    TableRowNode,
  ];
  console.log(props.diff);
  const initialConfig: InitialConfig = {
    namespace: "MyEditor",
    onError: editorOnError,
    nodes,
    editable: false,
  };
  function editorOnError(error: Error) {
    console.error(error);
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorObject diff={props.diff} />
    </LexicalComposer>
  );
}

function EditorObject(props: { diff: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    htmlToLexicalNodes(editor, props.diff);
  }, [props.diff, editor]);
  return (
    <div className="relative mt-2">
      <RichTextPlugin
        contentEditable={
          <ContentEditable className=" block h-auto min-h-full w-full rounded-md border-0 p-2 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400  sm:text-sm sm:leading-6" />
        }
        placeholder={<div className="absolute top-0  p-2"></div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
    </div>
  );
}
