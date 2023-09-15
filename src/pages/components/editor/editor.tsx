import { Transition, Dialog } from "@headlessui/react";
import {
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
} from "@heroicons/react/24/outline";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { OverflowNode } from "@lexical/overflow";
import { HeadingNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $insertNodes,
  type LexicalNode,
  ParagraphNode,
  LineBreakNode,
  TextNode,
} from "lexical";
import { Fragment, useEffect, useState } from "react";
import { type Document } from "~/drizzle";
import { api } from "~/utils/api";
import { DocumentUpdateResponse } from "~/types";
import { InsNode } from "./nodes/insNode";
import { DelNode } from "./nodes/delNode";

type InitialConfig = Parameters<typeof LexicalComposer>["0"]["initialConfig"];

export function ResultModal(props: {
  objects: DocumentUpdateResponse[];
  open: boolean;
  closeModal: (open: boolean) => void;
}) {
  const { open, closeModal, objects } = props;
  const [index, setIndex] = useState(0);
  const saveDocumentMutation = api.documents.saveOrUpdateDocument.useMutation();

  useEffect(() => {
    setIndex(0);
  }, [objects]);

  const object = objects[index];

  function handleNext() {
    setIndex((prev) => (prev + 1 < objects.length ? prev + 1 : prev));
  }

  function handlePrevious() {
    setIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  }

  function handleSave(html: string) {
    console.log("Saving");
    const document = objects[index]?.document;
    console.log(document);
    console.log(html);
    if (document) {
      console.log("Saving");
      saveDocumentMutation.mutate({
        id: document.id,
        text: html,
        type: document.type,
        title: document.title,
      });
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full  items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                as="div"
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6"
              >
                <Dialog.Title
                  as="h3"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  Results
                </Dialog.Title>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div>
                    <p>
                      {index + 1} of {objects.length}
                    </p>
                  </div>
                  <h1 className="text-2xl font-bold">
                    {object?.document.title ?? "invalid index"}
                  </h1>
                  <Editor
                    newText={object?.changes}
                    document={object?.document}
                    onSave={handleSave}
                  />
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={handlePrevious}
                      type="button"
                      className="rounded-full bg-indigo-600 p-1.5 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <ArrowSmallLeftIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      onClick={handleNext}
                      type="button"
                      className="rounded-full bg-indigo-600 p-1.5 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <ArrowSmallRightIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export function Editor(props: {
  newText?: string;
  document: Document | undefined;
  onSave: (html: string) => void;
}) {
  const nodes = [
    DelNode,
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
  const initialConfig: InitialConfig = {
    namespace: "MyEditor",
    onError: editorOnError,
    nodes,
  };
  function editorOnError(error: Error) {
    console.error(error);
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorObject
        newText={props.newText}
        document={props.document}
        onSave={props.onSave}
      />
    </LexicalComposer>
  );
}

function EditorObject(props: {
  newText: string | undefined;
  document: Document | undefined;
  onSave: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { document } = props;

  useEffect(() => {
    function htmlToLexicalNodes(html: string) {
      editor.update(() => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        console.log(doc);
        const nodes = $generateNodesFromDOM(editor, doc);
        if (nodes) {
          console.log(nodes);
          $getRoot().select();
          $insertNodes(nodes);
        }
      });
    }
    editor.update(() => {
      // clear root
      $getRoot().clear();
      // In the browser you can use the native DOMParser API to parse the HTML string.

      // Once you have the DOM instance it's easy to generate LexicalNodes.

      console.log("Inserting nodes");
      if (props.newText) {
        $getRoot().select();

        htmlToLexicalNodes(props.newText);
        return;
      }

      if (document?.text) {
        // Select the root
        $getRoot().select();

        // Insert them at a selection.
        htmlToLexicalNodes(document.text);
      }
    });
  }, [document, editor, props.newText]);

  function handleSave() {
    editor.update(() => {
      const newText = $generateHtmlFromNodes(editor, null);
      console.log(document);
      props.onSave(newText);
    });
  }

  function changeObjectToLexicalNodes(
    changes: Diff.Change[],
    added: boolean,
  ): LexicalNode[] {
    const paragraph = new ParagraphNode();

    const children: LexicalNode[] = [];

    if (typeof window === "undefined") {
      return [paragraph];
    }
    for (const change of changes) {
      for (const [i, line] of change.value.split("\n").entries()) {
        if (i !== 0) {
          const child: LineBreakNode = new LineBreakNode();
          children.push(child);
        }

        //const value = document.createElement("p");
        if (change.added) {
          if (added) {
            const child = new TextNode(line);
            child.setStyle("background-color: green");
            children.push(child);
          }

          continue;
        }
        if (change.removed) {
          if (!added) {
            const child = new TextNode(line);
            child.setStyle("background-color: red");
            children.push(child);
          }
          continue;
        }
        const child = new TextNode(line);
        children.push(child);
      }
    }
    // convert html to string
    paragraph.append(...children);
    return [paragraph];
  }

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.

  function exportDom() {
    /*
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor, null);
      console.log(html);
    });
    */
    const state = editor.getEditorState();
    return state.toJSON();
  }

  function exportDomAsText() {
    editor.update(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      console.log(text);
    });
  }

  function exportDomAsHtml() {
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor, null);
      console.log(html);
    });
  }
  /*
  function importContent() {
    editor.update(() => {
      // In the browser you can use the native DOMParser API to parse the HTML string.

      // Once you have the DOM instance it's easy to generate LexicalNodes.
      $getRoot().clear();

      // Select the root

      // Insert them at a selection.
      if (diff) {
        $getRoot().select();

        $insertNodes(changeObjectToLexicalNodes(diff, true));
      }
    });
  }
  */

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-10 ">
      <div className="w-3/4">
        <div className="relative mt-2">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="block h-auto w-full rounded-md border-0 p-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
            }
            placeholder={
              <div className="absolute top-0  p-2">Enter some text...</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MyCustomAutoFocusPlugin />
        </div>
        {
          //<button onClick={exportDom}>Export Dom</button>
        }
        {
          //<button onClick={importContent}>Import Content</button>
        }
      </div>
      {/*
      <button
        onClick={() => exportDomAsHtml()}
        type="button"
        className="rounded-full bg-indigo-600 px-2.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Print Html
      </button>
      */}
      <button
        onClick={handleSave}
        type="button"
        className="rounded-full bg-indigo-600 px-2.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Save
      </button>
    </div>
  );
}

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}
