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
import { $generateHtmlFromNodes } from "@lexical/html";
import * as lexical from "lexical";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import { type DBSharepointFile } from "~/drizzle";
import { api } from "~/utils/api";
import {
  type RunUpdateResponseTemporary,
  type RunUpdateFinishedResponse,
} from "~/types";
import { InsNode } from "./nodes/insNode";
import { InvisibleDelNode } from "./nodes/delNode";
import { CustomTextNode } from "./nodes/textNode";
import { CustomParagraphNode } from "./nodes/paragraphNode";
import { CustomListItemNode, CustomListNode } from "./nodes/listNode";
import { CustomHeadingNode } from "./nodes/headingNode";
import mergeConsecutiveHTMLTags from "./utils/mergeConsecutiveHtmlTags";
import { htmlToLexicalNodes } from "./utils/htmlToLexicalNodes";
import { AutoFocusPlugin } from "./plugins/autoFocusPlugin";
import { LoadingSpinner } from "../loadingSpinner/loadingSpinner";

type InitialConfig = Parameters<
  typeof LexicalComposer
>[number]["initialConfig"];

export function ResultModal(props: {
  temporaryResult: RunUpdateResponseTemporary[];
  updatedResult: RunUpdateFinishedResponse[];
  setUpdatedResult: Dispatch<SetStateAction<RunUpdateFinishedResponse[]>>;
  open: boolean;
  closeModal: (open: boolean) => void;
}) {
  const { open, closeModal, temporaryResult, updatedResult, setUpdatedResult } =
    props;
  const [forceOpen, setForceOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const objects = updatedResult.length !== 0 ? updatedResult : temporaryResult;
  const object = objects[index];

  function handleNext() {
    setIndex((prev) => (prev + 1 < objects.length ? prev + 1 : prev));
  }

  function handlePrevious() {
    setIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
  }

  function handleClose() {
    setForceOpen(false);
    setIndex(0);
    closeModal(false);
  }

  const saveDocumentMutation = api.sharepoint.updateSharepointFile.useMutation({
    onSuccess: (data) => {
      // Toggle saved flag to true
      const index = updatedResult.findIndex(
        (doc) => doc.document.itemId === data.itemId,
      );
      if (index !== -1) {
        const newRes = [...updatedResult];
        const obj = newRes[index];
        if (obj) {
          newRes[index] = { ...obj, saved: true };
          setUpdatedResult(newRes);
          return;
        }
      }
    },
  });

  function onSave(html: string, savedObject: RunUpdateFinishedResponse) {
    console.log("Saving");
    const document = savedObject.document;
    console.log(document);
    console.log(html);
    if (document) {
      console.log("Saving");
      saveDocumentMutation.mutate({
        itemId: document.itemId,
        content: html,
      });
    }
  }

  return (
    <Transition.Root show={open || forceOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                      {index + 1} of {objects.length === 0 ? 0 : objects.length}
                    </p>
                  </div>
                  <h1 className="text-2xl font-bold">
                    {object?.document.name ?? "invalid index"}
                  </h1>
                  <Editor
                    onSave={onSave}
                    resObject={object}
                    isLoading={saveDocumentMutation.isLoading}
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
  onSave: (html: string, savedObject: RunUpdateFinishedResponse) => void;
  resObject: RunUpdateFinishedResponse | RunUpdateResponseTemporary | undefined;
  isLoading: boolean;
}) {
  const nodes = [
    InvisibleDelNode,
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
    CustomTextNode,
    CustomParagraphNode,
    CustomListNode,
    CustomListItemNode,
    CustomHeadingNode,
    {
      replace: lexical.TextNode,
      with: (node: lexical.TextNode) => {
        return new CustomTextNode(node.getTextContent());
      },
    },
    {
      replace: lexical.ParagraphNode,
      with: (_node: lexical.ParagraphNode) => {
        return new CustomParagraphNode();
      },
    },
    {
      replace: ListNode,
      with: (node: ListNode) => {
        return new CustomListNode(node.__listType, node.__start);
      },
    },
    {
      replace: ListItemNode,
      with: (node: ListItemNode) => {
        return new CustomListItemNode(node.__value, node.__checked);
      },
    },
    {
      replace: HeadingNode,
      with: (node: HeadingNode) => {
        return new CustomHeadingNode(node.__tag);
      },
    },
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
        resObject={props.resObject}
        onSave={props.onSave}
        isLoading={props.isLoading}
      />
    </LexicalComposer>
  );
}

function EditorObject(props: {
  isLoading: boolean;
  resObject: RunUpdateFinishedResponse | RunUpdateResponseTemporary | undefined;
  onSave: (html: string, savedObject: RunUpdateFinishedResponse) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const { resObject, onSave, isLoading } = props;

  useEffect(() => {
    if (resObject?.changes) {
      htmlToLexicalNodes(editor, resObject.changes);
      return;
    }

    if (resObject?.document.content) {
      // Select the root

      // Insert them at a selection.
      htmlToLexicalNodes(editor, resObject.document.content);
    }
  }, [editor, resObject]);

  function handleSave() {
    editor.update(() => {
      const newText = generateHtmlFromNodes(editor);
      if (resObject?.type === "updated") {
        onSave(newText, resObject);
      }
    });
  }

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.

  function generateHtmlFromNodes(editor: lexical.LexicalEditor) {
    const html = $generateHtmlFromNodes(editor, null);
    const dom = new DOMParser().parseFromString(html, "text/html");
    mergeConsecutiveHTMLTags(dom.body);
    return dom.body.innerHTML;
  }

  function exportDomAsHtml() {
    editor.update(() => {
      const json = editor.getEditorState();
      console.log(json);
      const html = generateHtmlFromNodes(editor);
      console.log(html);
    });
  }

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
          <AutoFocusPlugin />
        </div>
      </div>

      {resObject?.type === "updated" && (
        <button
          onClick={() => handleSave()}
          disabled={resObject?.saved}
          type="button"
          className={`rounded-full ${
            resObject?.saved
              ? "bg-green-600"
              : "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
          }  px-2.5 py-1 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 `}
        >
          {resObject.saved ? (
            <span className="flex items-center gap-2">
              Saved <CheckIcon />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Save {isLoading && <LoadingSpinner />}
            </span>
          )}
        </button>
      )}
      {resObject?.type !== "updated" && <div>Generating</div>}
    </div>
  );
}

export function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
