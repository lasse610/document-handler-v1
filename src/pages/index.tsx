import Head from "next/head";
import { useState, Fragment, type FormEvent, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/utils/api";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type Diff from "diff";
import {
  type LexicalNode,
  LineBreakNode,
  TextNode,
  $getRoot,
  $insertNodes,
  ParagraphNode,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { Editor, ResultModal } from "./components/editor/editableEditor";
import { type Document } from "~/drizzle/index";
import {
  DocumentType,
  OperationType,
  type CompletionResponse,
  DocumentUpdateResponse,
  type DocumentUpdateResponseWithSavedFlag,
} from "~/types";
import htmlDiff from "node-htmldiff";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-y-20 bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <DocumentList documentType={DocumentType.Source} />
        <DocumentList documentType={DocumentType.Destination} />
        <DocumentList documentType={DocumentType.Sharepoint} />
      </main>
    </>
  );
}

interface DocumentListProps {
  documentType: DocumentType;
}

function DocumentList(props: DocumentListProps) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [result, setResult] = useState<DocumentUpdateResponseWithSavedFlag[]>(
    [],
  );
  const [resutlModalIsOpen, setResultModalIsOpen] = useState(false);
  const [operationType, setOperationType] = useState<OperationType>(
    OperationType.Modify,
  );
  const [selectedFile, setSelectedFile] = useState<Document | undefined>(
    undefined,
  );

  function onResultModalClose(open: boolean) {
    setResultModalIsOpen(open);
    setResult([]);
    runUpdateMutation.reset();
    void context.documents.invalidate();
  }

  const { documentType } = props;

  const context = api.useContext();
  const files = api.documents.getAllDocuments.useQuery({ type: documentType });
  const deleteFileMutation = api.documents.deleteDocument.useMutation({
    onSuccess: async () => {
      await context.documents.invalidate();
    },
  });
  const runUpdateMutation = api.documents.runUpdateForDocuments.useMutation({
    onSuccess: (data) => {
      console.log(data);
      setResult(data.map((item) => ({ ...item, saved: false })));
      setResultModalIsOpen(true);
    },
  });

  const downloadSharepointFilesMutation =
    api.sharepoint_old.downloadFiles.useMutation({
      onSuccess: async () => {
        await context.documents.getAllDocuments.invalidate({
          type: "sharepoint",
        });
      },
    });

  const title =
    documentType === DocumentType.Source
      ? "Source Files"
      : documentType === DocumentType.Destination
      ? "Destination Files"
      : "Sharepoint Files";

  function deleteFile(file: Document) {
    deleteFileMutation.mutate({ id: file.id });
  }

  function modifyFile(file: Document) {
    setOperationType(OperationType.Modify);
    setSelectedFile(file);
    setModalIsOpen(true);
  }

  function setIsModalOpen(open: boolean) {
    setModalIsOpen(open);
    setSelectedFile(undefined);
  }

  function addFile() {
    setOperationType(OperationType.Create);
    setModalIsOpen(true);
  }

  function runUpdate(file: Document) {
    runUpdateMutation.mutate({ id: file.id });
  }

  return (
    <div className="container  w-3/4 divide-y divide-gray-200 rounded-lg bg-white py-2">
      <div className="px-4 py-5 sm:px-6">
        <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-lg font-bold leading-6 text-gray-900">
              {title}
            </h3>
          </div>
          <div className="ml-4 mt-2 flex flex-shrink-0 flex-row gap-10">
            {documentType === DocumentType.Sharepoint && (
              <button
                onClick={() => downloadSharepointFilesMutation.mutate()}
                type="button"
                className="relative inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Download Files
              </button>
            )}
            <button
              onClick={addFile}
              type="button"
              className="relative inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Add a new file
            </button>
          </div>
        </div>
      </div>
      {!files.data || files.data.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center bg-gray-200">
          Add a file
        </div>
      ) : (
        <ul role="list" className="divide-y divide-gray-100">
          {files.data?.map((file) => {
            return (
              <li
                key={file.id}
                className="flex items-center justify-between gap-x-6 p-6"
              >
                <div className="flex items-start gap-x-3">
                  <p className="text-sm font-medium leading-6  text-gray-900">
                    {file.title}
                  </p>
                </div>
                <div className="flex items-end gap-x-3">
                  {file.updated && documentType === DocumentType.Source && (
                    <button
                      onClick={() => runUpdate(file)}
                      type="button"
                      className="rounded bg-green-50 px-2 py-1 text-sm font-semibold text-green-600 shadow-sm hover:bg-green-100"
                    >
                      {runUpdateMutation.isLoading && (
                        <svg
                          aria-hidden="true"
                          className="mr-2 inline h-5 w-5 animate-spin fill-green-500 text-gray-200 dark:text-gray-600"
                          viewBox="0 0 100 101"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                          />
                          <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                          />
                        </svg>
                      )}
                      Run Update
                    </button>
                  )}
                  <button
                    onClick={() => modifyFile(file)}
                    type="button"
                    className="rounded bg-indigo-50 px-2 py-1 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                  >
                    Modify
                  </button>
                  <button
                    onClick={() => deleteFile(file)}
                    type="button"
                    className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {documentType === DocumentType.Source && (
        <ResultModal
          objects={result}
          open={resutlModalIsOpen}
          closeModal={onResultModalClose}
        />
      )}

      <Modal
        open={modalIsOpen}
        setIsModalOpen={setIsModalOpen}
        file={selectedFile}
        operation={operationType}
        documentType={documentType}
      />
    </div>
  );
}

function Modal(props: {
  open: boolean;
  setIsModalOpen: (open: boolean) => void;
  file: Document | undefined;
  operation: OperationType;
  documentType: "source" | "destination" | "sharepoint";
}) {
  const context = api.useContext();
  const { open, file, operation, documentType } = props;
  const saveFileMutation = api.documents.saveOrUpdateDocument.useMutation({
    onSuccess: async () => {
      await context.documents.getAllDocuments.invalidate({
        type: documentType,
      });
    },
  });
  const [title, setTitle] = useState(file?.title ?? "");

  useEffect(() => {
    if (file) {
      setTitle(file.title);
    }
  }, [file]);

  function setIsModalOpen(open: boolean) {
    props.setIsModalOpen(open);
    setTitle("");
  }

  function handleSave(html: string) {
    if (operation === OperationType.Create && title && html) {
      console.log("create");
      saveFileMutation.mutate({ type: documentType, title, text: html });
    }

    if (operation === OperationType.Modify && file?.id && title && html) {
      console.log("modify");
      saveFileMutation.mutate({
        type: documentType,
        id: file?.id,
        title,
        text: html,
      });
    }
    setTitle("");
    setIsModalOpen(false);
  }
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setIsModalOpen}>
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
                as="form"
                className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6"
              >
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <PencilSquareIcon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mx-auto flex items-center justify-center py-4">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      {operation === OperationType.Modify && `Modify ${title}`}
                      {operation === OperationType.Create &&
                        `Create a new file`}
                    </Dialog.Title>
                  </div>

                  {operation === OperationType.Create && (
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        Title
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-left sm:mt-5">
                    <div>
                      <label
                        htmlFor="text"
                        className="block text-sm font-medium leading-6 text-gray-900"
                      >
                        <p>Contents</p>
                      </label>
                      <div className="mt-2">
                        <Editor document={file} onSave={handleSave} />
                      </div>
                    </div>
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

/*

function ResultModal(props: {
  objects: CompletionResponse[];
  open: boolean;
  closeModal: (open: boolean) => void;
}) {
  const { open, closeModal, objects } = props;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [objects]);

  function editorOnError(error: Error) {
    console.error(error);
  }
  const initialConfig = {
    namespace: "MyEditor",
    onError: editorOnError,
  };
  const object = objects[index];

  function handleNext() {
    setIndex((prev) => (prev + 1 < objects.length ? prev + 1 : prev));
  }

  function handlePrevious() {
    setIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
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
                  <LexicalComposer initialConfig={initialConfig}>
                    <Editor
                      diff={object?.changes}
                      id={object?.document.id}
                      title={object?.document.title}
                    />
                  </LexicalComposer>
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



function Editor(props: {
  diff: Diff.Change[] | undefined;
  id: string | undefined;
  title: string | undefined;
}) {
  const [editor] = useLexicalComposerContext();
  const { id, diff, title } = props;
  const context = api.useContext();
  const saveDocumentMutation = api.documents.saveOrUpdateDocument.useMutation({
    onSuccess: async () => {
      await context.documents.getAllDocuments.invalidate({
        type: "destination",
      });
      // invalide
    },
  });

  useEffect(() => {
    editor.update(() => {
      // clear root
      $getRoot().clear();
      // In the browser you can use the native DOMParser API to parse the HTML string.

      // Once you have the DOM instance it's easy to generate LexicalNodes.
      console.log("Inserting nodes");
      console.log(diff);
      if (diff) {
        // Select the root
        $getRoot().select();

        // Insert them at a selection.
        $insertNodes(changeObjectToLexicalNodes(diff, true));
      }
    });
  }, [diff, editor]);

  function handleSave() {
    editor.update(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      if (id && title && text) {
        saveDocumentMutation.mutate({ id, text, title, type: "destination" });
      }
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
/*
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
*/
